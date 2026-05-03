import { db } from './index';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    console.log('Connection successful:', result);
  } catch (error: any) {
    console.log(error.cause);
  }
}
testConnection();
