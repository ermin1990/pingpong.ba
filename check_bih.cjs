
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

async function checkUser() {
    const q = query(collection(db, "users"), where("email", "==", "smoranjkic@gmail.com"));
    const snap = await getDocs(q);
    if (snap.empty) {
        console.log("User not found in pingpong-bih");
    } else {
        const user = snap.docs[0].data();
        console.log("User found in pingpong-bih:", user);
        console.log("Organization ID:", user.organizationId);
    }
}

checkUser().catch(console.error);
