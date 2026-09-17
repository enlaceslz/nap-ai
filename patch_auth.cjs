const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

const newLoginLogic = `
      try {
        // 0. Tenta autenticar via API Node.js/Postgres (Drizzle)
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formattedEmail, password: pass })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          const dbUser = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            provedorId: 'nap-postgres',
            status: data.status
          };
          setUser(dbUser);
          setIsAuthenticated(true);
          localStorage.setItem('nap_auth', JSON.stringify(dbUser));
          return;
        } else if (response.status === 401 || response.status === 403) {
          // A API rejeitou a senha ou usuário
          throw new Error(data.error || 'Credenciais inválidas no banco de dados.');
        } else {
          // Erro 500 (banco offline), cai pro try/catch abaixo (Firebase/Mock fallback)
          throw new Error('DatabaseConnectError');
        }
      } catch (dbErr: any) {
        if (dbErr.message !== 'DatabaseConnectError' && dbErr.message !== 'Failed to fetch') {
          // Erro real de validação
          throw dbErr;
        }
        console.warn('Banco de dados inacessível ou não configurado. Tentando fallback para Firebase/Mock...');
      }

      try {
`;

code = code.replace('      try {\n        // 1. Tenta autenticar no Firebase Auth', newLoginLogic + '        // 1. Tenta autenticar no Firebase Auth');

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
