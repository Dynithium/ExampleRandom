# Locations

> **Note:** This document describes the full vision for *Elderville*. Locations and features will be added incrementally as development progresses.

## Current In-Game Layout (Village Prototype)

The playable village is a **48x30 tile map** where every building's exterior footprint is exactly **15x10 tiles** — the same size as its interior. The four buildings and their front doors:

| Building | Footprint (x, y) | Door Tile (x, y) | Interior |
|---|---|---|---|
| Council of Elders (Blue House) | (3, 3) | (10, 12) | `council` |
| Minslaire & Tinslaire's House (Red House) | (28, 3) | (35, 12) | `home` |
| Farmer's Homestead | (3, 15) | (10, 24) | `homesteadA` |
| Weaver's Homestead | (28, 15) | (35, 24) | `homesteadB` |

Walk into a door tile to enter; walk onto the door mat inside to exit back to the same spot outside.

District tiles currently placed on the map:

- **Red House (home)** — interior has two beds and the heirloom sword in its glass case; Minslaire wakes up here.
- **Blue House (council)** — interior has the council table, benches, and bookshelves.
- **Grand Gardens** — crop terraces at (22, 18) using tile `10`.
- **The Forge & Workshops** — at (22, 4), tile `12`.
- **Central Well** — at (24, 16), tile `11`.
- **Southern Marketplace & Bazaar** — stalls at (22, 26), tile `13`.
- **Watchtower & Eastern Gate** — watchtower at (44, 6), tile `14`; the gate gap in the eastern tree line is the path at rows 8–9.
- **Village Pond** — water at (40, 26), tile `5`.
- **Roads** — dirt paths at row 13, row 25, and columns 2, 18, 21 connecting all districts.

NPCs currently stand at: **Tinslaire** (34, 14), **Elder Marcus** (9, 14), **Elder Sarah** (23, 14).

## The World

The world is uninhabitable due to **toxic air** from nuclear war (World War 3). The only way to survive is with **life suits**—bio-synthetic membranes engineered by governments as a last resort. They bond to the skin at birth, filtering the air and sustaining life. The suits are maintained through simple, communal means—no advanced technology is required.

## Elderville (Massive Settlement Layout)

Elderville is a **massive, sprawling settlement** nestled between the western hills and the eastern forest. It is divided into several distinct districts, connected by winding dirt paths and wooden walkways:

### 1. The Upper Ward (Administrative Center)
- **The Blue House**: The largest building in Elderville, painted deep blue. This is where the Council of Elders gathers around a massive oak table and hearth. Confronting the elders here transforms the interior into a vast combat arena.
- **The Council Archives**: A subterranean vault containing pre-WW3 records and the dual-function remote beacon used to trigger the Scrap Bots and reveal the Elemental Box.

### 2. The Residential Quarters (The Red District)
- **Minslaire & Tinslaire's House (Red House)**: A cozy, worn home with two beds and a family heirloom blade by the door. This is also the **Safe Camp**, where Minslaire respawns if defeated.
- **Neighboring Homesteads**: Dozens of wooden family homes where villagers live, sleep, and maintain their life suits.

### 3. The Agricultural Outskirts (Greenhouse Terraces)
- **The Grand Gardens**: Producing crop yields essential for village survival under the canopy.
- **The Central Well**: A deep water source near the treeline hiding strange mechanical reverberations. The source of the **Well’s Echo** side quest.

### 4. The Artisan & Blacksmith District
- **The Forge & Workshops**: Where villagers repair tools, forge basic melee weapons, and craft gear for the brave ones venturing out.

### 5. The Eastern Gate & Guard Post
- **The Watchtower**: Stationed by Elder Moss, overlooking the barricaded border leading directly into the dangerous Eastern Forest. The starting point for the **Perimeter Sweep** side quest.

### 6. The Southern Marketplace & Bazaar
- **The Trading Post**: A lively plaza where villagers trade supplies, share rumors, and pick up local community tasks and side quests from the village board. The hub for the **Marketplace Supply Run** side quest.

## The Eastern Forest

A dense woodland that begins where Elderville's path ends. The trees here are old and gnarled, and the undergrowth is choked with rusted scrap. This is where the machines roam. Scrap drones patrol the clearings, rust bots wander the old trails, and heavier mechs guard the river crossing to the east.

The deeper you go, the more dangerous it becomes. Vanguard Bots are rumored to patrol the far side of the river, guarding something the elders call the **Elemental Box**—an artifact from the old world, before the suits, before the scrap.

## The Elemental Box

A mysterious artifact sealed deep in the eastern forest, beyond the river and the heaviest machine patrols. Its location was revealed through a blue light beacon that the elders have had since World War 3. This beacon has a dual function: it can both activate the Elemental Box (revealing its location) and trigger the Scrap Bots to awaken and patrol the forest.

The elders were waiting for someone like Minslaire to fight the robots as part of their plan. The beacon was created by the same people who made the life suits—it was designed to guard the Elemental Box until someone capable of fighting the bots could retrieve it. The elders possess a remote control for it. The box holds the technology required to upgrade life suits, granting people elemental powers.

## Safe Camp

A small clearing west of the village where fallen wanderers wake up. The life suits have a failsafe—when the wearer's body gives out, the suit pulls them back here, repairing the damage and restarting the heart. No one knows how or why it works, but every villager has woken up at the Safe Camp at least once. In the current prototype, the Safe Camp is located inside the **Red House**.

## Game 3: The Faraway Place

A distant, isolated location where Minslaire and Tinslaire find their **father**, trapped but alive. This area is far from Elderville, hidden in the ruins of the old world. It is here that the truth of Islam is revealed, and the purpose of their journey becomes clear.
