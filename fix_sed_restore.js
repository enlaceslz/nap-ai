const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf8');

// The command that broke it was: sed -i 's/}$//g' server.ts
// This removed exactly one `}` from the end of any line that ended with `}`.
// We can try to repair it by adding `}` to lines that were affected.
// How do we know which ones were affected?
// Lines that now end with `;` but have unmatched `{`? No, if it was `};`, `}` was NOT at the end of the line, `;` was!
// Wait! `sed 's/}$//g'` ONLY matches `}` at the EXACT END of the line!
// So `};` was NOT affected!
// Only `  }` or `}` or `  } ` (if no spaces at the end) were affected.
// So any line that now consists purely of spaces (length > 0) was likely a `  }`!
// Any line that ends with ` ` (space) was probably ` }`? No, `}` was at the very end.
// If a line was `    }`, after removing `}`, it is now `    `. 
// So, if a line has ONLY spaces, we append `}`.
// What about lines like `  } else {`? They don't end in `}`, so they were NOT affected!
// So ONLY lines that ENDED in `}` were affected.
// This is actually very predictable.
// Let's write a script that analyzes the original `server.ts` before `auto_brace.cjs` (wait, did I overwrite it? Yes, but let's check).
