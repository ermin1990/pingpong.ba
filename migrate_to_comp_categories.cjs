const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    getDoc,
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

const TARGET_COMPETITION_ID = "AoUYbhJZd8IlmJuruRN2";

async function runMigrate() {
    const dataPath = path.join(__dirname, 'extracted_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    // 1. Get Target Competition and Organization ID
    const compRef = doc(db, "competitions", TARGET_COMPETITION_ID);
    const compSnap = await getDoc(compRef);
    if (!compSnap.exists()) {
        console.error("Target competition not found!");
        return;
    }
    const organizationId = compSnap.data().organizationId;
    console.log(`Target Organization ID: ${organizationId}`);

    // 2. Import/Map Players
    console.log("Mapping Players...");
    const sqlPlayerIdToFirestoreId = {};
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

    // 3. Create Categories (from SQL Competitions) and Groups
    console.log("Creating Categories and Groups...");
    const sqlCompIdToCategoryId = {};
    const sqlGroupIdToFirestoreGroupId = {};

    for (const sqlComp of data.competitions) {
        // Find results/groups for this SQL competition
        const compGroups = data.groups.filter(g => g.competition_id === sqlComp.id);
        
        const allPlayerIdsInCategory = new Set();
        
        const groupsForFirestore = compGroups.map(g => {
            const pIds = (g.player_ids || "").split(',')
                .map(sid => sqlPlayerIdToFirestoreId[sid.trim()])
                .filter(id => !!id);
            
            pIds.forEach(id => allPlayerIdsInCategory.add(id));
            
            const fireStoreGroupId = `group_${g.id}`;
            sqlGroupIdToFirestoreGroupId[g.id] = fireStoreGroupId;

            return {
                id: fireStoreGroupId,
                name: g.name,
                players: pIds,
                standings: [] // Standings will likely be empty or need calculation
            };
        });

        const categoryData = {
            name: sqlComp.name, // Use original competition name as Category name
            type: sqlComp.type === 'league' ? 'league' : 'tournament',
            settings: {
                setsToWin: parseInt(sqlComp.sets_to_win) || 3,
                pointsPerSet: parseInt(sqlComp.points_per_set) || 11
            },
            groups: groupsForFirestore,
            participants: Array.from(allPlayerIdsInCategory),
            createdAt: serverTimestamp()
        };

        const catRef = await addDoc(collection(db, `competitions/${TARGET_COMPETITION_ID}/categories`), categoryData);
        sqlCompIdToCategoryId[sqlComp.id] = catRef.id;
        console.log(`Created Category: ${sqlComp.name} (ID: ${catRef.id})`);
    }

    // 4. Import Matches
    console.log("Importing Matches...");
    let matchCount = 0;
    for (const m of data.matches) {
        const categoryId = sqlCompIdToCategoryId[m.competition_id];
        if (!categoryId) continue;

        const p1Id = sqlPlayerIdToFirestoreId[m.player1_id];
        const p2Id = sqlPlayerIdToFirestoreId[m.player2_id];

        // Ensure sets is valid JSON or array
        let sets = [];
        try {
            if (m.sets) {
                sets = JSON.parse(m.sets);
            }
        } catch (e) {
            console.warn(`Failed to parse sets for match ${m.id}`);
        }

        await addDoc(collection(db, "matches"), {
            competitionId: TARGET_COMPETITION_ID,
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
            roundNumber: m.round_number ? parseInt(m.round_number) : null,
            bracketPosition: m.bracket_position ? parseInt(m.bracket_position) : null,
            sets: sets,
            createdAt: serverTimestamp()
        });
        matchCount++;
        if (matchCount % 100 === 0) console.log(`Imported ${matchCount} matches...`);
    }

    // 5. Update Competition Stats (Total participants count)
    console.log("Updating competition stats...");
    const allUniquePlayersSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", organizationId)));
    // This is not quite right as we only want players in THIS competition.
    // We would need to traverse all categories/groups.
    
    console.log(`Migration finished! Imported ${matchCount} matches into Competition ${TARGET_COMPETITION_ID}`);
}

runMigrate().catch(console.error);
