#!/usr/bin/env node
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account JSON not found at ${serviceAccountPath}. Set FIREBASE_SERVICE_ACCOUNT_PATH or place serviceAccountKey.json in project root.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function exportCompetitions() {
  console.log('Exporting all competitions...');
  const snapshot = await db.collection('competitions').get();
  if (snapshot.empty) {
    console.log('No competitions found.');
    return;
  }

  const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  const outDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, `competitions-backup-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Exported ${data.length} competitions to ${outPath}`);
}

exportCompetitions().then(() => process.exit(0)).catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
