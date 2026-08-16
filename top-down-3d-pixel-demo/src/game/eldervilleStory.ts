import { create } from "zustand";
import { rt } from "./state";

export const fatherMemoryLines = [
  "Everything and everyone has a purpose, which reflects their maker.",
  "Like this blade. It was made by me. It's designed for fighting — that's what it's for. But look.",
  "It has a sheath. And that sheath is made to show that it is not time for battle.",
  "I fear that one day, calamities might befall you. And it might just be... time for war.",
];

export type Dialog = { name: string; lines: string[] };

export const tinslaireInsideDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "You're up! The elders are at the door. The actual elders! They came to our house!",
    "They've been waiting since sunrise. You should go talk to them.",
    "And... don't forget father's blade. But not yet — they said not yet.",
  ],
};
export const tinslaireInsideRepeat: Dialog = { name: "Tinslaire", lines: ["Go on! The elders are waiting outside!"] };

export const tinslaireVillageDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "Brother! The village is so bright today. Have you seen the Grand Gardens?",
    "Elder Moss told me not to listen to the Central Well... but it really does hum.",
    "I'll be walking around the village. Come find me if you need me!",
  ],
};
export const tinslaireVillageRepeat: Dialog = {
  name: "Tinslaire",
  lines: ["Four trials with the elders, then the cave. You'll do great, Minslaire!"],
};

export const tinslaireNightDialog: Dialog = {
  name: "Tinslaire",
  lines: [
    "Yaaawn... it's getting dark outside, brother.",
    "The life suits hum louder at night, don't they?",
    "Make sure you get some rest before the trials tomorrow.",
  ],
};
export const tinslaireNightRepeat: Dialog = {
  name: "Tinslaire",
  lines: ["Goodnight, Minslaire! See you in the morning."],
};

export const elderMossDoorDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "Good morning, Minslaire. I'm sorry for the early visit.",
    "We heard sounds from the cave — the old one, just on the outskirts of town, where the forest begins. Something's stirring in there that shouldn't be.",
    "We'd look ourselves, but we're old, and our bones aren't for crawling. You're young, you're quick, you know every path in this village.",
    "But before we ask you to go in there — and we will — we need to know who you are.",
    "The elders test character before blade. Four small trials, to see what kind of person we are sending.",
    "Come find us in the village when you are ready. Moss watches the Central Well on the outskirts, Sage the Blue House study, Thorn the widow. And the Bazaar watches honesty.",
  ],
};
export const elderMossDoorRepeat: Dialog = {
  name: "Elder Moss",
  lines: ["We will not send you to the cave untested. Find us in the village — the trials await."],
};

// Trial 1 Dialogues (The Well's Echo)
export const elderMossWellIntroDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "Ah, Minslaire. Welcome to your first test of virtue: The Well's Echo.",
    "The Central Well is the heart of Elderville's water supply. Every drop we drink comes through its rope and bucket.",
    "Walk over to the well, inspect the rope mechanism, and report back to me what you observe. A keen eye and an obedient heart are what we test.",
  ],
};
export const elderMossWellAssignedRepeat: Dialog = {
  name: "Elder Moss",
  lines: ["Go inspect the rope at the Central Well just beside me. Let me know what you find."],
};
export const wellInspectDialog: Dialog = {
  name: "Central Well",
  lines: [
    "You lean over the mossy stone rim and inspect the rope and pulley...",
    "(CLANK... GRRRR... WHIRRR... HUMMM...)",
    "A low, metallic grinding reverberates from deep beneath the stone. Like heavy machinery turning in a hidden workshop...",
    "No hand-built village well should ever make a sound like this. You should report this to Elder Moss immediately.",
  ],
};
export const elderMossWellReportDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "You're back, Minslaire. Did you check the rope? What did you observe?",
    "(You describe the mechanical grinding and rhythmic clanking echoing beneath the well.)",
    "A grinding sound? Mechanical rumble? Nonsense. It's just the old underground water currents shifting against the bedrock.",
    "(He glances toward the Blue House, his face tensing sharply.)",
    "Nothing. There is nothing down there, Minslaire. Forget it.",
    "Still... your observation was thorough. You have passed the First Trial: The Well's Echo.",
    "Elder Sage awaits you outside the Council Hall for the Second Trial.",
  ],
};
export const elderMossWellCompletedRepeat: Dialog = {
  name: "Elder Moss",
  lines: ["You passed the First Trial. Forget the sound at the well — focus on Sage's trial at the Council Hall."],
};

// Trial 2 Dialogues (The Scholar's Request)
export const elderSageStudyIntroDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "Ah, Minslaire! Elder Moss told me you passed his trial at the Central Well.",
    "Now begins the Second Trial: The Scholar's Request. We test wits, patience, and reverence for the past.",
    "Inside the Council Hall, my ancient archive bookcase is locked by an elemental harmony mechanism. An irreplaceable bio-frequency scroll is wedged inside.",
    "Inspect my study desk inside for the harmony order, align the 4 elemental dials on the northern bookcase, and bring me the scroll intact.",
  ],
};
export const elderSageStudyAssignedRepeat: Dialog = {
  name: "Elder Sage",
  lines: ["Step inside the Council Hall. Check my study desk for the harmony order and solve the bookcase dials."],
};
export const scholarDeskClueDialog: Dialog = {
  name: "Scholar's Journal",
  lines: [
    "You inspect Elder Sage's research journal open on the study desk...",
    "The passage is titled 'The Harmonious Order of the World':",
    "'1. First, the Mountain Earth (Green) anchored the bedrock.'",
    "'2. Second, the Deep Ocean (Blue) filled the hollows.'",
    "'3. Third, the Molten Core (Red) warmed the bio-membrane.'",
    "'4. Fourth, the Golden Sun (Gold) illuminated the seal.'",
    "(Remember this 4-element sequence: Green -> Blue -> Red -> Gold)",
  ],
};
export const elderSageStudyDeliverDialog: Dialog = {
  name: "Elder Sage",
  lines: [
    "By the stars... you unlocked the ancient archive without damaging the fragile parchment!",
    "(He unrolls the pre-war scroll with trembling, reverent hands)",
    "Look at this diagram: 'Resonant bio-synthetic frequency: 432 Hz... matches the subterranean pulse.' This is pivotal.",
    "You proved that patience and intellect triumph over brute force. You have passed the Second Trial: The Scholar's Request!",
    "Now find Elder Thorn near the Western Homesteads for the Third Trial.",
  ],
};
export const elderSageStudyCompletedRepeat: Dialog = {
  name: "Elder Sage",
  lines: ["You passed the Second Trial! Elder Thorn awaits near the Western Homesteads for the Third Trial."],
};

// Trial 3 Dialogues (The Widow's Task)
export const elderThornIntroDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "Minslaire. The elders tested your eyes at the well, and your intellect in the study. Now I test your heart.",
    "Old Widow Oren lives in the western homestead. Her husband's life suit failed years ago, and she lives alone.",
    "She has a heavy sack of harvest grain waiting in the Grand Gardens that she cannot carry on her own.",
    "Go to the Grand Gardens crop terraces, lift the grain sack, and deliver it safely to Widow Oren's home. Strength in Elderville is a debt of service, not a privilege.",
  ],
};
export const elderThornAssignedRepeat: Dialog = {
  name: "Elder Thorn",
  lines: ["Go to the Grand Gardens, lift the grain sack, and bring it to Widow Oren in the western homestead."],
};
export const gardenGrainPickupDialog: Dialog = {
  name: "Harvest Grain",
  lines: [
    "You approach the heavy sack of golden harvest grain resting on the crop terrace...",
    "You lift the heavy sack onto your shoulder with firm resolve. Your life suit hums warmly, bracing against the weight.",
    "(Deliver the grain sack to Widow Oren inside the Farmer's Homestead)",
  ],
};
export const widowOrenDeliverDialog: Dialog = {
  name: "Widow Oren",
  lines: [
    "Oh, bless your noble heart, Minslaire! My poor knees ache so terribly with the cold air...",
    "You carried this entire sack all the way from the garden terraces?",
    "(She reaches into her worn apron pocket and pulls out 3 shiny silver coins)",
    "Please, take these silver coins. It is all I have left, but you have saved my winter.",
  ],
};
export const minslaireDeclineRewardDialog: Dialog = {
  name: "Minslaire",
  lines: [
    "Keep your silver, Mother Oren. As long as my life suit breathes, you will never carry grain alone.",
  ],
};
export const widowOrenBlessedDialog: Dialog = {
  name: "Widow Oren",
  lines: [
    "(Tears fill her gentle eyes as she clasps your hands)",
    "Your father possessed that exact same honorable soul, Minslaire. May the blessing of the ancients guard your steps.",
  ],
};
export const elderThornCompleteDialog: Dialog = {
  name: "Elder Thorn",
  lines: [
    "(Elder Thorn steps forward from the doorway, his weathered face filled with profound respect)",
    "You asked for no silver. You served a widow with honor, dignity, and grace.",
    "Your father would be deeply proud, Minslaire. You have passed the Third Trial: The Widow's Task!",
    "Only one trial remains: The Honest Change at the Southern Marketplace Bazaar.",
  ],
};
export const elderThornCompletedRepeat: Dialog = {
  name: "Elder Thorn",
  lines: ["You passed the Third Trial! Head to the Southern Marketplace for the Fourth Trial."],
};

// Trial 4 Dialogues (The Honest Change)
export const traderIntroDialog: Dialog = {
  name: "Bazaar Trader",
  lines: [
    "Welcome to the Elderville Bazaar, young wanderer! The Council sent word you need expedition provisions.",
    "Here is your pack of rations, climbing cord, and toolkits...",
    "(He counts out your payment pouch and accidentally hands you 50 EXTRA silver coins!)",
    "There you are, all squared away! Safe travels into the wilds!",
  ],
};
export const traderHonestyReturnDialog: Dialog = {
  name: "Bazaar Trader",
  lines: [
    "(You gently hand back the extra pouch of 50 silver coins, explaining the mistake.)",
    "By the heavens above... you returned fifty silver coins?!",
    "Most runners in the outer districts would have pocketed that without a second thought!",
    "The Council of Elders was observing from the arcade. You have passed the Fourth Trial: The Honest Change!",
    "Take this trader's blessing, Minslaire: 'The suit's hum will guide you home.' Now report to the Council Hall for your blade trial!",
  ],
};
export const traderCompletedRepeat: Dialog = {
  name: "Bazaar Trader",
  lines: ["May honor guide your blade, Minslaire! The Council gathers behind the Blue House to test your combat."],
};

// Combat Trial Dialogue (Behind Blue House)
export const councilCombatTrialDialog: Dialog = {
  name: "The Council of Elders",
  lines: [
    "Minslaire! You have proven your virtue across all four trials: Observation at the Well, Intellect in the Archives, Service for the Widow, and Integrity at the Bazaar.",
    "Now the Council tests your steel. In the training clearing behind the Blue House, three practice dummies stand ready.",
    "Elder Thorn will watch your footwork: STRIKE with SPACE toward your target, hold R to GUARD, and tap SHIFT to DODGE-ROLL — but mind your stamina, it fuels all three.",
    "Elder Sage has set archery boards beyond the dummies. Loose arrows with K — the blade is for when they get close; the bow is for when they don't.",
    "When the training dummies fall, you shall take your father's blade and enter the Outskirts Cave!",
  ],
};

// Outskirts Cave (Act 1 finale beat)
export const outskirtsCaveEnterDialog: Dialog = {
  name: "Outskirts Cave",
  lines: [
    "You hold a torch high and step past the cold stone teeth of the entrance.",
    "Deeper, the light flickers off wet rock. Deeper still — two red eyes blink open in the dark...",
    "— ACT I: THE CALLING — continues here —",
    "(End of the current expedition build. The Cave Machine awaits in the next update.)",
  ],
};

export const villageNPCsData: { id: string; name: string; tx: number; ty: number; color: string; dialog: Dialog; repeat: Dialog }[] = [
  {
    id: "tinslaire",
    name: "Tinslaire",
    tx: 12, ty: 13, color: "#4a90d9",
    dialog: tinslaireVillageDialog,
    repeat: tinslaireVillageRepeat,
  },
  {
    id: "elderMoss",
    name: "Elder Moss",
    tx: 59, ty: 35, color: "#8b7355",
    dialog: elderMossWellIntroDialog,
    repeat: elderMossWellAssignedRepeat,
  },
  {
    id: "elderSage",
    name: "Elder Sage",
    tx: 32, ty: 12, color: "#73558b",
    dialog: elderSageStudyIntroDialog,
    repeat: elderSageStudyAssignedRepeat,
  },
  {
    id: "elderThorn",
    name: "Elder Thorn",
    tx: 16, ty: 26, color: "#6b6b8b",
    dialog: elderThornIntroDialog,
    repeat: elderThornAssignedRepeat,
  },
  {
    id: "bazaarTrader",
    name: "Bazaar Trader",
    tx: 15, ty: 40, color: "#c07840",
    dialog: traderIntroDialog,
    repeat: traderIntroDialog,
  },
];

export const swordCaseDialog: Dialog = {
  name: "Sword Case",
  lines: ["Your father's blade...", "Encased in glass the day he and mother vanished.", "It waits for its master. Pass the trials, and the glass will open."],
};

// Door elders positions (village tiles around Red House door at [12, 10])
export const eldersAtDoorPositions = [
  { id: "elderMossDoor", name: "Elder Moss", tx: 11, ty: 11, color: "#8b7355" },
  { id: "elderSageDoor", name: "Elder Sage", tx: 13, ty: 11, color: "#73558b" },
  { id: "elderThornDoor", name: "Elder Thorn", tx: 12, ty: 12, color: "#6b6b8b" },
];

export type TrialState = "not_started" | "assigned" | "inspected" | "desk_read" | "puzzle_solved" | "grain_picked" | "delivered" | "overpaid" | "completed";

type ElderState = {
  openingBlack: boolean;
  memoryActive: boolean;
  memoryIndex: number;
  memoryDone: boolean;
  tinslaireInsideTalked: boolean;
  eldersAtDoorReady: boolean;
  eldersDoorDialogDone: boolean;
  // 4 Virtue Trials
  wellTrialState: TrialState;
  scholarTrialState: TrialState;
  widowTrialState: TrialState;
  marketTrialState: TrialState;
  combatTrialState: TrialState;
  dummiesHealth: number[];
  carryingGrain: boolean;
  hasSword: boolean;
  scholarPuzzleOpen: boolean;
  currentArea: string;
  currentInterior: string | null;
  hp: number;
  st: number;
  // dialog queue
  activeDialog: { name: string; lines: string[]; index: number } | null;
  dialogSourceId: string | null;
  spoken: Set<string>;
  // helpers
  startMemory: () => void;
  advanceDialog: () => void;
  showDialog: (dlg: Dialog, sourceId: string | null) => void;
  setArea: (area: string, interior: string | null) => void;
  setOpeningBlack: (v: boolean) => void;
  setWellTrialState: (v: TrialState) => void;
  setScholarTrialState: (v: TrialState) => void;
  setWidowTrialState: (v: TrialState) => void;
  setMarketTrialState: (v: TrialState) => void;
  setCombatTrialState: (v: TrialState) => void;
  setScholarPuzzleOpen: (v: boolean) => void;
  damageDummy: (index: number, dmg: number) => void;
};

export const useElder = create<ElderState>((set, get) => ({
  openingBlack: true,
  memoryActive: false,
  memoryIndex: 0,
  memoryDone: false,
  tinslaireInsideTalked: false,
  eldersAtDoorReady: false,
  eldersDoorDialogDone: false,
  wellTrialState: "not_started",
  scholarTrialState: "not_started",
  widowTrialState: "not_started",
  marketTrialState: "not_started",
  combatTrialState: "not_started",
  dummiesHealth: [60, 60, 60],
  carryingGrain: false,
  hasSword: false,
  scholarPuzzleOpen: false,
  currentArea: "home",
  currentInterior: "home",
  hp: 100,
  st: 100,
  activeDialog: null,
  dialogSourceId: null,
  spoken: new Set<string>(),

  startMemory: () => set({ memoryActive: true, memoryIndex: 0, activeDialog: { name: "Father", lines: fatherMemoryLines, index: 0 }, dialogSourceId: "fatherMemory" }),
  showDialog: (dlg, sourceId) => set({ activeDialog: { name: dlg.name, lines: dlg.lines, index: 0 }, dialogSourceId: sourceId }),
  setWellTrialState: (v) => set({ wellTrialState: v }),
  setScholarTrialState: (v) => set({ scholarTrialState: v }),
  setWidowTrialState: (v) => set({ widowTrialState: v }),
  setMarketTrialState: (v) => set({ marketTrialState: v }),
  setCombatTrialState: (v) => set({ combatTrialState: v }),
  setScholarPuzzleOpen: (v) => set({ scholarPuzzleOpen: v }),

  damageDummy: (index: number, dmg: number) => {
    const s = get();
    const nextH = [...s.dummiesHealth];
    nextH[index] = Math.max(0, nextH[index] - dmg);
    const allDefeated = nextH.every((h) => h <= 0);
    set({ dummiesHealth: nextH, combatTrialState: allDefeated ? "completed" : s.combatTrialState });
  },

  advanceDialog: () => {
    const s = get();
    if (!s.activeDialog) return;
    if (s.activeDialog.index < s.activeDialog.lines.length - 1) {
      set({ activeDialog: { ...s.activeDialog, index: s.activeDialog.index + 1 } });
      if (s.memoryActive) set({ memoryIndex: s.activeDialog.index + 1 });
    } else {
      // finished
      const src = s.dialogSourceId;
      const wasMemory = src === "fatherMemory";
      const wasTinslaireInside = src === "tinslaireInside";
      const wasMossDoor = src === "elderMossDoor";
      const wasWellInspect = src === "wellInspect";
      const wasMossWellIntro = src === "elderMossWellIntro";
      const wasMossWellReport = src === "elderMossWellReport";
      const wasSageStudyIntro = src === "elderSageStudyIntro";
      const wasScholarDeskClue = src === "scholarDeskClue";
      const wasSageStudyDeliver = src === "elderSageStudyDeliver";
      const wasThornIntro = src === "elderThornIntro";
      const wasGrainPickup = src === "gardenGrainPickup";
      const wasWidowDeliver = src === "widowDeliverFlow";
      const wasThornComplete = src === "elderThornComplete";
      const wasTraderIntro = src === "traderIntro";
      const wasTraderReturn = src === "traderReturn";
      const wasCouncilCombat = src === "councilCombatTrial";
      const wasSwordTaken = src === "swordTaken";

      const next: Partial<ElderState> = { activeDialog: null, dialogSourceId: null };
      if (wasMemory) { next.memoryActive = false; next.memoryDone = true; next.openingBlack = false; }
      if (wasSwordTaken) { next.hasSword = true; }
      if (wasTinslaireInside) { next.tinslaireInsideTalked = true; next.eldersAtDoorReady = true; }
      if (wasMossDoor) { next.eldersDoorDialogDone = true; }
      if (wasMossWellIntro) { next.wellTrialState = "assigned"; }
      if (wasWellInspect) { next.wellTrialState = "inspected"; }
      if (wasMossWellReport) { next.wellTrialState = "completed"; }
      if (wasSageStudyIntro) { next.scholarTrialState = "assigned"; }
      if (wasScholarDeskClue && (s.scholarTrialState === "assigned" || s.scholarTrialState === "not_started")) {
        next.scholarTrialState = "desk_read";
      }
      if (wasSageStudyDeliver) { next.scholarTrialState = "completed"; }
      if (wasThornIntro) { next.widowTrialState = "assigned"; }
      if (wasGrainPickup) { next.widowTrialState = "grain_picked"; next.carryingGrain = true; }
      if (wasWidowDeliver) { next.widowTrialState = "delivered"; next.carryingGrain = false; }
      if (wasThornComplete) { next.widowTrialState = "completed"; }
      if (wasTraderIntro) { next.marketTrialState = "overpaid"; }
      if (wasTraderReturn) { next.marketTrialState = "completed"; }
      if (wasCouncilCombat) { next.combatTrialState = "assigned"; }

      if (src) {
        const ns = new Set(s.spoken); ns.add(src);
        (next as any).spoken = ns;
      }
      set(next as any);
    }
  },
  setArea: (area, interior) => set({ currentArea: area, currentInterior: interior }),
  setOpeningBlack: (v) => set({ openingBlack: v }),
}));

export function isInside() {
  const s = useElder.getState();
  return s.currentArea !== "village";
}

const _offX = 72.5, _offZ = 75;
rt.player.pos.set(_offX + 4 + 0.5, 2, _offZ + 5 + 0.5);
rt.player.yaw = Math.PI;
