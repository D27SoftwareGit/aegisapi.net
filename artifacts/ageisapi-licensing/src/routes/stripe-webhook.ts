import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, purchaseTokensTable } from "@workspace/db";
import { getStripe, getWebhookSecret, SKUS, type SkuKey } from "../lib/stripe.js";
import { sendPurchaseEmail } from "../lib/email.js";
import { logger } from "../lib/logger.js";
import type Stripe from "stripe";

const router: IRouter = Router();

// POST /licensing/stripe/webhook
// Must be mounted BEFORE express.json() — receives raw Buffer for sig verification.
router.post("/", async (req, res) => {
  const webhookSecret = getWebhookSecret();

  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    res.status(400).json({ error: "missing_signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature verification failed");
    res.status(400).json({ error: "invalid_signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutCompleted(session);
    } catch (err) {
      logger.error({ err, sessionId: session.id }, "Checkout webhook handler failed");
      res.status(500).json({ error: "webhook_failed" });
      return;
    }
  }

  res.json({ received: true });
});

function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    if ((current as { code?: string }).code === "23505") {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const meta = session.metadata ?? {};
  const clerkUserId = meta.clerkUserId;
  const sku = meta.sku as SkuKey | undefined;

  if (!clerkUserId || !sku || !SKUS[sku]) {
    logger.warn({ sessionId: session.id, meta }, "Checkout session missing required metadata — skipping");
    return;
  }

  // ── Idempotency guard ────────────────────────────────────────────────────────
  // Stripe may deliver the same webhook event more than once. Check for an
  // existing purchase token for this session before doing anything else.
  const [existing] = await db
    .select({ id: purchaseTokensTable.id })
    .from(purchaseTokensTable)
    .where(eq(purchaseTokensTable.stripeSessionId, session.id))
    .limit(1);

  if (existing) {
    logger.info({ sessionId: session.id }, "Duplicate webhook delivery — purchase token already exists, skipping");
    return;
  }

  // ── 3DS result verification ──────────────────────────────────────────────────
  // Expand the PaymentIntent + latest charge to check the 3DS authentication
  // outcome. Only "authenticated" gets a license. Any other result means the
  // charge completed without full 3DS authentication — we refund it immediately.
  const stripe = getStripe();

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;

  if (!paymentIntentId) {
    logger.error(
      { sessionId: session.id, clerkUserId, sku },
      "Checkout session has no payment_intent — license NOT granted",
    );
    return;
  }

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  const charge = pi.latest_charge as Stripe.Charge | null;
  const tds = charge?.payment_method_details?.card?.three_d_secure;

  logger.info({
    event: "checkout.session.completed",
    sessionId: session.id,
    piId: pi.id,
    tdsResult: tds?.result ?? "NULL — no 3DS performed",
    liabilityShifted: tds?.result === "authenticated",
  }, "3DS verification");

  if (!tds || tds.result !== "authenticated") {
    logger.error(
      { sessionId: session.id, paymentIntentId, tdsResult: tds?.result ?? null, clerkUserId, sku },
      "3DS authentication not completed — issuing refund, license NOT granted",
    );
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
      });
      logger.info({ paymentIntentId }, "Refund issued for non-authenticated 3DS charge");
    } catch (refundErr) {
      logger.error({ refundErr, paymentIntentId }, "Failed to issue refund for non-authenticated 3DS charge — manual action required");
    }
    return;
  }

  // ── Issue purchase token ─────────────────────────────────────────────────────
  const skuDef = SKUS[sku];
  const pricePaidCents = session.amount_total;
  if (pricePaidCents == null || pricePaidCents < 1) {
    logger.error(
      { sessionId: session.id, clerkUserId, sku, amountTotal: session.amount_total },
      "Checkout session has no amount_total — license NOT granted",
    );
    return;
  }

  const licenseExpiresAt = new Date();
  licenseExpiresAt.setMonth(licenseExpiresAt.getMonth() + 12);

  const token = randomUUID();

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    "";

  try {
    await db.insert(purchaseTokensTable).values({
      clerkUserId,
      token,
      tier: skuDef.tier,
      callBalance: skuDef.calls,
      stripeSessionId: session.id,
      pricePaidCents,
      email,
      licenseExpiresAt,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      logger.info({ sessionId: session.id }, "Duplicate webhook delivery — purchase token already exists, skipping");
      return;
    }
    logger.error({ err, clerkUserId, sku, sessionId: session.id }, "Failed to create purchase token");
    return;
  }

  logger.info({ clerkUserId, sku }, "Purchase token created");

  if (!email) {
    logger.error(
      { clerkUserId, sku, sessionId: session.id },
      "Checkout session has no customer email — token issued, mail skipped",
    );
    return;
  }

  try {
    await sendPurchaseEmail({
      to: email,
      tier: skuDef.tier,
      callBalance: skuDef.calls,
      pricePaidCents,
      token,
      licenseExpiresAt,
    });
  } catch (err) {
    logger.error(
      { err, clerkUserId, sku, sessionId: session.id },
      "Purchase token issued but purchase email failed",
    );
  }
}

export default router;
