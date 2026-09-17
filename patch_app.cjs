const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('NapSaasLanding')) {
  // Insert import
  code = code.replace(
    /import HistoricoConversas from "\.\/pages\/admin\/relatorios\/HistoricoConversas";/,
    'import HistoricoConversas from "./pages/admin/relatorios/HistoricoConversas";\nimport NapSaasLanding from "./pages/NapSaasLanding";'
  );
  
  // Insert route
  code = code.replace(
    /<Route path="\/landingpage" element=\{<ErrorBoundary fallbackTitle="Falha na Vitrine da Landing Page"><LandingPage \/><\/ErrorBoundary>\} \/>/,
    '<Route path="/landingpage" element={<ErrorBoundary fallbackTitle="Falha na Vitrine da Landing Page"><LandingPage /></ErrorBoundary>} />\n              <Route path="/nap" element={<ErrorBoundary fallbackTitle="Erro na Landing Page SaaS"><NapSaasLanding /></ErrorBoundary>} />'
  );

  fs.writeFileSync('src/App.tsx', code);
}
