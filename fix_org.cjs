
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } = require('firebase/firestore');

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

async function fixUserOrg() {
    const email = 'selimovicermin90@gmail.com';
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    
    if (snap.empty) return;
    
    const userDoc = snap.docs[0];
    let orgId = userDoc.data().organizationId;
    
    if (!orgId) {
        // Create Organization
        const orgRef = await addDoc(collection(db, "organizations"), {
            name: "JOOLA Organization",
            adminEmail: email,
            createdAt: serverTimestamp()
        });
        orgId = orgRef.id;
        
        // Update User
        await updateDoc(userDoc.ref, { organizationId: orgId });
        console.log(`Created Org ${orgId} and assigned to user.`);
    } else {
        console.log(`User already has Org ${orgId}`);
    }

    // Update the competition as well if it has null org
    const compId = "siWtPLJ0LAfDMIPg9Is2";
    await updateDoc(doc(db, "competitions", compId), {
        organizationId: orgId
    });
    console.log("Updated competition with Org ID.");
    
    console.log(`FINAL_ORG_ID=${orgId}`);
}

fixUserOrg().catch(console.error);
