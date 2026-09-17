const fs = require('fs');

// We know that `sed 's/}$//g'` removed the `}` from the end of the lines.
// So lines that were `  }` became `  ` (spaces only)
// Lines that were `    }` became `    `
// So we can find lines that consist ONLY of spaces (or are completely empty) and if the next line's indentation suggests a block was closed, or if we can track braces.
// Actually, it's safer to use an auto-formatter or a smarter heuristic.
// Wait, a line that was `}` and was stripped is now empty or just spaces.
// Let's replace any line that has only spaces AND has length > 0 with `} ` or `}`.
// But some lines might have been just empty. 
// A line that had `  }` would now have length 2 and be just spaces.
// Let's check length of these lines.

let text = fs.readFileSync('server.ts', 'utf8');
let lines = text.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^\s+$/)) { // line is only spaces
    lines[i] = lines[i] + '}';
  } else if (lines[i] === '') {
    // If the line was empty originally, it didn't end in `}`.
    // Wait, what if it was exactly `}` with no spaces? Then it would become ``, which is length 0.
    // Let's check if we need to add `}` to empty lines. This is risky. 
  }
}

fs.writeFileSync('server.ts_fixed', lines.join('\n'));
