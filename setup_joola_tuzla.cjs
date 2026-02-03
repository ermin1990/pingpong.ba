
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    serverTimestamp 
} = require('firebase/firestore');

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

const TARGET_EMAIL = "selimovicermin90@gmail.com";
const TARGET_COMP_NAME = "JOOLA Kup 2025 Tuzla";

async function setupTarget() {
    // 1. Find User
    console.log(`Finding user ${TARGET_EMAIL}...`);
    const q = query(collection(db, "users"), where("email", "==", TARGET_EMAIL));
    const snap = await getDocs(q);
    
    if (snap.empty) {
        console.error("User not found!");
        return;
    }
    
    const user = snap.docs[0].data();
    const organizationId = user.organizationId;
    console.log(`Found user. Org ID: ${organizationId}`);

    // 2. Check/Create Competition
    // Since we cleared everything, we likely need to create it.
    const cq = query(
        collection(db, "competitions"), 
        where("organizationId", "==", organizationId),
        where("name", "==", TARGET_COMP_NAME)
    );
    const cSnap = await getDocs(cq);

    let compId;
    if (!cSnap.empty) {
        compId = cSnap.docs[0].id;
        console.log(`Competition '${TARGET_COMP_NAME}' already exists (ID: ${compId})`);
    } else {
        const newComp = await addDoc(collection(db, "competitions"), {
            name: TARGET_COMP_NAME,
            slug: 'joola-kup-2025-tuzla', 
            organizationId: organizationId,
            type: 'tournament',
            status: 'active',
            participantsCount: 0,
            createdAt: serverTimestamp(),
            sport: 'Table Tennis'
        });
        compId = newComp.id;
        console.log(`Created new competition '${TARGET_COMP_NAME}' (ID: ${compId})`);
    }

    // Output for next steps
    console.log(`\nTARGET_COMP_ID=${compId}`);
    console.log(`TARGET_ORG_ID=${organizationId}`);
}

setupTarget().catch(console.error);
