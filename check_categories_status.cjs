
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkCategories() {
    console.log("Fetching categories...");
    const catSnap = await getDocs(collection(db, "competitions", TARGET_COMPETITION_ID, "categories"));
    
    console.log(`Found ${catSnap.size} categories:`);
    catSnap.forEach(d => {
        const data = d.data();
        const pCount = data.participants ? data.participants.length : 0;
        const gCount = data.groupConfig ? Object.keys(data.groupConfig).length : 0;
        console.log(`- ${data.name} (ID: ${d.id}) | Participants: ${pCount} | Groups: ${gCount}`);
    });
}

checkCategories().catch(console.error);
