import Stripe from "stripe";

type StripeApiTarget = "prod" | "test";

function stripeApiTarget(): StripeApiTarget {
  const raw = process.env.STRIPE_API_TARGET;
  if (raw === "prod" || raw === "test") {
    return raw;
  }
  throw new Error(
    'STRIPE_API_TARGET must be exactly "prod" or "test".',
  );
}

export function getStripe(): Stripe {
  const target = stripeApiTarget();
  const key =
    target === "prod"
      ? process.env.STRIPE_PROD_SECRET_KEY
      : process.env.STRIPE_TEST_SECRET_KEY;
  if (!key) {
    throw new Error(
      `Stripe ${target} secret key not configured. ` +
        `Set ${target === "prod" ? "STRIPE_PROD_SECRET_KEY" : "STRIPE_TEST_SECRET_KEY"}.`,
    );
  }
  return new Stripe(key);
}

export function getStripePublishableKey(): string {
  const target = stripeApiTarget();
  const key =
    target === "prod"
      ? process.env.STRIPE_PROD_PUBLISHABLE_KEY
      : process.env.STRIPE_TEST_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      `Stripe ${target} publishable key not configured.`,
    );
  }
  return key;
}

export function getWebhookSecret(): string {
  const target = stripeApiTarget();
  const key =
    target === "prod"
      ? process.env.STRIPE_PROD_WEBHOOK_SECRET
      : process.env.STRIPE_TEST_WEBHOOK_SECRET;
  if (!key) {
    throw new Error(
      `Stripe ${target} webhook secret not configured. ` +
        `Set ${target === "prod" ? "STRIPE_PROD_WEBHOOK_SECRET" : "STRIPE_TEST_WEBHOOK_SECRET"}.`,
    );
  }
  return key;
}

export const SKUS = {
  call_20: {
    calls: 20,
    tier: "call_pack" as const,
    name: "AegisAPI — 20 API Calls",
    priceEnvKey: "PRICE_CALL_20_CENTS",
  },
  call_50: {
    calls: 50,
    tier: "call_pack" as const,
    name: "AegisAPI — 50 API Calls",
    priceEnvKey: "PRICE_CALL_50_CENTS",
  },
  call_200: {
    calls: 200,
    tier: "call_pack" as const,
    name: "AegisAPI — 200 API Calls",
    priceEnvKey: "PRICE_CALL_200_CENTS",
  },
  call_400: {
    calls: 400,
    tier: "call_pack" as const,
    name: "AegisAPI — 400 API Calls",
    priceEnvKey: "PRICE_CALL_400_CENTS",
  },
  yearly: {
    calls: -1,
    tier: "yearly" as const,
    name: "AegisAPI — Yearly Unlimited",
    priceEnvKey: "PRICE_YEARLY_CENTS",
  },
} as const;

export type SkuKey = keyof typeof SKUS;

export function getSkuPriceCents(skuKey: SkuKey): number {
  const sku = SKUS[skuKey];
  const raw = process.env[sku.priceEnvKey];
  const cents = raw ? parseInt(raw, 10) : NaN;
  if (isNaN(cents) || cents < 1) {
    throw new Error(`Env var ${sku.priceEnvKey} not set or invalid.`);
  }
  return cents;
}

export function getAllPrices(): Record<
  SkuKey,
  { name: string; calls: number; tier: string; cents: number; dollars: string }
> {
  const result: Record<string, unknown> = {};
  for (const [key, sku] of Object.entries(SKUS) as [SkuKey, (typeof SKUS)[SkuKey]][]) {
    const cents = getSkuPriceCents(key);
    result[key] = {
      name: sku.name,
      calls: sku.calls,
      tier: sku.tier,
      cents,
      dollars: (cents / 100).toFixed(2),
    };
  }
  return result as ReturnType<typeof getAllPrices>;
}
