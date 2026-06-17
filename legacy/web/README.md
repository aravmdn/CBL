# Web app (DORMANT secondary fallback)

This is the **React/Vite web app** — a kept-but-secondary dev tool and reversible fallback.
**It is NOT used at the 19 June demo.** The demo is TouchDesigner-only: [`../../td/cbl.toe`](../../td/cbl.toe).

It originally rendered the visuals on a 2D canvas and streamed pose to TouchDesigner over a
WebSocket; that browser→TD bridge is retired. Kept here only as a reversible fallback.

## Running the fallback

```powershell
npm install
npm run dev        # Vite on http://127.0.0.1:5173 + legacy Express API on :8787
npm test           # Vitest
npm run build      # tsc + Vite production build
```

No API key is needed. **It loads MediaPipe from a CDN, so it needs internet** — unlike the
offline TouchDesigner demo (whose MediaPipe models are bundled in `../../td/models/`).

## See also

- [`../../RUN.md`](../../RUN.md) — project runbook.
- [`../../docs/touchdesigner-onesurface-2026-05-27.md`](../../docs/touchdesigner-onesurface-2026-05-27.md) — the authoritative standalone (TD-primary) architecture; why the web app is secondary.
