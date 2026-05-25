# TouchDesigner MCP — AI-Assisted Network Development

Date: 2026-05-25

This document explains how to use the `claude-touchdesigner` plugin to build and manipulate TouchDesigner networks from Claude Code via MCP.

## What It Does

The plugin connects Claude Code to a running TouchDesigner instance over HTTP. You can ask Claude to create operators, write GLSL shaders, wire up rendering pipelines, or build feedback simulations — all executed live inside TouchDesigner.

## Prerequisites

- TouchDesigner 2025 or later
- Claude Code CLI (already installed)
- Node.js (already installed)

## One-Time Setup

### 1. Plugin (already installed)

The plugin is installed globally at scope: user. Verify with:

```powershell
claude plugin list
```

You should see `touchdesigner@claude-touchdesigner` v0.1.6 enabled.

### 2. Port environment variable (already set permanently)

`TDAPI_PORT=44444` is set as a Windows user environment variable. You can verify in a new terminal:

```powershell
$env:TDAPI_PORT   # should print 44444
```

### 3. Load the TOX into TouchDesigner

Drag this file into your TouchDesigner network editor:

```
C:\Users\20243223\.claude\plugins\cache\claude-touchdesigner\touchdesigner\0.1.6\toe\TouchDesignerAPI.tox
```

After dragging it in:
- Select the `TouchDesignerAPI` component
- Set its **Port parameter to 44444** (must match `TDAPI_PORT`)

The component starts an HTTP server automatically. You should see it active in the textport.

### 4. Load the skill in Claude Code

```
/touchdesigner
```

This loads the `td-guide` knowledge base — operator families, patterns, GLSL reference, rendering setup, instancing, and feedback loops.

## MCP Tools

Once the TOX is running, Claude has access to four tools:

| Tool | What it does |
|---|---|
| `td_execute` | Run Python code inside TouchDesigner |
| `td_pane` | Get the current network editor path/state |
| `td_selection` | Get currently selected operators |
| `td_operators` | List operators at a network path |

## Example Prompts

```
Create a sphere SOP with noise displacement
```
```
Build a GLSL feedback loop that simulates ripples
```
```
Set up a render pipeline with camera, light, and PBR material
```
```
Create instanced geometry from a grid SOP, 500 instances
```
```
Write a GLSL TOP that generates a cymatics-style sin(kx)*sin(ky) pattern
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Connection refused | Check TDAPI_PORT=44444 matches the TOX Port parameter; restart both |
| Component not loaded | Confirm TOX is in the project; check textport for Python errors |
| Wrong parameter name error | Run `op.TDAPI.GetParameterList('operatorType')` to discover actual names |
| Stale error after fix | Check errors in a **separate** `td_execute` call — TD caches errors at frame boundaries |

## Key Coding Rules (for Claude when using this plugin)

1. **Always use `op.TDAPI.CreateOp()`** not raw `base.create()` — it sets `viewer=True` and moves docked operators correctly.
2. **Always use `op.TDAPI.CreateGeometryComp()`** not manual Geometry COMP setup.
3. **Verify parameter names** with `op.TDAPI.GetParameterList('typeName')` before setting them — TD names are unpredictable.
4. **Split error checks**: fix in one `td_execute`, check errors in a second separate call.
5. **Never create geometry inside a Geometry COMP** — build at parent level, pass via In/Out.
6. **Use relative paths** for nearby operators (`null1`, `../cam1`), absolute only for global resources.
7. **Insert Null as intermediary** before any reference connection.

## Operator Family Quick Reference

| Family | Data | GPU? | Use for |
|---|---|---|---|
| SOP | 3D geometry | CPU | Modeling, procedural shapes |
| POP | 3D points/particles | GPU | Particles, large point clouds |
| TOP | 2D images/textures | GPU | Compositing, shaders, rendering output |
| CHOP | Time-based channels | CPU | Audio, animation, data streams |
| DAT | Tables, text, scripts | CPU | Data, Python |
| COMP | Containers, scenes, UI | — | Scene hierarchy, UI panels |

## Relation to the CBL Web App

The web app (React/Vite) is the live demo product — it runs on a laptop at the installation. TouchDesigner is a separate creative tool for prototyping visuals, exploring GLSL effects, and testing ideas before translating them into canvas code. The TikTok visual reference (`docs/touchdesigner-reference.md`) was the original inspiration; this MCP plugin lets Arav prototype directly in TD and then port the results to the canvas.
