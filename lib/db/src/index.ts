import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const isProd = process.env.NODE_ENV === "production";
const connectionString = isProd
  ? process.env.AEGISAPI_DB_URL
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    isProd
      ? "AEGISAPI_DB_URL must be set in production."
      : "DATABASE_URL must be set in development.",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

// devPool always connects to the Replit Helium dev DB (DATABASE_URL),
// regardless of NODE_ENV. Used by reset-app to wipe dev data alongside prod.
const devConnectionString = process.env.DATABASE_URL;
export const devPool = devConnectionString
  ? new Pool({ connectionString: devConnectionString })
  : null;

export * from "./schema";
