# aegisapi.net

Customer website and licensing API.

- `artifacts/ageisapi-website` — public site (info, legal, download, account)
- `artifacts/ageisapi-licensing` — checkout, webhook, redeem, key issuance
- `lib/db` — PostgreSQL / Drizzle

Copy `.env.example` into the host secret manager. Never commit secrets.

```sh
pnpm install --frozen-lockfile
pnpm run build
```
