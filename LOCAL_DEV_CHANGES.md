# Why these local-dev file changes exist

These 4 files were changed so the app can run on **macOS localhost** (port `3000`) with Vite.  
`server/db.ts` and `server/routes.ts` were **not** changed — use `.env` from `untitled.env` for Neon + keys.

**Open UI:** http://127.0.0.1:3000

---

## 1. `client/public/force-hide-errors.css`

**Problem:** Selector `[data-vite-dev-id]` was used to hide Vite error overlays.

**Why broken:** Vite also puts `data-vite-dev-id` on injected CSS `<style>` tags (Tailwind). Hiding/removing them made the page look like plain HTML (no styles).

**Change:** Removed `[data-vite-dev-id]` from the CSS hide list.

---

## 2. `client/public/block-error-modal.js`

**Problem:** Every 1 second, JS removed DOM nodes matching `[data-vite-dev-id]`.

**Why broken:** That deleted Vite’s CSS style tags → unstyled page (“sometimes”).

**Change:**
- Stop targeting `[data-vite-dev-id]`
- Never remove `<style>` tags

---

## 3. `client/index.html`

**Problem:** Service worker always registered, including on localhost.

**Why broken:** SW cache can serve old HTML/assets and cause flaky unstyled or stuck loading screens in Vite.

**Change:** On `localhost` / `127.0.0.1`, unregister SW and clear caches. Production still registers `/sw.js`.

---

## 4. `server/index.ts`

| Change | Why |
|--------|-----|
| `upgradeInsecureRequests: null` | Helmet enables this by default; on `http://` it upgrades CSS/JS to HTTPS and breaks local Vite. |
| `connectSrc` adds `http:`, `ws:`, `wss:` | Needed for local HTTP + Vite HMR websocket. |
| CORS `localhost:3000` / `127.0.0.1:3000` | Port 5000 is often taken by macOS AirPlay; app runs on 3000. |
| Rate limit `skip` in development | Vite HMR alone exceeds 1000 req / 15 min → “Too many requests…”. |
| `reusePort` only on Linux | On macOS, `reusePort: true` throws `ENOTSUP` and the server never starts. |

---

## How to start locally

```bash
# .env from untitled.env (Neon DATABASE_URL, OPENAI_API_KEY, etc.)
# set PORT=3000 and NODE_ENV=development
npm run dev
```

Then open **http://127.0.0.1:3000** (hard refresh if needed: Cmd+Shift+R).

### DBeaver (local dump, optional)

If using the restored dump (not Neon):

- Host: `127.0.0.1`
- Port: `5432`
- Database: `adaptalyfe`
- User / password: `adaptalyfe` / `adaptalyfe`
