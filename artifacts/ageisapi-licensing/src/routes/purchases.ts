import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, purchaseTokensTable } from "@workspace/db";
import { requireAuth } from "../middlewares/clerk.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// GET /account/purchases
// Returns all purchase tokens for the authenticated user.
router.get("/account/purchases", requireAuth, async (_req, res, next) => {
  try {
    const clerkUserId = res.locals.clerkUserId as string;

    const rows = await db
      .select({
        id: purchaseTokensTable.id,
        token: purchaseTokensTable.token,
        tier: purchaseTokensTable.tier,
        callBalance: purchaseTokensTable.callBalance,
        pricePaidCents: purchaseTokensTable.pricePaidCents,
        redeemed: purchaseTokensTable.redeemed,
        redeemedAt: purchaseTokensTable.redeemedAt,
        licenseExpiresAt: purchaseTokensTable.licenseExpiresAt,
        createdAt: purchaseTokensTable.createdAt,
      })
      .from(purchaseTokensTable)
      .where(eq(purchaseTokensTable.clerkUserId, clerkUserId))
      .orderBy(desc(purchaseTokensTable.createdAt));

    const purchases = rows.map((row) => ({
      id: row.id,
      token: row.token,
      tier: row.tier,
      callBalance: row.callBalance,
      pricePaidCents: row.pricePaidCents,
      priceDollars: (row.pricePaidCents / 100).toFixed(2),
      redeemed: row.redeemed,
      redeemedAt: row.redeemedAt,
      licenseExpiresAt: row.licenseExpiresAt,
      purchasedAt: row.createdAt,
    }));

    res.json({ purchases });
  } catch (err) {
    logger.error({ err }, "Failed to load purchases");
    next(err);
  }
});

export default router;
