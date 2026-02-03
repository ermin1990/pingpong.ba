
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where, 
    doc, 
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
        } else if (src.id === '44') {
             // Explicit mapping for Seniorke 2 -> SENIORKE
             const seniorCat = categories.find(c => normalize(c.name) === 'SENIORKE');
             if (seniorCat) sqlCompIdToCatId[src.id] = seniorCat.id;
        }
    });

    // 2. Prepare Player Mapping
    console.log("Mapping Players...");
    const existingPlayersSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", ORGANIZATION_ID)));
    const existingPlayersByName = {};
    existingPlayersSnap.forEach(doc => {
        existingPlayersByName[doc.data().name] = doc.id;
    });

    const sqlPlayerIdToFirestoreId = {};
    data.players.forEach(p => {
        if (existingPlayersByName[p.name]) {
            sqlPlayerIdToFirestoreId[p.id] = existingPlayersByName[p.name];
        }
    });

    // 3. Process Groups
    console.log("Processing Groups...");
    
    for (const sqlCompId of Object.keys(sqlCompIdToCatId)) {
        const firestoreCatId = sqlCompIdToCatId[sqlCompId];
        const compGroups = data.groups.filter(g => g.competition_id === sqlCompId);
        
        if (compGroups.length === 0) continue;

        const groupConfig = {};
        const groupsList = [];
        
        let validGroupsCount = 0;

        for (const g of compGroups) {
            let pIdsRaw = g.player_ids;
            let rawIds = [];

            // Try JSON parse first (handles ["1", "2"])
            try {
                // Determine if it needs unescaping
                if (typeof pIdsRaw === 'string' && (pIdsRaw.startsWith('[') || pIdsRaw.startsWith('"['))) {
                    while (typeof pIdsRaw === 'string') {
                         try {
                            const parsed = JSON.parse(pIdsRaw);
                            pIdsRaw = parsed;
                         } catch (e) {
                            break;
                         }
                    }
                    if (Array.isArray(pIdsRaw)) rawIds = pIdsRaw;
                }
            } catch (e) {
                // If JSON fails, use simple comma split if it looks like csv
            }

            // Fallback for CSV like "1,2,3"
            if (rawIds.length === 0 && typeof g.player_ids === 'string') {
                 rawIds = g.player_ids.split(',').map(s => s.trim());
            }

            const firestorePlayerIds = rawIds.map(rid => sqlPlayerIdToFirestoreId[String(rid)]).filter(x => !!x);
            
            // Determine Index from Group Name (A -> 0, B -> 1)
            let groupIndex = -1;
            if (g.name.length === 1 && g.name >= 'A' && g.name <= 'Z') {
                groupIndex = g.name.charCodeAt(0) - 65;
            } else if (!isNaN(parseInt(g.name))) {
                 groupIndex = parseInt(g.name) - 1; // Assuming 1-based numeric names
            } else {
                // Fallback: assign incremental based on sort or iteration?
                // For now, let's just log warning if weird name
                // Actually, let's use the iterator index if we sort them first
            }

            if (groupIndex === -1) {
                // Heuristic: Map group names A, B, C...
                 // This assumes compGroups are processed in order or we can sort them
            }
            
            // To do this reliably, let's just store them with id for now, 
            // but we need the index for the key in groupConfig.
            
            groupsList.push({
                name: g.name,
                players: firestorePlayerIds,
                originalId: g.id
            });
        }

        // Sort groups by name to determine indices
        groupsList.sort((a, b) => a.name.localeCompare(b.name));

        groupsList.forEach((group, index) => {
             groupConfig[index] = group.players;
        });

        // Update Category Document
        // We also want to update the 'groups' field structure as used in import_matched_data for consistency?
        // Or just `groupConfig`. The prompt implies `groupConfig` is needed.
        
        await updateDoc(doc(db, "competitions", TARGET_COMPETITION_ID, "categories", firestoreCatId), {
            groupConfig: groupConfig
        });
        
        console.log(`Updated Category ${firestoreCatId}: groupConfig with ${Object.keys(groupConfig).length} groups.`);
    }

    console.log("Done.");
}

runUpdate().catch(console.error);
