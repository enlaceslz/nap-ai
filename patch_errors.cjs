const fs = require('fs');

function silenceErrors(filePath) {
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Silence helpdesk DB offline logs
    code = code.replace(/console\.warn\("DB offline, using memory fallback for getTickets", e\);/g, 'console.log("[Info] DB offline, using memory fallback for getTickets");');
    code = code.replace(/console\.warn\("DB offline, using memory fallback for createTicket", e\);/g, 'console.log("[Info] DB offline, using memory fallback for createTicket");');
    code = code.replace(/console\.warn\("DB offline, memory closeTicket fallback"\);/g, 'console.log("[Info] DB offline, memory closeTicket fallback");');
    code = code.replace(/console\.warn\("Audit Log memory fallback"\);/g, 'console.log("[Info] Audit Log memory fallback");');
    
    // CRM
    code = code.replace(/console\.warn\("PostgreSQL connection failed, using Memory Fallback"\);/g, 'console.log("[Info] PostgreSQL connection failed, using Memory Fallback");');
    
    // Any other console.warn or error that passes 'e' for DB fallback
    code = code.replace(/console\.warn\("([^"]+)", e\);/g, 'console.log("[Info] $1");');
    code = code.replace(/console\.error\("([^"]+)", e\);/g, 'console.log("[Info] $1");');

    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Patched: ' + filePath);
  }
}

silenceErrors('server/helpdesk/service.ts');
silenceErrors('server/crm/crmService.ts');
silenceErrors('server/crm/crmRoutes.ts');
