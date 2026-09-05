# Product claims — from the Windows app (ingest this)

**Audience:** the website agent in `C:\aegisapi_www`.  
**Source:** desktop tree `C:\aegisapi` (Settings → About, license/trial code, `BACKLOG.md`).  
**When this and live `/legal` (or `AGENTS.md` in this repo) disagree, stop and tell Phillip.** Do not “fix” copy to sound friendlier. Do not patch `C:\aegisapi` from a website chat.

This file is **not** lawyer-final. Counsel owns the prose. This file is **what the shipped exe actually does**, so legal does not lie.

Refreshed from the app baseline that includes Chromium Send / Windows system proxy (`da723e3` lineage). Re-copy from the app agent if About/license/trial change.

---

## Two surfaces (do not mash them)

| | **Desktop app** (`AegisAPI.exe`) | **This website** |
|---|---|---|
| Vault / API keys / activity log | Local only. Never uploaded. | Never holds vault contents. |
| License **check** after a key is on the PC | Offline. Ed25519 verify + machine ID in-process. No AegisAPI license server. | Not involved. |
| **Buying / redeeming** a key | User pastes a key. App does not call `/licensing`. | Clerk, Stripe, `/licensing`, Machine ID posted at redeem. That **is** D27 seeing account + payment + machine ID. |
| User API calls (Send) | To the **user-typed** URL only. Windows system proxy + Windows cert store. | N/A |

**Forbidden one-liners**

- Do not write “AegisAPI never makes a network call” as if Send and this site do not exist. Say: the **installed app** does not phone home to AegisAPI; it does not check licenses on our servers; user-configured API calls leave the machine; the **website** is a separate browser product (account, pay, issue keys).
- Do not write “no license data is ever transmitted to our servers.” Redeem on `/account` transmits Machine ID (and the commerce stack already has email/payment). Desktop activation after that is local.
- Do not call the vault “end-to-end encryption” (no second party). Local encryption at rest. TLS only to the user-typed API URL.
- Do not claim we proxy or sync API keys.
- Do not ship macOS/Linux as available unless Phillip confirms binaries. The product release is **Windows NSIS only**.

**CISO sentence (desktop):**

> Secrets live in a local vault that only AegisAPI can open. We never upload it, sync it, or proxy your calls. The only time a key leaves this machine is when you send a request you configured.

---

## Publisher and origin

- Product: **AegisAPI**. Publisher: **D27 Software L.L.C.**
- App `openExternal` allowlist: origin **`https://aegisapi.net`** only (browser). Not an in-app updater.
- Store-expected paths: `/legal`, `/support`.
- Customer download: `/downloads/AegisAPI-Setup.exe` (Windows NSIS only). SHA-256 lives in `artifacts/ageisapi-website/src/data/download-manifest.json`. Do not commit the `.exe`.
- Contacts in site copy: `support@` `security@` `legal@` `sales@` `@aegisapi.net` — keep unless Phillip changes them.

---

## Seats and machines (must match About)

From Settings → About (verbatim intent):

- **One physical PC, one license.** Extra Windows logins are **not** extra seats.
- The key **cannot move** to another machine.
- **Remote desktop / terminal server is not a v1 SKU.**
- One live **vault owner** on that PC (`VaultOwnerSid`). Extra logins fail closed for the vault.
- Setup can **take over** (new owner SID): license and call pack stay with the PC; **trial remaining is kept, not reset**.
- Setup that **replaces bits** migrates or new-vaults **the wizard user** and **destroys every other vault** on the PC. Restore those from a **vault backup** (`.aegisbak`).
- **Uninstall** removes the app and every vault. It does **not** erase license / trial / call pack (erasing that would refresh the trial).
- Forgot-password **new vault** keeps the license.

Do not describe a floating “one machine at a time” seat you can bounce weekly unless the **licensing API** actually implements transfer — the **exe** binds the key to **this** PC’s hardware ID. Extra logins on that PC share the seat; they are not new licenses.

---

## Where data lives (desktop)

- **Vault, pepper, activity log:** `%APPDATA%\AegisAPI` of the **owner**. Ciphertext. One owner.
- **Activity log:** vault-class sibling; full call telemetry (URLs, header names and values, bodies) for in-app debug; cap **8 / 16 / 32 MB** (Settings → General). No decrypt CLI. Setup Update re-wraps vault **and** log together.
- **License / trial / call pack:** `%ProgramData%\AegisAPI` and `HKLM\SOFTWARE\AegisAPI`. **Not** the vault. Machine-wide.
- Wrapping key is per **app build**. Stolen vault file does not open in another build. The owner who can unlock can decrypt it. That is not “we cannot read your vault.”

---

## Trial and metering (desktop)

- One **20-call / 7-day** trial pool **per PC** (whichever ends first). Shared across Windows logins. Reinstall does **not** reset remaining trial (persist stays).
- Paid **call packs** and unlimited SKUs are issued as signed keys; the exe meters **calls**, not vault access. Expired / no license may block **Send**. It must **not** destroy vault unlock.
- Dollar amounts and pack sizes: **do not invent**. Site SKUs are env/`PRICE_*` and licensing code. Store listing text may still list old pack sizes (10/25/50/100) — if `/pricing` differs, pricing page + env win for commerce; do not “harmonize” by guessing. Tell Phillip.

---

## License key format (desktop will reject the rest)

Wire format: **`aegis1.<payload>.<signature>`** (Ed25519).  
**No `ageis1.` alias.** If this site still **issues** `ageis1.` keys, they **will not activate** in the app. Issuance must emit `aegis1.`. Do not add a typo alias in the exe; fix the signer.

Private signing key is **not** in the desktop repo. Website `DEV_LICENSE_PRIVATE_KEY` must match the public key baked in the exe or activation fails. Do not paste that private key into chat or into this file.

Deactivate in the app: removes the key from **this PC** (all logins). Vaults are not deleted.

---

## What the app can Send

Auth in the builder: none / bearer / basic / API key. **No** client-certificate (mTLS) picker. **No** request-signing with a PEM.  
Outbound HTTP uses **Chromium** in main with **Windows system proxy** (PAC/GPO) and the **Windows certificate store**. No proxy URL field in Settings.

---

## What never ships to customers

AegisAPIAdmin and `nuke.ps1` are internal. Not a download, not in NSIS, not “enterprise extras” on this site.

---

## About text (copy from the exe — lock legal to this)

Vault (one live owner on this PC): `%APPDATA%\AegisAPI` of the current owner — vault, pepper, activity log. Extra logins are not seats. Setup can take over (you become the owner; license and call pack stay with this PC; trial remaining is kept, not reset). Replacing bits destroys every other vault on this PC — restore those from a vault backup. Uninstall removes the app and every vault; it does not erase license / trial / call pack.

Setup Update re-wraps the vault and the activity log together (same password). The log is a vault-class sibling file: ciphertext on disk, full call telemetry for in-app debug, capped at 8 / 16 / 32 MB (Settings → General). There is no decrypt CLI. Wrapping key stops a stolen file from opening in another build; the owner who can unlock can decrypt it, same as the vault.

License / trial / call pack (this PC): `%ProgramData%\AegisAPI` and `HKLM\SOFTWARE\AegisAPI`. Not vault. Uninstall does not erase this (that would refresh the trial).

One physical PC, one license. Extra Windows logins are not extra seats. The key cannot move to another machine. Remote desktop is not a v1 SKU.
