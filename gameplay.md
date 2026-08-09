# Gameplay

> **Note:** This document describes the full vision for the *Minslaire* trilogy. Features will be added incrementally as development progresses.

## Overview

*Minslaire* is a classic top-down pixel-art action RPG with a whimsical tone and deep lore. You play as **Minslaire**, a young villager living with your younger brother **Tinslaire** in the red house west of the council's Blue House. The elders—who secretly activated the Scrap Bots to trigger the blue light beacon revealing the artifact's location—have tasked you with retrieving the **Elemental Box**. First you must kill the **Cave Machine** on the outskirts, drag its body back at their behest, and let them forge its remains into a **compass** — a brass disc with the machine's eye at its center that guides you to the Box, lets the elders speak to you remotely like a phone, and lets them see your position at all times.

This begins an epic trilogy:
- **Minslaire (The Betrayal):** The elders betray you, using the box to upgrade themselves. You blow up the box, granting everyone elemental powers, but only you and Tinslaire absorb all the elements. Tinslaire kills the elders, and you are blasted into a remote mountain village.
- **Minslaire II: Ascendence:** You wake up 5 years later to fight **Neegabla** (your nihilistic brother Tinslaire who overthrew the elders and wields all elements). After defeating him, you reconcile and vow to find life's purpose.
- **Minslaire III: Transcendence:** Your journey for purpose culminates in discovering the truth of Islam, the ultimate answer to your quest for meaning.

---

# Minslaire — The Betrayal: Complete Design

## Progression Model

Minslaire is built around **one loop** that deepens as it repeats:

1. **Learn** — talk to someone, hear the hum, find a new tool or technique.
2. **Help** — serve the village (side quests), earn trust and gear.
3. **Hunt** — push into the forest, fight the machines.
4. **Return** — bring something back (a lesson, a keepsake, the box — and first, the Cave Machine's body).
5. **The twist** — the loop's reward is stolen, and the story turns.

The player is guided by the **yellow arrow** and the **mission bar** (top right) — diegetically, the needle of the **compass** forged from the Cave Machine. Missed/optional content is marked with a soft white arrow instead of yellow (a weak compass signal).

## Act 1 — The Calling (Village, tutorial + prep)

### Opening: Wake in the Red House
- Spawn at the Red House interior. Two beds, father's sword in a glass case, the table with Tinslaire's wooden bird.
- **Opening cutscene:** the memory of your father's blade lesson (*purpose, the sheath, the fear of war*) plays as you get out of bed.
- **Tutorial beats (scripted, unmissable):**
  1. *Move* — walk to the window and back.
  2. *Talk* — interact with Tinslaire (E). He tells you the elders are at the door.
  3. *Open the door* — meet the elders. They ask you to investigate the **cave on the outskirts**.

### The Elders' Trials (character tests — before combat)
Before they hand you a sword, the elders test *who you are*, not what you can swing. Four small tasks, each quietly judging a virtue:

| Trial | Giver | Objective | Tests | Theme Seed |
|---|---|---|---|---|
| **The Well's Echo** | Elder Moss | Check the rope at the Central Well; find the rumble beneath | Observation; obedience (do you drop it?) | The elders are hiding something |
| **The Scholar's Request** | Elder Sage | Retrieve rare herbs / a stuck scroll from his study | Wits; patience | Knowledge is a trust, not a trophy |
| **The Widow's Task** | Elder Thorn | Carry grain / fetch water for Widow Oren | The heart; grace in service | Your strength is a debt; service without reward |
| **The Honest Change** | The Council | A trader overpays you at the Bazaar — keep it or return it? | Honesty | Integrity; being seen by something higher |

### The Elders' Test (combat tutorial)
Now they test your skills in the training clearing behind the Blue House:
- **Sword test (with Elder Thorn)** — attack, facing, cooldown. Cut down a row of dummies.
- **Bow test (with Elder Sage)** — aim, range. Still targets, then moving ones.
- **Dodge & block (with Elder Thorn)** — dodge rolls, blocking, stamina.
- *(First-time players learn all core combat here; the cave then demands they use it.)*

### The Cave (Act 1 boss — first machine)
Take your father's blade down from the case and enter the cave on the outskirts. It's dark — use your torch to see. Deeper and deeper, until two red eyes blink open in the dark. Defeat the **Cave Machine**. When it falls, do not leave it — the elders ordered you to **bring the body back intact**, no matter how heavy. Drag its chassis out of the cave and haul it to the village.

### The Compass (the elders' leash — diegetic guidance + remote link)
At the **Forge & Workshops**, Elder Sage salvages the Cave Machine's **core and red eye**. Using pre-WW3 records from the vault, he forges a **compass** — a brass disc with the eye set at its center, humming on the same frequency as the blue light beacon and the Elemental Box.

- **In-world yellow arrow:** The compass needle tugs toward the Box. When the Box is far, the arrow glows yellow and points off-screen; when near, it settles and disappears. A weak/optional signal appears as a soft white arrow.
- **Phone:** Crackling voice-link lets the elders speak to you in the forest ("Minslaire, can you hear me? Bear east at the fallen oak") and you can answer (E to transmit).
- **Tracker:** The vault beneath the Blue House has a map table where the elders see your position as a moving pin — they always know where you are. They gift it to you "for your safety."

*Theme Seed: guidance that pretends to love you — a false hum that will be answered by the true Guidance in Minslaire III.*

### Village Tasks (unlock the main chain)
> Three tasks the village needs before you go, completed after the compass is forged. They teach you to trust the needle before the forest expedition. They must be done to open the Eastern Gate.

| Quest | Giver | Objective | Teaches | Theme Seed |
|---|---|---|---|---|
| **Tinslaire's Keepsake** | Tinslaire | Find his wooden bird near the Grand Gardens (compass needle flutters) | Movement, E-interact, following the needle | Trust; love that returns |
| **Perimeter Sweep** | Elder Thorn | Defeat 2 Scrap Drones near the Eastern Gate (elders coach you over the compass) | First real combat against the scrap, voice-link tutorial | Your strength is a debt to the village |
| **Marketplace Supply Run** | Bazaar Trader | Carry crops from the Grand Gardens to the Market stalls | Stamina management, sprint | Provision; the hum guides you home |

### The Pre-Forest Hinge
After the village tasks, meet Elder Thorn at the **Watchtower** at night. He admits he voted against sending you and warns: *"Whatever is out there, Minslaire, it is not the danger. We are."* He glances at the compass on your belt. *"They can hear you. They can see where you stand. Remember that when you come back."* This is the first hard seed of the betrayal. The gate opens.

## Act 2 — The Forest (combat gauntlet)

Four linked zones with an escalating boss. The **compass guides you through all of them**, and the elders' voices crackle over it at intervals — encouragement, directions, and quiet observation you cannot turn off. Each zone ends with a **quiet beat** (a forced stop, a found object, a moment of stillness) that reinforces the themes without combat.

| Zone | Enemies | Mini/Boss | Quiet Beat |
|---|---|---|---|
| **The Outskirts** | Scrap Drones (x2–3) | — | A child's shoe in a mossy clearing (compass needle trembles) |
| **The Midden** | Rust Bots (x2), mixed drones | Rust Watcher (elite Rust Bot) | **The Stillness** — your suit *and* the compass go silent for one breath |
| **The River Crossing** | Drones + Rust Bots | **Heavy Mech** (boss) | The fallen bridge; the water below (elders go radio-silent) |
| **The Far Forest** | Vanguard Bots (x2–3), watchers | Vanguard patrol (two simultaneously) | The box's grove; the hum changes; compass spins |

### Boss: Heavy Mech
- 60 HP. Very slow, one-shots if it lands a hit.
- **Patterns:** (1) slow wind-up charge (dodge sideways), (2) sweeping arm arc (block), (3) exposed core after a miss (attack window).
- **Lesson:** patience. The fight is won by *not* swinging first.

### The Elemental Box (scripted scene)
- No combat. Walking to the pedestal triggers a cutscene: the grove goes silent, the suit's hum and the **compass eye dim**, then both lean toward the box. The compass needle spins wildly, then stops dead, pointing straight at the pedestal. The box opens on its own.
- The voice speaks: *"You were told this was a vessel of power... The ones who sent you will show you what they truly serve."*
- The return trip has **no random encounters** — the machines go still, as if waiting. The compass is dead weight on the way back, needle fixed, voices gone. This should feel *wrong*.

## Act 3 — The Ambush (the turn)

### The Blue House Confrontation
- Entering the Blue House with the box locks the doors and triggers the scene: Moss cold, Sage reading from the recovered vault screen, Thorn silent. On the vault map table, your pin is still blinking where you stand — they watched you the whole way home.
- **The Struggle (QT event):** Hold E to keep hold of the box. If released, the elders take it first (a failure variant that still leads to the detonation, just with the box in Moss's hands).
- **The Detonation (scripted):** The box explodes into elemental energy. Cutscene only. You and Tinslaire absorb all elements; the elders get fragments (Moss=fire/unstable, Sage=air/half-formed, Thorn=nothing).

### Boss: The Elders
- **Fight type:** Arena battle inside the Blue House (interior transforms into a combat arena).
- **Stages:**
  1. **Elder Moss** (fire, unstable) — telegraphed flame columns, staggers himself after each cast. 40 HP.
  2. **Elder Sage** (air, half-formed) — gusts that push you, but his own attacks knock him off-balance. 30 HP.
  3. **Elder Thorn** (no power) — fights with grief and a blade. He doesn't want to hurt you; his HP is the lowest (25) and he stops when Tinslaire arrives.
- **Cutscene:** Moss's final fire blast → **Tinslaire steps in front of it** → the elements answer his grief and the elders fall. Tinslaire's first kill is a mercy he did not intend.

### The Exile (epilogue)
- A wave of energy throws you out of the Blue House, over the hills. The compass shatters against the hearth, eye flickering out. Screen fades.
- **Wake:** remote mountain village, suit hums, wooden bird on your chest, Tinslaire absent.
- **Post-credits hook (text):** *"Five years later, in the ruins of the Blue House, a name is whispered: Neegabla."*

---

## Controls

| Action | Key(s) |
|--------|--------|
| Move | `WASD` or `Arrow Keys` |
| Attack (Sword) | `SPACE` or `J` |
| Shoot (Bow) | `K` *(design target)* |
| Dodge | `SHIFT` + Direction |
| Block | `R` |
| Interact / Talk | `E` |
| Compass Voice-link | Hold `E` (when compass equipped) to transmit |
| Sprint | `SHIFT` (while moving, when not dodging) |
| Enter / Exit Houses | Walk into a door tile |
| Advance/Close Dialogue | `SPACE` or `E` |

## Sound Effects

- **Life Suits**: A quiet, rhythmic hum (constant while active).
- **Compass**: A softer, higher hum that harmonizes with the suit when pointing true; crackling voice-link, needle tick.
- **Ambient Village**: Villagers chatting, children laughing, wind rustling, wooden creaks.
- **Central Well**: Mechanical rumblings (foreshadowing Scrap Bots).
- **Combat**: Sword slashes, enemy clanks, dodge rolls, blocking sounds.
- **Eastern Forest**: Wind howling, distant metallic scrapes, faint compass chatter from elders.
- **The Stillness**: In the Midden, *both* hums drop out for one breath — pure wind and heartbeat.
- **The Box**: A deep, breathing hum that overrides the suit's and compass hums during the grove scene.

## HUD

The user interface displays three important stats:

- **HP (Health)** — Reduced when enemies touch you. If it reaches zero, you respawn at the Safe Camp.
- **ST (Stamina)** — Used while sprinting or dodging. Recovers slowly over time when not in use.
- **Beasts Slain** — A running count of scrap bots you have defeated.
- **Mission Bar** (top right) — Shows your current objective and progress. Its yellow arrow is the **compass needle** — diegetic.
- **Soft goal marker (white arrow)** — optional/side content only (weak compass signal).

## Mission System

The game guides you through Elderville with a series of missions. A glowing **yellow arrow** — the compass needle — appears on screen pointing toward your current goal when it's off-screen. When you're near the objective, the arrow disappears.

### Minslaire Main Mission List (full chain)

| # | Mission | Description |
|---|---------|-------------|
| 1 | Speak with Tinslaire | Your brother tells you the elders are at the door. |
| 2 | Meet the Elders | Open the door. They ask you to investigate the cave on the outskirts. |
| 3 | The Elders' Trials | Pass the four small tests: the well, the scholar, the widow, the honest change. |
| 4 | The Elders' Test | Prove your sword and bow skills in the training clearing. |
| 5 | Investigate the Cave | Enter the cave on the outskirts. Slay the Cave Machine. |
| 6 | Bring Back the Body | Drag the Cave Machine's chassis back to the village Forge as ordered. |
| 7 | The Compass | Sage forges the compass from the machine's eye/core. Receive the voice-link and tracker. |
| 8 | Complete the Village Tasks | Help Tinslaire, the gate, and the marketplace — learn to follow the needle. *(opens the gate)* |
| 9 | Talk to Elder Thorn at the Watchtower | His warning at night — "They can hear you" — the gate opens. |
| 10 | Enter the Forest | Follow the compass into the eastern forest. Defeat 2 Scrap Drones. Elders watch and speak. |
| 11 | Push Deeper | Rust Bots guard the middle forest. Clear a path. |
| 12 | Cross the River | A Heavy Mech blocks the river crossing. Defeat it to proceed. |
| 13 | Reach the Far Forest | Vanguard Bots patrol the far side. Push through to find the box. Compass spins. |
| 14 | Find the Elemental Box | You've cleared the forest. Search for the artifact at the river's end. |
| 15 | Return to Elderville | You have the box. Bring it home — compass dead, elders silent. *(the ambush begins on arrival)* |
| 16 | The Blue House | Face the council. *(arena boss)* |
| 17 | The Exile | End of Minslaire. Compass shattered. |

## Combat

- Press `SPACE` or `J` to swing your sword in the direction you are facing.
  - Each slash deals **20 damage** and pushes enemies back slightly.
  - You cannot attack again until the cooldown finishes.
- **Bow:** Press `K` to draw and loose an arrow in the direction you are facing. Arrows deal **12 damage** and can hit from range, but take time to draw — you're vulnerable while aiming. *(Design target.)*
- **Dodge:** Press `SHIFT` + a direction to quickly roll in that direction. Grants brief invincibility (0.5 seconds) but consumes stamina.
- **Block:** Hold `R` to raise your guard. Reduces incoming damage by **50%** while active, but drains stamina slowly.
- Enemies take damage and flash red when hit.
- If an enemy touches you, you lose **12 HP** and become briefly invulnerable (unless blocking).
- Against formidable foes like the Heavy Mech guarding the river, mastering dodging and blocking is key to survival.
- Right before locating the Elemental Box in the far forest, you must survive a grueling combat gauntlet.
- **The final fight is not about skill alone** — it is a boss the story turns around. The Elders fight is the emotional and mechanical climax; the dodge/block muscle memory the player built against the machines is what lets them survive the council's elemental flailing.

## Enemy Types

| Enemy | HP | Speed | Behavior | Weakness |
|-------|----|-------|----------|----------|
| Scrap Drone | 20 | Fast | Floats through the forest and chases when close | Melee knocks them out of the air |
| Rust Bot | 35 | Slow | Sturdy walker that wanders until it spots you | Block their charges |
| Vanguard Bot | 40 | Medium | Agile sentinel found near the eastern river | Stagger if hit twice in quick succession |
| Heavy Mech | 60 | Very Slow | Powerful tank with high health; one-shots if it lands a hit | Dodge its charged attack |
| Cave Machine | 40 | Medium | The rusted bot in the cave, first in the village | Use the bow to chip it, the blade to finish |
| Rust Watcher | 45 | Slow | Elite Rust Bot guarding the Midden | Break its guard with two hits |
| Elder Moss | 40 | Medium | Fire columns, staggers after casting | Attack during his stagger |
| Elder Sage | 30 | Medium | Air gusts that push you | His attacks knock him off-balance |
| Elder Thorn | 25 | Fast | Blade fighter, grief-stricken | Outlast; he stops when Tinslaire arrives |

## Characters

- **Tinslaire** — Minslaire's younger brother. Found in the Red House. He's too young to fight but encourages you before your quest. His innocence hides a future as Neegabla, the nihilistic ruler of Minslaire II: Ascendence.
- **Elder Moss** — The watcher. He found the old records mentioning the Elemental Box. Found near the Blue House. His urgency to retrieve the box hides a darker motive. In Minslaire he is the architect of the betrayal and the first elder to fall. He orders the body retrieval and monitors your pin on the vault map.
- **Elder Sage** — The scholar. He studies the life suits and believes the box holds the key. Found near the garden. He deciphered the vault records, salvages the Cave Machine, and **forges the compass** — confirming the box's frequency. He reads the vault screen during the ambush.
- **Elder Thorn** — The protector. He warns against recklessness but trusts the council's judgment. His loyalty will be tested. He is the conflicted elder: he voted against sending you, warns you at the watchtower that the compass is a leash, and falls last—without power, holding only grief.

## Elderville: Village Layout

Elderville is a **massive, sprawling settlement** divided into distinct districts, connected by winding dirt paths and wooden walkways:

### 1. The Upper Ward (Administrative Center)
- **The Blue House**: The largest building in Elderville, painted deep blue. This is where the Council of Elders gathers around a massive oak table and hearth. Confronting the elders here transforms the interior into a combat arena.
- **The Council Archives**: A subterranean vault containing pre-WW3 records and the dual-function remote beacon used to trigger the Scrap Bots and reveal the Elemental Box. It also houses the **map table** where the compass's tracker pin glows, letting the elders see your position in the forest in real time. The records Elder Sage reads from in the ambush scene come from here.

### 2. The Residential Quarters (The Red District)
- **Minslaire & Tinslaire's House (Red House)**: A cozy, worn home with two beds and a family heirloom blade by the door. This is also the **Safe Camp**, where Minslaire respawns if defeated.
- **Neighboring Homesteads**: Dozens of wooden family homes where villagers live, sleep, and maintain their life suits.

### 3. The Agricultural Outskirts (Greenhouse Terraces)
- **The Grand Gardens**: Producing crop yields essential for village survival under the canopy.
- **The Central Well**: A deep water source near the treeline hiding strange mechanical reverberations. The source of the **Well's Echo** side quest.

### 4. The Artisan & Blacksmith District
- **The Forge & Workshops**: Where villagers repair tools, forge basic melee weapons, and craft gear for the brave ones venturing out. After the Cave, this is where **Elder Sage forges the compass** from the Machine's eye and core — the anvil still warm when he hands it to you.

### 5. The Eastern Gate & Guard Post
- **The Watchtower**: Stationed by Elder Moss, overlooking the barricaded border leading directly into the dangerous Eastern Forest. The starting point for the **Perimeter Sweep** side quest and the site of Elder Thorn's night warning about the compass.
- **The Eastern Gate**: A gap in the barricaded treeline. It opens only after all village quests and the compass is proven.

### 6. The Southern Marketplace & Bazaar
- **The Trading Post**: A lively plaza where villagers trade supplies, share rumors, and pick up local community tasks and side quests from the village board. The hub for the **Marketplace Supply Run** side quest.

## Early Gameplay Loop

1. **Wake Up in Red House**: Minslaire starts in his home. Tinslaire tells you the elders are at the door.
   - **Tutorial**: Move around (WASD/arrows), talk to Tinslaire (E), exit the door to meet the elders.
   - **Opening cutscene**: your father's blade lesson plays as you get out of bed.

2. **The Elders' Trials (character tests)**: Before combat, the elders test who you are:
   - **The Well's Echo** — find the rumble beneath the Central Well; Moss dismisses it.
   - **The Scholar's Request** — a small puzzle for Elder Sage.
   - **The Widow's Task** — serve Widow Oren for Elder Thorn.
   - **The Honest Change** — a trader overpays you; integrity is watched.

3. **The Elders' Test (combat tutorial)**: Sword, bow, dodge, and block against the training dummies behind the Blue House.

4. **The Cave (first boss) + The Body**: Enter the dark cave with your torch; fight the Cave Machine. **Drag its chassis back to the Forge** — elders insist it not be left behind.

5. **The Compass**: At the Forge, Elder Sage salvages the machine's eye/core and forges the **compass** — your yellow arrow, voice-link, and tracker. Practice following it.

6. **Village Tasks (before the forest)**:
   - **Tinslaire's Keepsake**: Find his wooden bird near the Grand Gardens — compass flutters.
   - **Perimeter Sweep**: Clear 2 Scrap Drones near the Eastern Gate (first combat with compass chatter).
   - **Marketplace Supply Run**: Gather crops for the Bazaar (stamina management).

7. **Enter the Forest**:
   - After the village tasks, Elder Thorn gives the final warning at the Watchtower — *"They can hear you."*
   - Walk through the Eastern Gate and follow the compass's pull into the Eastern Forest (transition to next area). The elders' voices will follow you.

## Houses and Resting

The village has two houses:

- **Blue House (center)** — Home to the Council of Elders. Step inside to recover.
- **Red House (west)** — Minslaire and Tinslaire's home. A small, quiet place with two beds and a table.

Walking into a door transports you inside, where you can:

- Recover **40 HP** automatically upon entering.
- Walk around the interior, which contains beds, tables, and bookcases.
- Exit by walking into the interior door to return to the village.

Resting is the only reliable way to recover health besides respawning.

> **Note:** Before Act 3, the Blue House interior is a rest area. Entering it with the box in Act 3 instead locks the doors and becomes the arena — a deliberate reversal of a safe space.

## Death and Respawn

If your health drops to zero, your **life suit** revives you at the **Safe Camp** (inside the Red House) with full HP. **Only the player respawns**—defeated enemies remain defeated, so you won't have to fight them again unless you restart the game.

> **Theme note:** This mechanic is *the* piece of the world that no one can explain, and it is the seam through which the truth of Minslaire III: Transcendence is sewn — mercy you did not earn, returning you when you could not return yourself. It is never spoken of as strange in the fiction; the player is simply left to wonder.

## Objective

Follow the compass's yellow arrow and the mission objectives in the top right corner to retrieve the Elemental Box. Talk to the elders over the link, fight through the forest while they watch, and bring the artifact home.
