import { getAllPrices, getStripe, getStripePublishableKey, getWebhookSecret } from "./stripe.js";
import { assertEmailConfigured } from "./email.js";
import { assertSigningKeyConfigured } from "./license-issuer.js";
import { assertEncryptionKeyConfigured } from "./crypto.js";

function requireEnv(name: string): void {
  if (!process.env[name]) {
    throw new Error(`${name} is not set.`);
  }
}

/** Fail the process if a live secret is missing. No toy defaults. */
export function assertLiveConfig(): void {
  requireEnv("AEGISAPI_DB_URL");
  requireEnv("CLERK_SECRET_KEY");
  requireEnv("CLERK_WEBHOOK_SECRET");
  requireEnv("VITE_CLERK_PUBLISHABLE_KEY");
  requireEnv("LICENSE_PRIVATE_KEY");

  assertEncryptionKeyConfigured();
  assertSigningKeyConfigured();
  assertEmailConfigured();
  getStripe();
  getStripePublishableKey();
  getWebhookSecret();
  getAllPrices();
}
