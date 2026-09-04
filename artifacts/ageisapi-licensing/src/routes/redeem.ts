import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, purchaseTokensTable, licenseBindingsTable, userLicensesTable } from "@workspace/db";
import { encryptField, lookupHash } from "../lib/crypto.js";
import { issueLicenseKey } from "../lib/license-issuer.js";
import { logger } from "../lib/logger.js";
import { getAuth } from "@clerk/express";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const redeemLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const redeemBodySchema = z.object({
  token: z.string().uuid("token must be a valid UUID"),
  machineId: z.string().min(8).max(512),
});

// POST /licensing/redeem
// Called by the website (authenticated user session).
// User provides their Machine ID (copied from the desktop app) and their
// purchase token. Server issues a signed, machine-bound license key and
// returns it so the user can paste it into the desktop app.
// The desktop app itself never contacts this endpoint — the airgap is preserved.
router.post("/redeem", redeemLimiter, async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const parsed = redeemBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }

  const { token, machineId } = parsed.data;

  try {
    const [purchase] = await db
      .select()
      .from(purchaseTokensTable)
      .where(
        and(
          eq(purchaseTokensTable.token, token),
          eq(purchaseTokensTable.clerkUserId, userId),
          eq(purchaseTokensTable.redeemed, false),
        ),
      )
      .limit(1);

    if (!purchase) {
      res.status(404).json({ error: "token_not_found_or_already_redeemed" });
      return;
    }

    if (new Date() > purchase.licenseExpiresAt) {
      res.status(410).json({ error: "token_expired" });
      return;
    }

    const tier = purchase.tier as "call_pack" | "yearly";

    const licenseKey = issueLicenseKey({
      machineId,
      tier,
      callBalance: purchase.callBalance,
      expiresAt: purchase.licenseExpiresAt,
    });

    const keyHash = lookupHash(licenseKey);

    await db.transaction(async (tx) => {
      await tx.insert(licenseBindingsTable).values({
        licenseKeyEncrypted: encryptField(licenseKey),
        licenseKeyLookupHash: keyHash,
        machineIdEncrypted: encryptField(machineId),
        status: "bound",
        packCallBalance: tier === "call_pack" ? purchase.callBalance : 0,
        boundAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.insert(userLicensesTable).values({
        clerkUserId: userId,
        licenseKeyLookupHash: keyHash,
      });

      await tx
        .update(purchaseTokensTable)
        .set({ redeemed: true, redeemedAt: new Date() })
        .where(eq(purchaseTokensTable.token, token));
    });

    logger.info(
      { token, clerkUserId: userId, tier },
      "Purchase token redeemed — license key issued",
    );

    res.json({ licenseKey });
  } catch (err) {
    logger.error({ err, token }, "Failed to redeem purchase token");
    next(err);
  }
});

export default router;
