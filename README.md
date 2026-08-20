# Minslaire — Act I: The Calling

A whimsical retro 3D pixel-art action RPG set in a post-WW3 world where humanity survives in bio-synthetic life suits. This is the playable **Act I prototype** of a planned trilogy — *Minslaire*, *Minslaire II: Ascendence*, and *Minslaire III: Transcendence*. See [walkthrough.md](walkthrough.md), [gameplay.md](gameplay.md), [story.md](story.md), and [locations.md](locations.md) for the full vision.

## Act I — what's playable
- **The opening**: wake to the suit's hum in the Red House, live the father's blade-lesson memory (fully voiced 3D cutscene), and meet the Council of Elders at your door
- **Twelve trials, in a fixed order** — Act I is gated so it must be played through, not skipped around:
  1. observation at the Central Well (Elder Moss)
  2. the four-dial archive puzzle in the Council Hall (Elder Sage)
  3. carrying grain for Widow Oren, and refusing her silver (Elder Thorn)
  4. the trader's fifty-silver overpayment — with Tinslaire arguing to keep it (the Council)
  5. **The Night Watch** — read the roster, light three rampart braziers in its order (Elder Thorn)
  6. **The Dry Cistern** — three sluice gates, one correct configuration (Elder Sage)
  7. **The Blighted Rows** — find which orchard row is warm from below (the Orchard Keeper)
  8. **The Short Tally** — weigh the granary against its own ledger (Elder Moss)
  9. **The Muster** — Thorn's live drill: guard, dodge, riposte on his call (Elder Thorn)
  10. **The Scrap in the Quarry** — three machine constructs, your first real fight (Elder Sage)
  11. **The Trial of Steel** — the dummies, then your father's blade (the Council)
  12. **The Outskirts Cave** — the Cave Machine, and hauling the body home (Elder Moss)
- **The Trial of Steel**: sword, bow, guard, and dodge against training dummies behind the Blue House
- **The Outskirts Cave**: a torch-lit dark delve, glow-moss wayfinding, and the Cave Machine boss — first machine anyone in Elderville has ever seen
- **The body and the compass**: haul the chassis back to the Forge and receive the elders' compass, its salvaged red eye already watching
- **Death and mercy**: fall, and the life suit returns you to the Safe Camp — the machine keeps its wounds
- A sprawling village with districts, day/night cycle, wandering NPCs with pixel portraits, save/load, and an objective marker that points the way

## Characters
- **Minslaire** — you. Young, quick, and about to be tested.
- **Tinslaire** — your little brother. Giddy about the elders, fond of the Grand Gardens, unnervingly attached to the compass eye.
- **Elder Moss** — the watcher. Dismisses what the well hears.
- **Elder Sage** — the scholar. Forgets nothing, forges the compass.
- **Elder Thorn** — the protector. Tests the heart before the blade.
- **Widow Oren** and the **Bazaar Trader** — the village you serve.
- **The Father** — remembered in the yard, blade flat on his palm. Exiled by the council for asking who made the life suits; the protagonist of the companion game *Ashveil*, where he is known only as the **Ashbearer**.

## Controls
- **WASD / Arrows**: Move · **SHIFT (hold)**: Sprint · **SHIFT (tap)**: Dodge roll
- **SPACE / J**: Sword attack · **K**: Bow · **R (hold)**: Guard
- **E**: Talk / Inspect / Advance dialogue
- **P / ESC**: Pause menu (save, load, settings)
- **Mouse wheel / +/-**: Zoom · **Q / C**: Rotate camera
- **G**: Agent Mode panel (LLM benchmark)
- Walk into doors to enter buildings; every prop has a hitbox

## Agent Mode — the LLM benchmark
The game doubles as an agentic benchmark. Press **G** (or the ⌁ button, bottom-left) to open
the Agent Mode panel, paste in any OpenAI-compatible endpoint, model id and API key, and the
model plays Act I from waking up to receiving the compass.

**Setup.** Point `ENDPOINT` at any `/v1` base URL — OpenAI, OpenRouter, Groq, Together,
llama.cpp, or a local Ollama at `http://localhost:11434/v1`. `LIST` pulls `/models` into an
autocomplete. Credentials live in `localStorage` only and are sent nowhere but your endpoint.

**Vision.** Hit `CHECK` and the panel probes your model with a 1×1 test image — the only
reliable capability test, since the OpenAI-compatible spec has no field advertising image
support. If the endpoint accepts it, each turn also sends a downscaled screenshot of the live
canvas with the on-screen HUD text composited underneath, so the model sees what a player
sees. If it doesn't, the run silently continues text-only. The panel shows the exact frame
that was transmitted.

**How it plays.** Each step the agent gets a structured observation — tile position, clock,
HP, trial states, the open dialog line, and nearby points of interest with compass bearings
and distances — and replies with one JSON action. Actions go through the same pipeline a
human uses: synthetic key events plus a BFS autopilot that walks real routes at normal
speed. No teleports, no direct story-state writes. `move_to` targets a POI tile and stops
beside it when the tile itself is solid (a well, a forge, an NPC), and aborts cleanly when a
door changes area or a dialog interrupts the walk.

**Scoring.** 24 points: leaving home (1), the twelve trials (weighted 1-3 by type — puzzles and combat count double, the finale triple), the blade trial
(1), father's blade (1), entering the cave (1), slaying the Cave Machine (2), and delivering
the body for the compass (2). The panel tracks steps, deaths, failed and invalid actions, and
token usage, and `COPY JSON REPORT` exports the whole run — rubric and action log included —
for pasting into a spreadsheet or issue.

Run `npm run test:agent` to verify the harness: pathfinding to every objective over real
world data, full story completability, reply parsing, observation rendering, and screenshot
capture.

## Run
```bash
cd top-down-3d-pixel-demo
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

```bash
npm run typecheck   # tsc --noEmit
npm run test:agent  # Agent Mode harness tests (no browser/network needed)
npm run build       # single self-contained dist/index.html
```

Pushes to `main` build the game and publish `top-down-3d-pixel-demo/dist` to GitHub Pages
via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Full Vision
Act I ends as the compass needle tugs east. The trilogy roadmap — the forest gauntlet, the elders' betrayal, and the themes it all serves — is documented in the design docs:
- [Walkthrough (scene by scene)](walkthrough.md)
- [Gameplay & Mechanics](gameplay.md)
- [Story & Lore](story.md)
- [Locations & World](locations.md)
