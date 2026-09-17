const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix 'body' error by using 'any' type for options
const optionsFind = `  const options = {
    method,`;
const optionsReplace = `  const options: any = {
    method,`;
code = code.replace(optionsFind, optionsReplace);

// Fix remaining sgpDatabase error
code = code.replace("sgpDatabase.find", "sgpDatabase_mock.find");

fs.writeFileSync('server.ts', code);
