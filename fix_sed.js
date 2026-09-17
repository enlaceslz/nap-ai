const fs = require('fs');

let text = fs.readFileSync('server.ts_patched', 'utf8');
let lines = text.split('\n');

let changes = 0;
for (let i = 0; i < lines.length; i++) {
    // If the line consists entirely of spaces (and length > 0), it must have been a line with just `}` and indentation.
    if (lines[i].match(/^\s+$/)) {
        lines[i] = lines[i] + '}';
        changes++;
    }
    // If the line is completely empty, it might have been a `}` at column 0.
    // BUT we shouldn't add `}` to every empty line. Let's look for empty lines that are followed by `export default app;` or something.
    // Let's only fix empty lines that are at the very end.
    
    // If the line ends with a string literal without a closing brace, but it's part of an object definition
    if (lines[i].match(/status: "ativo"\s*$/)) {
        lines[i] = lines[i].replace(/status: "ativo"\s*$/, 'status: "ativo" }');
        changes++;
    }
    
    if (lines[i].match(/const novoIncidente: IncidenteRede = \{\s*$/)) {
        // wait, did this line end with }? No, it ends with {.
    }
}

fs.writeFileSync('server.ts_fixed3', lines.join('\n'));
console.log("Made " + changes + " changes.");
