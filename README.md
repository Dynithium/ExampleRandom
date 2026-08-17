# Minslaire — Act I: The Calling

A whimsical retro 3D pixel-art action RPG set in a post-WW3 world where humanity survives in bio-synthetic life suits. This is the playable **Act I prototype** of a planned trilogy — *Minslaire*, *Minslaire II: Ascendence*, and *Minslaire III: Transcendence*. See [walkthrough.md](walkthrough.md), [gameplay.md](gameplay.md), [story.md](story.md), and [locations.md](locations.md) for the full vision.

## Act I — what's playable
- **The opening**: wake to the suit's hum in the Red House, live the father's blade-lesson memory (fully voiced 3D cutscene), and meet the Council of Elders at your door
- **The four virtue trials**: observation at the Central Well (Elder Moss), wits in the Council Hall archive puzzle (Elder Sage), service carrying grain for Widow Oren (Elder Thorn), and honesty at the Bazaar (the trader's overpayment)
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
- **The Father** — remembered in the yard, blade flat on his palm.

## Controls
- **WASD / Arrows**: Move · **SHIFT (hold)**: Sprint · **SHIFT (tap)**: Dodge roll
- **SPACE / J**: Sword attack · **K**: Bow · **R (hold)**: Guard
- **E**: Talk / Inspect / Advance dialogue
- **P / ESC**: Pause menu (save, load, settings, agent mode)
- **Mouse wheel / +/-**: Zoom · **Q / C**: Rotate camera
- Walk into doors to enter buildings; every prop has a hitbox

## Agent Mode (benchmark)
From the title screen or pause menu, open **Agent Benchmark**. Paste any OpenAI-compatible **endpoint**, **model**, and **API key**. The model plays Act I as a fair-play bench: it walks pathfound routes, talks, solves Sage's archive, fights, and hauls the Cave Machine to the Forge. No teleports. Score is 11 points across the four virtues, the blade trial, the sword, the cave, the machine, and the compass.

The key stays in this browser only. The host must allow browser CORS (OpenRouter, Groq, and local servers with CORS on usually work).

## Run
```bash
cd top-down-3d-pixel-demo
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. `npm run build` produces a single self-contained `dist/index.html`.

## Full Vision
Act I ends as the compass needle tugs east. The trilogy roadmap — the forest gauntlet, the elders' betrayal, and the themes it all serves — is documented in the design docs:
- [Walkthrough (scene by scene)](walkthrough.md)
- [Gameplay & Mechanics](gameplay.md)
- [Story & Lore](story.md)
- [Locations & World](locations.md)
