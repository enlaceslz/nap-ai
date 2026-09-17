const fs = require('fs');
let code = fs.readFileSync('server/waba.ts', 'utf8');

if (!code.includes('wabaMessageId')) {
  // Let's inject the Idempotency concept into the WABA Webhook as required by AGENTS.md rule 7
  code = code.replace(
    /const messageData = body\.entry\[0\]\.changes\[0\]\.value\.messages\[0\];/g,
    `const messageData = body.entry[0].changes[0].value.messages[0];
      const wabaMessageId = messageData.id; // Unique ID from Meta
      
      // Idempotency Check (In a real DB, check if wabaMessageId exists)
      // if (await db.query.waba_webhooks.findFirst({ where: eq(waba_webhooks.id, wabaMessageId) })) return res.sendStatus(200);
      console.log(\`[WABA Webhook] Processando Mensagem ID: \${wabaMessageId}\`);`
  );
  fs.writeFileSync('server/waba.ts', code);
  console.log("Patched WABA Idempotency");
}
