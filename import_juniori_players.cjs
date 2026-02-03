
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    where, 
    addDoc, 
    updateDoc, 
    doc, 
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

const TARGET_COMPETITION_ID = "siWtPLJ0LAfDMIPg9Is2";
const ORGANIZATION_ID = "E9RaaxT0RAoSEqDTt7qs";
const JUNIORI_CAT_ID = "KhcNQNFVjvbjwIz8n0qu";

const metadata = [
    { name: "KANLIĆ ARON", club: "STK SPIN 2012" },
    { name: "FAZLIĆ ERVIN", club: "STK KREKA" },
    { name: "MIHAEL ZOVKO", club: "STK MOSTAR" },
    
    { name: "BAŠIĆ NIDAL", club: "STK SPIN 2012" },
    { name: "ŠKULJ BAKIR", club: "STK ALADŽA" },
    { name: "MORANJKIĆ HARUN", club: "STK KREKA" },
    
    { name: "VUKAŠIN KECMAN", club: "OSTK SPIN B.LUKA" },
    { name: "TVRTKOVIĆ DARIO", club: "STK ALADŽA" },
    { name: "MARKO PANDŽA", club: "STK MOSTAR" },
    
    { name: "ZLOTRG DINO", club: "STK MLADOST" },
    { name: "FAKIĆ FARUK", club: "STK SPIN 2012" },
    { name: "NUKOVIĆ ALMAS", club: "STK KREKA" },
    
    { name: "ČELIĆ ĐORĐE", club: "STK SPARTAK INSPIRA" },
    { name: "BAJROVIĆ BERIZ", club: "STK ALADŽA" },
    { name: "SUČIĆ LUKA", club: "STK CM VITEZ" },
    
    { name: "HANIĆ AZUR", club: "STK LUKAVAC" },
    { name: "MUJKIĆ NISVET", club: "STK SPIN DOBOJ ISTOK" },
    { name: "LUKIĆ PAVLE", club: "STK BORAC" },
    { name: "PETKOVIĆ JOVAN", club: "STK OZREN" },
    
    { name: "MIČIĆ MARKO", club: "STK SPIN 2012" },
    { name: "JAGANJAC AMAR", club: "STK KREKA" },
    { name: "AJDINOVIĆ RAŠID", club: "STK ALADŽA" },
    { name: "IMAMOVIĆ VEDAD", club: "STK LUKAVAC" },
    
    { name: "MURATOVIĆ ADI", club: "STK KREKA" },
    { name: "MAGLIĆ KAMER", club: "STK MLADOST" },
    { name: "NOŽICA MIHAJLO", club: "STK BORAC" },
    { name: "MUHIĆ TARIK", club: "STK LUKAVAC" }
];

async function run() {
    console.log("Fetching existing players...");
    const pSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", ORGANIZATION_ID)));
    const existingPlayersByName = {};
    pSnap.forEach(d => {
        const data = d.data();
        existingPlayersByName[data.name.toUpperCase().trim()] = d.id;
    });

    const participantIds = [];
    const groupConfig = {
        0: [], // A
        1: [], // B
        2: [], // C
        3: [], // D
        4: [], // E
        5: [], // F
        6: [], // G
        7: []  // H
    };

    let pIndex = 0;
    
    // Groups A-E have 3 players
    // Groups F-H have 4 players
    const groupSizes = [3, 3, 3, 3, 3, 4, 4, 4];
    
    let currentMetaIndex = 0;

    for (let gIdx = 0; gIdx < groupSizes.length; gIdx++) {
        const size = groupSizes[gIdx];
        
        for (let i = 0; i < size; i++) {
            if (currentMetaIndex >= metadata.length) break;
            
            const p = metadata[currentMetaIndex];
            const normName = p.name.toUpperCase().trim();
            
            let pid = existingPlayersByName[normName];
            
            if (!pid) {
                console.log(`Creating new player: ${p.name} (${p.club})`);
                const ref = await addDoc(collection(db, "players"), {
                    name: p.name,
                    club: p.club,
                    organizationId: ORGANIZATION_ID,
                    createdAt: serverTimestamp()
                });
                pid = ref.id;
                existingPlayersByName[normName] = pid;
            } else {
                console.log(`Found existing: ${p.name}`);
            }
            
            participantIds.push(pid);
            groupConfig[gIdx].push(pid);
            
            currentMetaIndex++;
        }
    }

    console.log(`Total Participants: ${participantIds.length}`);

    // Update Category
    const catRef = doc(db, "competitions", TARGET_COMPETITION_ID, "categories", JUNIORI_CAT_ID);
    await updateDoc(catRef, {
        participants: participantIds,
        groupConfig: groupConfig
    });

    console.log("Category JUNIORI updated successfully.");
}

run().catch(console.error);
