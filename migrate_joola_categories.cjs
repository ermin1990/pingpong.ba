
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    addDoc, 
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

async function runMigrate() {
    const dataPath = path.join(__dirname, 'extracted_joola.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`Importing ${data.competitions.length} categories into Comp ID: ${TARGET_COMPETITION_ID}...`);

    for (const sqlComp of data.competitions) {
        const categoryData = {
            name: sqlComp.name,
            type: sqlComp.type === 'league' ? 'league' : 'tournament',
            settings: {
                setsToWin: parseInt(sqlComp.sets_to_win) || 3,
                pointsPerSet: parseInt(sqlComp.points_per_set) || 11
            },
            groups: [], // No groups available in this dump
            participants: [], // No players available in this dump
            createdAt: serverTimestamp()
        };

        const catRef = await addDoc(collection(db, `competitions/${TARGET_COMPETITION_ID}/categories`), categoryData);
        console.log(`Created Category: ${sqlComp.name} (ID: ${catRef.id})`);
    }

    console.log("Migration finished.");
}

runMigrate().catch(console.error);
