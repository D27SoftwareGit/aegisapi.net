import { Resend } from "resend";
import { logger } from "./logger.js";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.warn("RESEND_API_KEY not set — email delivery disabled");
    return null;
  }
  return new Resend(key);
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
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
  const resend = getResend();
  if (!resend) return;

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
      <h1>Your AegisAPI license is ready</h1>
      <p class="sub">Thank you for your purchase. Your activation token is below.</p>

      <div class="section">
        <div class="label">Activation token</div>
        <div class="token-box">${token}</div>
        <div class="steps">
          <ol>
            <li>Open <strong>AegisAPI</strong> on your computer</li>
            <li>Go to the <strong>License</strong> tab</li>
            <li>Click <strong>"Activate purchase"</strong> and enter the token above</li>
            <li>Your signed license key will be generated and saved automatically</li>
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
        You can also retrieve your activation token at any time from<br>
        <a href="https://aegisapi.net/account">aegisapi.net/account</a> → My Licenses<br><br>
        Questions? Contact <a href="mailto:support@aegisapi.net">support@aegisapi.net</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Your AegisAPI license is ready!

Activation token:
${token}

How to activate:
1. Open AegisAPI on your computer
2. Go to the License tab
3. Click "Activate purchase" and enter the token above
4. Your signed license key will be generated and saved automatically

Receipt:
  Product      : ${tierLabel(tier, callBalance)}
  Amount paid  : ${formatCents(pricePaidCents)}
  Valid until  : ${expiryStr}

You can also retrieve your token at: https://aegisapi.net/account

Questions? Email support@aegisapi.net
`.trim();

  try {
    const result = await resend.emails.send({
      from: `AegisAPI <${getFromEmail()}>`,
      to,
      subject: "Your AegisAPI activation token & receipt",
      html,
      text,
    });
    logger.info({ to, result }, "Purchase email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send purchase email");
  }
}
