const fs = require('fs');

const file = 'src/db/schema.ts';
let content = fs.readFileSync(file, 'utf8');

const newTables = `
// --- CUSTOMER 360 & BILLING (NAP CUSTOMER) ---
export const nap_customers = pgTable('nap_customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  document: varchar('document', { length: 50 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  whatsapp: varchar('whatsapp', { length: 50 }),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const nap_customer_references = pgTable('nap_customer_references', {
  id: serial('id').primaryKey(),
  napCustomerId: integer('nap_customer_id').references(() => nap_customers.id),
  externalSystem: varchar('external_system', { length: 50 }).notNull(), // 'sgp', 'ixc', 'hubsoft'
  externalCustomerId: varchar('external_customer_id', { length: 100 }).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  syncStatus: varchar('sync_status', { length: 50 }).default('synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const nap_invoices = pgTable('nap_invoices', {
  id: serial('id').primaryKey(),
  napCustomerId: integer('nap_customer_id').references(() => nap_customers.id),
  externalInvoiceId: varchar('external_invoice_id', { length: 100 }),
  externalSystem: varchar('external_system', { length: 50 }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: varchar('status', { length: 50 }).default('open'), // open, paid, canceled
  paymentChargeId: varchar('payment_charge_id', { length: 255 }), // Enlace-Pay ID
  txid: varchar('txid', { length: 255 }), // PIX TXID
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const nap_payment_transactions = pgTable('nap_payment_transactions', {
  id: serial('id').primaryKey(),
  napInvoiceId: integer('nap_invoice_id').references(() => nap_invoices.id),
  napCustomerId: integer('nap_customer_id').references(() => nap_customers.id),
  txid: varchar('txid', { length: 255 }),
  transactionId: varchar('transaction_id', { length: 255 }), // Bank transaction ID
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  method: varchar('method', { length: 50 }).default('PIX'),
  status: varchar('status', { length: 50 }).default('confirmed'),
  source: varchar('source', { length: 50 }), // 'C6', 'Enlace-Pay'
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const nap_customer_events = pgTable('nap_customer_events', {
  id: serial('id').primaryKey(),
  napCustomerId: integer('nap_customer_id').references(() => nap_customers.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  source: varchar('source', { length: 50 }),
  referenceId: varchar('reference_id', { length: 100 }),
  metadata: text('metadata'), // JSON
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const nap_integrations = pgTable('nap_integrations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 'SGP', 'IXC'
  type: varchar('type', { length: 50 }).notNull(), // 'erp', 'payment'
  status: varchar('status', { length: 50 }).default('DISCONNECTED'),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
`;

if (!content.includes('nap_customers')) {
  content = content + '\n' + newTables;
  fs.writeFileSync(file, content);
  console.log('Added Customer 360 tables to schema');
} else {
  console.log('Customer 360 tables already exist');
}
