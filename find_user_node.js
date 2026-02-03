
import { db } from './src/firebase/config.js';
import { collection, query, where, getDocs } from 'firebase/firestore';

async function findUser() {
  const email = 'smoranjkic@gmail.com';
  console.log(`Tražim korisnika: ${email}`);
  
  const q = query(collection(db, "users"), where("email", "==", email));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    console.log("Korisnik nije pronađen u 'users' kolekciji. Provjeravam whitelistu...");
    const wq = query(collection(db, "whitelisted_emails"), where("email", "==", email));
    const wsnap = await getDocs(wq);
    if (wsnap.empty) {
      console.log("JSON_START" + JSON.stringify({error: "User not found"}) + "JSON_END");
    } else {
      console.log("JSON_START" + JSON.stringify(wsnap.docs[0].data()) + "JSON_END");
    }
  } else {
    console.log("JSON_START" + JSON.stringify(snap.docs[0].data()) + "JSON_END");
  }
}

findUser().catch(err => {
  console.error(err);
  process.exit(1);
});
