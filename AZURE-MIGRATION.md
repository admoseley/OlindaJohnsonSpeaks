# Azure Migration Playbook

**Netlify / Render / Resend / GitHub → Azure + GitHub**

A reusable, step-by-step guide for migrating Adrian Moseley's web properties to Azure.
Written 2026-07-14. Pilot site: **OlindaJohnsonSpeaks** (this repo). Flagship: **stampedpassports.com** (Phase 2 — only after the pilot proves the process).

---

## The target architecture (agreed design)

```
Internet ──► Front Door Standard (WAF + CDN edge cache)     [flagship only]
                 │
     ┌───────────┴────────────┐
     │                        │
Static Web Apps          Container Apps Environment
(each website,           (backend services from Render,
 global hosting,          serverless containers,
 free SSL)                ingress load-balances replicas 0→N)
     │                        │
     └──► Azure Functions + Storage Queue   (WTK pipeline, form intake)
              │
     Cosmos DB (free tier) · Blob Storage · Key Vault · ACS Email
              │
     Application Insights + Log Analytics (monitoring, alerts)
```

**Principles**

- **Serverless first.** No VMs, no OS patching, nothing to scale by hand. "Load balancer + two nodes" is delivered by Container Apps ingress across replicas and by SWA/Front Door's global edge — redundancy without node management.
- **Infrastructure as Code.** Everything provisioned by Bicep templates checked into the repo. The portal is for looking, not clicking-to-create.
- **No stored cloud secrets in GitHub.** GitHub Actions authenticates to Azure with OIDC federated credentials. App secrets live in Key Vault, read via managed identity.
- **Old host stays live until the Azure copy is verified.** DNS cutover is the last step and is instantly reversible.
- **Budget guardrails before the first resource.** Spending limit stays ON ($150 credit); budget alerts fire long before it's reached.

**Steady-state cost target**

| Service | Monthly |
|---|---|
| Static Web Apps — pilot + small sites (Free tier) | $0 |
| Static Web Apps Standard — stampedpassports.com | $9 |
| Front Door Standard + WAF (flagship, Phase 2) | ~$35 + pennies/GB |
| Functions (Flex Consumption) — WTK pipeline | ~$0 (free grant) |
| Cosmos DB (free tier: 1000 RU/s + 25 GB) | $0 |
| Storage (queues, blobs, tables) | < $1 |
| ACS Email (replaces Resend) | < $1 ($0.00025/email) |
| Key Vault | < $1 |
| App Insights / Log Analytics (≤5 GB) | ~$0 |
| Container Apps (Render services, scale-to-zero) | $0–15 |
| **Total** | **≈ $45–60 with Front Door; ≈ $10–25 without** |

Credit is $150/mo with the spending limit ON: if it's ever exhausted, Azure **suspends the subscription until the next cycle** — the budget alerts below exist so that never happens silently. Adrian will raise the limit to $250/300 once Netlify/Render/Resend are cancelled.

---

## Phase 0 — One-time Azure foundation (shared by every site)

Do this once. Every later site migration reuses it.

### 0.1 Confirm subscription context

```bash
az account show --output table
# Must show: Visual Studio Premium with MSDN (0f0593aa-8cca-4464-8c51-eef9cd914367), Enabled, IsDefault=True
```

Existing resource groups (`MoseleyVirtualDesktop`, `CheckVDICert`, `Admoseley_SendGrid_RG`, etc.) are pre-existing — leave them alone.

### 0.2 Budget alerts (before anything else)

Portal: **Cost Management + Billing → Budgets → Add** — monthly budget of $150 with alert thresholds at **33% ($50), 66% ($100), 93% ($140)**, alert email `adrian.moseley@gmail.com`.

CLI equivalent:

```bash
az consumption budget create \
  --budget-name monthly-guardrail \
  --amount 150 --time-grain Monthly \
  --start-date $(date +%Y-%m-01) --end-date 2030-01-01 \
  --category Cost
# Then add the three notification thresholds in the portal (simpler than the CLI JSON).
```

### 0.3 Naming conventions

| Thing | Pattern | Example |
|---|---|---|
| Shared resource group | `rg-shared-core` | — |
| Per-site resource group | `rg-<site>-prod` | `rg-olindajohnson-prod` |
| Static Web App | `swa-<site>` | `swa-olindajohnson` |
| Function App | `func-<site>-<purpose>` | `func-stamped-wtk` |
| Container App | `ca-<service>` | `ca-live-dashboard` |
| Key Vault | `kv-moseley-core` | (globally unique, ≤24 chars) |
| Cosmos DB account | `cosno-moseley-core` | (one free-tier account per subscription) |
| Storage account | `stmoseley<site>` | lowercase, no dashes |
| Region | `eastus2` everywhere unless a service requires otherwise | — |

### 0.4 GitHub OIDC federated credential (no stored cloud secrets)

One Entra app registration, one federated credential **per repo** you deploy from:

```bash
# 1. App registration + service principal (once)
az ad app create --display-name "github-actions-deployer"
APP_ID=$(az ad app list --display-name "github-actions-deployer" --query "[0].appId" -o tsv)
az ad sp create --id $APP_ID

# 2. Federated credential for a repo's main branch (repeat per repo)
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "gh-OlindaJohnsonSpeaks-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:admoseley/OlindaJohnsonSpeaks:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

# 3. Grant it Contributor on the site's resource group (least privilege — not the whole sub)
az role assignment create --assignee $APP_ID --role Contributor \
  --scope /subscriptions/0f0593aa-8cca-4464-8c51-eef9cd914367/resourceGroups/rg-olindajohnson-prod
```

In each repo, set three **non-secret** GitHub Actions variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` (`c56bf61c-badc-4f18-a821-5f360174f384`), `AZURE_SUBSCRIPTION_ID` (`0f0593aa-8cca-4464-8c51-eef9cd914367`). Workflows then log in with `azure/login@v2` — no password ever stored.

> Note: deploying **content** to a Static Web App uses that app's deployment token (a per-app secret; step 1.3). OIDC covers everything else — infra, Functions, Container Apps.

### 0.5 Shared core resources (Bicep)

Create an `azure/` folder in whichever repo is being migrated (templates are copy-paste reusable). Shared core, provisioned once:

```bash
az group create --name rg-shared-core --location eastus2
az deployment group create --resource-group rg-shared-core --template-file azure/shared-core.bicep
```

`azure/shared-core.bicep` should declare:

- **Key Vault** `kv-moseley-core` (RBAC mode) — all app secrets (ANTHROPIC_API_KEY, etc.)
- **Cosmos DB** `cosno-moseley-core` with `enableFreeTier: true` — database per site, containers for counters/archives/leads (only ONE free-tier account is allowed per subscription — this is it)
- **Log Analytics workspace + Application Insights** — every site/function points here
- **Azure Communication Services + Email Communication Service** — the Resend replacement

### 0.6 ACS Email sender domain (once per sending domain)

1. Portal: Email Communication Service → **Provision domain** → custom domain (e.g. `stampedpassports.com`).
2. Add the TXT (SPF + verification), DKIM, and DKIM2 CNAME records it gives you at your DNS host.
3. Add/keep a DMARC record: `_dmarc TXT "v=DMARC1; p=quarantine; rua=mailto:adrian.moseley@gmail.com"`.
4. Connect the domain to the ACS resource; note the connection string → Key Vault.

(An Azure-managed sender domain `*.azurecomm.net` is available instantly for testing — the equivalent of Resend's `onboarding@resend.dev` sandbox.)

**Gotcha:** `az communication list-key`'s connection string field is `primaryConnectionString`,
not `connectionString` — the latter silently resolves to nothing with `-o tsv` (no error). Get it
into a Static Web App setting in one step:

```bash
az staticwebapp appsettings set \
  --name swa-<site> --resource-group rg-<site>-prod \
  --setting-names "ACS_CONNECTION_STRING=$(az communication list-key --name acs-<site> --resource-group rg-<site>-prod --query primaryConnectionString -o tsv)"
```

Managed Functions (Free/Standard tier, no separate Function App resource) pick up new/changed app
settings only at the next deploy — after setting or changing one, trigger a redeploy
(`gh workflow run <workflow-name> --ref main`, or push a commit) before assuming it isn't working.

---

## Phase 1 — Pilot: OlindaJohnsonSpeaks (Netlify → Static Web Apps)

Plain static HTML (`index.html` at repo root, no build step). Simplest possible migration — the point is to prove the pipeline end-to-end.

### 1.1 Resource group + Static Web App

```bash
az group create --name rg-olindajohnson-prod --location eastus2
az staticwebapp create \
  --name swa-olindajohnson \
  --resource-group rg-olindajohnson-prod \
  --sku Free
```

Free tier: 100 GB bandwidth/mo, free SSL, 2 custom domains — plenty for this site. (Create it *without* linking GitHub here; the workflow in 1.3 handles deploys, which keeps the workflow file under our control.)

### 1.2 Free Azure hostname

The app immediately gets `https://<generated-name>.azurestaticapps.net` — free, SSL included, no custom domain required:

```bash
az staticwebapp show -n swa-olindajohnson -g rg-olindajohnson-prod --query defaultHostname -o tsv
```

This answers "can I host without my own domain?" — **yes**, and this URL is also the parallel-run test target.

### 1.3 GitHub Actions deploy workflow

Get the deployment token and store it as a repo secret:

```bash
az staticwebapp secrets list -n swa-olindajohnson -g rg-olindajohnson-prod --query properties.apiKey -o tsv
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo admoseley/OlindaJohnsonSpeaks
```

`.github/workflows/azure-swa-deploy.yml`:

```yaml
name: Deploy to Azure Static Web Apps
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: "/"        # plain HTML at repo root
          skip_app_build: true     # nothing to build
          output_location: ""
```

For an Astro/framework site (Phase 2), swap `app_location`/`skip_app_build` for the build config (`app_location: "/"`, `output_location: "dist"`, remove `skip_app_build`).

Add `staticwebapp.config.json` at the deploy root for headers/redirects (the Netlify `_headers`/`_redirects`/`netlify.toml` equivalent):

```json
{
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  }
}
```

### 1.4 Verify on the free hostname (Netlify still live)

- [ ] Site loads at `https://<name>.azurestaticapps.net`
- [ ] All pages, images, favicon, fonts load (check DevTools console/network for 404s)
- [ ] Meta/OG tags render (paste URL into a link-preview checker)
- [ ] GitHub Action is green; push a trivial change and confirm it deploys

### 1.5 Custom domain + DNS cutover (if this site has one)

1. Lower the domain's DNS TTL to 300s a day ahead.
2. `az staticwebapp hostname set -n swa-olindajohnson -g rg-olindajohnson-prod --hostname <domain>` — it gives a TXT validation record; add it.
3. Point DNS: apex → ALIAS/ANAME (or A if the host lacks ALIAS), `www` → CNAME to the `azurestaticapps.net` hostname.
4. Wait for SSL to issue (automatic), verify site on the real domain.
5. **Rollback if anything is wrong:** point DNS back at Netlify — it's still live.

### 1.6 Decommission the Netlify site

Only after several clean days: Netlify dashboard → site → Delete. Keep the GitHub repo — it's now the deployment source for Azure.

**Status: done.** Netlify site (`olindajohnsonspeaks`) deleted via `netlify sites:delete` on
2026-09-14, same day as cutover rather than after a waiting period — an explicit call, not the
recommended default above.

The booking form (Netlify Forms) was also replaced in this pilot, ahead of Phase 2's plan —
see the Phase 2.2 table below; same Azure Function + ACS Email pattern, done early because this
site's booking form was the only Netlify-proprietary piece blocking a clean cutover.

**Pilot exit criteria:** green Action deploys on push, site serves from Azure (free hostname or custom domain), rollback path understood. **Met.** Now the playbook is proven — next up is Phase 2 (stampedpassports.com), whenever that migration starts.

---

## Phase 2 — stampedpassports.com (the flagship)

Everything from Phase 1, plus the WTK pipeline (the only Netlify-proprietary code) and edge security. Netlify stays live in parallel throughout.

### 2.1 Hosting

- `rg-stamped-prod`, `swa-stamped` on **Standard** ($9/mo — SLA, bigger quotas).
- Same workflow as 1.3 but with the Astro build: `output_location: "dist"`, Node 20.

### 2.2 Port the WTK pipeline

| Today (Netlify/Resend) | Azure replacement |
|---|---|
| Netlify Forms + `submission-created.mts` event | HTTP-triggered **intake Function** `/api/wtk-submit` (validation + honeypot field; SWA Standard links the Function App natively under `/api`) |
| `wtk-gate.mts` per-IP counters in Netlify Blobs | **Cosmos DB** container `rate-counters` with TTL (auto-expiring day/week/month keys) |
| `wtk-pipeline-background.mts` (background function) | **Storage Queue** `wtk-jobs` + queue-triggered **worker Function** — retries and poison-queue built in; traffic bursts just queue instead of failing |
| Guide archive in Netlify Blobs | Cosmos `guides` container (or Blob Storage for the PDFs) |
| `wtk/lib/email.mjs` (Resend SDK) | **ACS Email SDK** (`@azure/communication-email`) — keep the same primary/fallback/receipt logic |
| HMAC between functions | No longer needed — the queue is internal; keep payload validation |
| Failure email per rate-limited submission | **Daily digest** email (fixes the viral-day inbox flood) |
| Env-var secrets | **Key Vault references** + managed identity; `ANTHROPIC_API_KEY` never sits in app settings. (The Netlify AI-Gateway `baseURL` pin in `wtk/lib/generate.mjs` becomes unnecessary — harmless to keep) |

Keep all existing business rules: 3/day per email, 25/day global, 90-day trip cap, owner-email bypass, fail-open live-data fetches.

### 2.3 Front Door Standard + WAF (the "viral day" and "bad actors" answer)

- Front Door Standard (~$35/mo) in front of the SWA origin.
- **Caching:** edge-cache `/_astro/*`, `/wtk-gallery/*`, images, fonts — the CDN for all images; origin barely sees viral read traffic.
- **WAF custom rules:** rate-limit rule (e.g. >100 req/min per IP → block 10 min), geo rules if abuse appears, block obvious bot UAs on `/api/*`.
- Lock the SWA to only accept Front Door traffic (SWA Standard supports this via the `X-Azure-FDID` header check in `staticwebapp.config.json` networking config).

### 2.4 Verification checklist before DNS cutover

- [ ] Full crawl of the Azure copy (every page, image, redirect) — compare against production
- [ ] WTK end-to-end: submit form → PDF arrives by email → receipt to Adrian → archive written → counters increment
- [ ] Rate limits enforced (4th same-email submission blocked; digest not per-failure emails)
- [ ] Contact + trip-inquiry forms deliver
- [ ] `sitemap.xml` + `robots.txt` served; resubmit sitemap in Google Search Console after cutover (GSC is a Domain property — survives the host change)
- [ ] App Insights availability test green; alert rule on availability + Function failures
- [ ] Front Door caching verified (`x-cache: TCP_HIT` on repeat image loads)
- [ ] Rollback = DNS back to Netlify (keep it live for 2+ weeks)

### 2.5 After cutover

Cancel Resend and the Netlify site; raise the Azure spending limit per the plan ($250/300).

---

## Phase 3 — Render → Azure

### 3.1 Static sites on Render → Static Web Apps

Repeat Phase 1 per site. Free tier each.

### 3.2 Node/API services → Container Apps (containers + serverless: yes)

Azure Container Apps runs your container serverlessly: scales 0→N, built-in HTTPS ingress that load-balances across replicas (this **is** the "load balancer + two nodes" — set `--min-replicas 2` for always-warm redundancy, or `0` for scale-to-zero economy).

```bash
# One environment hosts many apps
az containerapp env create --name cae-moseley --resource-group rg-shared-core \
  --location eastus2 --logs-workspace-id <log-analytics-id>

az containerapp create \
  --name ca-<service> --resource-group rg-<site>-prod \
  --environment cae-moseley \
  --image ghcr.io/admoseley/<service>:latest \
  --target-port 3000 --ingress external \
  --min-replicas 0 --max-replicas 4 \
  --cpu 0.25 --memory 0.5Gi
```

Per service: add a `Dockerfile` (Render services usually already have one or a start command to wrap), build + push to **GHCR** from GitHub Actions (free for public/private repos), then `az containerapp update --image ...` in the same workflow via OIDC login. Each app gets a free `https://ca-<service>.<env>.azurecontainerapps.io` hostname.

Cron jobs on Render → **Container Apps Jobs** (`az containerapp job create --trigger-type Schedule --cron-expression "0 6 * * *"`) or timer-triggered Functions.

### 3.3 Verify + cut over

Same pattern: free hostname first, parallel run, DNS cutover, watch App Insights, then delete the Render service.

---

## Phase 4 — Email cutover + decommission

1. Any remaining Resend senders → ACS Email (domain already verified in 0.6). Watch DMARC reports for a week.
2. Cancel in order, only after each replacement is verified: Netlify sites → Render services → Resend account.
3. Raise the Azure spending limit to $250/300 (portal → Subscription → spending limit) now that old subscriptions are cancelled.
4. Monthly: check Cost Management vs. the budget; prune anything unused.

---

## Appendix A — Per-site migration checklist (copy per site)

```
Site: ____________  Current host: ____________  Custom domain: Y/N
[ ] Resource group + SWA/Container App created (Bicep/CLI)
[ ] GitHub Actions workflow added, deploy green
[ ] Verified on free *.azurestaticapps.net / *.azurecontainerapps.io hostname
[ ] Forms / APIs / dynamic features ported and tested
[ ] Monitoring: App Insights wired, availability test + alert
[ ] DNS TTL lowered (day before)
[ ] Custom domain attached, SSL issued
[ ] DNS cutover done; site verified on real domain
[ ] Old host kept live ___ days → deleted
[ ] Search Console sitemap resubmitted (if indexed site)
```

## Appendix B — Free hostname reference

| Service | Free hostname | SSL |
|---|---|---|
| Static Web Apps | `<name>.azurestaticapps.net` | ✔ automatic |
| Container Apps | `<app>.<env-name>.<region>.azurecontainerapps.io` | ✔ automatic |
| Functions | `<app>.azurewebsites.net` | ✔ automatic |

No free *custom* domains exist on Azure — but nothing requires one: sites are fully hostable/testable/shareable on the free hostnames above.

## Appendix C — Rollback plan

Every phase keeps the old host live until verification passes. Rollback is always: **point DNS back at the old host** (5-minute TTL makes this near-instant). Nothing on the old platforms is deleted until the Azure replacement has run clean for days.

## Appendix D — Security posture gained

- WAF + per-IP rate limiting at the edge (Front Door) — bots stopped before they cost compute
- DDoS absorption via Microsoft's edge network
- Secrets in Key Vault with RBAC + audit log; managed identity everywhere; zero cloud credentials in GitHub (OIDC)
- Security headers via `staticwebapp.config.json` on every site
- App Insights anomaly alerts (traffic spikes, failure-rate spikes) to email
- Queue-based intake: abuse floods queue up and get rate-limited, never overwhelm compute or the Claude budget
- Budget alerts at $50/$100/$140 — cost attacks surface within hours, and the spending limit hard-caps worst case
