# TODO: re-point the booking form onto the shared platform

Part of the shared-email roadmap: https://github.com/admoseley/azure-email-platform/blob/main/docs/ROADMAP.md (see `docs/ADD-A-SITE.md` there for the full procedure).

**Rules (from the platform):** this site gets its **own** Communication Service, linked only to its own sending domain. The sender address is fixed **server-side** — a form may supply a message and a Reply-To (the visitor), never a From. Authenticate with managed identity, not a connection string, where the host allows it.

- **Today (platform issue #6):** `api/src/functions/booking.js` already sends via ACS, but through a **standalone** Communication Service using `ACS_CONNECTION_STRING` and an Azure-managed sender (`BOOKING_FROM_EMAIL`). The form is `#booking-form` in `index.html` (~line 1442).
- **Sends as:** `@olindajohnsonspeaks.com` (root; no MX/SPF today). Root must first be added to `approved_root_domains` in azure-email-platform (its own reviewed change), then registered.
- **Steps**
  - [ ] Approve + register `olindajohnsonspeaks.com` in azure-email-platform; decide the sender (booking@? — note the page advertises `Booking@OlindaJohnsonSpeaks.com` as a *mailbox*; check whether mail is ever set up there before publishing a `-all` SPF).
  - [ ] Who controls the domain's DNS? Publish records, verify.
  - [ ] Site repo: Communication Service linked to that domain only (`email_service_domain_id = domain_ids[...]`), sender role for the Function's managed identity, diagnostic setting to the shared workspace.
  - [ ] `booking.js`: swap `ACS_CONNECTION_STRING` for `DefaultAzureCredential` + endpoint; keep From server-side. Check the Function host supports managed identity (SWA managed API does not).
  - [ ] Retire the old connection string and standalone resource; update `CLAUDE.md` and `AZURE-MIGRATION.md`.
