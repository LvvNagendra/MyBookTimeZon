# Free frontend deploy (GitHub Pages)

## Live URL (after first successful workflow)

**https://LvvNagendra.github.io/MyBookTimeZon/**

## What this deploy includes

| Item | Behavior |
|------|----------|
| UI (React) | Hosted on **GitHub Pages** (free) |
| API / DB | **Not** hosted — build uses `VITE_USE_MOCK=true` |
| Beauty Coach / AI hair / skin | **Smart offline / mock** tips (no API key in the browser) |
| Booking / dashboards | Demo data via mock client |

## Why the Gemini key is NOT in the frontend

1. Anything in a GitHub Pages JS bundle is **public** — anyone can steal the key.
2. Google Generative Language API **does not allow** normal browser CORS from `*.github.io`, so a key in the frontend still would not call Gemini reliably.
3. Live Gemini belongs on the **Spring Boot** server (`GEMINI_API_KEY` env), then set `VITE_API_BASE_URL` to that API host and rebuild Pages **without** mock.

## Enable Pages (one-time)

1. Repo → **Settings → Pages**
2. Source: **GitHub Actions**
3. Push to `main` (or run workflow **Deploy frontend to GitHub Pages** manually)

## Local Pages build smoke test

```bash
cd frontend
npm ci
npm run build:pages
npm run preview -- --base /MyBookTimeZon/
```

## Make Gemini truly live later (free backend)

1. Deploy Spring Boot on Render / Railway / Fly.io (free tier).
2. Set server env: `GEMINI_API_KEY`, `BEAUTY_COACH_LLM=GEMINI`, `GEMINI_MODEL=gemini-3.8-flash`
3. Rebuild Pages with:
   - `VITE_USE_MOCK=false`
   - `VITE_API_BASE_URL=https://your-api.onrender.com`
   - keep `VITE_BASE_PATH=/MyBookTimeZon/`

**Rotate** any key that was pasted in chat before putting it on a server.
