<!-- markdownlint-disable MD022 MD029 MD032 -->

# Full Site Audit (Verified Findings Only)

Date: 2026-03-26
Scope reviewed: all `*.html`, `assets/js/main.js`, `api/contact.js`, `sitemap.xml`, `robots.txt`, `vercel.json`, and docs cleanup changes.

## Method (no assumptions)
- Inspected source files directly.
- Ran scripted checks for:
  - missing canonical / OG essentials / title / meta description / H1 / viewport
  - repeated accessibility patterns
  - content similarity across location/service pages
- Attempted Lighthouse, but the environment does not have Chrome available.

## Findings

### Resolved in this pass
1. `quote.html` now has canonical URL + complete OG/Twitter essentials (`og:url`, `og:image`, twitter tags).
2. `404.html` now has canonical URL.
3. `quote.html` and `privacy-policy.html` now include skip-link + `main` landmark pattern.
4. Shared mobile menu accessibility improved: `aria-controls` is now set at runtime in `assets/js/main.js`.
5. `quote.html` now uses WebP media variants instead of PNG references.
6. `quote.html` error handling now uses inline message UI instead of blocking alerts.
7. Contact form field constraints (`maxlength`, tel pattern/inputmode) now better align with API-side validation.
8. CSP in `vercel.json` updated to allow configured Meta Pixel script/connect endpoints.
9. Root clutter reduced: operational markdown moved into `docs/`; unused assets removed.
10. Quote-page trust proof wording aligned to reviewed proof baseline (`100+ verified reviews`).
11. Microsoft UET consent now has an in-page user action flow on `quote.html` (accept/decline with persisted choice + `grantConsent()` call on accept).

### SEO
1. **`quote.html` is intentionally blocked from indexing (`noindex, nofollow`)**.
   - Verified at `quote.html` robots meta.
   - Impact: this page cannot rank organically.
2. **Strong template similarity across dedicated service pages (risk of weak differentiation)**.
   - Scripted text similarity found multiple page pairs around 0.60+ sequence similarity (e.g., `appliance-removal-royse-city-tx.html` vs `construction-debris-removal-royse-city-tx.html` at 0.640).

### UI / UX / Accessibility
3. **Quote honeypot branch can still leave submit button disabled for bot-filled payloads**.
   - Low-impact user-facing issue (mostly affects spam interactions), but worth hardening by restoring button state before early return.

### Lead Generation / Conversion
4. **Address consistency is split across customer-facing pages and system emails (Royse City office + Caddo Mills HQ)**.
   - Website presents both addresses in multiple places; API email templates default to Caddo Mills address.
   - Not necessarily wrong, but this should be made explicit consistently to avoid trust confusion.

5. **UET consent now has a call site on `quote.html`**.
   - User-facing consent banner stores accept/decline choice in localStorage.
   - Accept action invokes `grantConsent()` to switch Microsoft ad storage to granted.

### Visuals / Performance Signals
7. **Primary site stylesheet is highly compressed and difficult to maintain directly (`assets/css/style.css`).**
   - Workflow now documented to edit `assets/css/style.src.css` and rebuild `style.css`.

## Command outputs (key)

### A) Meta audit script summary (30 pages)
- Core metadata coverage is now consistent across indexable pages.
- Remaining intentional exception: `quote.html` (`noindex, nofollow`) for paid traffic.

### B) Accessibility pattern script summary
- `skip-link` and `main` landmark now present on `quote.html` and `privacy-policy.html`.
- Shared menu toggle now gets `aria-controls` via `assets/js/main.js`.

### C) Similarity script summary
- Highest page-text similarity examples:
  - 0.640 `appliance-removal-royse-city-tx.html` vs `construction-debris-removal-royse-city-tx.html`
  - 0.635 `furniture-removal-royse-city-tx.html` vs `garage-cleanout-royse-city-tx.html`

## Not run due environment limitation
- Lighthouse/PageSpeed metrics (no local Chrome available for lighthouse CLI run).

## Recommended next actions
1. Keep trust-proof counts synchronized whenever schema `reviewCount` is updated.
2. Add a lightweight Lighthouse pass (mobile + desktop) once Chrome is available, then prioritize CLS/LCP opportunities.
3. Consider adding a shared header/footer template build step to reduce future cross-page drift.
