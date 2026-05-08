#!/usr/bin/env node
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from project .env if exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account JSON not found at ${serviceAccountPath}. Set FIREBASE_SERVICE_ACCOUNT_PATH or place serviceAccountKey.json in project root.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteLeagues() {
  console.log('Searching for competitions with type=="League"...');
  const q = db.collection('competitions').where('type', '==', 'League');
  const snapshot = await q.get();
  if (snapshot.empty) {
    console.log('No leagues found.');
    return;
  }

  console.log(`Found ${snapshot.size} leagues. Deleting in batches (500/doc batch)...`);
  const docs = snapshot.docs;
  const batchSize = 500;
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    // Prefer recursive delete if available (will remove subcollections too)
    for (const doc of chunk) {
      if (typeof db.recursiveDelete === 'function') {
        await db.recursiveDelete(doc.ref);
        console.log(`Recursively deleted doc ${doc.id}`);
      } else {
        // Fallback: delete the document only (note: subcollections will remain)
        const batch = db.batch();
        batch.delete(doc.ref);
        await batch.commit();
        console.log(`Deleted doc ${doc.id} (non-recursive)`);
      }
    }
    console.log(`Processed batch ${i / batchSize + 1} (${chunk.length} docs)`);
  }

  console.log('All league documents processed (check logs for recursive delete availability).');
}

deleteLeagues().then(() => process.exit(0)).catch(err => {
  console.error('Error deleting leagues:', err);
  process.exit(1);
});
