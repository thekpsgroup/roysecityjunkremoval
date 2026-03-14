# Full Site Audit (Verified Findings Only)

Date: 2026-03-14
Scope reviewed: all `*.html`, `assets/js/main.js`, `api/contact.js`, `sitemap.xml`, `robots.txt`, `vercel.json`.

## Method (no assumptions)
- Inspected source files directly.
- Ran scripted checks for:
  - missing canonical / OG essentials / title / meta description / H1 / viewport
  - repeated accessibility patterns
  - content similarity across location/service pages
- Attempted Lighthouse, but the environment does not have Chrome available.

## Findings

### SEO
1. **`quote.html` is intentionally blocked from indexing (`noindex, nofollow`)**.
   - Verified at `quote.html` robots meta.
   - Impact: this page cannot rank organically.

2. **`quote.html` is missing canonical URL**.
   - Head contains title/description/robots and partial OG tags, but no canonical link.

3. **`quote.html` is missing OG `og:image` and `og:url`**.
   - Only `og:title` and `og:description` are present.

4. **`404.html` is missing canonical and OG tags (`og:title`, `og:description`, `og:image`, `og:url`)**.
   - Verified by scripted meta check.

5. **Strong template similarity across dedicated service pages (risk of weak differentiation)**.
   - Scripted text similarity found multiple page pairs around 0.60+ sequence similarity (e.g., `appliance-removal-royse-city-tx.html` vs `construction-debris-removal-royse-city-tx.html` at 0.640).

### UI / UX / Accessibility
6. **Mobile menu toggle lacks `aria-controls` on template pages checked**.
   - Example in `index.html` and `404.html`: button has `aria-label` and `aria-expanded`, but no `aria-controls` target.

7. **`quote.html` and `privacy-policy.html` do not include a visible skip link (`.skip-link`) while most main pages do**.
   - This is inconsistent keyboard/screen-reader navigation behavior.

8. **Quote form honeypot early-return leaves submit button in loading/disabled state**.
   - In `quote.html` submit handler, button is set to "Sending..." and disabled before `if (data.website) { return; }`.
   - For any submission that sets `website`, the handler returns without restoring button state.

### Lead Generation / Conversion
9. **Evidence consistency conflict in social proof: “500+ happy customers” vs structured `reviewCount: 107`**.
   - Quote page claims 500+ customers.
   - Homepage structured data states reviewCount 107.

10. **Address consistency is split across customer-facing pages and system emails (Royse City office + Caddo Mills HQ)**.
   - Website presents both addresses in multiple places; API email templates default to Caddo Mills address.
   - Not necessarily wrong, but this should be made explicit consistently to avoid trust confusion.

11. **Microsoft Ads consent update function exists but no in-repo trigger was found**.
   - `quote.html` sets UET consent default to denied and defines `grantConsent()` “call from cookie banner”.
   - Repository search found no call site for `grantConsent()`.
   - Result: ad storage may remain denied unless an external banner invokes it.

### Visuals / Performance Signals
12. **`quote.html` uses PNG hero and before/after assets where WebP versions exist in repo**.
   - This may increase payload compared with WebP equivalents.

## Command outputs (key)

### A) Meta audit script summary (30 pages)
- Missing canonical + OG issues were detected for:
  - `404.html`
  - `quote.html`

### B) Accessibility pattern script summary
- `menu-toggle` missing `aria-controls` on template-driven pages.
- `privacy-policy.html` and `quote.html` missing skip-link pattern.

### C) Similarity script summary
- Highest page-text similarity examples:
  - 0.640 `appliance-removal-royse-city-tx.html` vs `construction-debris-removal-royse-city-tx.html`
  - 0.635 `furniture-removal-royse-city-tx.html` vs `garage-cleanout-royse-city-tx.html`

## Not run due environment limitation
- Lighthouse/PageSpeed metrics (no local Chrome available for lighthouse CLI run).
