const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../laravel-backend/infinit4_testteamsphere (1).sql');
const output = {
    players: [],
    competitions: [],
    groups: [],
    matches: []
};

const orgId = "4";

function getRecords(tableName, data) {
    const records = [];
    let searchStr = `INSERT INTO \`${tableName}\``;
    let pos = 0;
    
    while ((pos = data.indexOf(searchStr, pos)) !== -1) {
        let valuesIndex = data.indexOf("VALUES", pos);
        if (valuesIndex === -1) break;
        
        let semicolonIndex = data.indexOf(";", valuesIndex);
        if (semicolonIndex === -1) break;
        
        let valuesPart = data.substring(valuesIndex + 6, semicolonIndex).trim();
        let inString = false;
        let parenLevel = 0;
        let current = "";
        
        for (let i = 0; i < valuesPart.length; i++) {
            const char = valuesPart[i];
            if (char === "'" && (i === 0 || valuesPart[i-1] !== "\\")) {
                inString = !inString;
            }
            if (!inString) {
                if (char === "(") parenLevel++;
                if (char === ")") parenLevel--;
            }
            current += char;
            if (parenLevel === 0 && (char === "," || i === valuesPart.length - 1)) {
                let rec = current.trim();
                while (rec.endsWith(',')) rec = rec.slice(0, -1).trim();
                if (rec.startsWith('(') && rec.endsWith(')')) {
                    records.push(rec.slice(1, -1));
                }
                current = "";
            }
        }
        pos = semicolonIndex + 1;
    }
    return records;
}

function splitCSV(str) {
    const result = [];
    let current = "";
    let inString = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === "'" && (i === 0 || str[i-1] !== "\\")) inString = !inString;
        if (char === "," && !inString) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result.map(v => {
        if (!v || v === 'NULL') return null;
        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/\\'/g, "'");
        return v;
    });
}

const data = fs.readFileSync(filePath, 'utf8');

console.log("Parsing competitions...");
const compRecords = getRecords('competitions', data);
const compIds = new Set();
compRecords.forEach(r => {
    const vals = splitCSV(r);
    console.log(`Comp: ID=${vals[0]}, Name=${vals[1]}, Org=${vals[4]}`);
    if (String(vals[4]) === String(orgId)) {
        compIds.add(vals[0]);
        output.competitions.push({
            id: vals[0],
            name: vals[1],
            slug: vals[2],
            type: vals[7],
            status: vals[13],
            sets_to_win: vals[26],
            points_per_set: vals[27]
        });
    }
});
console.log(`Found ${output.competitions.length} competitions.`);

console.log("Parsing players...");
const playerRecords = getRecords('players', data);
playerRecords.forEach(r => {
    const vals = splitCSV(r);
    // console.log(`Player: ID=${vals[0]}, Name=${vals[1]}, Org=${vals[4]}`);
    if (vals && String(vals[4]) === String(orgId)) {
        output.players.push({
            id: vals[0],
            name: vals[1],
            club: vals[6]
        });
    }
});
console.log(`Found ${output.players.length} players.`);

console.log("Parsing groups...");
const groupRecords = getRecords('tournament_groups', data);
groupRecords.forEach(r => {
    const vals = splitCSV(r);
    if (vals && compIds.has(vals[1])) {
        output.groups.push({
            id: vals[0],
            competition_id: vals[1],
            name: vals[2],
            player_ids: vals[4],
            standings: vals[5]
        });
    }
});
console.log(`Found ${output.groups.length} groups.`);

console.log("Parsing matches...");
const matchRecords = getRecords('matches', data);
matchRecords.forEach(r => {
    const vals = splitCSV(r);
    if (vals && compIds.has(vals[20])) {
        output.matches.push({
            id: vals[0],
            competition_id: vals[20],
            player1_id: vals[6],
            player2_id: vals[7],
            score1: vals[8],
            score2: vals[9],
            status: vals[12],
            round: vals[14],
            sets: vals[15],
            group_id: vals[24],
            phase: vals[23],
            round_number: vals[25],
            bracket_position: vals[26],
            is_knockout: vals[23] === 'knockout' || vals[23] === 'Finals'
        });
    }
});
console.log(`Found ${output.matches.length} matches.`);

fs.writeFileSync('extracted_data.json', JSON.stringify(output, null, 2));
console.log("Done! Data saved to extracted_data.json");
