# Creative Bowl Lab — Final Presentation (generated deck)

The 19-June final-presentation **draft** is generated from code so it stays
consistent and easy to restyle. Output: `Creative_Bowl_Lab_Final_DRAFT.pptx`
(15 slides, 16:9, fully animated). A copy also lives in the OneDrive CBL folder.

## Why code?
python-pptx gives precise, repeatable layout, and a custom XML layer
(`animations.py`) adds **real PowerPoint animations + slide transitions** that
python-pptx can't do natively. Edit the Python, rerun, and the whole deck
rebuilds — no manual reflowing.

## Rebuild
```powershell
# one-time: deps live in a local venv (git-ignored)
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install python-pptx pymupdf

# rebuild the deck
.\.venv\Scripts\python.exe build_deck.py

# (optional) re-extract source images from the SSA PDFs
.\.venv\Scripts\python.exe extract_assets.py
```

## Files
| File | Purpose |
|---|---|
| `build_deck.py` | The 15 slides — content + layout + per-slide animations. Edit here. |
| `deck_kit.py` | Design system: palette, Garamond/Segoe type, cards, glows, chakra-bar motif, footer. |
| `animations.py` | Injects `<p:timing>` entrance effects (fade/wipe/float/zoom) + `<p:transition>` (fade/morph/push). |
| `extract_assets.py` | Pulls the bowl-spectrum, cymatics and TouchDesigner images out of the source PDFs. |
| `assets/` | Extracted evidence images used in the deck. |
| `Creative_Bowl_Lab_Final_DRAFT.pptx` | The deliverable. |

## Slide map (16 slides)
1 Title · 2 Team · 3 Goal (+ why it's challenging) · 4 Evidence / literature ·
5 Triple-diamond process · 6 Decisions & mid-term feedback · 7 Requirements
(MoSCoW) · 8 Concept · 9 User-centred design · 10 System pipeline ·
11 Prototype & feasibility (validated) · 12 Sound→colour · 13 Heartbeat→pulse ·
14 Body→shape · 15 Experience / live demo · 16 Reflection.

## Rubric mapping (Final evaluation — group assessment)
Tailored to the **Final** rubric (6 criteria; ours is a DESIGN project, so
criterion 4/RESEARCH does not apply):
- **1 Goal** — desired/challenging/original/innovative, literature-motivated → slides 3 + 4
- **2 Requirements & scope** — MoSCoW, mid-term feedback addressed, decisions justified → slides 5–7
- **3 Manufacturing (DESIGN): user-centred & intuitive** → slide 9
- **5 Final outcome / prototype + feasibility through testing** → slide 11 (+ 10, 12–15)
- **6 Presentation** — the whole deck + live demo → slides 15–16

## Notes
- **Fonts:** Garamond (display) + Segoe UI (body) — both ship with Office, so the
  deck renders correctly on any presenting laptop. Brand wanted Cormorant
  Garamond, which isn't installed; Garamond is the closest safe match.
- It's a **draft**: text is placeholder-quality in places, the live-demo slide
  assumes you run the TouchDesigner build, and figures (Henk/Mahiraa) can replace
  the redrawn flowchart/diamond if they prefer their own.
