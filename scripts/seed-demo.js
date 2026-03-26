// scripts/seed-demo.js
import admin from "firebase-admin";
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Greška: serviceAccountKey.json nije pronađen u rootu projekta!");
  console.log("Molimo preuzmite service account ključ sa Firebase konzole i spremite ga kao serviceAccountKey.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedRosePharmLeague() {
  const rosePharmLeagueId = "rose-pharm-kreka-liga-s1";
  const rosePharmLeague = {
    name: "ROSE PHARM – KREKA LIGA (Sezona 1)",
    slug: "rose-pharm-kreka-liga-s1",
    organizer: "Stonoteniski klub 'KREKA' Tuzla",
    sponsor: "ROSE PHARM apoteke",
    location: "Stonoteniska dvorana „KREKA“ Tuzla",
    startDate: "2026-03-22",
    startTime: "17:00",
    status: "active",
    type: "League",
    ownerUid: "DAt7L6Qo9GZsh1Y6gN2V5LszshY2", // Tvoj UID iz Firebase-a
    isSeason: true, 
    subCompetitions: [], 
    description: "Prva liga za veterane, rekreativce i ljubitelje stonog tenisa u Tuzli.",
    
    // Points System (based on image text)
    pointsSystem: {
      winInGroup: 5,
      winAfterGroup: 5,
      bonusPoints: {
        "1": 50,
        "2": 40,
        "3": 35,
        "4": 30,
        "5": 25,
        "6": 20,
        "7": 15,
        "8": 10,
        "9-16": 5
      }
    },

    prizes: {
      "1": "150 KM + Pehar + Medalja + Diploma",
      "2": "100 KM + Medalja + Diploma",
      "3": "50 KM + Medalja + Diploma",
      others: "Zahvalnice za sve učesnike"
    },

    rules: {
      groupSize: "4-6 igrača",
      matchFormat: "Best of 3 (do 2 dobijena seta) u grupama i ranoj fazi",
      knockoutFormat: "Best of 5 (do 3 dobijena seta) od 1/4 finala pa nadalje",
      advancement: "2 ili 3 najbolja iz grupe u glavni žrijeb, ostali u utješni/razigravanje",
      eligibility: "Svi registrovani i neregistrovani (osim Premijer lige BiH)",
      rankingImpact: "Rezultati utiču na žrijeb za naredne turnire"
    },

    charity: {
      minFee: "10 KM",
      purpose: "Sanacija krova dvorane i ugradnja solarnih panela",
      transparency: "Javna objava prihoda na FB stranici"
    },

    registration: {
      preliminaryDeadline: "2026-03-21 18:00",
      finalDeadline: "2026-03-22 09:00",
      contact: "Viber grupa, FB stranica, 061/178-606"
    },

    isPublic: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    console.log("🚀 Unosim Rose Pharm - Kreka Ligu sa ADMIN ovlastima...");
    // Use doc().set() to specify a fixed ID for easier testing if needed, or add() 
    const docRef = await db.collection("competitions").add(rosePharmLeague);
    console.log("✅ Liga uspješno kreirana ID: ", docRef.id);
    
    // Create first monthly tournament
    const tournament1 = {
      name: "ROSE PHARM – KREKA LIGA: Turnir 1",
      parentLeagueId: docRef.id,
      date: "2026-03-22",
      status: "active",
      type: "Groups", // Monthly event is played in groups
      isPublic: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const t1Ref = await db.collection("competitions").add(tournament1);
    console.log("✅ Prvi turnir kreiran ID: ", t1Ref.id);
    
    // Update league with subcompetition
    await docRef.update({
      subCompetitions: [t1Ref.id]
    });
  } catch (e) {
    console.error("❌ Greška pri unosu lige: ", e);
  }
}

async function seed() {
  try {
    console.log("🚀 Pokrećem unos podataka...");
    await seedRosePharmLeague();
    console.log("✨ Sve završeno.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Fatalna greška: ", e);
    process.exit(1);
  }
}

seed();
