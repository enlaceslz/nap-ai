const fs = require('fs');
let text = fs.readFileSync('server/communications/nocCopilot.ts', 'utf8');

// Adding FieldService capability to Gemini (MCP Gateway for OS / PRD Fase 7/8)
if (!text.includes('get_field_work_orders')) {
  text = text.replace(
    'import { GenieacsService } from "../genieacs/genieacsService";',
    'import { GenieacsService } from "../genieacs/genieacsService";\nimport { FieldService } from "../field/fieldService";'
  );

  const mcpOSDecl = `
          {
            name: "get_field_work_orders",
            description: "Consulta as Ordens de Serviço (OS) ativas para os técnicos de campo.",
            parameters: {
              type: "OBJECT",
              properties: {
                status_filter: {
                  type: "STRING",
                  description: "Filtrar por status (ex: pending, dispatched, en_route)",
                }
              }
            }
          },
          {
            name: "update_os_status",
            description: "Atualiza o status de uma Ordem de Serviço de campo. (Ação Operacional)",
            parameters: {
              type: "OBJECT",
              properties: {
                os_number: { type: "STRING" },
                new_status: { type: "STRING", description: "Novo status: en_route, on_site, resolved" }
              },
              required: ["os_number", "new_status"]
            }
          },`;

  text = text.replace(
    '          {',
    mcpOSDecl + '\n          {'
  );

  const execOsTool = `
      if (name === "get_field_work_orders") {
        const fieldService = FieldService.getInstance();
        let orders = fieldService.getWorkOrders();
        if (args.status_filter) orders = orders.filter(o => o.status === args.status_filter);
        return orders;
      }
      
      if (name === "update_os_status") {
        const fieldService = FieldService.getInstance();
        const updated = fieldService.updateOsStatus(args.os_number, args.new_status, "Telegram_User");
        if (updated) return { success: true, os: updated };
        return { error: "OS não encontrada." };
      }`;

  text = text.replace(
    '      if (name === "get_cpe_status") {',
    execOsTool + '\n\n      if (name === "get_cpe_status") {'
  );

  fs.writeFileSync('server/communications/nocCopilot.ts', text, 'utf8');
  console.log('Gemini MCP Gateway patched with Field Service capabilities');
} else {
  console.log('Already patched');
}
