# OlindaJohnsonSpeaks

Static one-page marketing site for Dr. Olinda Johnson, PhD, RNC, CNS, APN — a nurse educator who
delivers CEU-qualifying trainings for hospitals, universities, and professional nursing
organizations.

**Live site:** https://purple-ocean-065f4e30f.3.azurestaticapps.net
*(temporary Azure hostname — a custom domain will replace this once one is acquired)*

## Stack

Plain HTML/CSS/JS — no framework, no build step. See [`CLAUDE.md`](CLAUDE.md) for the full design
system, page structure, and constraints.

The booking form is backed by an Azure Function (`api/src/functions/booking.js`) that sends
submissions via Azure Communication Services Email.

## Hosting

Azure Static Web Apps (`swa-olindajohnson`, Free tier, resource group `rg-olindajohnson-prod`).
Deploys automatically via [`.github/workflows/azure-swa-deploy.yml`](.github/workflows/azure-swa-deploy.yml)
on every push to `main`.

The site previously ran on Netlify; that site has been decommissioned and deleted.

## Local preview

```bash
python3 -m http.server 8734
# then open http://localhost:8734
```

Port 8734 is configured in `.claude/launch.json`. Note: the booking form's `/api/booking` endpoint
only works when deployed to Azure — it will 404 against the local static server.

## Repo layout

See [`CLAUDE.md`](CLAUDE.md) for the full file inventory, design tokens, and page structure.
