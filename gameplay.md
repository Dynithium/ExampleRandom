# Gameplay

> **Note:** This document describes the full vision for *Elderville*. Features will be added incrementally as development progresses.

## Overview

*Elderville* is a classic top-down pixel-art action RPG with a whimsical tone and deep lore. You play as **Minslaire**, a young villager living with your younger brother **Tinslaire** in the red house west of the council's Blue House. The elders—who secretly activated the Scrap Bots to trigger the blue light beacon revealing the artifact's location—have tasked you with retrieving the **Elemental Box**. 

This begins an epic trilogy:
- **Game 1 (Elderville):** The elders betray you, using the box to upgrade themselves. You blow up the box, granting everyone elemental powers, but only you and Tinslaire absorb all the elements. Tinslaire kills the elders, and you are blasted into a remote mountain village.
- **Game 2:** You wake up 5 years later to fight **Neegabla** (your nihilistic brother Tinslaire who overthrew the elders and wields all elements). After defeating him, you reconcile and vow to find life's purpose.
- **Game 3:** Your journey for purpose culminates in discovering the truth of Islam, the ultimate answer to your quest for meaning.

## Controls

| Action | Key(s) |
|--------|--------|
| Move | `WASD` or `Arrow Keys` |
| Attack | `SPACE` or `J` |
| Dodge | `SHIFT` + Direction |
| Block | `R` |
| Interact / Talk | `E` |
| Sprint | `SHIFT` (while moving, when not dodging) |
| Enter / Exit Houses | Walk into a door tile |
| Advance/Close Dialogue | `SPACE` or `E` |

## Sound Effects

- **Life Suits**: A quiet, rhythmic hum (constant while active).
- **Ambient Village**: Villagers chatting, children laughing, wind rustling, wooden creaks.
- **Central Well**: Mechanical rumblings (foreshadowing Scrap Bots).
- **Combat**: Sword slashes, enemy clanks, dodge rolls, blocking sounds.
- **Eastern Forest**: Wind howling, distant metallic scrapes.

## HUD

The user interface displays three important stats:

- **HP (Health)** — Reduced when enemies touch you. If it reaches zero, you respawn at the Safe Camp.
- **ST (Stamina)** — Used while sprinting or dodging. Recovers slowly over time when not in use.
- **Beasts Slain** — A running count of scrap bots you have defeated.
- **Mission Bar** (top right) — Shows your current objective and progress.

## Mission System

The game guides you through Elderville with a series of missions. A glowing **yellow arrow** appears on screen pointing toward your current goal when it's off-screen. When you're near the objective, the arrow disappears.

### Village Side Quests (Required Pre-Adventure)
Before embarking on the dangerous journey into the Eastern Forest, Minslaire must complete the following side quests across the massive settlement of Elderville:

1. **Tinslaire's Keepsake** — Help your younger brother find his carved wooden toy near the Greenhouse Terraces.
2. **The Well’s Echo** — Investigate strange mechanical rumblings beneath the Central Well with Elder Moss.
3. **Perimeter Sweep** — Assist Elder Moss by clearing out stray scrap drones hovering near the Eastern Gate.
4. **Marketplace Supply Run** — Gather rare crop ingredients from the Agricultural Outskirts for the Bazaar traders.

> **Note:** These side quests are required to unlock the main mission chain and prepare you for the journey ahead.

### Main Mission List

| # | Mission | Description |
|---|---------|-------------|
| 1 | Speak with Tinslaire | Your brother is awake. Talk to him before heading out. |
| 2 | Talk to Elder Moss | The council has called a meeting. Find Elder Moss near the Blue House. |
| 3 | Talk to Elder Sage | Elder Sage has studied the old records. He waits near the garden. |
| 4 | Talk to Elder Thorn | Elder Thorn has final words for you before you enter the forest. |
| 5 | Enter the Forest | Cross into the eastern forest. Defeat 2 Scrap Drones. |
| 6 | Push Deeper | Rust Bots guard the middle forest. Clear a path. |
| 7 | Cross the River | A Heavy Mech blocks the river crossing. Defeat it to proceed. |
| 8 | Reach the Far Forest | Vanguard Bots patrol the far side. Push through to find the box. |
| 9 | Find the Elemental Box | You've cleared the forest. Search for the artifact at the river's end. |
| 10 | Return to Elderville | You have the box. Bring it home to upgrade your life suit with elemental powers. |

Complete all missions to retrieve the Elemental Box and save Elderville.

## Combat

- Press `SPACE` or `J` to swing your sword in the direction you are facing.
  - Each slash deals **20 damage** and pushes enemies back slightly.
  - You cannot attack again until the cooldown finishes.
- **Dodge:** Press `SHIFT` + a direction to quickly roll in that direction. Grants brief invincibility (0.5 seconds) but consumes stamina.
- **Block:** Hold `R` to raise your guard. Reduces incoming damage by **50%** while active, but drains stamina slowly.
- Enemies take damage and flash red when hit.
- If an enemy touches you, you lose **12 HP** and become briefly invulnerable (unless blocking).
- Against formidable foes like the Heavy Mech guarding the river, mastering dodging and blocking is key to survival.
- Right before locating the Elemental Box in the far forest, you must survive a grueling combat gauntlet.

## Enemy Types

| Enemy | HP | Speed | Behavior | Weakness |
|-------|----|-------|----------|----------|
| Scrap Drone | 20 | Fast | Floats through the forest and chases when close | Melee knocks them out of the air |
| Rust Bot | 35 | Slow | Sturdy walker that wanders until it spots you | Block their charges |
| Vanguard Bot | 40 | Medium | Agile sentinel found near the eastern river | Stagger if hit twice in quick succession |
| Heavy Mech | 60 | Very Slow | Powerful tank with high health; one-shots if it lands a hit | Dodge its charged attack |

## Characters

- **Tinslaire** — Minslaire's younger brother. Found in the Red House. He's too young to fight but encourages you before your quest. His innocence hides a future as Neegabla, the nihilistic ruler of Game 2.
- **Elder Moss** — The watcher. He found the old records mentioning the Elemental Box. Found near the Blue House. His urgency to retrieve the box hides a darker motive.
- **Elder Sage** — The scholar. He studies the life suits and believes the box holds the key. Found near the garden.
- **Elder Thorn** — The protector. He warns against recklessness but trusts the council's judgment. His loyalty will be tested.

## Elderville: Village Layout

Elderville is a **massive, sprawling settlement** divided into distinct districts, connected by winding dirt paths and wooden walkways:

### 1. The Upper Ward (Administrative Center)
- **The Blue House**: The largest building in Elderville, painted deep blue. This is where the Council of Elders gathers around a massive oak table and hearth. Confronting the elders here transforms the interior into a combat arena.
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

## Early Gameplay Loop

1. **Wake Up in Red House**: Minslaire starts in his home. Tinslaire is asleep or playing with a wooden toy.
   - **Tutorial**: Move around (WASD/arrows), talk to Tinslaire (E), exit the house (walk into door).

2. **Explore the Village**: Talk to villagers to learn about the life suits, the elders’ meeting, and the strange noises in the well.
   - **Optional**: Complete **Tinslaire’s Keepsake** (find his toy near the Grand Gardens) to unlock a hint about the elders’ betrayal (e.g., Tinslaire says, *"Elder Moss was acting weird yesterday…"*).

3. **Meet the Elders**:
   - Elder Moss near the Blue House gives the first mission: *"The council has called a meeting. Talk to Elder Sage."*
   - Elder Sage reveals the **Elemental Box** and its location in the Eastern Forest.
   - Elder Thorn warns: *"The forest is deadly. But if you’re to go, you’ll need to be prepared."*

4. **Side Quests (Required)**:
   - **The Well’s Echo**: Investigate the Central Well with Elder Moss. Discover mechanical rumblings (Scrap Bots stirring).
   - **Perimeter Sweep**: Assist Elder Moss by clearing 2 Scrap Drones near the Eastern Gate (first combat tutorial).
   - **Marketplace Supply Run**: Gather crops for the Bazaar. Introduces stamina management (sprinting with SHIFT).

5. **Enter the Forest**:
   - After completing side quests, Elder Thorn gives the final warning: *"The elders have made their decision. Retrieve the box, Minslaire."*
   - Walk through the Eastern Gate into the Eastern Forest (transition to next area).

## Houses and Resting

The village has two houses:

- **Blue House (center)** — Home to the Council of Elders. Step inside to recover.
- **Red House (west)** — Minslaire and Tinslaire's home. A small, quiet place with two beds and a table.

Walking into a door transports you inside, where you can:

- Recover **40 HP** automatically upon entering.
- Walk around the interior, which contains beds, tables, and bookcases.
- Exit by walking into the interior door to return to the village.

Resting is the only reliable way to recover health besides respawning.

## Death and Respawn

If your health drops to zero, your **life suit** revives you at the **Safe Camp** (inside the Red House) with full HP. **Only the player respawns**—defeated enemies remain defeated, so you won’t have to fight them again unless you restart the game.

## Objective

Follow the mission objectives in the top right corner to retrieve the Elemental Box. The yellow arrow always points you toward your next goal. Talk to the elders, fight through the forest, and bring the artifact home.
