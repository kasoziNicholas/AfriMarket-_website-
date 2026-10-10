# AfriMarket Equities (hardened)

## Run it
```bash
npm install
npm run build        # copies Chart.js + Font Awesome into public/vendor and builds public/styles.css
cp .env.example .env # edit values
npm start            # http://localhost:5000
```
Redis is optional: without `REDIS_URL` the server uses an in-memory cache.

## Layout
- `server.js` - Express API (`/api/companies`, `/api/exchanges`, `/api/health`) + static hosting, Helmet CSP, CORS allow-list, rate limit
- `data/*.json` - the datasets (replace with a licensed live feed in `SOURCES` inside `server.js`)
- `public/` - frontend (`index.html`, `app.js`, `terms.html`); no CDNs, no inline scripts/styles
- `src/input.css`, `tailwind.config.js` - Tailwind build (rerun `npm run build:css` after changing classes)

## Before going live
1. Fill the highlighted placeholders in `public/terms.html` and get it legally reviewed.
2. Replace the sample data with a licensed source and update `meta.dataStatus` / `meta.asOf`.
3. Serve over HTTPS, set `TRUST_PROXY`, and run `npm run audit` regularly.
