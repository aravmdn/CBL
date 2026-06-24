# Teammate TouchDesigner file — architect review & merge plan (2026-06-11)

A teammate (EngineeringArt discipline — prior MATLAB contributor, see
`EngineeringArt CBL/`) submitted their own TouchDesigner project,
**`EngineeringArt_TouchDesign.10.toe`**. The ask: *"be the architect, merge what's
good, drop the rest, document it."*

This doc is the architectural decision: it preserves the file, explains **why an
automated merge isn't possible**, and gives a concrete, low-risk procedure to merge
the good parts **inside TouchDesigner** while keeping the one-surface demo intact.

---

## 0. Where the file lives now

| | |
|---|---|
| Repo path | `td/incoming/EngineeringArt_TouchDesign_2026-06-11.toe` |
| Original name | `EngineeringArt_TouchDesign.10.toe` (the `.10` is TD's auto-increment suffix) |
| Size | 16 KB |
| md5 | `e3bc8e4090365fa85b943f0b3d1626ac` |
| Received | 2026-06-11 |

It is committed (under `td/incoming/`, deliberately outside the
`td/*.[0-9]*.toe` ignore rule) so the teammate's work is version-controlled and
never lost, and so the merge can be done/redone from a known-good source.

> **Do not** rename it into `td/` as `cbl.*.toe` — those are TD auto-backups and are
> git-ignored. Keep submitted artifacts under `td/incoming/`.

---

## 1. Why this can't be merged automatically (the honest constraint)

A `.toe` is **TouchDesigner's proprietary, compressed/encrypted binary container**.
Confirmed on 2026-06-11:

- The file magic is `31 30 00 00` (`"10"` + version) — same as our own `td/cbl.toe`.
- Everything after the header is opaque. `strings` over both the teammate file **and
  our own committed `cbl.toe`** returns **zero** readable operator names, paths, or
  shader source. There is no tar/zip/zlib member to walk.
- There is **no TouchDesigner on the build machine** (it's a Linux container; TD is a
  Windows/macOS GUI app), so the node graph cannot be opened, diffed, or recombined
  off-tool.

**Consequence:** no tool in this environment can tell you *which operators the
teammate built*, let alone splice them into `cbl.toe`. TD networks are merged the way
TD users always merge them — **by opening both files in TouchDesigner and selectively
copying operators across.** This doc makes that a 15-minute, decision-guided task
instead of guesswork.

### Two ways to get a real, operator-level merge done by Claude
If you want Claude (not just yourself) to make the per-operator keep/drop calls, give it
*eyes into the network*, then it's straightforward:

1. **Live, via the TD MCP (best).** Open the teammate file in TD, drop in
   `TouchDesignerAPI.tox`, set port `44444`, run `/touchdesigner` in Claude Code
   (see `docs/touchdesigner-mcp.md`). Claude can then enumerate the teammate's
   operators, read their parameters/shaders, and copy the good ones into `cbl.toe`
   programmatically.
2. **Static, cheap.** In TD, open the teammate file and either (a) screenshot the
   network at each level into `docs/td-screenshots/`, or (b) select-all →
   *Edit > Copy*, paste into a text editor — TD copies operators as **`tscript` text**
   you can save as `.txt` and commit. Either gives Claude a readable inventory to
   review against the checklist in §3.

Until one of those exists, the decisions below are made **by class of contribution**
(what's worth keeping vs. what fights our architecture), which is the part that doesn't
need to see individual nodes.

---

## 2. The bar everything merges against: the one-surface demo

The authoritative architecture is `docs/touchdesigner-onesurface-2026-05-27.md`. The
19 June demo is **one TD file, one webcam, no browser, fully offline**, compositing:

```
void → camera → +flow(cymatics+aurora+orbs feedback) → +aura → +fingertip orbs → master_out
```

with `pose_mp` (TD-native MediaPipe), `audio_out` (bowl → Solfeggio chakra), and
`heartbeat` (LFO, now optionally driven by the live Arduino on COM7). Anything merged in
must **not** break offline-safety, must **not** open a browser or a second camera, and
must **not** duplicate an operator we already have a tuned version of.

`cbl.toe` is the integration target. The teammate file is a **source of parts**, not a
replacement — we never overwrite `cbl.toe` with it.

---

## 3. Decision framework — keep / adapt / drop

Because the merge is selective and done in-tool, here is the architect's rule set. As
you walk the teammate's network in TD, sort each operator into one of these buckets:

### ✅ KEEP / ADAPT — likely worth grafting
- **A genuinely new visual layer** we don't have (e.g. a feedback/displacement/edge
  effect, a different particle look, a kaleidoscope/mirror, a ramp/LUT palette) — graft
  it as an **extra composite layer** before `aura`, gated so it can be disabled.
- **A better/cleaner shader** for something we already do (cymatics, aurora, aura warp)
  — port the *math/params*, keep our uniform plumbing (`pose`, `audio_out`,
  `heartbeat`). Don't import the whole subtree.
- **Audio-analysis or color-mapping ideas** (different FFT banding, a nicer chakra
  ramp) — fold into `audio_out`'s logic, keep the channel names (`peakHz/hue/energy/
  chakra`) so downstream uniforms are untouched.
- **Useful constants/tables** (a frequency→color table, tuned thresholds) — these are
  cheap and safe to adopt.

### 🔶 ADAPT WITH CARE — good idea, wrong wiring for us
- Anything that reads pose/hands from a **different source** than `pose_mp` — keep the
  *visual*, repoint its inputs to our `pose` / `hands_mp` channels.
- Anything hard-wired to a **fixed resolution / aspect** — match `master_out`
  (1280×720) and our aspect-correction convention.

### ❌ DROP — fights the architecture
- A **second `videodeviceinTOP`** / its own camera chain — we already own the camera
  via `camera_in`; two camera ops contend for the device (the exact bug that retired
  the browser bridge).
- A **live `audiodeviceinCHOP` saved into the file** — this hangs TD on save on flaky
  audio drivers (documented gotcha). Bowl mic is added at runtime via
  `td/enable_bowl_audio.py`, never saved in.
- **Any browser/WebSocket/web-render bridge** — the demo runs no browser.
- **Duplicates** of operators we already have tuned (our cymatics is the real Ritz
  Chladni superposition; our flow/orbs/aura are live-verified). Don't regress these.
- Anything requiring **internet / a CDN / a paid service** (MediaPipe must come from our
  bundled `td/models/`, not a download).

---

## 4. The merge procedure (in TouchDesigner, on the demo laptop)

> Work on a **copy**, never the teammate's original or `cbl.toe` directly until the end.

1. **Open both files.** Launch TD, `File > Open` → `td/cbl.toe`. Then
   `File > Open` the teammate file `td/incoming/EngineeringArt_TouchDesign_2026-06-11.toe`
   in a **second TD window** (or open it and use the network path bar to keep them
   distinct). Note its top-level COMP path.
2. **Inventory it.** Walk the teammate network top-down. For each operator, apply §3 and
   jot keep/adapt/drop. (If you want Claude to do this, do §1's MCP or screenshot step
   first and hand back the inventory.)
3. **For each KEEP item:** select it (plus any operators it strictly depends on),
   *Edit > Copy*, switch to the `cbl.toe` window at `/project1/cbl`, *Edit > Paste*.
   Give it a clear name. **Do not** paste over an existing op.
4. **Rewire to our signals.** Repoint the pasted op's inputs/uniform expressions to our
   public read points: `pose` (CHOP), `hands_mp`, `audio_out` (`peakHz/hue/energy/
   chakra`), `heartbeat` (`beat`). Delete any teammate camera/audio/browser source it
   dragged along (§3 DROP).
5. **Composite it in, gated.** Add the new visual as a layer in the composite chain
   *before* `aura` (so the person stays sharp), through a level/opacity you can drive to
   0. Mirror the reversible pattern we use for Chladni Option B (a gain that can be
   gated off) so the demo is never worse than today.
6. **CheckErrors.** `Dialogs > Errors`. The network must be error-free.
7. **Save mic-free.** Ensure no live `audiodeviceinCHOP` is in the file (run
   `disable_bowl_audio()` if needed), then save. Remember the MCP save gotcha: delete the
   target first or save to a new name — `project.save('cbl.toe')` won't overwrite via the
   non-interactive API.
8. **A/B verify live** with a person + the bowl: camera live (not frozen), existing
   layers unchanged, the new layer toggles cleanly on/off. Only then commit `cbl.toe`.

---

## 5. What was done in this pass (and what wasn't)

**Done (off-tool, this session):**
- Preserved the teammate's `.toe` into version control at
  `td/incoming/EngineeringArt_TouchDesign_2026-06-11.toe` (provenance + md5 recorded).
- Wrote this architect review: the binary constraint, the keep/adapt/drop framework
  against the one-surface architecture, and the in-TD merge procedure.
- Linked it from `docs/index.md` and `CLAUDE.md`.

**Not done (requires TouchDesigner + the demo laptop):**
- The actual operator-level splice into `cbl.toe`. It **cannot** be done from the Linux
  build environment — see §1. Run §4 in TD, or unblock a Claude-driven merge via §1's MCP
  path. `cbl.toe` is **unchanged** by this pass, so the demo is exactly as it was.

---

## 6. Recommended next step

Open the teammate file in TD with the MCP component on `:44444` and ping Claude with
`/touchdesigner` — that turns §4 from a manual task into a reviewed, programmatic merge
where Claude can actually see and judge each operator. Short of that, do §1's screenshot/
tscript export and commit it to `docs/td-screenshots/`, and the per-operator keep/drop
calls can be made from that.
