
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../laravel-backend/infinit4_testteamsphere (1).sql');
const output = {
    competition_players: []
};

// We need to know which Competition IDs we care about (Org 4 competitions)
// From full_extractor.cjs we know Org 4 comp IDs are: 4, 31, 32, 34, 35, 39, 43, 44, 45-50.
const targetCompIds = new Set(['4', '31', '32', '34', '35', '39', '43', '44', '45', '46', '47', '48', '49', '50']);

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

console.log("Parsing competition_player...");
const records = getRecords('competition_player', data);
records.forEach(r => {
    const vals = splitCSV(r);
    // id=0, competition_id=1, player_id=2
    if (vals && targetCompIds.has(vals[1])) {
        output.competition_players.push({
            competition_id: vals[1],
            player_id: vals[2]
        });
    }
});

console.log(`Found ${output.competition_players.length} player registrations.`);
fs.writeFileSync('extracted_participations.json', JSON.stringify(output, null, 2));
console.log("Saved to extracted_participations.json");
