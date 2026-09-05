import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, purchaseTokensTable, licenseBindingsTable, userLicensesTable } from "@workspace/db";
import { encryptField, lookupHash } from "../lib/crypto.js";
import { issueLicenseKey } from "../lib/license-issuer.js";
import { logger } from "../lib/logger.js";
import { requireAuth } from "../middlewares/clerk.js";
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

class RedeemHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
    this.name = "RedeemHttpError";
  }
}

// POST /licensing/redeem
// Called by the website (authenticated, non-revoked user). Row is locked
// until redeemed is set so two requests cannot mint two keys for one token.
// The desktop app itself never contacts this endpoint.
router.post("/redeem", redeemLimiter, requireAuth, async (req, res, next) => {
  const clerkUserId = res.locals.clerkUserId as string;

  const parsed = redeemBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }

  const { token, machineId } = parsed.data;

  try {
    const licenseKey = await db.transaction(async (tx) => {
      const [purchase] = await tx
        .select()
        .from(purchaseTokensTable)
        .where(
          and(
            eq(purchaseTokensTable.token, token),
            eq(purchaseTokensTable.clerkUserId, clerkUserId),
            eq(purchaseTokensTable.redeemed, false),
          ),
        )
        .for("update")
        .limit(1);

      if (!purchase) {
        throw new RedeemHttpError(404, "token_not_found_or_already_redeemed");
      }

      if (new Date() > purchase.licenseExpiresAt) {
        throw new RedeemHttpError(410, "token_expired");
      }

      const tier = purchase.tier as "call_pack" | "yearly";

      const key = issueLicenseKey({
        machineId,
        tier,
        callBalance: purchase.callBalance,
        expiresAt: purchase.licenseExpiresAt,
        purchaseToken: token,
      });

      const keyHash = lookupHash(key);

      await tx.insert(licenseBindingsTable).values({
        licenseKeyEncrypted: encryptField(key),
        licenseKeyLookupHash: keyHash,
        machineIdEncrypted: encryptField(machineId),
        status: "bound",
        packCallBalance: tier === "call_pack" ? purchase.callBalance : 0,
        boundAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.insert(userLicensesTable).values({
        clerkUserId,
        licenseKeyLookupHash: keyHash,
      });

      await tx
        .update(purchaseTokensTable)
        .set({ redeemed: true, redeemedAt: new Date() })
        .where(eq(purchaseTokensTable.token, token));

      return key;
    });

    logger.info({ clerkUserId }, "Purchase token redeemed — license key issued");
    res.json({ licenseKey });
  } catch (err) {
    if (err instanceof RedeemHttpError) {
      res.status(err.status).json({ error: err.code });
      return;
    }
    logger.error({ err, clerkUserId }, "Failed to redeem purchase token");
    next(err);
  }
});

export default router;
