const fs = require('fs');
let code = fs.readFileSync('src/pages/PortalLogin.tsx', 'utf8');

const hook = `  const navigate = useNavigate();`;

const inject = `
  const isValidCpf = (cpf) => {
    cpf = cpf.replace(/\\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\\d)\\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
        soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  };
  const navigate = useNavigate();`;

code = code.replace(hook, inject);

const hook2 = `  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;`;
    
const inject2 = `  const [cpfError, setCpfError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;
    
    if (!isValidCpf(cpf)) {
      setCpfError('CPF inválido de acordo com a Receita Federal');
      return;
    }
    setCpfError('');`;

code = code.replace(hook2, inject2);

const hook3 = `const [copiedCpf, setCopiedCpf] = useState(false);`;
const inject3 = `const [copiedCpf, setCopiedCpf] = useState(false);`;
// Just checking if we need to add the state above instead of replacing handleLogin.
// Let's add the state above.
code = code.replace(`  const [cpfNotFound, setCpfNotFound] = useState(false);`, `  const [cpfNotFound, setCpfNotFound] = useState(false);\n  const [cpfError, setCpfError] = useState('');`);

code = code.replace(`  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;

    setIsLoading(true);`, `  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return;
    
    if (!isValidCpf(cpf)) {
      setCpfError('CPF inválido de acordo com a Receita Federal');
      return;
    }
    setCpfError('');

    setIsLoading(true);`);


const hookInput = `                <input
                  type="tel"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full h-13 pl-4 pr-11 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-mono font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                  required
                />
                {cpf.length === 14 && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                    <ShieldCheck size={22} />
                  </div>
                )}`;

const injectInput = `                <input
                  type="tel"
                  value={cpf}
                  onChange={(e) => { setCpfError(''); handleCpfChange(e); }}
                  placeholder="000.000.000-00"
                  className={\`w-full h-13 pl-4 pr-11 bg-slate-50 border-2 rounded-xl text-lg font-mono font-medium text-slate-800 focus:ring-4 outline-none transition-all placeholder:text-slate-300 \${cpfError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'}\`}
                  required
                />
                {cpf.length === 14 && !cpfError && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                    <ShieldCheck size={22} />
                  </div>
                )}
              </div>
              {cpfError && (
                <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertTriangle size={12} /> {cpfError}
                </p>
              )}`;

code = code.replace(hookInput, injectInput);

fs.writeFileSync('src/pages/PortalLogin.tsx', code);
console.log("CPF validator patched");
