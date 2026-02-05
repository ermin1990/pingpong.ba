// scripts/seed-demo.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const demoTournament = {
  name: "Balkan Cup 2026 - International Table Tennis Open",
  date: "2026-05-15",
  endDate: "2026-05-17",
  location: "Sportska dvorana 'Novo Sarajevo' (Grbavica)",
  description: "Najveći međunarodni stonoteniski turnir u regiji koji okuplja preko 300 takmičara iz cijelog Balkana i šire. Očekuju vas vrhunski mečevi, odlična atmosfera i bogat nagradni fond.",
  status: "active",
  type: "tournament",
  image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&q=80&w=1200",
  
  // Professional Fields
  organizer: "Stonoteniski klub 'SPIN' Sarajevo",
  director: "Mirza Ibrahimović",
  referee: "Adnan Hodžić (ITTF International Umpire)",
  entryFee: "30 KM (15 EUR) pojedinačno, 50 KM parovi",
  prizes: "Ukupni nagradni fond: 5.000 KM. Pobjednik dobija 1.500 KM + Pehar. Ostali nagrađeni opremom brenda Butterfly.",
  schedule: "PETAK (15.05.2026):\n- 18:00 - Registracija i akreditacije\n- 19:00 - Tehnički sastanak\n\nSUBOTA (16.05.2026):\n- 08:30 - Otvaranje dvorane\n- 09:30 - Svečano otvaranje\n- 10:00 - Grupna faza (Seniori i U21)\n- 14:00 - Pauza\n- 15:30 - Nastavak takmičenja po grupama\n\nNEDJELJA (17.05.2026):\n- 09:00 - Glavni žrijeb (Knockout faza)\n- 11:30 - Polufinala i Finala\n- 13:00 - Dodjela nagrada",
  rules: "1. Turnir se igra po važećim ITTF pravilima.\n2. Kategorije: Seniori (M/Ž), U21, Veterani 40-50, 50-60, 60+.\n3. Sve partije se igraju u 3 dobijena seta (best of 5).\n4. Obavezna je sportska dvoranska oprema.\n5. Loptice: Butterfly R40+ ***.\n6. Žalbe se podnose vrhovnom sudiji uz taksu od 50 KM.",
  
  contact: {
    phone: "+387 61 123 456",
    email: "info@spin-sarajevo.ba",
    address: "Zvornička 15, 71000 Sarajevo, Bosna i Hercegovina"
  },
  
  availableCategories: [
    "Muški Singl",
    "Ženski Singl",
    "Muški Dubl",
    "Ženski Dubl",
    "Mješoviti Dubl",
    "U21 Muški",
    "U21 Ženski",
    "U18 Muški",
    "U18 Ženski",
    "Veterani 40+",
    "Veterani 50+",
    "Veterani 60+"
  ],
  
  registration: {
    isOpen: true,
    link: "https://forms.google.com/balkan-cup-2026",
    deadline: "2026-05-10"
  },
  
  isPublic: true,
  
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  categoryIds: [] // Will be populated manually or through UI
};

async function seed() {
  try {
    console.log("🚀 Pokrećem unos demo turnira...");
    const docRef = await addDoc(collection(db, "competitions"), demoTournament);
    console.log("✅ Demo turnir uspješno kreiran sa ID: ", docRef.id);
    console.log("🔗 Pristupi mu na: http://localhost:5173/p/" + docRef.id);
    process.exit(0);
  } catch (e) {
    console.error("❌ Greška pri unosu: ", e);
    process.exit(1);
  }
}

seed();
