const fs = require('fs');
let code = fs.readFileSync('src/pages/NapSaasLanding.tsx', 'utf8');

code = code.replace(
  /const planKey = \\`plan\\\\\$\\{planNum\\}Features\\` as keyof typeof prev;/g,
  'const planKey = `plan${planNum}Features` as keyof typeof prev;'
);
// wait actually it looks like the escaping in EOF didn't expand because I used 'EOF' (single quotes).
// Let's check what it actually wrote.
