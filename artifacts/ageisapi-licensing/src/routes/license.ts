import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, licenseBindingsTable } from "@workspace/db";
import { lookupHash } from "../lib/crypto";
import { publicLookupLimiter } from "../middlewares/rateLimit";

const router: IRouter = Router();

const licenseKeySchema = z.string().min(8).max(256);

const statusBody = z.object({
  licenseKey: licenseKeySchema,
});

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

// Customer license transfer is not a product. Public claim/release stay 404.
router.post("/claim", (_req, res) => {
  res.status(404).json({ error: "not_supported" });
});

router.post("/release", (_req, res) => {
  res.status(404).json({ error: "not_supported" });
});

export default router;
