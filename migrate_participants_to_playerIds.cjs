
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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

async function run() {
    console.log("Fetching categories...");
    const catSnap = await getDocs(collection(db, "competitions", TARGET_COMPETITION_ID, "categories"));
    
    let updatedCount = 0;

    for (const d of catSnap.docs) {
        const data = d.data();
        const participants = data.participants || [];
        const playerIds = data.playerIds || [];

        // If participants has data but playerIds is empty or different, sync them.
        // We trust participants as the recently imported source of truth.
        
        if (participants.length > 0) {
            // merge unique ids
            const combined = new Set([...playerIds, ...participants]);
            const newPlayerIds = Array.from(combined);
            
            if (newPlayerIds.length !== playerIds.length) {
                console.log(`Updating ${data.name} (ID: ${d.id})...`);
                console.log(`  Old playerIds: ${playerIds.length}`);
                console.log(`  New playerIds: ${newPlayerIds.length} (Source: participants=${participants.length})`);
                
                await updateDoc(doc(db, "competitions", TARGET_COMPETITION_ID, "categories", d.id), {
                    playerIds: newPlayerIds,
                    participants: newPlayerIds // Keep them in sync just in case
                });
                updatedCount++;
            } else {
                console.log(`Skipping ${data.name} - already synced.`);
            }
        } else {
             console.log(`Skipping ${data.name} - no participants found.`);
        }
    }

    console.log(`Updated ${updatedCount} categories.`);
}

run().catch(console.error);
