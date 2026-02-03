
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../laravel-backend/infinit4_testteamsphere (1).sql');

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
            if (char === "'" && (i === 0 || valuesPart[i-1] !== "\\")) inString = !inString;
            if (!inString) {
                if (char === "(") parenLevel++;
                if (char === ")") parenLevel--;
            }
            current += char;
            if (parenLevel === 0 && (char === "," || i === valuesPart.length - 1)) {
                let rec = current.trim();
                while (rec.endsWith(',')) rec = rec.slice(0, -1).trim();
                if (rec.startsWith('(') && rec.endsWith(')')) records.push(rec.slice(1, -1));
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
const expectedNames = [
    "JUNIORKE", 
    "PODKATEGORIJA NAJMLAĐE KADETKINJE", 
    "MLAĐI KADETI", 
    "JUNIORI", 
    "PODKATEGORIJA NAJMLAĐI KADETI", 
    "SENIORI"
];

console.log("Searching competitions...");
const records = getRecords('competitions', data);
records.forEach(r => {
    const vals = splitCSV(r);
    const id = vals[0];
    const name = vals[1];
    const orgId = vals[4];
    
    // Check if name roughly matches expected ones
    const normalized = name.toUpperCase().trim();
    if (expectedNames.some(en => normalized.includes(en)) || normalized.includes("KADET") || normalized.includes("SENIOR") || normalized.includes("JUNIOR")) {
        console.log(`Found: ID=${id}, Name="${name}", OrgID=${orgId}`);
    }
});
