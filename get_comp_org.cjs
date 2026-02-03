
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function getOrgInfo() {
    const compId = "AoUYbhJZd8IlmJuruRN2";
    const docRef = doc(db, "competitions", compId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        console.log("Competition Found!");
        console.log("Organization ID:", snap.data().organizationId);
    } else {
        console.log("Competition not found");
    }
}

getOrgInfo().catch(console.error);
