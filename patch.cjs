const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
code = code.replace(/getFirestore,\s*doc,/g, 'getFirestore,\n  initializeFirestore,\n  doc,');
code = code.replace(/getFirestore\(app, firebaseConfig\.firestoreDatabaseId\)/g, 'initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)');
code = code.replace(/getFirestore\(app\)/g, 'initializeFirestore(app, { experimentalForceLongPolling: true })');
fs.writeFileSync('src/lib/firebase.ts', code);
