
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
    // 1. Get Existing Players
    console.log("Fetching existing players...");
    const pSnap = await getDocs(query(collection(db, "players"), where("organizationId", "==", ORGANIZATION_ID)));
    const existingPlayers = {};
    const existingPlayersByName = {}; // Normalized name -> ID
    pSnap.forEach(d => {
        const data = d.data();
        existingPlayers[d.id] = data;
        existingPlayersByName[data.name.toUpperCase().trim()] = d.id;
    });

    const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
    const groups = {}; // { A: { players: [], matches: [] } }
    let currentGroup = null;
    let mode = null; // 'tabela' or 'mecevi' or null

    // We can split by Group Headers "A", "B", ... but lines are tricky.
    // Let's identify "Tabela" to start a group? No, "A" is before "Tabela".
    // Simple parser: sequence scan.

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for Group Header (Single Letter)
        if (line.length === 1 && line >= 'A' && line <= 'H') {
            currentGroup = line;
            groups[currentGroup] = { players: [], matches: [], matchLines: [] };
            mode = null;
            continue;
        }

        if (line === "Tabela") {
            mode = "tabela";
            continue;
        }
        if (line === "Mečevi") {
            mode = "mecevi";
            continue;
        }

        if (mode === 'tabela') {
            // Regex for player line: Rank Name (Club) ...
            // Eg: "1 KANLIĆ ARON (STK SPIN 2012) 2 0 6 +26 4"
            const match = line.match(/^\d+\s+(.*?)\s+\((.*?)\)/);
            if (match) {
                const name = match[1].trim();
                const club = match[2].trim();
                groups[currentGroup].players.push({ name, club });
            }
        } else if (mode === 'mecevi') {
            // Collect match lines to parse later, as they span multiple lines
            groups[currentGroup].matchLines.push(line);
        }
    }

    // 2. Process Players & Groups
    const groupConfig = {};
    const allParticipantIds = new Set();
    const nameToFirestoreId = {};

    console.log("Processing Players...");
    for (const gCode of Object.keys(groups)) {
        const group = groups[gCode];
        const gPlayerIds = [];

        for (const p of group.players) {
            const normName = p.name.toUpperCase().trim();
            let pid = existingPlayersByName[normName];
            
            if (!pid) {
                console.log(`Creating new player: ${p.name}`);
                const ref = await addDoc(collection(db, "players"), {
                    name: p.name,
                    club: p.club,
                    organizationId: ORGANIZATION_ID,
                    createdAt: serverTimestamp()
                });
                pid = ref.id;
                existingPlayersByName[normName] = pid;
            } else {
                // Update club if missing? Nah.
                // console.log(`Found existing player: ${p.name}`);
            }

            gPlayerIds.push(pid);
            allParticipantIds.add(pid);
            nameToFirestoreId[normName] = pid; // For match parsing
        }
        
        // Map 'A' -> 0, 'B' -> 1
        const gIndex = gCode.charCodeAt(0) - 65;
        groupConfig[gIndex] = gPlayerIds;
    }

    // 3. Update Category
    console.log("Updating Category...");
    await updateDoc(doc(db, "competitions", TARGET_COMPETITION_ID, "categories", JUNIORI_CAT_ID), {
        groupConfig: groupConfig,
        participants: Array.from(allParticipantIds)
    });

    // 4. Process Matches
    console.log("Processing Matches...");
    
    for (const gCode of Object.keys(groups)) {
        console.log(`Processing matches for Group ${gCode}... (${groups[gCode].matchLines.length} lines)`);
        const mLines = groups[gCode].matchLines;
        let i = 0;
        
        while (i < mLines.length) {
            // Find Matches
            // We expect a Name line first.
            const isNameLine = (l) => l.match(/\(\d+\)$/);
            
            // Read P1
            const p1Line = mLines[i];
            const p1Match = p1Line.match(/(.+?)\s+\(\d+\)$/);
            if (!p1Match) { 
                i++; continue; // Skip garbage?
            }
            
            const p1Name = p1Match[1].trim().toUpperCase();
            i++;
            
            // Read scores until next Name line
            const p1SetScores = [];
            while (i < mLines.length && !isNameLine(mLines[i])) {
                const val = mLines[i].trim();
                if (val !== '-' && !isNaN(parseInt(val))) {
                    p1SetScores.push(parseInt(val));
                }
                i++;
            }
            
            // Read P2
            if (i >= mLines.length) break;
            const p2Line = mLines[i];
            const p2Match = p2Line.match(/(.+?)\s+\(\d+\)$/);
            if (!p2Match) {
                 console.warn("Expected P2 line, got: " + p2Line);
                 i++; continue;
            }
            
            const p2Name = p2Match[1].trim().toUpperCase();
            i++;

            const tailVals = [];
            while (i < mLines.length) {
                if (isNameLine(mLines[i])) break; // Found next match match start
                const val = mLines[i].trim();
                if (val !== '-') {
                     tailVals.push(val); 
                }
                i++;
            }
            
            if (tailVals.length < 2) {
                console.warn("Not enough data for match");
                continue;
            }
            
            const score2 = parseInt(tailVals.pop());
            const score1 = parseInt(tailVals.pop());
            const p2SetScores = tailVals.map(v => parseInt(v)).filter(v => !isNaN(v)); 
            
            const sets = [];
            const len = Math.max(p1SetScores.length, p2SetScores.length);
            for(let s=0; s<len; s++) {
                sets.push({
                    p1: p1SetScores[s] || 0,
                    p2: p2SetScores[s] || 0
                });
            }

            const p1Id = nameToFirestoreId[p1Name];
            const p2Id = nameToFirestoreId[p2Name];

            if (!p1Id || !p2Id) {
                console.error(`Could not resolve IDs for match: ${p1Name} vs ${p2Name}`);
                continue;
            }
            
            const gIndex = gCode.charCodeAt(0) - 65;
            
            await addDoc(collection(db, "matches"), {
              competitionId: TARGET_COMPETITION_ID,
              categoryId: JUNIORI_CAT_ID,
              organizationId: ORGANIZATION_ID,
              player1Id: p1Id,
              player2Id: p2Id,
              player1Score: score1,
              player2Score: score2,
              score1: score1, 
              score2: score2,
              status: 'completed',
              sets: sets,
              phase: 'groups',
              groupId: gIndex, 
              createdAt: serverTimestamp()
            });
            console.log(`Added Match: ${p1Name} vs ${p2Name} (${score1}-${score2})`);
        }
    }
    
    console.log("Done.");
}

run().catch(console.error);
