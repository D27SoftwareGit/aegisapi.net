import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, appUsersTable, purchaseTokensTable } from "@workspace/db";
import { requireAuth } from "../middlewares/clerk.js";
import { encryptField, decryptField } from "../lib/crypto.js";
import { getStripe, getStripePublishableKey, SKUS, getSkuPriceCents, getAllPrices, type SkuKey } from "../lib/stripe.js";
import { logger } from "../lib/logger.js";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const checkoutLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

// GET /licensing/pricing
// Public — returns all current prices from env vars.
router.get("/pricing", async (_req, res) => {
  try {
    const prices = getAllPrices();
    const publishableKey = getStripePublishableKey();
    res.json({ prices, publishableKey });
  } catch (err) {
    logger.error({ err }, "Failed to get pricing");
    res.status(500).json({ error: "pricing_unavailable" });
  }
});

const checkoutBodySchema = z.object({
  sku: z.enum(["call_20", "call_50", "call_200", "call_400", "yearly"]),
  returnUrl: z.string().url(),
});

function isAllowedCheckoutReturnUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  return host === "aegisapi.net" || host === "www.aegisapi.net";
}

// POST /licensing/stripe/create-checkout-session
// Requires Clerk auth. Returns { clientSecret } for Stripe embedded checkout.
router.post(
  "/stripe/create-checkout-session",
  checkoutLimiter,
  requireAuth,
  async (req, res, next) => {
    const parsed = checkoutBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
      return;
    }

    const { sku, returnUrl } = parsed.data;
    if (!isAllowedCheckoutReturnUrl(returnUrl)) {
      res.status(400).json({ error: "invalid_return_url" });
      return;
    }
    const skuKey = sku as SkuKey;
    const skuDef = SKUS[skuKey];
    const clerkUserId = res.locals.clerkUserId as string;

    try {
      const stripe = getStripe();
      const priceCents = getSkuPriceCents(skuKey);

      // Get or create Stripe customer, caching encrypted in app_users
      const [appUser] = await db
        .select()
        .from(appUsersTable)
        .where(eq(appUsersTable.clerkUserId, clerkUserId))
        .limit(1);

      let stripeCustomerId: string | undefined;
      if (appUser?.stripeCustomerIdEncrypted) {
        stripeCustomerId = decryptField(appUser.stripeCustomerIdEncrypted);
      }

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          metadata: { clerkUserId },
        });
        stripeCustomerId = customer.id;
        if (appUser) {
          await db
            .update(appUsersTable)
            .set({ stripeCustomerIdEncrypted: encryptField(stripeCustomerId) })
            .where(eq(appUsersTable.clerkUserId, clerkUserId));
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        ui_mode: "embedded_page",
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: skuDef.name },
              unit_amount: priceCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          clerkUserId,
          sku,
          tier: skuDef.tier,
          callBalance: String(skuDef.calls),
          priceCents: String(priceCents),
        },
        payment_method_options: {
          card: {
            request_three_d_secure: "challenge",
          },
        },
        payment_intent_data: {
          metadata: { clerkUserId, sku },
        },
        consent_collection: {
          terms_of_service: "required",
        },
        custom_text: {
          terms_of_service_acceptance: {
            message:
              "I agree to the [AegisAPI Terms of Service](https://aegisapi.net/legal) and understand that all sales are final and non-refundable.",
          },
        },
        return_url: returnUrl,
      });

      res.json({ clientSecret: session.client_secret });
    } catch (err) {
      logger.error({ err, clerkUserId, sku }, "Failed to create checkout session");
      next(err);
    }
  },
);

// GET /licensing/stripe/session-status?session_id=xxx
// Requires Clerk auth. Returns the real outcome of a checkout session:
//   { status: "granted" | "refunded" | "pending" }
// "granted"  = purchase token exists → license will be (or was) issued
// "refunded" = session completed but no token (3DS failed, payment refunded)
// "pending"  = webhook hasn't fired yet (rare race condition, poll again)
router.get(
  "/stripe/session-status",
  requireAuth,
  async (req, res) => {
    const sessionId = req.query.session_id as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: "session_id required" });
      return;
    }

    const clerkUserId = res.locals.clerkUserId as string;

    try {
      const [token] = await db
        .select({ id: purchaseTokensTable.id })
        .from(purchaseTokensTable)
        .where(
          and(
            eq(purchaseTokensTable.stripeSessionId, sessionId),
            eq(purchaseTokensTable.clerkUserId, clerkUserId),
          ),
        )
        .limit(1);

      if (token) {
        res.json({ status: "granted" });
        return;
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent.latest_charge"],
      });
      if (session.metadata?.clerkUserId !== clerkUserId) {
        res.status(404).json({ error: "session_not_found" });
        return;
      }

      if (session.status !== "complete") {
        res.json({ status: "pending" });
        return;
      }

      const pi = session.payment_intent;
      let hasRefund = false;
      if (pi && typeof pi === "object") {
        const charge = pi.latest_charge;
        if (charge && typeof charge === "object") {
          hasRefund = charge.refunded === true;
        }
      }

      res.json({ status: hasRefund ? "refunded" : "pending" });
    } catch (err) {
      logger.error({ err, sessionId, clerkUserId }, "Failed to get session status");
      res.status(500).json({ error: "status_unavailable" });
    }
  },
);

export default router;
