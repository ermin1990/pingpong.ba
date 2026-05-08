import admin from "firebase-admin";
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seedFullLeague() {
  console.log("🚀 Dohvatam realne igrače iz baze...");
  
  const ownerUid = "DAt7L6Qo9GZsh1Y6gN2V5LszshY2";
  
  // 1. Dohvati realne igrače
  const playersSnap = await db.collection("players").where("ownerUid", "==", ownerUid).limit(20).get();
  let realPlayers = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  if (realPlayers.length < 8) {
    console.log("⚠️ Prenalo igrača u bazi, dodajem još par demo igrača...");
    const demo = [
        { name: "Edin Konjić", club: "STK Kreka" },
        { name: "Amer Muftić", club: "Tuzla" },
        { name: "Zlatan Džozić", club: "Sarajevo" },
        { name: "Mirza Hanić", club: "Lukavac" }
    ];
    for (const d of demo) {
        const ref = await db.collection("players").add({ ...d, ownerUid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        realPlayers.push({ id: ref.id, ...d });
    }
  }

  // 2. Kreiramo Glavnu Ligu (Sistem)
  const seasonData = {
    name: "ROSE PHARM – KREKA LIGA (Sezona 2026)",
    type: "league_season",
    status: "active",
    ownerUid: ownerUid,
    isSeason: true,
    description: "Zvanična sezona 2026 sa zbirnom tabelom poena.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isPublic: true,
    pointsSystem: {
      winInGroup: 5,
      winAfterGroup: 5,
      bonusPoints: { "1": 50, "2": 40, "3": 35, "4": 30, "5": 25, "6": 20, "7": 15, "8": 10, "9-16": 5 }
    }
  };

  const seasonRef = await db.collection("competitions").add(seasonData);
  const seasonId = seasonRef.id;

  // 3. Kreiramo Kategorije
  const catNames = ["Apsolutna Kategorija", "Veterani 40-50", "Veterani 50+"];
  const categories = [];
  
  for (const name of catNames) {
    const cRef = await db.collection("competitions").doc(seasonId).collection("categories").add({
        name,
        format: "groups_knockout",
        status: "active",
        playerIds: realPlayers.slice(0, 12).map(p => p.id)
    });
    categories.push({ id: cRef.id, name });
  }

  // 4. Kreiramo Mjesečni Turnir (npr. Mart)
  const marchTournament = {
    name: "ROSE PHARM LIGA - Mart 2026",
    parentLeagueId: seasonId,
    type: "league_season",
    status: "active",
    ownerUid: ownerUid,
    startDate: "2026-03-22",
    isPublic: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const marchRef = await db.collection("competitions").add(marchTournament);
  const marchId = marchRef.id;

  // 5. Kreiramo mečeve za Martovski turnir
  console.log("🎾 Generišem mečeve za Mart...");
  const playersForMatches = realPlayers.slice(0, 8);
  
  for (const cat of categories) {
    // Dodajemo kategoriju i u pod-turnir
    const subCatRef = await db.collection("competitions").doc(marchId).collection("categories").add({
        name: cat.name,
        originalCategoryId: cat.id,
        status: "active",
        playerIds: playersForMatches.map(p => p.id)
    });

    // Kreiramo par mečeva (simulacija grupne faze)
    for (let i = 0; i < playersForMatches.length; i += 2) {
      if (!playersForMatches[i+1]) break;
      
      const p1 = playersForMatches[i];
      const p2 = playersForMatches[i+1];
      
      await db.collection("matches").add({
        competitionId: marchId,
        categoryId: subCatRef.id,
        player1: { id: p1.id, name: p1.name },
        player2: { id: p2.id, name: p2.name },
        player1Score: Math.floor(Math.random() * 3),
        player2Score: Math.floor(Math.random() * 3),
        status: "completed",
        setsToWin: 2,
        isKnockout: false,
        groupId: 0,
        groupName: "Grupa A",
        ownerUid: ownerUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  console.log(`\n✅ USPEŠNO SEEDOVANO!`);
  console.log(`Krovna Liga ID: ${seasonId}`);
  console.log(`Martovski Turnir ID: ${marchId}`);
}

seedFullLeague().catch(console.error);
