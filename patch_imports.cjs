const fs = require('fs');
let code = fs.readFileSync('src/pages/PortalLogin.tsx', 'utf8');

if (!code.includes('AlertTriangle')) {
  code = code.replace(`import { ShieldCheck, Info, ChevronRight, Check, ArrowRight, Loader2, Sparkles, UserX, HeadphonesIcon } from 'lucide-react';`, `import { ShieldCheck, Info, ChevronRight, Check, ArrowRight, Loader2, Sparkles, UserX, HeadphonesIcon, AlertTriangle } from 'lucide-react';`);
  fs.writeFileSync('src/pages/PortalLogin.tsx', code);
  console.log("Import patched");
}
