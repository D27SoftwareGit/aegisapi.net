import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, licenseBindingsTable, licenseAuditLogTable } from "@workspace/db";
import { encryptField, decryptField, lookupHash } from "../lib/crypto";
import { publicLookupLimiter, licenseWriteLimiter } from "../middlewares/rateLimit";

const router: IRouter = Router();

const licenseKeySchema = z.string().min(8).max(256);
const machineIdSchema = z.string().min(8).max(256);

const claimBody = z.object({
  licenseKey: licenseKeySchema,
  machineId: machineIdSchema,
});

const releaseBody = z.object({
  licenseKey: licenseKeySchema,
  machineId: machineIdSchema,
});

const statusBody = z.object({
  licenseKey: licenseKeySchema,
});

async function logAudit(
  licenseKeyLookup: string,
  action: string,
  actor: string,
  detail?: string,
) {
  await db.insert(licenseAuditLogTable).values({
    licenseKeyLookupHash: licenseKeyLookup,
    action,
    actor,
    detail: detail ?? null,
  });
}

// POST /status — read-only lookup, whether a license is bound and its
// remaining pack-call balance. No machine identity required.
router.post("/status", publicLookupLimiter, async (req, res) => {
  const parsed = statusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }

  const keyHash = lookupHash(parsed.data.licenseKey);
  const [row] = await db
    .select()
    .from(licenseBindingsTable)
    .where(eq(licenseBindingsTable.licenseKeyLookupHash, keyHash))
    .limit(1);

  if (!row) {
    res.json({ status: "unbound", packCallBalance: 0 });
    return;
  }

  res.json({
    status: row.status,
    packCallBalance: row.packCallBalance,
  });
});

// POST /claim — bind a license to a machine. Server is authoritative: this
// must succeed and commit BEFORE the calling machine writes its local vault.
// Fails if the license is already bound to a different machine.
router.post("/claim", licenseWriteLimiter, async (req, res) => {
  const parsed = claimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }
  const { licenseKey, machineId } = parsed.data;
  const keyHash = lookupHash(licenseKey);

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(licenseBindingsTable)
      .where(eq(licenseBindingsTable.licenseKeyLookupHash, keyHash))
      .limit(1);

    if (!existing) {
      const [inserted] = await tx
        .insert(licenseBindingsTable)
        .values({
          licenseKeyEncrypted: encryptField(licenseKey),
          licenseKeyLookupHash: keyHash,
          machineIdEncrypted: encryptField(machineId),
          status: "bound",
          boundAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return { ok: true as const, row: inserted };
    }

    if (existing.status === "bound") {
      const boundMachineId = existing.machineIdEncrypted
        ? decryptField(existing.machineIdEncrypted)
        : null;
      if (boundMachineId === machineId) {
        // Idempotent re-claim from the same machine.
        return { ok: true as const, row: existing };
      }
      return { ok: false as const, reason: "already_bound_elsewhere" };
    }

    // status === "released" — free to (re)claim, balance carries forward.
    const [updated] = await tx
      .update(licenseBindingsTable)
      .set({
        machineIdEncrypted: encryptField(machineId),
        status: "bound",
        boundAt: new Date(),
        releasedAt: null,
        forceCleared: false,
        updatedAt: new Date(),
      })
      .where(eq(licenseBindingsTable.licenseKeyLookupHash, keyHash))
      .returning();
    return { ok: true as const, row: updated };
  });

  if (!result.ok) {
    res.status(409).json({ error: result.reason });
    return;
  }

  await logAudit(keyHash, "claim", "system", machineId);
  res.json({
    status: result.row.status,
    packCallBalance: result.row.packCallBalance,
  });
});

// POST /release — the currently bound machine gives up its binding. Server
// commits the release first; the migration tool must only wipe its local
// vault after receiving a 200 here. Pack-call balance is preserved for the
// next claim.
router.post("/release", licenseWriteLimiter, async (req, res) => {
  const parsed = releaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }
  const { licenseKey, machineId } = parsed.data;
  const keyHash = lookupHash(licenseKey);

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(licenseBindingsTable)
      .where(eq(licenseBindingsTable.licenseKeyLookupHash, keyHash))
      .limit(1);

    if (!existing || existing.status !== "bound") {
      return { ok: false as const, reason: "not_bound" };
    }

    const boundMachineId = existing.machineIdEncrypted
      ? decryptField(existing.machineIdEncrypted)
      : null;
    if (boundMachineId !== machineId) {
      return { ok: false as const, reason: "bound_to_different_machine" };
    }

    const [updated] = await tx
      .update(licenseBindingsTable)
      .set({
        status: "released",
        releasedAt: new Date(),
        machineIdEncrypted: null,
        updatedAt: new Date(),
      })
      .where(eq(licenseBindingsTable.licenseKeyLookupHash, keyHash))
      .returning();
    return { ok: true as const, row: updated };
  });

  if (!result.ok) {
    res.status(409).json({ error: result.reason });
    return;
  }

  await logAudit(keyHash, "release", "system", machineId);
  res.json({ status: result.row.status, packCallBalance: result.row.packCallBalance });
});

export default router;
