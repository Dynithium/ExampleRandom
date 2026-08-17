# Locations

> **Note:** This document describes the full vision for the *Minslaire* trilogy. Locations and features will be added incrementally as development progresses.

## Current In-Game Layout (Village Prototype)

The playable village is a **72×50 tile map** on a 72×72 heightfield. Building exteriors are compact **5x5 footprints** — much smaller than their interiors, which stay **15x10 tiles**. The four buildings and their front doors:

| Building | Exterior Footprint (x, y) | Door Tile (x, y) | Interior Size |
|---|---|---|---|
| Council of Elders (Blue House) | (30, 6) | (32, 10) | 15x10 (`council`) |
| Minslaire & Tinslaire's House (Red House) | (10, 6) | (12, 10) | 15x10 (`home`) |
| Farmer's Homestead | (10, 24) | (12, 28) | 15x10 (`homesteadA`) |
| Weaver's Homestead | (30, 24) | (32, 28) | 15x10 (`homesteadB`) |

Walk into a door tile to enter; walk onto the door mat inside to exit back to the same spot outside.

District tiles currently placed on the map:

- **Red House (home)** — interior has two beds and the heirloom sword in its glass case; Minslaire wakes up here.
- **Blue House (council)** — interior has the council table, benches, and bookshelves.
- **Grand Gardens** — crop terraces around (26–39, 34–41).
- **The Forge & Workshops** — at (52, 7). **After the Cave, this is where Sage forges the compass from the machine's remains.**
- **Central Well** — at (58, 36).
- **Southern Marketplace & Bazaar** — stalls at (15, 40).
- **Watchtower & Eastern Gate** — watchtower at (66, 12); the gate gap in the eastern tree line is around rows 16–18. The Outskirts Cave mouth is at (66, 8).
- **Village Pond** — water at (40, 26), tile `5`.
- **Roads** — dirt paths at row 13, row 25, and columns 2, 18, 21 connecting all districts.

NPCs currently stand at: **Tinslaire** (30, 9), **Elder Marcus** (8, 9), **Elder Sarah** (23, 14). NPCs are solid and block player movement.

---

# Minslaire — The Betrayal: Full World Map

> All coordinates below are design targets for the full Minslaire build, not yet in the prototype.

## Region Flow

```
Elderville ──[Cave]──> (return body) ──[Forge: Compass forged]──> Elderville ──[Eastern Gate]──> The Outskirts ──> The Midden ──> The River Crossing ──> The Far Forest ──> The Box's Grove
     ^                                                                                                                                                 |
     |                                                                                                                                                 |
     +------------------------------- return trip (compass dead, no encounters, no voices) ----------------------------------------------------------+
```

Epilogue: `The Mountain Village` (new map, reached by cutscene at the end of Act 3, compass shattered).

## 1. The Upper Ward (Administrative Center)

- **The Blue House**: The largest building in Elderville, painted deep blue. This is where the Council of Elders gathers around a massive oak table and hearth.
  - **Normal state:** rest area, recover 40 HP, exit freely.
  - **Act 3 state (with the box in hand):** doors lock, interior transforms into a **combat arena** — tables pushed aside, benches splintered, the hearth casting long shadows, the vault map table blinking your pin where you stand. This is the arena for the Elder boss fight.
- **The Council Archives**: A subterranean vault beneath the Blue House, reached by a trapdoor behind the hearth. Contains pre-WW3 records and the **blue light beacon** — the dual-function remote that reveals the Elemental Box and stirs the Scrap Bots — and the **map table** where the compass's tracker pin glows, letting the elders see your position in the forest in real time.
  - Elder Sage reads the vault records aloud during the ambush, confirming what the box can do and damning the council in the same breath. He also used those same records to tune the compass.

## 2. The Residential Quarters (The Red District)

- **Minslaire & Tinslaire's House (Red House)**: A cozy, worn home with two beds, a table, and a family heirloom blade in a glass case by the door. This is also the **Safe Camp**, where Minslaire respawns if defeated.
  - On the table: Tinslaire's **wooden bird**. The player cannot take it into the forest; after the exile, it appears in the epilogue tucked against their chest.
- **Neighboring Homesteads**: Dozens of wooden family homes where villagers live, sleep, and maintain their life suits. The Farmer's and Weaver's homesteads are the first ones reachable in the prototype.

## 3. The Agricultural Outskirts (Greenhouse Terraces)

- **The Grand Gardens**: Crop terraces producing the food that keeps Elderville alive under the canopy. Site of the **Tinslaire's Keepsake** quest (his wooden bird is lost here — compass flutters) and the **Marketplace Supply Run** (crops carried back to the Bazaar).
- **The Central Well**: A deep water source near the treeline. Strange mechanical reverberations echo from below — a sound no machine-less village should make, on the same frequency the compass will later hum to. Site of the **Well's Echo** quest. Elder Moss is uncharacteristically eager to dismiss the sound: *"Forget it."*

## 4. The Artisan & Blacksmith District

- **The Forge & Workshops**: Where villagers repair tools, forge basic melee weapons, and prepare gear for the brave ones venturing out. Before the forest, the forge can repair your blade for free (story beat, not a mechanic). **After the Cave, this is the pivotal location where Elder Sage salvages the Cave Machine's eye and core on the anvil and forges the compass** — the brass disc that becomes your yellow arrow, voice-link, and tracker. The eye still ticks when he hands it to you.

## 5. The Eastern Gate & Guard Post

- **The Watchtower**: Stationed by Elder Moss, overlooking the barricaded border into the Eastern Forest. Starting point for the **Perimeter Sweep** quest (2 Scrap Drones drift out of the treeline — elders coach you over the compass). At night, Elder Thorn waits here for the pre-forest warning about the leash: *"They can hear you."*
- **The Eastern Gate**: A gap in the barricaded treeline. It opens only after the compass is forged and all village quests are complete.

## 6. The Southern Marketplace & Bazaar

- **The Trading Post**: A lively plaza where villagers trade supplies and share rumors. Hub of the **Marketplace Supply Run**. A trader's farewell line becomes a theme seed: *"Take the blessing. The suit's hum will guide you home."* — now harmonized with the compass's hum.

## 7. The Cave on the Outskirts

The old cave where the forest begins, on the edge of town. The elders send Minslaire here at sunrise to investigate "sounds." It is **dark** — you must carry a **torch** to see, it grows deeper and darker the further in you go, and the light flickers off wet rock.

Deeper still, two **red eyes blink open** in the dark: the Cave Machine, a rusted scrap bot — the first machine anyone in the village has ever seen, placed there by the elders as their test and their key. When it falls with a shudder, you must **haul its body back to the village** at the elders' behest — intact, eye still faintly glowing. Its chassis is heavy; the path out feels longer than the path in. At the Forge, Sage lifts the eye and the core. What opens the path to the Elemental Box is not just the machine's death, but what Sage makes from its remains.

*(Minslaire doesn't know this yet. He thinks he's being useful.)*

## 8. The Eastern Forest (four zones) — compass-guided

The forest is only survivable because the compass is tuned to the Box's frequency — the same frequency as the blue light beacon. The needle tugs, the elders' voices crackle over it, and on the vault map table your pin moves.

### Zone 1 — The Outskirts
The treeline swallows the sun immediately past the gate. Rusted husks of old machines lie half-buried in the dirt; the forest floor is still the wreck of an old road. **Enemies:** 2–3 Scrap Drones. Sage's voice: *"Thirty paces, then north."*
- **Quiet beat:** a clearing with a moss-grown child's shoe. No children live out here anymore. The suit hums, the compass eye brightens.

### Zone 2 — The Midden
The middle forest is a graveyard of the old world — rusted cars, toppled towers, and the shambling Rust Bots. The birds fall silent the deeper you go. **Enemies:** Rust Bots, mixed drones; elite **Rust Watcher** at the zone's end.
- **The Stillness:** at the zone's heart, a forced rest point where **both** suit and compass go silent for one breath — eye dim, needle still — the first time in Minslaire's life he hears the forest without either hum. Wind. Heartbeat. Then both hums return.

### Zone 3 — The River Crossing
A wide, black river splits the forest. A fallen bridge is the only crossing, guarded by the **Heavy Mech** (boss, 60 HP). The elders go radio-silent here — static. Defeating it drops the bridge and opens the way east.
- **Quiet beat:** standing at the broken edge, looking down at the dark water, wondering what the world was like when rivers were just water. The compass ticks again, shyly.

### Zone 4 — The Far Forest
The trees grow older and taller; the canopy blocks all light. Vanguard Bots patrol in pairs. This is the farthest anyone in Elderville has ever gone. **Enemies:** Vanguard Bots (2–3), a two-bot patrol guarding the approach. The compass needle trembles, then pulls hard.
- The path ends at the river's source: a grove where no machines will follow.

### The Box's Grove
A small stone clearing, half-sunk in moss, where the trees are so old they seem to watch. At its center, on a low stone pedestal: the **Elemental Box** — not machine, not wood, not stone, warm to the touch.
- **Scripted scene (no combat):** the grove goes silent; both hums dim and lean toward the box; the compass needle spins wildly, then slams fixed pointing at the pedestal. The voice speaks the warning. On the return trip through all four zones, the compass is dead, the voices gone, the machines stand still — as if waiting. This should read as *wrong*.

## 9. The Mountain Village (epilogue)

A remote settlement in the western hills, reached only by cutscene after the exile. Unknown to Minslaire, high in the mountains, far from Elderville's smoke. Cold air that the suit filters without effort, stone homes, and quiet. The broken compass is left shattered on the Blue House hearth.
- **Post-credits text:** *"Five years later, in the ruins of the Blue House, a name is whispered: Neegabla."*

---

## Safe Camp

A small clearing west of the village where fallen wanderers wake up. The life suits have a failsafe—when the wearer's body gives out, the suit pulls them back here, repairing the damage and restarting the heart. No one knows how or why it works, but every villager has woken up at the Safe Camp at least once. In the current prototype, the Safe Camp is located inside the **Red House**.

> **Theme note:** The Safe Camp is the world's unexplainable mercy — the seam through which Minslaire III: Transcendence's truth is sewn. It is never flagged as strange in the fiction; the player is simply left to wonder why the suit loves them enough to bring them back. The compass, by contrast, is explainable mercy that breaks — a counterfeit guidance.

## Minslaire III: The Faraway Place

A distant, isolated location where Minslaire and Tinslaire find their **father**, trapped but alive. This area is far from Elderville, hidden in the ruins of the old world. It is here that the truth of Islam is revealed, and the purpose of their journey becomes clear — and where the compass's false guidance is revealed as the shadow of true Guidance that needs no eye and no beacon.
