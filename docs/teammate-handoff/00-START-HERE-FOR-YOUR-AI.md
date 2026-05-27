# Start Here — Brief for the AI assistant

_Snapshot date: 2026-05-26 · TU/e Multi-Disciplinary CBL, Group 5_

## Who you are and what to do

You are an AI assistant. A member of TU/e CBL **Group 5** has handed you this folder.
Your job is to **read these files and explain the CBL project to them in plain
language** — what it is, how the pieces work, what their groupmate Arav is building,
and where their own part fits in.

The person reading your explanation is **not necessarily technical**. Some of them are
writing the group report; some are doing the sound experiments; some help with code.
Assume they want clear, simple answers, not jargon.

## How to talk about this project

- **Plain words first.** Avoid technical terms where a normal word works. When you must
  use a term (chakra detection, cymatics, FFT, MediaPipe, TouchDesigner...), explain it
  in one sentence. There is a glossary in `05-plain-language-glossary.md` — use it.
- **Frame everything as "what happens on the screen."** The whole project is about a
  bowl, a heartbeat, and a person controlling live visuals. Tie explanations back to
  that.
- **Do not bring up "poetry" as a current feature.** An earlier version of this project
  generated poems. That idea was **dropped** (decided 2026-05-22). Some old poem code
  still sits unused in the project, but it is not part of the work anymore. Don't
  describe it as active.

## What is in this folder

| File / folder | What it covers |
|---|---|
| `00-START-HERE-FOR-YOUR-AI.md` | This brief. |
| `01-project-overview.md` | The concept and the story behind it. The big picture. |
| `02-what-arav-is-building.md` | Arav's part: the sound/signal + visuals software. **The main thing teammates ask about.** |
| `03-how-the-pieces-fit-together.md` | How sound, heartbeat, camera, and visuals connect. The two software paths (web app + TouchDesigner). |
| `04-status-and-whats-next.md` | What works today, what's waiting on hardware, what's next. |
| `05-plain-language-glossary.md` | Every technical word, explained in one line. |
| `06-team-and-timeline.md` | Who does what, key dates, materials ordered. |
| `context/` | The project's own README and CLAUDE.md — extra detail if a teammate asks something deeper. |
| `screenshots/` | Pictures of the current visuals. Show these — they explain more than words. |
| `code/` | A read-only copy of the important program files, for coding teammates. Start at `code/README.md`. |
| `matlab-reference/` | The original MATLAB sound-analysis files a teammate wrote, kept for reference. |

## Suggested reading order for you (the assistant)

1. `01-project-overview.md` — get the concept.
2. `02-what-arav-is-building.md` — get Arav's scope.
3. `03-how-the-pieces-fit-together.md` — get how it connects.
4. `04-status-and-whats-next.md` — get current state.
5. Keep `05-plain-language-glossary.md` open as a reference while you explain.
6. Use `06-team-and-timeline.md` to tell the teammate where they personally fit.

## If the teammate asks "what should I do?"

Point them to `06-team-and-timeline.md`. It lists who owns what. If they write the
report, the overview + how-it-fits + glossary docs give them the material they need.
If they code, send them to `code/README.md`.
