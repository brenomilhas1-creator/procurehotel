const XLSX = require('xlsx');
const wb = XLSX.readFile('/tmp/import-teste-debug.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
console.log('Rows:', rows);
console.log('Header:', rows[0]);
const lower = rows[0].map((h) => String(h || '').toLowerCase().trim());
console.log('Lower:', lower);
