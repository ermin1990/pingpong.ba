
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where, 
    doc, 
    getDoc,
    updateDoc
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

async function runUpdate() {
    // Load Data
    const extractedDataPath = path.join(__dirname, 'extracted_data.json');
    const participationsPath = path.join(__dirname, 'extracted_participations.json');
    
    const extractedData = JSON.parse(fs.readFileSync(extractedDataPath, 'utf8'));
    const participationsData = JSON.parse(fs.readFileSync(participationsPath, 'utf8'));

    // 1. Build SQL ID -> Player Name Map
    const sqlPlayerIdToName = {};
    extractedData.players.forEach(p => {
        sqlPlayerIdToName[p.id] = p.name;
    });

    // 2. Fetch Firestore Players (Org 8) -> Map Name -> ID
    console.log("Fetching Firestore players...");
    const playersSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", ORGANIZATION_ID)));
    const nameToFirestoreId = {};
    playersSnap.forEach(d => {
        nameToFirestoreId[d.data().name] = d.id;
    });

    // 3. Fetch/Map Categories
    console.log("Fetching target categories...");
    const catSnap = await getDocs(collection(db, "competitions", TARGET_COMPETITION_ID, "categories"));
    const categories = [];
    catSnap.forEach(d => categories.push({ id: d.id, ...d.data() }));

    const normalize = (s) => s.trim().toUpperCase();
    const sqlCompIdToCatId = {};
    
    extractedData.competitions.forEach(src => {
        const srcName = normalize(src.name);
        const match = categories.find(c => normalize(c.name) === srcName);
        if (match) {
            sqlCompIdToCatId[src.id] = match.id;
        } else if (src.id === '44') {
             // Explicit mapping for Seniorke 2 -> SENIORKE
             const seniorCat = categories.find(c => normalize(c.name) === 'SENIORKE');
             if (seniorCat) sqlCompIdToCatId[src.id] = seniorCat.id;
        }
    });

    // 4. Process Participations
    const categoryNewParticipants = {}; // CatID -> Set<FirestorePlayerID>

    let foundCount = 0;
    let missingPlayerCount = 0;

    for (const record of participationsData.competition_players) {
        const sqlCompId = record.competition_id;
        const sqlPlayerId = record.player_id;

        const catId = sqlCompIdToCatId[sqlCompId];
        if (!catId) continue; // Not a mapped competition

        const playerName = sqlPlayerIdToName[sqlPlayerId];
        if (!playerName) {
            // console.warn(`Warning: SQL Player ID ${sqlPlayerId} not found in extracted_data.json`);
            missingPlayerCount++;
            continue;
        }

        const firestoreId = nameToFirestoreId[playerName];
        if (!firestoreId) {
            // console.warn(`Warning: Player "${playerName}" not found in Firestore Org 8.`);
            missingPlayerCount++;
            continue;
        }

        if (!categoryNewParticipants[catId]) {
            categoryNewParticipants[catId] = new Set();
        }
        categoryNewParticipants[catId].add(firestoreId);
        foundCount++;
    }

    console.log(`Matched ${foundCount} participations.`);
    if (missingPlayerCount > 0) console.log(`Skipped ${missingPlayerCount} records due to missing player data.`);

    // 5. Update Firestore Categories
    console.log("Updating categories...");
    for (const catId of Object.keys(categoryNewParticipants)) {
        const newIds = categoryNewParticipants[catId];
        
        const catRef = doc(db, "competitions", TARGET_COMPETITION_ID, "categories", catId);
        const catDoc = await getDoc(catRef);
        
        if (!catDoc.exists()) continue;

        const currentParticipants = catDoc.data().participants || [];
        const uniqueParams = new Set(currentParticipants);
        
        let added = 0;
        newIds.forEach(id => {
            if (!uniqueParams.has(id)) {
                uniqueParams.add(id);
                added++;
            }
        });

        if (added > 0) {
            await updateDoc(catRef, {
                participants: Array.from(uniqueParams)
            });
            console.log(`Updated Category ${catDoc.data().name}: Added ${added} new participants (Total: ${uniqueParams.size}).`);
        } else {
            console.log(`Category ${catDoc.data().name}: No new participants to add.`);
        }
    }
    
    console.log("Done.");
}

runUpdate().catch(console.error);
