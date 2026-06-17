# Running CBL

CBL (Creative Bowl Lab), TU/e Group 5. The deliverable is a **TouchDesigner installation**:
a Tibetan singing bowl and an Arduino pulse sensor drive live visuals (body aura, flowing
colour, cymatics, aurora, chakra colour), rendered from one webcam, **standalone, no
browser**. Final demo: 19 June 2026.

This file is the source of truth for run steps. `README.md` and `CLAUDE.md` link here.

---

## 1. Run the demo (TouchDesigner)

This is the actual installation. TD does the camera, MediaPipe pose/hands tracking, and all
visuals on the GPU. **No browser is needed or wanted.**

```powershell
& "C:\Program Files\Derivative\TouchDesigner\bin\TouchDesigner.exe" "C:\projects\CBL\td\cbl.toe"
```

Then **stand in front of the webcam.** That is the whole show.

### Enable the live bowl mic (do this every session)

The mic is intentionally **not** saved inside the `.toe`. Open the **Textport**
(`Alt+T`) and paste in the contents of `td/enable_bowl_audio.py`. This forces the
**linear spectrum** the pitch detector needs.

### Enable the live heartbeat (optional)

Paste the contents of `td/enable_pulse_serial.py` into the Textport.

- Arduino is on **COM7**.
- TD's `serialDAT` needs **both `dtr` AND `rts` enabled** (otherwise it reads 0 bytes).
- With **no sensor connected**, the visuals still breathe gently on a resting-heartbeat
  simulation — the demo works without the Arduino.

### Boot-hang reboot rule

If TD hangs on load (window is alive but frozen), **kill it and relaunch.** This is a
known intermittent wedge, not a real failure.

---

## 2. Live tuning knobs

Set these on operators inside the `/project1/cbl` network in TD.

### "See yourself through the aura"

The person shows through wherever the effects cover their body, while the glow stays full
strength around them.

| Operator | Parameter | Default | Effect |
|---|---|---|---|
| `reveal` | `uReveal` (vec0 value1) | `0.6` | How visible the person is. Higher = more you / fainter effects over you; lower = dreamier; `0` = original fully-covered look. |
| `aura_warp` | `uControl` vec3 value1 (`personFade`) | `0.7` | How much the radial aura dims over the body. |
| `aura_warp` | `uControl` vec3 value2 (`keepFloor`) | `0.15` | Minimum aura kept over the body. |
| `mask_blur` | `size` | `8` | Softness of the person-matte edge. |

### Bowl / figure tuning

For the Chladni figure and bowl response, see
`docs/touchdesigner-chladni-implementation-2026-06-09.md` (§11) — don't duplicate it here.

---

## 3. The fallback web app (DORMANT — not the demo)

> **This is a reversible fallback / dev tool only. It is NOT used at the demo.** It loads
> MediaPipe from a CDN, so unlike the offline TD demo it **needs internet.**

```powershell
cd legacy/web
npm install
npm run dev        # Vite on http://127.0.0.1:5173 + legacy Express API on :8787
npm test           # Vitest
npm run build      # tsc + vite build
```

No API key is needed.

---

## Where to read more

- **Architecture / start here:** `docs/touchdesigner-onesurface-2026-05-27.md`
- **Operator map for the TD network:** `td/README.md`
- **Running build log:** `docs/touchdesigner-resume-2026-05-27.md`
