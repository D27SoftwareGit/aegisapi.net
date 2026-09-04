import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

async function ensureSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.licensing_license_bindings (
        id SERIAL PRIMARY KEY,
        license_key_encrypted TEXT NOT NULL,
        license_key_lookup_hash TEXT NOT NULL UNIQUE,
        machine_id_encrypted TEXT,
        status TEXT NOT NULL DEFAULT 'unbound',
        pack_call_balance INTEGER NOT NULL DEFAULT 0,
        bound_at TIMESTAMP,
        released_at TIMESTAMP,
        force_cleared BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS public.licensing_audit_log (
        id SERIAL PRIMARY KEY,
        license_key_lookup_hash TEXT NOT NULL,
        action TEXT NOT NULL,
        actor TEXT NOT NULL DEFAULT 'system',
        detail TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS public.app_users (
        id SERIAL PRIMARY KEY,
        clerk_user_id TEXT NOT NULL UNIQUE,
        stripe_customer_id_encrypted TEXT,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
        revoked_at TIMESTAMP,
        suspended BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS public.licensing_user_licenses (
        id SERIAL PRIMARY KEY,
        clerk_user_id TEXT NOT NULL,
        license_key_lookup_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS public.purchase_tokens (
        id SERIAL PRIMARY KEY,
        clerk_user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        tier TEXT NOT NULL,
        call_balance INTEGER NOT NULL DEFAULT 0,
        stripe_session_id TEXT UNIQUE,
        price_paid_cents INTEGER NOT NULL DEFAULT 0,
        email TEXT NOT NULL DEFAULT '',
        redeemed BOOLEAN NOT NULL DEFAULT FALSE,
        redeemed_at TIMESTAMP,
        license_expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    logger.info("Schema verified");
  } catch (err) {
    logger.error({ err }, "Schema verification failed — startup aborted");
    process.exit(1);
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await ensureSchema();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
