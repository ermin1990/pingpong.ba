
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../laravel-backend/infinit4_testteamsphere (1).sql');

const data = fs.readFileSync(filePath, 'utf8');

const regex = /INSERT INTO `competitions` .*?VALUES\s*(.*);/s;
const match = regex.exec(data);

if (match) {
    const values = match[1];
    // This is a naive split, might fail with commas in strings, but good for ID check
    // Actually, let's just find the last verifyable ID.
    const parts = values.split('),');
    const lastPart = parts[parts.length - 1];
    console.log("Last competition record:", lastPart);
} else {
    console.log("No match found");
}
