import { createPrivateKey, sign as cryptoSign } from "node:crypto";

export interface IssueLicenseKeyOpts {
  machineId: string;
  tier: "call_pack" | "yearly";
  callBalance: number;
  expiresAt: Date;
}

export function issueLicenseKey(opts: IssueLicenseKeyOpts): string {
  const privKeyB64 = process.env.DEV_LICENSE_PRIVATE_KEY;
  if (!privKeyB64) {
    throw new Error("DEV_LICENSE_PRIVATE_KEY environment variable is not set.");
  }

  let privateKey;
  try {
    privateKey = createPrivateKey({
      key: Buffer.from(privKeyB64, "base64"),
      format: "der",
      type: "pkcs8",
    });
  } catch (e) {
    throw new Error(
      `Failed to parse DEV_LICENSE_PRIVATE_KEY: ${(e as Error).message}`,
    );
  }

  const now = new Date();
  const payload = {
    v: 1,
    machineId: opts.machineId,
    tier: opts.tier,
    callBalance: opts.callBalance,
    issuedAt: now.toISOString(),
    expiresAt: opts.expiresAt.toISOString(),
  };

  const payloadBytes = Buffer.from(JSON.stringify(payload), "utf8");
  const signature = cryptoSign(null, payloadBytes, privateKey);

  return `aegis1.${payloadBytes.toString("base64url")}.${signature.toString("base64url")}`;
}
