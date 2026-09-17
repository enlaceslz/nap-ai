const fs = require('fs');
let code = fs.readFileSync('src/pages/TecnicoCampo.tsx', 'utf8');

// Ensure correct React structure at end of TecnicoCampo.tsx
const cleanEnd = `
          )}
        </div>
      </div>
    </div>
  );
}
`;

// It's probably easier to just locate where to slice it.
const matchStr = '              <button\n                onClick={() => {\n                  saveSignature();\n                  setShowAssinaturaModal(false);\n                  handleConcluirAtendimento(selectedOS.id);\n                }}\n                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all active:scale-[0.99] flex justify-center items-center gap-2"\n              >\n                <CheckCircle2 size={18} />\n                Validar e Encerrar OS\n              </button>\n            </div>\n          </div>\n        </div>\n      )}';

const index = code.indexOf(matchStr);
if (index > -1) {
  code = code.substring(0, index + matchStr.length) + '\n    </div>\n  );\n}';
  fs.writeFileSync('src/pages/TecnicoCampo.tsx', code);
}
