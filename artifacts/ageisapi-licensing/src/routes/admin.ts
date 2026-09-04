import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, pool, devPool, licenseBindingsTable, licenseAuditLogTable } from "@workspace/db";
import { lookupHash } from "../lib/crypto";
import { requireAdmin } from "../middlewares/adminAuth";
import { adminLimiter } from "../middlewares/rateLimit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.use(requireAdmin, adminLimiter);

const forceClearBody = z.object({
  licenseKey: z.string().min(8).max(256),
  reason: z.string().min(1).max(1000),
});

// POST /admin/force-clear — support-only escape hatch for a machine that
// crashed without a clean release. Wipes the binding server-side so the
// license can be reclaimed elsewhere. Per policy, pack-call balance is
// forfeited on a forced clear (never on a normal tool-driven migration).
router.post("/force-clear", async (req, res) => {
  const parsed = forceClearBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }
  const { licenseKey, reason } = parsed.data;
  const keyHash = lookupHash(licenseKey);

  const [existing] = await db
    .select()
    .from(licenseBindingsTable)
    .where(eq(licenseBindingsTable.licenseKeyLookupHash, keyHash))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  await db
    .update(licenseBindingsTable)
    .set({
      status: "released",
      machineIdEncrypted: null,
      releasedAt: new Date(),
      packCallBalance: 0,
      forceCleared: true,
      updatedAt: new Date(),
    })
    .where(eq(licenseBindingsTable.licenseKeyLookupHash, keyHash));

  await db.insert(licenseAuditLogTable).values({
    licenseKeyLookupHash: keyHash,
    action: "force_clear",
    actor: "admin",
    detail: reason,
  });

  req.log.warn({ reason }, "Admin force-cleared a license binding");
  res.json({ status: "released", packCallBalance: 0 });
});

// GET /admin/audit — recent audit log entries (license keys never appear
// in plaintext; only their lookup hash is stored/returned).
router.get("/audit", async (_req, res) => {
  const rows = await db
    .select()
    .from(licenseAuditLogTable)
    .orderBy(licenseAuditLogTable.id)
    .limit(500);
  res.json({ entries: rows });
});

// POST /admin/checkpoint/backup — produces a JSON snapshot of all license
// bindings (still encrypted at rest) for disaster-recovery backup. This does
// NOT decrypt anything; it's a raw table dump admins can archive.
router.post("/checkpoint/backup", async (_req, res) => {
  const bindings = await db.select().from(licenseBindingsTable);
  const auditLog = await db.select().from(licenseAuditLogTable);
  res.json({
    createdAt: new Date().toISOString(),
    bindings,
    auditLog,
  });
});

// POST /admin/checkpoint/credentials-export — one-time export of the current
// admin key / encryption key configuration status (never the values
// themselves — those live only in Replit/Azure secrets). Used by the admin
// to confirm which keys are configured before a key-rotation.
router.post("/checkpoint/credentials-export", async (_req, res) => {
  res.json({
    adminKeyConfigured: Boolean(process.env["AEGISAPI_LICENSING_ADMIN_KEY"]),
    encryptionKeyConfigured: Boolean(
      process.env["AEGISAPI_LICENSING_ENCRYPTION_KEY"],
    ),
    exportedAt: new Date().toISOString(),
  });
});

// POST /admin/checkpoint/logs-export — returns recent structured logs is not
// wired to a file sink in this service (logs go to stdout, captured by the
// platform); this endpoint instead exports the audit log, which is the
// durable record admins actually need for support investigations.
router.post("/checkpoint/logs-export", async (_req, res) => {
  const rows = await db
    .select()
    .from(licenseAuditLogTable)
    .orderBy(licenseAuditLogTable.id)
    .limit(2000);
  res.json({ exportedAt: new Date().toISOString(), entries: rows });
});

const resetConfirmation = z.object({
  confirm: z.literal("RESET"),
});

// POST /admin/reset — truncates all licensing data. Destructive; requires an
// explicit confirm: "RESET" body to guard against accidental calls.
router.post("/reset", async (req, res) => {
  const parsed = resetConfirmation.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "confirmation_required" });
    return;
  }

  await db.delete(licenseAuditLogTable);
  await db.delete(licenseBindingsTable);

  logger.warn("Admin reset licensing tables");
  res.json({ status: "reset_complete" });
});

// POST /admin/truncate-all — wipes all public tables and resets identity
// sequences. Used to reset the test environment between test cycles.
router.post("/truncate-all", async (_req, res) => {
  await pool.query(`
    TRUNCATE
      public.app_users,
      public.licensing_audit_log,
      public.licensing_license_bindings,
      public.licensing_user_licenses,
      public.purchase_tokens
    RESTART IDENTITY CASCADE
  `);
  logger.warn("Admin truncated all public tables and reset identity sequences");
  res.json({ status: "truncated" });
});

async function deleteAllStripeCustomers(secretKey: string): Promise<number> {
  let deleted = 0;
  let startingAfter: string | undefined;
  while (true) {
    const url = new URL("https://api.stripe.com/v1/customers");
    url.searchParams.set("limit", "100");
    if (startingAfter) url.searchParams.set("starting_after", startingAfter);
    const listRes = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}` },
    });
    if (!listRes.ok) break;
    const page = await listRes.json() as { data: Array<{ id: string }>; has_more: boolean };
    if (page.data.length === 0) break;
    await Promise.all(page.data.map(async (c) => {
      await fetch(`https://api.stripe.com/v1/customers/${c.id}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}` },
      });
    }));
    deleted += page.data.length;
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return deleted;
}

// POST /admin/reset-app — full test-environment reset:
//   1. Snapshot prod (Neon) table row counts before + after
//   2. Truncate prod tables
//   3. Snapshot dev (Helium) table row counts before + after
//   4. Truncate dev tables
//   5. Delete all Clerk users
//   6. Delete all Stripe TEST customers
//   7. Delete all Stripe PROD customers
// Returns before+after snapshots for both DBs.
router.post("/reset-app", async (_req, res) => {
  const clerkSecret = process.env["CLERK_SECRET_KEY"];
  if (!clerkSecret) {
    res.status(500).json({ error: "CLERK_SECRET_KEY not configured" });
    return;
  }

  const tables = [
    "app_users",
    "licensing_audit_log",
    "licensing_license_bindings",
    "licensing_user_licenses",
    "purchase_tokens",
  ] as const;

  async function countAll(p: typeof pool): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const r = await p.query(`SELECT COUNT(*) FROM public.${t}`);
      counts[t] = Number(r.rows[0].count);
    }
    return counts;
  }

  // 1. Prod before
  const prodBefore = await countAll(pool);

  // 2. Truncate prod (Neon)
  await pool.query(`
    TRUNCATE
      public.app_users,
      public.licensing_audit_log,
      public.licensing_license_bindings,
      public.licensing_user_licenses,
      public.purchase_tokens
    RESTART IDENTITY CASCADE
  `);

  // 3. Prod after
  const prodAfter = await countAll(pool);

  // 4. Dev before + truncate + after
  const devBefore: Record<string, number> = {};
  const devAfter: Record<string, number> = {};
  let devTruncated = false;
  if (devPool) {
    const devTables = await devPool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    const devTableNames = devTables.rows.map((r: { table_name: string }) => r.table_name);
    for (const t of tables) {
      if (devTableNames.includes(t)) {
        const r = await devPool.query(`SELECT COUNT(*) FROM public.${t}`);
        devBefore[t] = Number(r.rows[0].count);
      } else {
        devBefore[t] = 0;
      }
    }
    const existingTables = tables.filter(t => devTableNames.includes(t));
    if (existingTables.length > 0) {
      await devPool.query(`
        TRUNCATE ${existingTables.map(t => `public.${t}`).join(", ")} RESTART IDENTITY CASCADE
      `);
      devTruncated = true;
    }
    for (const t of tables) {
      if (devTableNames.includes(t)) {
        const r = await devPool.query(`SELECT COUNT(*) FROM public.${t}`);
        devAfter[t] = Number(r.rows[0].count);
      } else {
        devAfter[t] = 0;
      }
    }
  }

  // 5. Delete all Clerk users (paginated)
  let deletedUsers = 0;
  let offset = 0;
  const limit = 500;
  while (true) {
    const listRes = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${clerkSecret}` } }
    );
    if (!listRes.ok) {
      const text = await listRes.text();
      throw new Error(`Clerk list failed: ${listRes.status} ${text}`);
    }
    const users = (await listRes.json()) as Array<{ id: string }>;
    if (users.length === 0) break;

    await Promise.all(
      users.map(async (u) => {
        const del = await fetch(`https://api.clerk.com/v1/users/${u.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${clerkSecret}` },
        });
        if (!del.ok) {
          const text = await del.text();
          throw new Error(`Clerk delete ${u.id} failed: ${del.status} ${text}`);
        }
      })
    );

    deletedUsers += users.length;
    if (users.length < limit) break;
    offset += limit;
  }

  // 6 & 7. Delete all Stripe customers (test + prod)
  const stripeTestKey = process.env["STRIPE_TEST_SECRET_KEY"] ?? "";
  const stripeProdKey = process.env["STRIPE_PROD_SECRET_KEY"] ?? "";
  const [stripeTestDeleted, stripeProdDeleted] = await Promise.all([
    stripeTestKey ? deleteAllStripeCustomers(stripeTestKey) : Promise.resolve(0),
    stripeProdKey ? deleteAllStripeCustomers(stripeProdKey) : Promise.resolve(0),
  ]);

  logger.warn({ deletedUsers, stripeTestDeleted, stripeProdDeleted, prodBefore, prodAfter, devBefore, devAfter }, "Admin reset-app complete");
  res.json({
    status: "reset_complete",
    prod: { before: prodBefore, after: prodAfter, truncated: true },
    dev: { before: devBefore, after: devAfter, truncated: devTruncated },
    clerk: { deletedUsers },
    stripe: { testDeleted: stripeTestDeleted, prodDeleted: stripeProdDeleted },
  });
});

export default router;
