const fs = require('fs');const fs = require('fs');

const path = require('path');

const fs = require('fs');const path = require('path');

const filePath = path.join(__dirname, '../laravel-backend/infinit4_testteamsphere (1).sql');

const output = {const path = require('path');

    players: [],

    competitions: [],const filePath = path.join(__dirname, '../laravel-backend/infinit4_testteamsphere (1).sql');

    groups: [],

    matches: []const filePath = path.join(__dirname, '../laravel-backend/infinit4_testteamsphere (1).sql');const output = {

};

const output = {    players: [],

const orgId = "4";

    players: [],    competitions: [],

function getRecords(tableName, data) {

    const regex = new RegExp(`INSERT INTO \`${tableName}\` [^;]+ VALUES ([\\s\\S]+?);`, 'g');    competitions: [],    groups: [],

    let match;

    const allRecords = [];    groups: [],    matches: []

    

    while ((match = regex.exec(data)) !== null) {    matches: []};

        let valuesPart = match[1].trim();

        let inString = false;};

        let parenLevel = 0;

        let current = "";const orgId = "4";

        

        for (let i = 0; i < valuesPart.length; i++) {const orgId = "4";

            const char = valuesPart[i];

            if (char === "'" && (i === 0 || valuesPart[i-1] !== "\\")) {function parseInsertLine(line, tableName) {

                inString = !inString;

            }function getRecords(tableName, data) {    if (!line.includes(`INSERT INTO \`${tableName}\``)) return null;

            if (!inString) {

                if (char === "(") parenLevel++;    // Regex to find INSERT statements for the table    

                if (char === ")") parenLevel--;

            }    const regex = new RegExp(`INSERT INTO \`${tableName}\` [^;]+ VALUES ([\\s\\S]+?);`, 'g');    // Extract everything between VALUES and the end semicolon

            current += char;

            if (parenLevel === 0 && (char === "," || i === valuesPart.length - 1)) {    let match;    const VALUES_MARKER = "VALUES";

                let rec = current.trim();

                while (rec.endsWith(',')) rec = rec.slice(0, -1).trim();    const allRecords = [];    const startIndex = line.indexOf(VALUES_MARKER);

                if (rec.startsWith('(') && rec.endsWith(')')) {

                    allRecords.push(rec.slice(1, -1));        if (startIndex === -1) return null;

                }

                current = "";    while ((match = regex.exec(data)) !== null) {    

            }

        }        let valuesPart = match[1].trim();    let content = line.substring(startIndex + VALUES_MARKER.length).trim();

    }

    return allRecords;            // ...existing code...

}

        let inString = false;}

function splitCSV(str) {

    const result = [];        let parenLevel = 0;

    let current = "";

    let inString = false;        let current = "";function splitCSV(str) {

    for (let i = 0; i < str.length; i++) {

        const char = str[i];            const result = [];

        if (char === "'" && (i === 0 || str[i-1] !== "\\")) inString = !inString;

        if (char === "," && !inString) {        for (let i = 0; i < valuesPart.length; i++) {    let current = "";

            result.push(current.trim());

            current = "";            const char = valuesPart[i];    let inString = false;

        } else {

            current += char;            if (char === "'" && (i === 0 || valuesPart[i-1] !== "\\")) {    for (let i = 0; i < str.length; i++) {

        }

    }                inString = !inString;        const char = str[i];

    result.push(current.trim());

    return result.map(v => {            }        if (char === "'" && str[i-1] !== "\\") inString = !inString;

        if (!v || v === 'NULL') return null;

        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/\\'/g, "'");                    if (char === "," && !inString) {

        return v;

    });            if (!inString) {            result.push(current.trim());

}

                if (char === "(") parenLevel++;            current = "";

const data = fs.readFileSync(filePath, 'utf8');

                if (char === ")") parenLevel--;        } else {

console.log("Parsing competitions...");

const compRecords = getRecords('competitions', data);            }            current += char;

const compIds = new Set();

compRecords.forEach(r => {                    }

    const vals = splitCSV(r);

    if (vals[4] === orgId) {            current += char;    }

        compIds.add(vals[0]);

        output.competitions.push({                result.push(current.trim());

            id: vals[0],

            name: vals[1],            if (parenLevel === 0 && (char === "," || i === valuesPart.length - 1)) {    return result.map(v => {

            slug: vals[2],

            type: vals[7],                let rec = current.trim();        if (v === 'NULL') return null;

            status: vals[13],

            sets_to_win: vals[26],                if (rec.endsWith(',')) rec = rec.slice(0, -1).trim();        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/\\'/g, "'");

            points_per_set: vals[27]

        });                // Remove outer parens if they exist        return v;

    }

});                if (rec.startsWith('(') && rec.endsWith(')')) {    });

console.log(`Found ${output.competitions.length} competitions.`);

                    allRecords.push(rec.slice(1, -1));}

console.log("Parsing players...");

const playerRecords = getRecords('players', data);                }

playerRecords.forEach(r => {

    const vals = splitCSV(r);                current = "";const data = fs.readFileSync(filePath, 'utf8');

    if (vals && vals[4] === orgId) {

        output.players.push({            }const lines = data.split('\n');

            id: vals[0],

            name: vals[1],        }

            club: vals[6]

        });    }const compIds = new Set();

    }

});    return allRecords;

console.log(`Found ${output.players.length} players.`);

}console.log("Parsing competitions...");

console.log("Parsing groups...");

const groupRecords = getRecords('tournament_groups', data);lines.forEach(line => {

groupRecords.forEach(r => {

    const vals = splitCSV(r);function splitCSV(str) {    const records = parseInsertLine(line, 'competitions');

    if (vals && compIds.has(vals[1])) {

        output.groups.push({    const result = [];    if (records) {

            id: vals[0],

            competition_id: vals[1],    let current = "";        records.forEach(r => {

            name: vals[2],

            player_ids: vals[4],    let inString = false;            const vals = splitCSV(r);

            standings: vals[5]

        });    for (let i = 0; i < str.length; i++) {            // console.log(`Comp: ID=${vals[0]}, Org=${vals[4]}`); // Debug

    }

});        const char = str[i];            if (vals[4] === orgId) {

console.log(`Found ${output.groups.length} groups.`);

        if (char === "'" && (i === 0 || str[i-1] !== "\\")) inString = !inString;                compIds.add(vals[0]);

console.log("Parsing matches...");

const matchRecords = getRecords('matches', data);        if (char === "," && !inString) {                output.competitions.push({

matchRecords.forEach(r => {

    const vals = splitCSV(r);            result.push(current.trim());                    id: vals[0],

    if (vals && compIds.has(vals[20])) {

        output.matches.push({            current = "";                    name: vals[1],

            id: vals[0],

            competition_id: vals[20],        } else {                    slug: vals[2],

            player1_id: vals[6],

            player2_id: vals[7],            current += char;                    type: vals[7],

            score1: vals[8],

            score2: vals[9],        }                    status: vals[13],

            status: vals[12],

            round: vals[14],    }                    sets_to_win: vals[26],

            sets: vals[15],

            group_id: vals[24],    result.push(current.trim());                    points_per_set: vals[27]

            is_knockout: vals[23] === 'knockout' || vals[23] === 'Finals'

        });    return result.map(v => {                });

    }

});        if (v === 'NULL') return null;            }

console.log(`Found ${output.matches.length} matches.`);

        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/\\'/g, "'");        });

fs.writeFileSync('extracted_data.json', JSON.stringify(output, null, 2));

console.log("Done! Data saved to extracted_data.json");        return v;    }


    });});

}

console.log(`Found ${output.competitions.length} competitions.`);

const data = fs.readFileSync(filePath, 'utf8');

console.log("Parsing players...");

console.log("Parsing competitions...");lines.forEach(line => {

const compRecords = getRecords('competitions', data);    const records = parseInsertLine(line, 'players');

const compIds = new Set();    if (records) {

compRecords.forEach(r => {        records.forEach(r => {

    const vals = splitCSV(r);            const vals = splitCSV(r);

    if (vals[4] === orgId) {            // id is 0, org_id is 4

        compIds.add(vals[0]);            if (vals[4] === orgId) {

        output.competitions.push({                output.players.push({

            id: vals[0],                    id: vals[0],

            name: vals[1],                    name: vals[1],

            slug: vals[2],                    club: vals[6] // club is actually in "position" or "club" in some versions? 

            type: vals[7],                                 // Let me check players schema again.

            status: vals[13],                                 // Schema said: JERSEY NUMBER is 7. EMAIL is 2. USER_ID is 3. ORG_ID is 4. DOB is 5. POSITION is 6.

            sets_to_win: vals[26],                                 // In this data, position seems to be used for club.

            points_per_set: vals[27]                });

        });            }

    }        });

});    }

console.log(`Found ${output.competitions.length} competitions.`);});



console.log("Parsing players...");console.log(`Found ${output.players.length} players.`);

const playerRecords = getRecords('players', data);

playerRecords.forEach(r => {console.log("Parsing groups...");

    const vals = splitCSV(r);lines.forEach(line => {

    if (vals[4] === orgId) {    const records = parseInsertLine(line, 'tournament_groups');

        output.players.push({    if (records) {

            id: vals[0],        records.forEach(r => {

            name: vals[1],            const vals = splitCSV(r);

            club: vals[6]            if (compIds.has(vals[1])) {

        });                output.groups.push({

    }                    id: vals[0],

});                    competition_id: vals[1],

console.log(`Found ${output.players.length} players.`);                    name: vals[2],

                    player_ids: vals[4], // comma separated

console.log("Parsing groups...");                    standings: vals[5] // JSON?

const groupRecords = getRecords('tournament_groups', data);                });

groupRecords.forEach(r => {            }

    const vals = splitCSV(r);        });

    if (compIds.has(vals[1])) {    }

        output.groups.push({});

            id: vals[0],

            competition_id: vals[1],console.log("Parsing matches...");

            name: vals[2],lines.forEach(line => {

            player_ids: vals[4],    const records = parseInsertLine(line, 'matches');

            standings: vals[5]    if (records) {

        });        records.forEach(r => {

    }            const vals = splitCSV(r);

});            // competition_id is at index 21

console.log(`Found ${output.groups.length} groups.`);            if (compIds.has(vals[21])) {

                output.matches.push({

console.log("Parsing matches...");                    id: vals[0],

const matchRecords = getRecords('matches', data);                    competition_id: vals[21],

matchRecords.forEach(r => {                    player1_id: vals[6],

    const vals = splitCSV(r);                    player2_id: vals[7],

    if (compIds.has(vals[20])) {                    score1: vals[8],

        output.matches.push({                    score2: vals[9],

            id: vals[0],                    status: vals[13],

            competition_id: vals[20],                    round: vals[15],

            player1_id: vals[6],                    sets: vals[16],

            player2_id: vals[7],                    group_id: vals[25],

            score1: vals[8],                    is_knockout: vals[24] === 'knockout' || vals[24] === 'Finals' // phase is index 24

            score2: vals[9],                });

            status: vals[12],            }

            round: vals[14],        });

            sets: vals[15],    }

            group_id: vals[24],});

            is_knockout: vals[23] === 'knockout' || vals[23] === 'Finals'

        });fs.writeFileSync('extracted_data.json', JSON.stringify(output, null, 2));

    }console.log("Done! Data saved to extracted_data.json");

});
console.log(`Found ${output.matches.length} matches.`);

fs.writeFileSync('extracted_data.json', JSON.stringify(output, null, 2));
console.log("Done! Data saved to extracted_data.json");
