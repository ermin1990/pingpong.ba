
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc,
    serverTimestamp 
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
    apiKey: "AIzaSyASBx_4jF_xaaKisVTDSaw2u0TjVS0odbA",
    authDomain: "pingpong-bih.firebaseapp.com",
    projectId: "pingpong-bih",
    storageBucket: "pingpong-bih.firebasestorage.app",
    messagingSenderId: "541745757662",
    appId: "1:541745757662:web:7308c45f0af3678f7db14f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TARGET_COMPETITION_ID = "siWtPLJ0LAfDMIPg9Is2";
const ORGANIZATION_ID = "E9RaaxT0RAoSEqDTt7qs";

async function runImport() {
    const dataPath = path.join(__dirname, 'extracted_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    // 1. Prepare Category Mapping
    console.log("Fetching target categories...");
    const catSnap = await getDocs(collection(db, "competitions", TARGET_COMPETITION_ID, "categories"));
    const categories = [];
    catSnap.forEach(d => categories.push({ id: d.id, ...d.data() }));

    const normalize = (s) => s.trim().toUpperCase();
    const sqlCompIdToCatId = {};
    
    data.competitions.forEach(src => {
        const srcName = normalize(src.name);
        const match = categories.find(c => normalize(c.name) === srcName);
        if (match) {
            sqlCompIdToCatId[src.id] = match.id;
        }
    });

    // 2. Import Players
    console.log("Importing Players...");
    const sqlPlayerIdToFirestoreId = {};
    const existingPlayersSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", ORGANIZATION_ID)));
    const existingPlayersByName = {};
    existingPlayersSnap.forEach(doc => {
        existingPlayersByName[doc.data().name] = doc.id;
    });

    for (const p of data.players) {
        if (existingPlayersByName[p.name]) {
            sqlPlayerIdToFirestoreId[p.id] = existingPlayersByName[p.name];
        } else {
            const newPlayerRef = await addDoc(collection(db, "players"), {
                name: p.name,
                club: p.club || "",
                organizationId: ORGANIZATION_ID,
                createdAt: serverTimestamp()
            });
            sqlPlayerIdToFirestoreId[p.id] = newPlayerRef.id;
            existingPlayersByName[p.name] = newPlayerRef.id;
        }
    }
    console.log(`Mapped ${Object.keys(sqlPlayerIdToFirestoreId).length} players.`);

    // 3. Process Groups & Categories
    console.log("Processing Groups...");
    const sqlGroupIdToFirestoreId = {};

    for (const sqlCompId of Object.keys(sqlCompIdToCatId)) {
        const firestoreCatId = sqlCompIdToCatId[sqlCompId];
        const compGroups = data.groups.filter(g => g.competition_id === sqlCompId);
        
        const groupsList = [];
        const allParticipants = new Set();

        for (const g of compGroups) {
            const pIds = (g.player_ids || "").split(',')
                .map(sid => sqlPlayerIdToFirestoreId[sid.trim()])
                .filter(id => !!id);
            
            pIds.forEach(pid => allParticipants.add(pid));

            const newGroupId = `group_${g.id}`;
            sqlGroupIdToFirestoreId[g.id] = newGroupId;

            groupsList.push({
                id: newGroupId,
                name: g.name,
                players: pIds,
                standings: [] // Parsing JSON standings from SQL is hard, better to let system recalc or leave empty
            });
        }

        // Update Category Document
        await updateDoc(doc(db, "competitions", TARGET_COMPETITION_ID, "categories", firestoreCatId), {
            groups: groupsList,
            participants: Array.from(allParticipants)
        });
        console.log(`Updated Category ${firestoreCatId} with ${groupsList.length} groups.`);
    }

    // 4. Import Matches
    console.log("Importing Matches...");
    let matchesCount = 0;
    for (const m of data.matches) {
        const catId = sqlCompIdToCatId[m.competition_id];
        if (!catId) continue;

        const p1Id = sqlPlayerIdToFirestoreId[m.player1_id];
        const p2Id = sqlPlayerIdToFirestoreId[m.player2_id];
        
        let sets = [];
        try { if (m.sets) sets = JSON.parse(m.sets); } catch (e) {}

        await addDoc(collection(db, "matches"), {
            competitionId: TARGET_COMPETITION_ID,
            categoryId: catId,
            organizationId: ORGANIZATION_ID,
            player1Id: p1Id || null,
            player2Id: p2Id || null,
            score1: parseInt(m.score1) || 0,
            score2: parseInt(m.score2) || 0,
            status: m.status === 'completed' || m.status === 'active' ? 'completed' : 'pending',
            round: m.round || "1",
            phase: m.is_knockout ? 'knockout' : 'groups',
            groupId: m.group_id ? sqlGroupIdToFirestoreId[m.group_id] : null,
            roundNumber: m.round_number ? parseInt(m.round_number) : null,
            bracketPosition: m.bracket_position ? parseInt(m.bracket_position) : null,
            sets: sets,
            createdAt: serverTimestamp()
        });
        matchesCount++;
        if (matchesCount % 50 === 0) process.stdout.write(".");
    }
    console.log(`\nImported ${matchesCount} matches.`);
}

runImport().catch(console.error);
