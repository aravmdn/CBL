# Alejandra's Chladni visualizer (original)

`EngineeringArt_TouchDesign.10.toe` is teammate **Alejandra**'s standalone TouchDesigner
square-plate Chladni visualizer (saved 2026-06-12) — an independent re-implementation of the
same Ritz 1909 nodal-line math we use in `cbl.toe`'s `cymatics`.

Kept here, credited, as the source for the three techniques ported into the demo on
2026-06-12 (soft Gaussian glow, sand-grain accumulation, idle attract). It is **not** part of
the demo — the show runs `td/cbl.toe`.

- Full extraction of her network + logic: `docs/touchdesigner-alejandra-chladni-port-2026-06-12.md`
- As-built port in `cbl.toe`: `docs/touchdesigner-chladni-implementation-2026-06-09.md` §10

Her file's notable bits:
- `chladni_shader` — symmetric `cos·cos + cos·cos` superposition with `exp(-v²/0.004)` glow
  (we kept our antisymmetric `−` form for the report story, took the glow).
- `chladni_driver` (executeDAT) — continuous non-integer `(n,m)` morph from sine oscillators +
  `audio_rms` (we kept integer stepping; took the idea of an always-alive idle state).
- `sand_pixel` — grain-on-nodal-lines feedback accumulation (the seed for our `chladni_sand`).
- She also embedded the claude-touchdesigner MCP on port 9980 (we use 44444 in `cbl.toe`).
