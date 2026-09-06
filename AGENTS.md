# AegisAPI website — agent handoff

This repository is the customer site and license commerce for AegisAPI.
GitHub: `D27SoftwareGit/aegisapi-www` (private). Live origin: `https://aegisapi.net`

It is **not** the Windows product. Desktop app lives elsewhere (`C:\aegisapi`).
Do not patch the desktop app from this chat.

**Product / legal facts for the exe:** read **[CLAIMS.md](./CLAIMS.md)** first. That file is copied from the Windows app. If `Legal.tsx`, pricing copy, or this `AGENTS.md` disagrees with `CLAIMS.md` on vault, seats, phone-home, trial, or key prefix, **stop and tell Phillip**. Do not soften the app. Commerce (Clerk/Stripe/`/licensing`) is documented below; do not describe that as “the desktop phones home.”

**Phillip is the gatekeeper.** Senior engineer. Stay in the loop.

- Questions and “are we aligned?” are **read-only**. Do not create, edit, or delete files.
- Do not implement until he says to (“do it,” “implement that,” “make the change”).
- Before mutating: restate the problem, the likely cause, and the specific change. If there is more than one reasonable approach, **stop and wait**.
- Do not silently implement an alternative. Do not expand the radius.
- Do not commit unless he asks. **He does remote git.** The agent does not push.
- No background tasks, subagents, or side lookups. This chat only.
- Copyable pastes: one ` ```text ` fence, entire command, no commentary inside the block.

**Partner, not a spending machine.** Read the files that actually ship. Do not invent a second site, a CMS, or a “while I was there” redesign. A failed theory dies. If two approaches are live, stop and wait.

## Purpose of this site

1. Product information
2. Legal documentation
3. Software download
4. License key purchase (Clerk account + Stripe + machine-bound key issuance)

The site sells and issues keys in the browser. Vault secrets stay on the PC.
Do not claim the website has no backend. Do not claim the desktop app phones home
for vault data. Those are different surfaces.

## Layout

pnpm workspace. Node 20+, pnpm 10. Local folder: `C:\aegisapi_www`.

- `artifacts/ageisapi-website` — Vite/React public site (Wouter)
- `artifacts/ageisapi-licensing` — Express API mounted at `/licensing`
- `lib/db` — PostgreSQL / Drizzle
- `attached_assets` — images (aliased as `@assets`)

Folder names keep the spelling `ageis` (`artifacts/ageisapi-*`). Do not rename those unless that is the task.
Issued license keys must use the prefix `aegis1.` — the Windows app has no `ageis1.` alias.

Package filters:

```text
pnpm --filter @workspace/aegisapi-website run dev
pnpm --filter @workspace/aegisapi-licensing run dev
```

Website will not boot without `VITE_CLERK_PUBLISHABLE_KEY` and `BASE_PATH`.
Dev/preview also requires `PORT`.

## Customer routes (website)

- `/` — product
- `/security`
- `/pricing` — loads `GET /licensing/pricing`; checkout requires sign-in
- `/download` — Windows Setup only. URL, SHA-256, and build live in
  `artifacts/ageisapi-website/src/data/download-manifest.json`.
- `/docs`
- `/legal` — Terms, Privacy, License on one page
- `/support` — thin contact page (Store-expected)
- `/sign-in` / `/sign-up` — Clerk
- `/account` — purchases, redeem Machine ID → license key, copy issued key.
  No customer migration / transfer tab.

Stripe checkout Terms markdown points at `https://aegisapi.net/legal`.
There is no `/terms` route.

## Purchase and key flow (do not invent a second one)

1. User creates a Clerk account.
2. User buys a SKU on `/pricing` (embedded Stripe). SKUs in code: `call_20`,
   `call_50`, `call_200`, `call_400`, `yearly`. Enterprise is `mailto:sales@aegisapi.net` only.
3. Prices are env vars `PRICE_*_CENTS`. Do not invent dollar amounts in copy.
   If `/licensing/pricing` is down, the page shows "—" and Buy is disabled.
4. Stripe webhook `checkout.session.completed` requires a PaymentIntent and 3DS result
   `authenticated` or it refunds (when a PI exists) and does not grant a token.
5. Webhook writes a purchase token (UUID) then emails a receipt via Resend.
   Missing `RESEND_API_KEY` or `RESEND_FROM_EMAIL` refuses process start.
   Resend down after insert: token stands; `/account` is the redeem path.
6. On `/account` the user pastes Machine ID from the desktop License tab.
   `POST /licensing/redeem` (Clerk session, revoked/suspended denied) signs a key with
   `LICENSE_PRIVATE_KEY` (Ed25519 PKCS8, base64).
   Payload includes `purchaseToken`. Wire format: `aegis1.<payload>.<sig>`
7. User pastes that key into the desktop app. Redeem is website-only;
   the desktop app must not call this endpoint.

There is no `/licensing/admin` and no public license lookup or transfer API.
If they re-bind a purchase to a new Machine ID, stop and tell Phillip; that is
a transfer. Wipe Clerk, Stripe, or the DB from their dashboards or a script
you run — not from this process.

## Secrets (never commit, never paste into chat)

See `.env.example`. Root `.gitignore` ignores `.env` and `*.exe`. Do not stage env files.
Includes: Clerk, Stripe (`STRIPE_API_TARGET` is `prod` or `test`), `PRICE_*_CENTS`, Resend, `AEGISAPI_DB_URL`,
`AEGISAPI_LICENSING_ENCRYPTION_KEY` (32-byte hex AES-GCM), `LICENSE_PRIVATE_KEY`.

Field encryption at rest: AES-256-GCM. Lookup is HMAC-SHA256. Never log
plaintext license keys, purchase tokens, or machine IDs.

## Product claims — match this site, do not dilute

Publisher: **D27 Software L.L.C.** Product name: **AegisAPI**.
Contacts in copy: `support@`, `security@`, `legal@`, `sales@` — all `@aegisapi.net`.

True on this site:

- Vault is local; no cloud sync of secrets; AES-256-GCM at rest; Argon2 for passphrase.
- Trial copy: 20 API calls or 7 days, whichever first.
- Paid: call packs (12 months, carry-forward via maintenance in legal copy) and yearly unlimited.
- One active machine binding per purchased license in the self-serve SKUs.
- Website handles identity, payment, and key issuance. That is not “the vault left the machine.”

Do not write:

- “AegisAPI never makes a network call” as if the product has no network at all.
  The desktop’s API calls are user-typed URLs. The website talks to Clerk, Stripe, and `/licensing`.
- End-to-end encryption (no second party on the vault).
- That we proxy API keys.
- macOS/Linux as shipping platforms unless Phillip confirms builds exist.
  `/download` is Windows only.
- New SKUs, seats, RDS, or Enterprise self-serve checkout.

## What this repo is not

Not the NSIS/Setup **source** tree, not `AegisAPI.exe` from the app repo, not Admin/nuke as customer downloads.
The **signed** Windows Setup may be dropped at
`artifacts/ageisapi-website/public/downloads/AegisAPI-Setup.exe` (gitignored).
Commit the SHA-256 in `src/data/download-manifest.json` after the file is posted.
Do not put the installer in the desktop git repo.

Do not bake host-provider URLs into legal copy as if they were the company.

## How to change things

Smallest change that matches the agreed purpose. Restate problem, cause, and
files before mutating. If two approaches are reasonable, stop and wait.
Do not rename `ageisapi-*` folders unless that is the task. Do not issue `ageis1.` keys.
Do not expand shadcn/ui, add a CMS, or restyle the whole site.

After edits: what changed, what did not, how to verify
(browser: product, legal, download, purchase/redeem).
