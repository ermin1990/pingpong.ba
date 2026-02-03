
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } = require("firebase/firestore");

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

const competitions = [
  { name: 'Premijer liga muškarci 2025/2026', slug: 'premijer-liga-muskarci-20252026', type: 'league', status: 'in_progress' },
  { name: 'Najmlađe kadetkinje', slug: 'najmlade-kadetkinje', type: 'tournament', status: 'completed' },
  { name: 'Najmlađi kadeti', slug: 'najmladi-kadeti', type: 'tournament', status: 'completed' },
  { name: 'Mlađe kadetkinje', slug: 'mlade-kadetkinje', type: 'tournament', status: 'completed' },
  { name: 'Kadeti', slug: 'kadeti', type: 'tournament', status: 'completed' },
  { name: 'Kadetkinje', slug: 'kadetkinje', type: 'tournament', status: 'completed' },
  { name: 'Seniorke', slug: 'seniorke', type: 'tournament', status: 'completed' },
  { name: 'Seniorke 2', slug: 'seniorke-2', type: 'tournament', status: 'completed' },
  { name: 'XIX MEMORIJAL MARCEL MIZDARIĆ 2025, KATEGORIJA 40+', slug: 'xix-memorijal-marcel-mizdaric-2025-kategorija-40', type: 'tournament', status: 'active' },
  { name: 'XIX MEMORIJAL MARCEL MIZDARIĆ 2025, KATEGORIJA 50+', slug: 'xix-memorijal-marcel-mizdaric-2025-kategorija-50', type: 'tournament', status: 'active' },
  { name: 'XIX MEMORIJAL MARCEL MIZDARIĆ 2025, KATEGORIJA 60+', slug: 'xix-memorijal-marcel-mizdaric-2025-kategorija-60', type: 'tournament', status: 'active' },
  { name: 'XIX MEMORIJAL MARCEL MIZDARIĆ 2025, KATEGORIJA 65+', slug: 'xix-memorijal-marcel-mizdaric-2025-kategorija-65', type: 'tournament', status: 'active' },
  { name: 'XIX MEMORIJAL MARCEL MIZDARIĆ 2025, KATEGORIJA 70+', slug: 'xix-memorijal-marcel-mizdaric-2025-kategorija-70', type: 'tournament', status: 'active' },
  { name: 'XIX MEMORIJAL MARCEL MIZDARIĆ 2025, KATEGORIJA ŽENE', slug: 'xix-memorijal-marcel-mizdaric-2025-kategorija-zene', type: 'tournament', status: 'active' }
];

async function run() {
  const email = 'smoranjkic@gmail.com';
  console.log(`Tražim organizaciju za: ${email}`);
  
  const q = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(q);
  
  let organizationId = null;

  if (!snap.empty) {
    organizationId = snap.docs[0].data().organizationId;
  } else {
    // Provjera whiteliste
    const wq = query(collection(db, "whitelisted_emails"), where("email", "==", email));
    const wsnap = await getDocs(wq);
    if (!wsnap.empty) {
      organizationId = wsnap.docs[0].data().organizationId;
    }
  }

  if (!organizationId) {
    console.log("Korisnik nema organizationId. Kreiram novu organizaciju...");
    const orgRef = await addDoc(collection(db, "organizations"), {
      name: "Imported Organization",
      adminEmail: email,
      createdAt: serverTimestamp()
    });
    organizationId = orgRef.id;
    console.log(`Kreirana organizacija ID: ${organizationId}`);
  } else {
    console.log(`Pronađena organizacija ID: ${organizationId}`);
  }

  console.log(`Importujem ${competitions.length} takmičenja...`);

  for (const comp of competitions) {
    const docRef = await addDoc(collection(db, "competitions"), {
      ...comp,
      organizationId: organizationId,
      createdAt: serverTimestamp(),
      sport: "Table Tennis",
      participantsCount: 0
    });
    console.log(`Dodano: ${comp.name} (${docRef.id})`);
  }

  console.log("Import završen!");
}

run().catch(console.error);
