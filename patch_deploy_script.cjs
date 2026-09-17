const fs = require('fs');
let code = fs.readFileSync('deploy.sh', 'utf8');

if (code.includes('npm run start')) {
  code = code.replace(
    /pm2 start npm --name "nap-api" -- run start/,
    'pm2 start dist/server.cjs --name "nap-api" --time'
  );
  fs.writeFileSync('deploy.sh', code);
}
