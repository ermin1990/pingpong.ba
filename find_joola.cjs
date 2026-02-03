
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function findTarget() {
    const email = 'selimovicermin90@gmail.com';
    const uq = query(collection(db, "users"), where("email", "==", email));
    const uSnap = await getDocs(uq);
    
    if (uSnap.empty) {
        console.log("User not found");
        return;
    }
    
    const orgId = uSnap.docs[0].data().organizationId;
    console.log(`User Org ID: ${orgId}`);
    
    const cq = query(collection(db, "competitions"), where("organizationId", "==", orgId));
    const cSnap = await getDocs(cq);
    
    console.log("Existing competitions:");
    cSnap.forEach(doc => {
        console.log(`- ${doc.data().name} (ID: ${doc.id})`);
    });
}

findTarget().catch(console.error);
