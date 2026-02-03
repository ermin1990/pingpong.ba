
const { initializeApp } = require('firebase/app');
const { 
    getFirestore, collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp 
} = require('firebase/firestore');

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
const ORGANIZATION_ID = "E9RaaxT0RAoSEqDTt7qs";
const JUNIORI_CAT_ID = "KhcNQNFVjvbjwIz8n0qu";

const rawData = `
A
Tabela
P
I
Set±
Gem±
B
1
KANLIĆ ARON (STK SPIN 2012)
2
0
6
+26
4
2
FAZLIĆ ERVIN (STK KREKA)
1
1
0
-2
2
3
MIHAEL ZOVKO (STK MOSTAR)
0
2
-6
-24
0
Mečevi
FAZLIĆ ERVIN (2)
11
11
11
-
-
MIHAEL ZOVKO (3)
9
9
7
-
-
3
0
KANLIĆ ARON (1)
11
11
11
-
-
MIHAEL ZOVKO (3)
8
4
5
-
-
3
0
KANLIĆ ARON (1)
11
14
11
-
-
FAZLIĆ ERVIN (2)
8
12
6
-
-
3
0
B
Tabela
P
I
Set±
Gem±
B
1
BAŠIĆ NIDAL (STK SPIN 2012)
2
0
6
+38
4
2
ŠKULJ BAKIR (STK ALADŽA)
1
1
0
+0
2
3
MORANJKIĆ HARUN (STK KREKA)
0
2
-6
-38
0
Mečevi
ŠKULJ BAKIR (2)
11
11
11
-
-
MORANJKIĆ HARUN (3)
4
8
8
-
-
3
0
BAŠIĆ NIDAL (1)
11
11
11
-
-
MORANJKIĆ HARUN (3)
1
1
6
-
-
3
0
BAŠIĆ NIDAL (1)
11
11
11
-
-
ŠKULJ BAKIR (2)
9
5
6
-
-
3
0
C
Tabela
P
I
Set±
Gem±
B
1
VUKAŠIN KECMAN (OSTK SPIN B.LUKA)
2
0
5
+31
4
2
TVRTKOVIĆ DARIO (STK ALADŽA)
1
1
0
+7
2
3
MARKO PANDŽA (STK MOSTAR)
0
2
-5
-38
0
Mečevi
TVRTKOVIĆ DARIO (2)
11
11
11
-
-
MARKO PANDŽA (3)
6
5
5
-
-
3
0
VUKAŠIN KECMAN (1)
11
11
9
11
-
MARKO PANDŽA (3)
4
3
11
3
-
3
1
VUKAŠIN KECMAN (1)
11
12
12
-
-
TVRTKOVIĆ DARIO (2)
5
10
10
-
-
3
0
D
Tabela
P
I
Set±
Gem±
B
1
ZLOTRG DINO (STK MLADOST)
2
0
6
+35
4
2
FAKIĆ FARUK (STK SPIN 2012)
1
1
0
+8
2
3
NUKOVIĆ ALMAS (STK KREKA)
0
2
-6
-43
0
Mečevi
FAKIĆ FARUK (2)
11
11
11
-
-
NUKOVIĆ ALMAS (3)
4
2
5
-
-
3
0
ZLOTRG DINO (1)
11
11
11
-
-
NUKOVIĆ ALMAS (3)
5
4
3
-
-
3
0
ZLOTRG DINO (1)
11
11
11
-
-
FAKIĆ FARUK (2)
8
5
6
-
-
3
0
E
Tabela
P
I
Set±
Gem±
B
1
ČELIĆ ĐORĐE (STK SPARTAK INSPIRA)
2
0
6
+16
4
2
BAJROVIĆ BERIZ (STK ALADŽA)
1
1
0
-16
2
3
SUČIĆ LUKA (STK CM VITEZ)
0
2
-6
+0
0
Mečevi
BAJROVIĆ BERIZ (2)
-
-
-
-
-
SUČIĆ LUKA (3)
-
-
-
-
-
3
0
ČELIĆ ĐORĐE (1)
-
-
-
-
-
SUČIĆ LUKA (3)
-
-
-
-
-
3
0
ČELIĆ ĐORĐE (1)
14
11
11
-
-
BAJROVIĆ BERIZ (2)
12
7
1
-
-
3
0
F
Tabela
P
I
Set±
Gem±
B
1
HANIĆ AZUR (STK LUKAVAC)
3
0
9
+51
6
2
MUJKIĆ NISVET (STK SPIN DOBOJ ISTOK)
2
1
3
+27
4
3
LUKIĆ PAVLE (STK BORAC)
1
2
-4
-46
2
4
PETKOVIĆ JOVAN (STK OZREN)
0
3
-8
-32
0
Mečevi
MUJKIĆ NISVET (2)
11
11
11
-
-
LUKIĆ PAVLE (3)
2
6
1
-
-
3
0
HANIĆ AZUR (1)
11
11
11
-
-
PETKOVIĆ JOVAN (4)
5
8
4
-
-
3
0
PETKOVIĆ JOVAN (4)
6
6
4
-
-
MUJKIĆ NISVET (2)
11
11
11
-
-
0
3
HANIĆ AZUR (1)
11
11
11
-
-
LUKIĆ PAVLE (3)
2
5
5
-
-
3
0
LUKIĆ PAVLE (3)
13
12
4
12
-
PETKOVIĆ JOVAN (4)
11
10
11
10
-
3
1
HANIĆ AZUR (1)
12
11
11
-
-
MUJKIĆ NISVET (2)
10
6
4
-
-
3
0
G
Tabela
P
I
Set±
Gem±
B
1
MIČIĆ MARKO (STK SPIN 2012)
3
0
9
+48
6
2
JAGANJAC AMAR (STK KREKA)
2
1
3
+7
4
3
AJDINOVIĆ RAŠID (STK ALADŽA)
1
2
-3
-6
2
4
IMAMOVIĆ VEDAD (STK LUKAVAC)
0
3
-9
-49
0
Mečevi
JAGANJAC AMAR (2)
11
12
11
-
-
AJDINOVIĆ RAŠID (3)
7
10
9
-
-
3
0
MIČIĆ MARKO (1)
11
11
11
-
-
IMAMOVIĆ VEDAD (4)
3
7
5
-
-
3
0
IMAMOVIĆ VEDAD (4)
3
10
6
-
-
JAGANJAC AMAR (2)
11
12
11
-
-
0
3
MIČIĆ MARKO (1)
11
11
11
-
-
AJDINOVIĆ RAŠID (3)
4
8
7
-
-
3
0
AJDINOVIĆ RAŠID (3)
11
11
11
-
-
IMAMOVIĆ VEDAD (4)
5
7
5
-
-
3
0
MIČIĆ MARKO (1)
11
11
12
-
-
JAGANJAC AMAR (2)
3
5
10
-
-
3
0
H
Tabela
P
I
Set±
Gem±
B
1
MURATOVIĆ ADI (STK KREKA)
3
0
8
+58
6
2
MAGLIĆ KAMER (STK MLADOST)
2
1
4
+38
4
3
NOŽICA MIHAJLO (STK BORAC)
1
2
-3
-24
2
4
MUHIĆ TARIK (STK LUKAVAC)
0
3
-9
-72
0
Mečevi
MAGLIĆ KAMER (1)
11
11
11
-
-
MUHIĆ TARIK (4)
1
2
1
-
-
3
0
MURATOVIĆ ADI (2)
11
11
11
-
-
NOŽICA MIHAJLO (3)
3
3
6
-
-
3
0
MUHIĆ TARIK (4)
2
2
1
-
-
MURATOVIĆ ADI (2)
11
11
11
-
-
0
3
MAGLIĆ KAMER (1)
11
11
11
-
-
NOŽICA MIHAJLO (3)
9
3
3
-
-
3
0
NOŽICA MIHAJLO (3)
11
11
11
-
-
MUHIĆ TARIK (4)
8
5
5
-
-
3
0
MAGLIĆ KAMER (1)
11
7
8
4
-
MURATOVIĆ ADI (2)
6
11
11
11
-
1
3
`;

async function run() {
    // 1. Get All Players for lookup
    const pSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", ORGANIZATION_ID)));
    const playersByName = {};
    pSnap.forEach(d => {
        playersByName[d.data().name.toUpperCase().trim()] = { id: d.id, ...d.data() };
    });

    const lines = rawData.split('\n').map(l => l.trim());
    const groups = {};
    let currentGroup = null;
    let inTabela = false;
    let inMecevi = false;

    console.log("Parsing data...");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // Group marker: single letter A-H, but ONLY if not in Tabela header
        if (line.match(/^[A-H]$/) && !inTabela) {
            currentGroup = line;
            groups[currentGroup] = { players: [], matches: [] };
            inTabela = false;
            inMecevi = false;
            continue;
        }

        if (line === "Tabela") {
            inTabela = true;
            inMecevi = false;
            continue;
        }

        if (line === "Mečevi") {
            inTabela = false;
            inMecevi = true;
            continue;
        }

        if (inTabela) {
             // Look for rank number
             if (line.match(/^\d+$/) && line.length <= 2) {
                 const nameLine = lines[i+1];
                 if (!nameLine) { i++; continue; }
                 const nameMatch = nameLine.match(/(.+?)\s+\((.*?)\)/);
                 if (nameMatch) {
                     const name = nameMatch[1].trim().toUpperCase();
                     const player = playersByName[name];
                     if (player) {
                         groups[currentGroup].players.push(player.id);
                     } else {
                         console.warn(`Player NOT FOUND in DB: ${name}`);
                     }
                 }
                 // Skip the next lines (usually 5 lines of stats + current name line)
                 i += 6;
             }
        } else if (inMecevi) {
             // 14 lines per match
             /*
             0: P1 Name (Rank)
             1,2,3,4,5: Set points P1
             6: P2 Name (Rank)
             7,8,9,10,11: Set points P2
             12: Final 1
             13: Final 2
             */
             if (line.includes('(') && line.includes(')')) {
                 const p1Name = line.match(/(.+?)\s+\(\d+\)/)[1].trim().toUpperCase();
                 const p1SetPts = lines.slice(i+1, i+6).map(v => v === '-' ? 0 : parseInt(v));
                 
                 const p2Line = lines[i+6];
                 if (!p2Line || !p2Line.includes('(')) {
                     // Maybe not a match start or end of data
                     continue;
                 }
                 const p2Name = p2Line.match(/(.+?)\s+\(\d+\)/)[1].trim().toUpperCase();
                 const p2SetPts = lines.slice(i+7, i+12).map(v => v === '-' ? 0 : parseInt(v));
                 
                 const f1 = parseInt(lines[i+12]);
                 const f2 = parseInt(lines[i+13]);

                 const p1 = playersByName[p1Name];
                 const p2 = playersByName[p2Name];

                 if (p1 && p2) {
                     const sets = [];
                     for(let s=0; s<5; s++) {
                         if (p1SetPts[s] > 0 || p2SetPts[s] > 0) {
                             sets.push({ p1: p1SetPts[s], p2: p2SetPts[s] });
                         }
                     }
                     groups[currentGroup].matches.push({
                         player1: p1,
                         player2: p2,
                         score1: f1,
                         score2: f2,
                         sets: sets
                     });
                 } else {
                     console.error(`Missing players for match: ${p1Name} vs ${p2Name}`);
                 }
                 i += 13; // Jump to end of block
             }
        }
    }

    // 2. Update Group Config & Matches
    console.log("Updating Firestore...");
    const groupConfig = {};
    const allParticipantIds = new Set();
    
    const sortedGroupKeys = Object.keys(groups).sort();
    
    for (let k = 0; k < sortedGroupKeys.length; k++) {
        const char = sortedGroupKeys[k];
        const g = groups[char];
        groupConfig[k] = g.players;
        g.players.forEach(pid => allParticipantIds.add(pid));

        console.log(`Group ${char}: ${g.players.length} players, ${g.matches.length} matches.`);

        for (const m of g.matches) {
            await addDoc(collection(db, "matches"), {
                competitionId: TARGET_COMPETITION_ID,
                categoryId: JUNIORI_CAT_ID,
                organizationId: ORGANIZATION_ID,
                player1Id: m.player1.id,
                player2Id: m.player2.id,
                player1: { id: m.player1.id, name: m.player1.name },
                player2: { id: m.player2.id, name: m.player2.name },
                player1Score: m.score1,
                player2Score: m.score2,
                score1: m.score1,
                score2: m.score2,
                status: 'completed',
                sets: m.sets,
                phase: 'groups',
                groupId: k, // index 0, 1, 2...
                createdAt: serverTimestamp()
            });
        }
    }

    // Update Category with groupConfig and participant list
    await updateDoc(doc(db, "competitions", TARGET_COMPETITION_ID, "categories", JUNIORI_CAT_ID), {
        groupConfig: groupConfig,
        playerIds: Array.from(allParticipantIds),
        participants: Array.from(allParticipantIds)
    });

    console.log("Done.");
}

run().catch(console.error);
