import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// Ciphertext is AES-256-GCM (iv:tag:ciphertext, base64). Encrypt/decrypt only
// in artifacts/ageisapi-licensing with AEGISAPI_LICENSING_ENCRYPTION_KEY.

export const licenseBindingsTable = pgTable("licensing_license_bindings", {
  id: serial("id").primaryKey(),
  licenseKeyEncrypted: text("license_key_encrypted").notNull(),
  licenseKeyLookupHash: text("license_key_lookup_hash").notNull().unique(),
  machineIdEncrypted: text("machine_id_encrypted"),
  status: text("status").notNull().default("bound"),
  packCallBalance: integer("pack_call_balance").notNull().default(0),
  boundAt: timestamp("bound_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type LicenseBinding = typeof licenseBindingsTable.$inferSelect;

export const appUsersTable = pgTable("app_users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  stripeCustomerIdEncrypted: text("stripe_customer_id_encrypted"),
  revokedAt: timestamp("revoked_at"),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userLicensesTable = pgTable("licensing_user_licenses", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  licenseKeyLookupHash: text("license_key_lookup_hash").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseTokensTable = pgTable("purchase_tokens", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  token: text("token").notNull().unique(),
  tier: text("tier").notNull(),
  callBalance: integer("call_balance").notNull().default(0),
  stripeSessionId: text("stripe_session_id").unique(),
  pricePaidCents: integer("price_paid_cents").notNull().default(0),
  email: text("email").notNull().default(""),
  redeemed: boolean("redeemed").notNull().default(false),
  redeemedAt: timestamp("redeemed_at"),
  licenseExpiresAt: timestamp("license_expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AppUser = typeof appUsersTable.$inferSelect;
export type UserLicense = typeof userLicensesTable.$inferSelect;
export type PurchaseToken = typeof purchaseTokensTable.$inferSelect;
