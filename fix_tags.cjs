const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// I might have deleted a closing div for the entire grid container earlier
code = code.replace(
  /            <\/div>\n          \)\}\n        <\/div>\n      \)\}\n    <\/div>\n  \);\n\}/g,
  `            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
