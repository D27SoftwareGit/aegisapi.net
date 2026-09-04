import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// AgeisAPI licensing service tables live in the "licensing" schema so they
// stay logically isolated from other apps sharing this Postgres instance.
// licenseKeyEncrypted / machineIdEncrypted store AES-256-GCM ciphertext
// (iv:tag:ciphertext, base64), never plaintext. Encryption/decryption happens
// only inside artifacts/ageisapi-licensing using its own dedicated key.

export const licenseBindingsTable = pgTable("licensing_license_bindings", {
  id: serial("id").primaryKey(),
  licenseKeyEncrypted: text("license_key_encrypted").notNull(),
  licenseKeyLookupHash: text("license_key_lookup_hash").notNull().unique(),
  machineIdEncrypted: text("machine_id_encrypted"),
  status: text("status").notNull().default("unbound"), // unbound | bound | released
  packCallBalance: integer("pack_call_balance").notNull().default(0),
  boundAt: timestamp("bound_at"),
  releasedAt: timestamp("released_at"),
  forceCleared: boolean("force_cleared").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const licenseAuditLogTable = pgTable("licensing_audit_log", {
  id: serial("id").primaryKey(),
  licenseKeyLookupHash: text("license_key_lookup_hash").notNull(),
  action: text("action").notNull(), // claim | release | force_clear | admin_reset
  actor: text("actor").notNull().default("system"), // system | admin
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LicenseBinding = typeof licenseBindingsTable.$inferSelect;
export type LicenseAuditLogEntry = typeof licenseAuditLogTable.$inferSelect;

// Account / identity tables ─────────────────────────────────────────────────
// app_users  — one row per Clerk user. Created on first authenticated request.
// licensing_user_licenses — links a Clerk user to a license key they own.

export const appUsersTable = pgTable("app_users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  stripeCustomerIdEncrypted: text("stripe_customer_id_encrypted"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
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
