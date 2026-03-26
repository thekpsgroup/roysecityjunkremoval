# roysecityjunkremoval

Royse City Junk Removal marketing site and API endpoint for quote/contact form submissions.

## Repository Layout

- `docs/` contains operational guides and audits.
- `assets/` contains static CSS, JS, and image files.
- `api/` contains serverless endpoints.

## Key Docs

- `docs/ADS_SETUP_GUIDE.md`
- `docs/FULL_SITE_AUDIT.md`
- `docs/GO_LIVE_CHECKLIST.md`

## CSS Workflow

- Edit source styles in `assets/css/style.src.css`.
- Generate production stylesheet `assets/css/style.css` from the source file.

Commands:

- `npm run css:build` - build and minify `style.css` from `style.src.css`.
- `npm run css:watch` - watch mode while editing styles.

`assets/css/style.css` is treated as a generated artifact.
