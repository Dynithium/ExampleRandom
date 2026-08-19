/**
 * The Act I quest spine — twelve trials, in one ordered, declarative list.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Progression used to be encoded as a scatter of ad-hoc conditionals across
 * EldervillePlayer (interaction gates), EldervilleHUD (objective text) and
 * ObjectiveMarker (the arrow), each re-deriving "where am I in the story" from
 * five independent trial-state enums. Three copies of the same ordering rule is
 * three chances to disagree, and they did: the training dummies could be felled
 * at minute one, which flipped combatTrialState straight to "completed" and let
 * you collect your father's blade and walk into the cave having done no trials
 * at all. That was patched with a one-off guard inside damageDummy.
 *
 * The fix is to stop expressing order implicitly. A trial is a row in TRIALS
 * below; a trial is *available* only when every earlier row is complete. Every
 * gate in the game asks this module, so there is exactly one ordering rule and
 * adding a thirteenth trial cannot silently open a hole in the twelfth.
 *
 * Each row owns:
 *   - `stages`, the ordered sub-steps that make it up (drives the HUD tracker),
 *   - `isDone`/`stageOf`, pure reads of the store,
 *   - `where`, the tile the objective marker points at for the current stage.
 *
 * Nothing here mutates state. The trials advance through the same dialog
 * state machine as before; this module only answers "may I?" and "what now?".
 */

import type { ElderState } from "./eldervilleStory";

export type TrialId =
  | "well"
  | "scholar"
  | "widow"
  | "market"
  | "watch"
  | "sluice"
  | "blight"
  | "tally"
  | "muster"
  | "scrap"
  | "blade"
  | "cave";

export type TrialKind = "observation" | "puzzle" | "service" | "integrity" | "combat" | "finale";

export type Trial = {
  id: TrialId;
  /** 1-based position in the spine; also the number shown in the HUD. */
  n: number;
  title: string;
  /** Who sets the task, for the HUD subtitle. */
  giver: string;
  kind: TrialKind;
  /** One line of flavour shown in the quest log. */
  blurb: string;
  /** Ordered sub-steps. The HUD shows `stages[stageOf(s)]`. */
  stages: string[];
  /** Current sub-step index, clamped to stages.length-1. */
  stageOf: (s: ElderState) => number;
  isDone: (s: ElderState) => boolean;
  /**
   * Objective location for the current stage.
   * `area` "village" means village tiles; anything else is an interior id and
   * the coordinates are interior tiles.
   */
  where: (s: ElderState) => { area: string; tx: number; ty: number } | null;
};

const V = (tx: number, ty: number) => ({ area: "village", tx, ty });
const I = (area: string, tx: number, ty: number) => ({ area, tx, ty });

/** Key locations, named once so the trials and the world agree. */
export const LOC = {
  redHouseDoor: [12, 10],
  councilDoor: [32, 10],
  homesteadADoor: [12, 28],
  granaryDoor: [26, 60],
  orchardDoor: [10, 42],
  watchhouseDoor: [44, 14],
  moss: [59, 35],
  sage: [32, 12],
  thorn: [16, 26],
  trader: [15, 40],
  well: [58, 36],
  grainSack: [30, 36],
  plaza: [44, 12],
  northWatch: [36, 4],
  dummies: [36, 6],
  bladeSpot: [36, 8],
  cistern: [44, 48],
  sluices: [[42, 46], [48, 46], [54, 46]],
  orchardRows: [[9, 38], [13, 40], [17, 38]],
  granaryYard: [30, 57],
  quarry: [64, 62],
  quarryRamp: [64, 56],
  caveMouth: [90, 8],
  forge: [52, 7],
} as const;

export const TRIALS: Trial[] = [
  {
    id: "well",
    n: 1,
    title: "The Well's Echo",
    giver: "Elder Moss",
    kind: "observation",
    blurb: "Check the rope at the Central Well. Report what you hear beneath it.",
    stages: [
      "Speak with Elder Moss at the Central Well",
      "Inspect the rope mechanism",
      "Report the grinding sound to Elder Moss",
    ],
    stageOf: (s) => (s.wellTrialState === "not_started" ? 0 : s.wellTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.wellTrialState === "completed",
    where: (s) =>
      s.wellTrialState === "assigned" ? V(...(LOC.well as unknown as [number, number])) : V(...(LOC.moss as unknown as [number, number])),
  },
  {
    id: "scholar",
    n: 2,
    title: "The Scholar's Request",
    giver: "Elder Sage",
    kind: "puzzle",
    blurb: "A sealed archive bookcase. Four elemental dials, one right order.",
    stages: [
      "Speak with Elder Sage outside the Council Hall",
      "Read the notes on Sage's study desk",
      "Solve the four-dial archive bookcase",
      "Bring the scroll back to Elder Sage",
    ],
    stageOf: (s) =>
      s.scholarTrialState === "not_started" ? 0 : s.scholarTrialState === "assigned" ? 1 : s.scholarTrialState === "desk_read" ? 2 : 3,
    isDone: (s) => s.scholarTrialState === "completed",
    where: (s) => {
      if (s.scholarTrialState === "not_started" || s.scholarTrialState === "puzzle_solved") return V(32, 12);
      if (s.currentArea === "council") return s.scholarTrialState === "desk_read" ? I("council", 7, 1) : I("council", 6, 4);
      return V(32, 10);
    },
  },
  {
    id: "widow",
    n: 3,
    title: "The Widow's Task",
    giver: "Elder Thorn",
    kind: "service",
    blurb: "Carry grain to Widow Oren. Nobody is paying you for it.",
    stages: [
      "Speak with Elder Thorn on the homestead path",
      "Lift the grain sack in the Grand Gardens",
      "Deliver it to Widow Oren",
      "Report back to Elder Thorn",
    ],
    stageOf: (s) =>
      s.widowTrialState === "not_started" ? 0 : s.widowTrialState === "assigned" && !s.carryingGrain ? 1 : s.carryingGrain ? 2 : 3,
    isDone: (s) => s.widowTrialState === "completed",
    where: (s) => {
      if (s.widowTrialState === "not_started" || s.widowTrialState === "delivered") return V(16, 26);
      if (s.carryingGrain) return s.currentArea === "homesteadA" ? I("homesteadA", 6, 6) : V(12, 28);
      return V(30, 36);
    },
  },
  {
    id: "market",
    n: 4,
    title: "The Honest Change",
    giver: "The Council",
    kind: "integrity",
    blurb: "The trader miscounts fifty silver in your favour. Tinslaire is watching.",
    stages: ["Trade at the Southern Bazaar", "Return the fifty extra silver"],
    stageOf: (s) => (s.marketTrialState === "not_started" ? 0 : 1),
    isDone: (s) => s.marketTrialState === "completed",
    where: () => V(15, 40),
  },
  {
    id: "watch",
    n: 5,
    title: "The Night Watch",
    giver: "Elder Thorn",
    kind: "observation",
    blurb: "Three signal braziers on the north rampart. Light them in the order the watchhouse ledger gives.",
    stages: [
      "Take the watch roster from the Plaza Watchhouse",
      "Light the three braziers in the ledger's order",
      "Report the completed watch to Elder Thorn",
    ],
    stageOf: (s) => (s.watchTrialState === "not_started" ? 0 : s.watchTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.watchTrialState === "completed",
    where: (s) => {
      if (s.watchTrialState === "not_started") return s.currentArea === "watchhouse" ? I("watchhouse", 7, 4) : V(44, 14);
      if (s.watchTrialState === "assigned") {
        const next = s.braziersLit.findIndex((b: boolean) => !b);
        const spots: [number, number][] = [[32, 4], [36, 4], [40, 4]];
        return V(...(spots[next < 0 ? 2 : next]));
      }
      return V(16, 26);
    },
  },
  {
    id: "sluice",
    n: 6,
    title: "The Dry Cistern",
    giver: "Elder Sage",
    kind: "puzzle",
    blurb: "The aqueduct runs but the cistern is empty. Three sluice gates, and only one pattern fills it.",
    stages: [
      "Speak with Elder Sage about the empty cistern",
      "Set the three sluice gates along the aqueduct",
      "Check the cistern head",
    ],
    stageOf: (s) => (s.sluiceTrialState === "not_started" ? 0 : s.sluiceTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.sluiceTrialState === "completed",
    where: (s) => {
      if (s.sluiceTrialState === "not_started") return V(32, 12);
      if (s.sluiceTrialState === "assigned") return V(...(LOC.sluices[0] as unknown as [number, number]));
      return V(44, 48);
    },
  },
  {
    id: "blight",
    n: 7,
    title: "The Blighted Rows",
    giver: "Widow Oren",
    kind: "service",
    blurb: "Something is killing the orchard from underneath. Find which rows, and why.",
    stages: [
      "Speak with the Orchard Keeper",
      "Inspect the three suspect rows",
      "Report which row carries the rot",
    ],
    stageOf: (s) => (s.blightTrialState === "not_started" ? 0 : s.blightTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.blightTrialState === "completed",
    where: (s) => {
      if (s.blightTrialState === "not_started") return s.currentArea === "orchardHut" ? I("orchardHut", 6, 6) : V(10, 42);
      if (s.blightTrialState === "assigned") {
        const next = s.rowsInspected.findIndex((r: boolean) => !r);
        return V(...(LOC.orchardRows[next < 0 ? 2 : next] as unknown as [number, number]));
      }
      return s.currentArea === "orchardHut" ? I("orchardHut", 6, 6) : V(10, 42);
    },
  },
  {
    id: "tally",
    n: 8,
    title: "The Short Tally",
    giver: "Elder Moss",
    kind: "puzzle",
    blurb: "The granary count is short. The ledger is not wrong, so someone is.",
    stages: [
      "Read the granary ledger",
      "Weigh the four sacks against it",
      "Name the discrepancy to Elder Moss",
    ],
    stageOf: (s) => (s.tallyTrialState === "not_started" ? 0 : s.tallyTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.tallyTrialState === "completed",
    where: (s) => {
      if (s.tallyTrialState === "completed") return V(...(LOC.moss as unknown as [number, number]));
      if (s.currentArea === "granary") return I("granary", 3, 5);
      return V(26, 60);
    },
  },
  {
    id: "muster",
    n: 9,
    title: "The Muster",
    giver: "Elder Thorn",
    kind: "combat",
    blurb: "Thorn drills you in the Plaza: guard, dodge, and strike on his call.",
    stages: [
      "Meet Elder Thorn at Founders' Plaza",
      "Complete the drill: guard, dodge, riposte",
      "Stand down",
    ],
    stageOf: (s) => (s.musterTrialState === "not_started" ? 0 : s.musterTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.musterTrialState === "completed",
    where: () => V(44, 12),
  },
  {
    id: "scrap",
    n: 10,
    title: "The Scrap in the Quarry",
    giver: "Elder Sage",
    kind: "combat",
    blurb: "Something dug itself out of the quarry face. It is still moving.",
    stages: [
      "Descend into the Quarry",
      "Destroy the scrap constructs",
      "Bring a fragment to Elder Sage",
    ],
    stageOf: (s) => (s.scrapTrialState === "not_started" ? 0 : s.scrapTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.scrapTrialState === "completed",
    where: (s) => (s.scrapTrialState === "completed" ? V(32, 12) : V(64, 62)),
  },
  {
    id: "blade",
    n: 11,
    title: "The Trial of Steel",
    giver: "The Council",
    kind: "combat",
    blurb: "The full Council watches you fell three dummies and clear the archery boards.",
    stages: [
      "Accept the blade trial from the Council",
      "Fell the three training dummies",
      "Take your father's blade from the Red House",
    ],
    stageOf: (s) => (s.combatTrialState === "not_started" ? 0 : s.combatTrialState === "assigned" ? 1 : 2),
    isDone: (s) => s.hasSword,
    where: (s) => {
      if (s.combatTrialState === "not_started") return V(36, 8);
      if (s.combatTrialState === "assigned") return V(36, 6);
      return s.currentArea === "home" ? I("home", 9, 3.5) : V(12, 10);
    },
  },
  {
    id: "cave",
    n: 12,
    title: "The Outskirts Cave",
    giver: "Elder Moss",
    kind: "finale",
    blurb: "Whatever is down there, bring it back. All of it.",
    stages: [
      "Enter the Outskirts Cave",
      "Find what is making the sound",
      "Destroy the Cave Machine",
      "Do not leave the body — carry it to the Forge",
    ],
    stageOf: (s) =>
      s.caveStage === "not_entered" ? 0 : s.caveStage === "entered" ? 1 : s.caveStage === "boss_awake" ? 2 : 3,
    isDone: (s) => s.hasCompass,
    where: (s) => {
      if (s.currentArea === "cave") {
        if (s.carryingBody) return I("cave", 7, 21);
        if (s.caveStage === "boss_awake") return I("cave", 7.5, 3.5);
        if (s.caveStage === "entered") return I("cave", 7, 6);
        return null;
      }
      if (s.carryingBody) return V(52, 7);
      return V(90, 8);
    },
  },
];

export const TRIAL_COUNT = TRIALS.length;

export const trialById = (id: TrialId): Trial => {
  const t = TRIALS.find((x) => x.id === id);
  if (!t) throw new Error(`unknown trial: ${id}`);
  return t;
};

/** How many trials are fully complete. */
export function completedCount(s: ElderState): number {
  let n = 0;
  for (const t of TRIALS) {
    if (!t.isDone(s)) break;
    n++;
  }
  return n;
}

/** The trial the player should be working on, or null once Act I is done. */
export function activeTrial(s: ElderState): Trial | null {
  for (const t of TRIALS) if (!t.isDone(s)) return t;
  return null;
}

/**
 * The single ordering rule. A trial may be started or advanced only when every
 * trial before it in the spine is finished.
 *
 * Every interaction gate in the game routes through this, so a player cannot
 * reach trial 11's dummies during trial 2 no matter what order they walk in.
 */
export function isUnlocked(s: ElderState, id: TrialId): boolean {
  for (const t of TRIALS) {
    if (t.id === id) return true;
    if (!t.isDone(s)) return false;
  }
  return false;
}

/** True when this trial is the one currently in progress. */
export function isActive(s: ElderState, id: TrialId): boolean {
  const a = activeTrial(s);
  return !!a && a.id === id;
}

/**
 * Flavour for an NPC who has a task for you but not yet — used so a locked
 * giver says something in character instead of repeating their intro dialog.
 */
export function lockedHint(s: ElderState, id: TrialId): string {
  const idx = TRIALS.findIndex((t) => t.id === id);
  const blocking = TRIALS.slice(0, idx).find((t) => !t.isDone(s));
  if (!blocking) return "";
  return `Finish ${blocking.title} first — ${blocking.giver} is waiting on you.`;
}
