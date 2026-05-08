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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  const ownerUid = "DAt7L6Qo9GZsh1Y6gN2V5LszshY2";
  const competitionId = "rose-pharm-demo-tournament";
  
  console.log("🚀 Kreiram Demo Ligu sa igračima...");

  const players = [
    { name: "Alen Šurbek", club: "STK Kreka" },
    { name: "Ermin Selimović", club: "STK Kreka" },
    { name: "Damir Đulović", club: "STK Kreka" },
    { name: "Edin Gutić", club: "STK Kreka" },
    { name: "Slobodan Stojanov", club: "STK Tuzla" },
    { name: "Mirza Hanić", club: "STK Kreka" },
    { name: "Amer Muftić", club: "STK Bosna" },
    { name: "Feđa Biogradlić", club: "STK Sarajevo" }
  ];

  const playerIds = [];
  for (const p of players) {
    const pRef = await db.collection("players").add({
      ...p,
      ownerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    playerIds.push(pRef.id);
  }

  const tournament = {
    name: "ROSE PHARM DEMO - Mart 2026",
    slug: "rose-pharm-demo-mart-2026",
    type: "League_Season",
    status: "active",
    ownerUid,
    isPublic: true,
    isSeason: true,
    location: "Stonoteniska dvorana „KREKA“ Tuzla",
    startDate: "2026-03-22",
    playerIds: playerIds,
    participantsCount: playerIds.length,
    pointsSystem: {
      winInGroup: 5,
      winAfterGroup: 5,
      bonusPoints: { "1": 50, "2": 40, "3": 35, "4": 30, "5": 25, "6": 20, "7": 15, "8": 10, "9-16": 5 }
    },
    charity: {
      minFee: "10 KM",
      purpose: "Sanacija krova dvorane i ugradnja solarnih panela",
      transparency: "Javna objava na FB"
    },
    rules: {
      format: "Grupe po 4-6 igrača, Best of 3",
      knockout: "Best of 5 od 1/4 finala",
      rank: "Razigravanje za svako mjesto"
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const compRef = await db.collection("competitions").add(tournament);
  
  // Kreiraj kategoriju
  const category = {
    name: "Singl (Glavni turnir)",
    format: "groups_knockout",
    playerIds: playerIds,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await db.collection("competitions").doc(compRef.id).collection("categories").add(category);

  console.log(`✅ Demo liga uspješno kreirana! ID: ${compRef.id}`);
  process.exit(0);
}

seed();
