const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch } = require('firebase/firestore');

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

async function deleteAll() {
    console.log("Starting deletion of ALL competitions and matches...");
    
    // Create batches
    let batch = writeBatch(db);
    let count = 0;

    async function commitBatchIfNeeded() {
        if (count >= 400) {
            await batch.commit();
            console.log("Committed batch of 400 deletions...");
            batch = writeBatch(db);
            count = 0;
        }
    }

    // 1. Delete Matches
    console.log("Fetching matches...");
    const matchesSnap = await getDocs(collection(db, "matches"));
    console.log(`Found ${matchesSnap.size} matches to delete.`);
    
    for (const d of matchesSnap.docs) {
        batch.delete(d.ref);
        count++;
        await commitBatchIfNeeded();
    }

    // 1.5 Delete Players (NEW)
    console.log("Fetching players...");
    const playersSnap = await getDocs(collection(db, "players"));
    console.log(`Found ${playersSnap.size} players to delete.`);
    
    for (const p of playersSnap.docs) {
        batch.delete(p.ref);
        count++;
        await commitBatchIfNeeded();
    }

    // 2. Delete Competitions and their subcollections
    console.log("Fetching competitions...");
    const compsSnap = await getDocs(collection(db, "competitions"));
    console.log(`Found ${compsSnap.size} competitions to delete.`);

    for (const compDoc of compsSnap.docs) {
        // Fetch categories subcollection
        console.log(`Checking categories for competition ${compDoc.id}...`);
        const catSnap = await getDocs(collection(db, "competitions", compDoc.id, "categories"));
        
        for (const cat of catSnap.docs) {
            batch.delete(cat.ref);
            count++;
            await commitBatchIfNeeded();
        }

        // Delete the competition itself
        batch.delete(compDoc.ref);
        count++;
        await commitBatchIfNeeded();
    }

    // Identify and commit remaining
    if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${count} deletions.`);
    }

    console.log("All competitions and matches deleted successfully.");
}

deleteAll().catch(console.error);
