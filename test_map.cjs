
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc,
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

// Map Old Competition Names (Org 4) to New Categories
// Keys are SQL Comp Names (from older export)
// Values are implicitly matched by name (UPPERCASE in new Firestore)
const NAME_MAPPING = {
    // Basic Normalization: We will uppercase the old name and try to find a match.
    // Specific Overrides:
};

async function runMappingImport() {
    const dataPath = path.join(__dirname, 'extracted_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const sourceData = JSON.parse(rawData);

    // 1. Fetch Target Categories
    console.log(`Fetching categories for Comp ID: ${TARGET_COMPETITION_ID}...`);
    const catSnap = await getDocs(collection(db, "competitions", TARGET_COMPETITION_ID, "categories"));
    const categories = [];
    catSnap.forEach(d => categories.push({ id: d.id, ...d.data() }));
    
    // Normalization helper
    const normalize = (s) => s.trim().toUpperCase();

    // Map: SourceCompID -> TargetCategoryID
    const compIdToCatId = {};

    sourceData.competitions.forEach(src => {
        const srcName = normalize(src.name);
        // Find matching category
        // Try strict match first
        let match = categories.find(c => normalize(c.name) === srcName);
        
        // Try without "PODKATEGORIJA" if not found? No, names seem similar.
        
        if (match) {
            compIdToCatId[src.id] = match.id;
            console.log(`Mapped '${src.name}' -> '${match.name}'`);
        } else {
            console.warn(`No category match for '${src.name}'`);
        }
    });

    // 2. Fetch/Prepare Organization ID
    // We already know it's the one from fix_org.cjs, but let's query the competition to be safe/clean
    // Or just use the one we likely set: "siWtPLJ0LAfDMIPg9Is2" competition is in an Org.
    // Actually create mapped players in the *same* org as the competition.
    const compDoc = await getDocs(query(collection(db, "competitions"), where("__name__", "==", TARGET_COMPETITION_ID))); // __name__ is ID
    // Actually we can just get the doc
    // ...
    // Assuming Org ID is the one from the competition document.
    // ...
    
    // Let's just hardcode the org for now if needed, or read from comp.
    // We'll read it in the next step properly.
}

runMappingImport().catch(console.error);
