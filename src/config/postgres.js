// PostgreSQL configuration for Repair system
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
let pool = null;

const resolveEnv = (...keys) => keys.reduce((value, key) => value ?? process.env[key], undefined);

function buildPoolConfig() {
  const host = resolveEnv("DB_HOST", "PG_HOST");
  const defaultSsl = host && host.includes(".rds.amazonaws.com") ? "true" : "false";
  const sslEnabled = String(resolveEnv("PG_SSL", "DB_SSL") ?? defaultSsl).toLowerCase() === "true";
  return {
    host,
    port: Number(resolveEnv("DB_PORT", "PG_PORT") || 5432),
    user: resolveEnv("DB_USER", "PG_USER"),
    password: resolveEnv("DB_PASSWORD", "PG_PASSWORD"),
    database: resolveEnv("DB_NAME", "PG_NAME", "PG_DATABASE"),
    ssl: sslEnabled
      ? {
          rejectUnauthorized: false,
        }
      : false,
    max: Number(process.env.PG_POOL_MAX) || 10,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 30000,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS) || 5000,
  };
}

export function getPgPool() {
  if (pool) return pool;
  pool = new Pool(buildPoolConfig());
  pool.on("error", (err) => {
    console.error("Unexpected Postgres pool error:", err);
  });
  console.log("✅ Postgres pool initialized");
  return pool;
}

export async function withPgClient(handler) {
  const client = await getPgPool().connect();
  try {
    return await handler(client);
  } finally {
    client.release();
  }
}

export async function withPgTransaction(handler) {
  return withPgClient(async (client) => {
    try {
      await client.query("BEGIN");
      const result = await handler(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}

// Default export for repair system compatibility
const repairPool = new Pool(buildPoolConfig());

repairPool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL (Repair DB)"))
  .catch((err) => console.error("❌ Database connection error:", err.message));

export default repairPool;








