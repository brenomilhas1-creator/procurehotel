const XLSX = require('xlsx');
const fs = require('fs');
const buf = fs.readFileSync('/tmp/import-teste-debug.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
console.log('SheetNames:', wb.SheetNames);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
console.log('Rows:', JSON.stringify(rows));
