
const fs = require('fs');
const path = require('path');

const filePath = '/Users/batz-tuzla-backup/Downloads/competitions.sql';
const output = {
    competitions: []
};

const orgId = "8";

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

try {
    const data = fs.readFileSync(filePath, 'utf8');

    console.log("Parsing competitions...");
    const compRecords = getRecords('competitions', data);
    
    compRecords.forEach(r => {
        const vals = splitCSV(r);
        // ID=0, Name=1, Slug=2, Desc=3, OrgId=4
        if (vals && String(vals[4]) === String(orgId)) {
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

    console.log(`Found ${output.competitions.length} competitions for Org ${orgId}.`);
    
    fs.writeFileSync('extracted_joola.json', JSON.stringify(output, null, 2));
    console.log("Saved to extracted_joola.json");

} catch (err) {
    console.error("Error reading file:", err);
}
