import crypto from "node:crypto";

const KEY_ENV = "AEGISAPI_LICENSING_ENCRYPTION_KEY";

function getKey(): Buffer {
  const hex = process.env[KEY_ENV];
  if (!hex) {
    throw new Error(`${KEY_ENV} must be set (32-byte hex string).`);
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error(`${KEY_ENV} must decode to exactly 32 bytes.`);
  }
  return key;
}

export function assertEncryptionKeyConfigured(): void {
  getKey();
}

// AES-256-GCM field-level encryption. Stored format: base64(iv):base64(tag):base64(ciphertext)
export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptField(stored: string): string {
  const key = getKey();
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted field.");
  }
  const [ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64!, "base64");
  const tag = Buffer.from(tagB64!, "base64");
  const ciphertext = Buffer.from(ciphertextB64!, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

// Deterministic lookup hash (HMAC-SHA256 with the same encryption key as the
// HMAC secret) so license keys can be looked up by equality without ever
// storing them in plaintext or in a reversible-only form.
export function lookupHash(value: string): string {
  const key = getKey();
  return crypto.createHmac("sha256", key).update(value, "utf8").digest("hex");
}
