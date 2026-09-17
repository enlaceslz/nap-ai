import { db } from './src/db/index';
import { helpdesk_tickets } from './src/db/schema';

async function run() {
  try {
    const res = await db.select().from(helpdesk_tickets);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
