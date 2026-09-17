const fs = require('fs');
const ts = require('typescript');

function fixFile(fileName) {
    let sourceText = fs.readFileSync(fileName, 'utf8');
    let lines = sourceText.split('\n');
    let maxIters = 200;
    
    for (let iter = 0; iter < maxIters; iter++) {
        let sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
        let diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([fileName], {}));
        
        if (diagnostics.length === 0) {
            console.log("No syntax errors found!");
            break;
        }
        
        let firstError = diagnostics.find(d => [1005, 1128, 1472, 1135, 1131].includes(d.code));
        if (!firstError) {
            console.log("No fixable errors found. Found:", diagnostics[0].code);
            break;
        }
        
        let pos = sourceFile.getLineAndCharacterOfPosition(firstError.start);
        let lineNum = pos.line;
        
        console.log(`Iter ${iter}: Error ${firstError.code} at line ${lineNum + 1}`);
        
        let fixed = false;
        
        let searchUpLimit = 3;
        if (firstError.code === 1005 && lines[lineNum].match(/catch/)) {
            searchUpLimit = 50;
        }
        
        // Find empty line
        for (let i = lineNum; i >= Math.max(0, lineNum - searchUpLimit); i--) {
            if (lines[i] !== undefined && lines[i].match(/^\s*$/) && lines[i].length > 0) {
                lines[i] += '}';
                console.log(` => Inserted } at empty line ${i + 1}`);
                fixed = true;
                break;
            }
        }
        
        if (!fixed) {
            // Find line before that ends with string/boolean/number/array/object
            if (lineNum > 0 && lines[lineNum - 1].match(/["'a-zA-Z0-9\]\)]\s*$/)) {
                lines[lineNum - 1] += ' }';
                console.log(` => Inserted } at end of line ${lineNum}: ${lines[lineNum - 1]}`);
                fixed = true;
            } else {
                lines[lineNum] += ' }';
                console.log(` => Forced } at line ${lineNum + 1}: ${lines[lineNum]}`);
                fixed = true;
            }
        }
        
        // Let's also check for TS1128 "Declaration or statement expected".
        // It often means there is an EXTRA `}` because we inserted it incorrectly or it was already there.
        if (firstError.code === 1128) {
            for (let i = lineNum; i >= Math.max(0, lineNum - 5); i--) {
                if (lines[i] !== undefined && lines[i].match(/^\s*\}\s*$/)) {
                    lines[i] = lines[i].replace('}', '');
                    console.log(` => Removed extra } at line ${i+1}`);
                    fixed = true;
                    break;
                }
            }
            if(!fixed) {
               lines[lineNum] = lines[lineNum].replace(/\}\s*$/, '');
               console.log(` => Stripped } at line ${lineNum+1}`);
            }
        }
        
        sourceText = lines.join('\n');
    }
    
    fs.writeFileSync(fileName, sourceText);
}

fixFile('server.ts');
