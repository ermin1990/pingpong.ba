const admin = require('firebase-admin');
const path = require('path');
const serviceAccountPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  console.error('Ne mogu učitati serviceAccountKey.json sa puta:', serviceAccountPath);
  console.error(err);
  process.exit(1);
}

// Newer firebase-admin exposes top-level cert/initializeApp exports
if (admin && typeof admin.cert === 'function') {
  admin.initializeApp({ credential: admin.cert(serviceAccount) });
} else if (admin && admin.credential && typeof admin.credential.cert === 'function') {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  console.error('Unable to initialize firebase-admin with available exports.');
  process.exit(1);
}
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

const compId = process.argv[2];
const categoryId = process.argv[3];

if (!compId || !categoryId) {
  console.error('Usage: node scripts/inspect-knockout.cjs <competitionId> <categoryId>');
  process.exit(1);
}

(async () => {
  try {
    console.log(`Querying matches for competition=${compId} category=${categoryId}...`);
    const matchesSnap = await db.collection('matches')
      .where('competitionId', '==', compId)
      .where('categoryId', '==', categoryId)
      .get();

    const matches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${matches.length} matches for competition ${compId} category ${categoryId}`);

    const playerIds = new Set();
    matches.forEach(m => {
      if (m.player1 && m.player1.id && m.player1.id !== 'tbd') playerIds.add(m.player1.id);
      if (m.player2 && m.player2.id && m.player2.id !== 'tbd') playerIds.add(m.player2.id);
    });

    console.log('Player IDs in matches:', [...playerIds]);

    const players = {};
    if (playerIds.size) {
      const playerDocs = await Promise.all([...playerIds].map(id => db.collection('players').doc(id).get()));
      playerDocs.forEach(doc => {
        if (doc.exists) players[doc.id] = doc.data();
        else players[doc.id] = null;
      });
    }

    console.log('\nPlayers info:');
    for (const pid of [...playerIds]) {
      console.log(pid, '->', players[pid] ? { name: players[pid].name, ownerUid: players[pid].ownerUid } : 'MISSING');
    }

    // fetch categories in competition
    const catSnap = await db.collection('competitions').doc(compId).collection('categories').get();
    const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`\nCompetition has ${categories.length} categories`);

    const playerToCategories = {};
    categories.forEach(cat => {
      const pids = cat.playerIds || [];
      pids.forEach(pid => {
        if (!playerToCategories[pid]) playerToCategories[pid] = [];
        playerToCategories[pid].push(cat.id);
      });
    });

    console.log('\nMapping of players to categories:');
    for (const pid of [...playerIds]) {
      console.log(pid, '-> categories:', playerToCategories[pid] || []);
      const belongs = (playerToCategories[pid] || []).includes(categoryId);
      console.log('  Belongs to selected category?', belongs);
    }

    console.log('\nMatches details:');
    matches.forEach(m => {
      const p1 = m.player1?.id || null;
      const p2 = m.player2?.id || null;
      const roundLabel = m.roundName || m.round;
      console.log(m.id, `round=${roundLabel}`, `bracketIndex=${m.bracketIndex ?? 'n/a'}`, `bracketSide=${m.bracketSide ?? 'n/a'}`, `isKnockout=${!!m.isKnockout}`, `groupId=${m.groupId ?? 'n/a'}`);
      console.log(`  -> ${p1} (${players[p1]?.name || 'N/A'})  vs  ${p2} (${players[p2]?.name || 'N/A'})`);
      if (p1 && p1 !== 'tbd' && !(playerToCategories[p1] || []).includes(categoryId)) {
        console.log('    -> PLAYER1 NOT IN CATEGORY', p1, (playerToCategories[p1] || []));
      }
      if (p2 && p2 !== 'tbd' && !(playerToCategories[p2] || []).includes(categoryId)) {
        console.log('    -> PLAYER2 NOT IN CATEGORY', p2, (playerToCategories[p2] || []));
      }
    });

    process.exit(0);
  } catch (err) {
    console.error('Error while querying Firestore:', err);
    process.exit(1);
  }
})();
