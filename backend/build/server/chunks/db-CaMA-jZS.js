import { b as private_env } from './shared-server-cF6ckHns.js';
import pg from 'pg';

const { Pool } = pg;
let pool;
function getConnectionConfig() {
  const connectionString = private_env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum di-set.");
  }
  let isSupabaseHost = false;
  try {
    isSupabaseHost = new URL(connectionString).hostname.includes("supabase");
  } catch {
    isSupabaseHost = false;
  }
  const sslEnabled = private_env.DATABASE_SSL === "true" || private_env.DATABASE_SSL === "1" || private_env.PGSSLMODE === "require" || /[?&]sslmode=require/i.test(connectionString) || /[?&]ssl=true/i.test(connectionString) || isSupabaseHost;
  return {
    connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : void 0
  };
}
function getPool() {
  if (!pool) {
    pool = new Pool(getConnectionConfig());
  }
  return pool;
}
async function query(text, params = []) {
  return getPool().query(text, params);
}
async function withTransaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export { query as q, withTransaction as w };
//# sourceMappingURL=db-CaMA-jZS.js.map
