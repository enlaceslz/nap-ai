const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');
code = code.replace(
  "customer_id: serial('customer_id').references(() => clientes.id),",
  "customer_id: integer('customer_id').references(() => clientes.id),"
);
code = code.replace(
  "queue_id: serial('queue_id').references(() => helpdesk_queues.id),",
  "queue_id: integer('queue_id').references(() => helpdesk_queues.id),"
);
code = code.replace(
  "sla_id: serial('sla_id').references(() => helpdesk_slas.id),",
  "sla_id: integer('sla_id').references(() => helpdesk_slas.id),"
);
code = code.replace(
  "tecnico_id: serial('tecnico_id').references(() => users.id),",
  "tecnico_id: integer('tecnico_id').references(() => users.id),"
);
code = code.replace(
  "ticket_id: serial('ticket_id').references(() => helpdesk_tickets.id),",
  "ticket_id: integer('ticket_id').references(() => helpdesk_tickets.id),"
);
fs.writeFileSync('src/db/schema.ts', code, 'utf8');
console.log('Patched schema FKs');
