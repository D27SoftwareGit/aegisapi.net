# aegisapi.net

Authoritative source for the AegisAPI customer website hosted on Replit.

## Included services

- `artifacts/ageisapi-website` — React/Vite public website
- `artifacts/ageisapi-licensing` — customer, checkout, webhook, and licensing API
- `lib/db` — PostgreSQL/Drizzle database package
- `lib/api-client-react`, `lib/api-zod`, `lib/api-spec` — shared API client, validation, and OpenAPI source

## Requirements

- Node.js 20 or newer
- pnpm 10
- PostgreSQL
- Clerk, Stripe, and Resend configuration

Copy `.env.example` to the appropriate secure environment configuration and supply values through Replit Secrets or the deployment platform's secret manager. Never commit secret values.

## Install and verify

```sh
pnpm install --frozen-lockfile
pnpm run build
```

## Run on Replit

Public website:
For the current root-mounted website, set `BASE_PATH=/`.


```sh
pnpm --filter @workspace/aegisapi-website run dev
```

Licensing API:

```sh
pnpm --filter @workspace/aegisapi-licensing run dev
```

The public website is served at `/`. The licensing API is mounted at `/licensing` in the current Replit hosting configuration.
