
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

const organizationId = "nSYWYJQUTt3xosX1ApDE";

async function runImport() {
    const rawData = fs.readFileSync('extracted_data.json', 'utf8');
    const data = JSON.parse(rawData);

    console.log("Mapping competitions...");
    const compsSnap = await getDocs(query(collection(db, "competitions"), where("organizationId", "==", organizationId)));
    const slugToFirestoreId = {};
    compsSnap.forEach(doc => {
        slugToFirestoreId[doc.data().slug] = doc.id;
    });

    const sqlCompIdToFirestoreId = {};
    data.competitions.forEach(c => {
        if (slugToFirestoreId[c.slug]) {
            sqlCompIdToFirestoreId[c.id] = slugToFirestoreId[c.slug];
        }
    });

    console.log(`Matched ${Object.keys(sqlCompIdToFirestoreId).length} competitions.`);

    console.log("Importing Players...");
    const sqlPlayerIdToFirestoreId = {};
    
    // Check existing players in this org to avoid duplicates
    const playersSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", organizationId)));
    const existingPlayersByName = {};
    playersSnap.forEach(doc => {
        existingPlayersByName[doc.data().name] = doc.id;
    });

    for (const p of data.players) {
        if (existingPlayersByName[p.name]) {
            sqlPlayerIdToFirestoreId[p.id] = existingPlayersByName[p.name];
        } else {
            const newPlayerRef = await addDoc(collection(db, "players"), {
                name: p.name,
                club: p.club || "",
                organizationId: organizationId,
                createdAt: serverTimestamp()
            });
            sqlPlayerIdToFirestoreId[p.id] = newPlayerRef.id;
            existingPlayersByName[p.name] = newPlayerRef.id;
            console.log(`Added player: ${p.name}`);
        }
    }

    console.log("Creating Categories and Categories/Groups...");
    const sqlCompIdToCategoryId = {};
    const firestoreCompIdToCategoryData = {};

    for (const sqlId of Object.keys(sqlCompIdToFirestoreId)) {
        const firestoreId = sqlCompIdToFirestoreId[sqlId];
        const sqlComp = data.competitions.find(c => c.id === sqlId);
        
        // Find groups for this competition
        const compGroups = data.groups.filter(g => g.competition_id === sqlId);
        
        const groupsForFirestore = compGroups.map(g => {
            const pIds = (g.player_ids || "").split(',')
                .map(sid => sqlPlayerIdToFirestoreId[sid.trim()])
                .filter(id => !!id);
            
            return {
                id: `group_${g.id}`,
                name: g.name,
                players: pIds,
                standings: [] // Standings will be recalculated or we could import them
            };
        });

        const categoryData = {
            name: "Glavna Kategorija",
            type: sqlComp.type === 'league' ? 'league' : 'tournament',
            settings: {
                setsToWin: parseInt(sqlComp.sets_to_win) || 3,
                pointsPerSet: parseInt(sqlComp.points_per_set) || 11
            },
            groups: groupsForFirestore,
            createdAt: serverTimestamp()
        };

        const catRef = await addDoc(collection(db, `competitions/${firestoreId}/categories`), categoryData);
        sqlCompIdToCategoryId[sqlId] = catRef.id;
        
        // Update competition participant count
        const allPlayerIdsInComp = new Set();
        groupsForFirestore.forEach(g => g.players.forEach(pid => allPlayerIdsInComp.add(pid)));
        await updateDoc(doc(db, "competitions", firestoreId), {
            participantsCount: allPlayerIdsInComp.size
        });

        console.log(`Created category and groups for ${sqlComp.name}`);
    }

    console.log("Importing Matches...");
    const sqlGroupIdToFirestoreGroupId = {};
    data.groups.forEach(g => {
        sqlGroupIdToFirestoreGroupId[g.id] = `group_${g.id}`;
    });

    let matchCount = 0;
    for (const m of data.matches) {
        const firestoreId = sqlCompIdToFirestoreId[m.competition_id];
        const categoryId = sqlCompIdToCategoryId[m.competition_id];
        if (!firestoreId || !categoryId) continue;

        const p1Id = sqlPlayerIdToFirestoreId[m.player1_id];
        const p2Id = sqlPlayerIdToFirestoreId[m.player2_id];

        await addDoc(collection(db, "matches"), {
            competitionId: firestoreId,
            categoryId: categoryId,
            organizationId: organizationId,
            player1Id: p1Id || null,
            player2Id: p2Id || null,
            score1: parseInt(m.score1) || 0,
            score2: parseInt(m.score2) || 0,
            status: m.status === 'completed' || m.status === 'active' ? 'completed' : 'pending',
            round: m.round || "1",
            phase: m.is_knockout ? 'knockout' : 'groups',
            groupId: m.group_id ? sqlGroupIdToFirestoreGroupId[m.group_id] : null,
            sets: m.sets ? JSON.parse(m.sets) : [],
            createdAt: serverTimestamp()
        });
        matchCount++;
        if (matchCount % 100 === 0) console.log(`Imported ${matchCount} matches...`);
    }

    console.log(`Migration finished! Imported ${matchCount} matches.`);
}

runImport().catch(console.error);
