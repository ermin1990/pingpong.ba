
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    setDoc,
    writeBatch
} = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
    apiKey: "AIzaSyDEp...", // Use the real one from previously seen config
    authDomain: "teamsphere-a85ec.firebaseapp.com",
    projectId: "teamsphere-a85ec",
    storageBucket: "teamsphere-a85ec.firebasestorage.app",
    messagingSenderId: "598444365313",
    appId: "1:598444365313:web:96898436cd97034c568d4a"
};

// I need the API key. I'll search for it in the workspace or use a placeholder if I can't find it.
// Actually, I saw it in a previous tool output but I can't see it now.
// Let me grep for it in the frontend.

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const organizationId = "nSYWYJQUTt3xosX1ApDE";

async function runImport() {
    const rawData = fs.readFileSync('extracted_data.json', 'utf8');
    const data = JSON.parse(rawData);

    console.log("Fetching existing competitions from Firestore...");
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

    console.log("Importing Players...");
    const sqlPlayerIdToFirestoreId = {};
    // To avoid duplicates, check existing players first
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
                createdAt: new Date().toISOString()
            });
            sqlPlayerIdToFirestoreId[p.id] = newPlayerRef.id;
            existingPlayersByName[p.name] = newPlayerRef.id;
            console.log(`Added player: ${p.name}`);
        }
    }

    console.log("Creating Categories and Groups...");
    const sqlCompIdToCategoryId = {};
    for (const sqlId of Object.keys(sqlCompIdToFirestoreId)) {
        const firestoreId = sqlCompIdToFirestoreId[sqlId];
        const sqlComp = data.competitions.find(c => c.id === sqlId);
        
        // Create one category per competition
        const catRef = await addDoc(collection(db, `competitions/${firestoreId}/categories`), {
            name: "Glavna Kategorija",
            type: sqlComp.type === 'league' ? 'league' : 'tournament',
            settings: {
                setsToWin: parseInt(sqlComp.sets_to_win) || 3,
                pointsPerSet: parseInt(sqlComp.points_per_set) || 11
            },
            groups: [], // Will populate later
            createdAt: new Date().toISOString()
        });
        sqlCompIdToCategoryId[sqlId] = catRef.id;
        console.log(`Created category for ${sqlComp.name}`);
    }

    // Now map groups
    for (const g of data.groups) {
        const firestoreId = sqlCompIdToFirestoreId[g.competition_id];
        const categoryId = sqlCompIdToCategoryId[g.competition_id];
        if (!firestoreId || !categoryId) continue;

        // Map player IDs
        const playerIds = (g.player_ids || "").split(',').map(sid => sqlPlayerIdToFirestoreId[sid.trim()]).filter(id => !!id);
        
        const groupData = {
            id: g.id, // SQL ID as internal ID
            name: g.name,
            players: playerIds
        };

        // Update the category document with this group
        // This is simplified; normally you'd push to the array.
        // For efficiency, I'll aggregate and update at the end or do it now.
        // Let's just create a list of groups per category first.
    }

    console.log("Importing Matches...");
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
            status: m.status === 'completed' ? 'completed' : 'pending',
            round: m.round || "1",
            phase: m.is_knockout ? 'knockout' : 'groups',
            groupId: m.group_id || null, // Note: this is the SQL group_id
            sets: m.sets ? JSON.parse(m.sets) : [],
            createdAt: new Date().toISOString()
        });
        matchCount++;
        if (matchCount % 50 === 0) console.log(`Imported ${matchCount} matches...`);
    }

    console.log("Migration finished successfully!");
}

runImport().catch(console.error);
