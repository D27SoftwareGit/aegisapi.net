import { Resend } from "resend";
import { logger } from "./logger.js";

function requireResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set.");
  }
  return new Resend(key);
}

function fromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not set.");
  }
  return from;
}

export function assertEmailConfigured(): void {
  requireResend();
  fromAddress();
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function tierLabel(tier: string, callBalance: number): string {
  if (tier === "yearly") return "Yearly Unlimited (12 months)";
  return `Call Package — ${callBalance} API calls`;
}

export interface PurchaseEmailOpts {
  to: string;
  tier: string;
  callBalance: number;
  pricePaidCents: number;
  token: string;
  licenseExpiresAt: Date;
}

export async function sendPurchaseEmail(opts: PurchaseEmailOpts): Promise<void> {
  const resend = requireResend();
  const from = fromAddress();

  const { to, tier, callBalance, pricePaidCents, token, licenseExpiresAt } = opts;
  const expiryStr = licenseExpiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your AegisAPI Purchase</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e4e4e7; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 32px auto; padding: 0 16px; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 6px; color: #fafafa; }
    .sub { font-size: 14px; color: #a1a1aa; margin: 0 0 28px; }
    .section { margin-bottom: 24px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 6px; }
    .value { font-size: 14px; color: #e4e4e7; }
    .token-box { background: #09090b; border: 1px solid #3f3f46; border-radius: 8px; padding: 16px 20px; font-family: 'Courier New', monospace; font-size: 15px; color: #a78bfa; letter-spacing: 0.04em; word-break: break-all; margin-bottom: 24px; }
    .steps { background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { font-size: 13px; color: #a1a1aa; margin-bottom: 8px; line-height: 1.5; }
    .steps li:last-child { margin-bottom: 0; }
    .steps li strong { color: #e4e4e7; }
    .divider { border: none; border-top: 1px solid #27272a; margin: 24px 0; }
    .receipt-row { display: flex; justify-content: space-between; font-size: 13px; color: #a1a1aa; margin-bottom: 8px; }
    .receipt-row span:last-child { color: #e4e4e7; font-weight: 600; }
    .footer { margin-top: 24px; font-size: 12px; color: #52525b; text-align: center; line-height: 1.6; }
    .footer a { color: #71717a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <h1>Your AegisAPI purchase is complete</h1>
      <p class="sub">Thank you. Your purchase token is below. Sign in at aegisapi.net to generate your license key.</p>

      <div class="section">
        <div class="label">Purchase token</div>
        <div class="token-box">${token}</div>
        <div class="steps">
          <ol>
            <li>Sign in at <strong>aegisapi.net/account</strong></li>
            <li>Open <strong>AegisAPI</strong> → License tab → copy your <strong>Machine ID</strong></li>
            <li>On the site, paste that Machine ID and generate your license key</li>
            <li>Paste the signed key into AegisAPI → License → Activate</li>
          </ol>
        </div>
      </div>

      <hr class="divider">

      <div class="section">
        <div class="label">Receipt</div>
        <div class="receipt-row"><span>Product</span><span>${tierLabel(tier, callBalance)}</span></div>
        <div class="receipt-row"><span>Amount paid</span><span>${formatCents(pricePaidCents)}</span></div>
        <div class="receipt-row"><span>License valid until</span><span>${expiryStr}</span></div>
      </div>

      <hr class="divider">

      <p class="footer">
        You can also generate your key anytime from<br>
        <a href="https://aegisapi.net/account">aegisapi.net/account</a><br><br>
        Questions? Contact <a href="mailto:support@aegisapi.net">support@aegisapi.net</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Your AegisAPI purchase is complete.

Purchase token:
${token}

How to get your license key:
1. Sign in at https://aegisapi.net/account
2. Open AegisAPI → License tab → copy your Machine ID
3. On the site, paste that Machine ID and generate your license key
4. Paste the signed key into AegisAPI → License → Activate

Receipt:
  Product      : ${tierLabel(tier, callBalance)}
  Amount paid  : ${formatCents(pricePaidCents)}
  Valid until  : ${expiryStr}

You can also generate your key at: https://aegisapi.net/account

Questions? Email support@aegisapi.net
`.trim();

  const { data, error } = await resend.emails.send({
    from: `AegisAPI <${from}>`,
    to,
    subject: "Your AegisAPI purchase token & receipt",
    html,
    text,
  });
  if (error) {
    throw new Error(error.message ?? "Resend rejected the purchase email");
  }
  logger.info({ emailId: data?.id }, "Purchase email sent");
}
