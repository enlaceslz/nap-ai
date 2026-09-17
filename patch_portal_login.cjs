const fs = require('fs');
let code = fs.readFileSync('src/pages/PortalLogin.tsx', 'utf8');

const hook = `    setIsLoading(true);

    setTimeout(() => {`;

const inject = `    setIsLoading(true);

    fetch('/api/portal/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ cpf }) })
      .then(res => {
         if (res.status === 429) {
           res.json().then(data => {
             setCpfError(data.message || 'Bloqueio de segurança WAF ativado.');
             setIsLoading(false);
           });
           return Promise.reject('WAF Blocked');
         }
      })
      .then(() => {
        setTimeout(() => {`;

code = code.replace(hook, inject);
code = code.replace(`      navigate('/portal');
    }, 1000);`, `      navigate('/portal');
    }, 500);
      })
      .catch(() => {});`);

fs.writeFileSync('src/pages/PortalLogin.tsx', code);
console.log("PortalLogin WAF patched");
