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

export const elderMossDoorDialog: Dialog = {
  name: "Elder Moss",
  lines: [
    "Good morning, Minslaire. I'm sorry for the early visit.",
    "We heard sounds from the cave — the old one, just on the outskirts of town, where the forest begins. Something's stirring in there that shouldn't be.",
    "We'd look ourselves, but we're old, and our bones aren't for crawling. You're young, you're quick, you know every path in this village.",
    "But before we ask you to go in there — and we will — we need to know who you are.",
    "The elders test character before blade. Four small trials, to see what kind of person we are sending.",
    "Come to the Blue House when you are ready. Moss will watch the Well, Sage his study, Thorn the widow. And the Bazaar watches honesty.",
  ],
};
export const elderMossDoorRepeat: Dialog = {
  name: "Elder Moss",
  lines: ["We will not send you to the cave untested. Find us at the Blue House — the trials await."],
};

export const villageNPCsData: { id: string; name: string; tx: number; ty: number; color: string; dialog: Dialog; repeat: Dialog }[] = [
  {
    id: "tinslaire",
    name: "Tinslaire",
    tx: 30, ty: 10, color: "#4a90d9",
    dialog: { name: "Tinslaire", lines: ["Brother! You talked to them, right? What did they say?", "Trials first? That sounds like Moss. He always watches.", "You'll pass. You always do. Then... the cave."] },
    repeat: { name: "Tinslaire", lines: ["Four trials, then the cave. I'll be here."] },
  },
  {
    id: "elder1",
    name: "Elder Marcus",
    tx: 8, ty: 9, color: "#8b7355",
    dialog: { name: "Elder Marcus", lines: ["Ah, Minslaire. You spoke with the council at your door.", "Moss speaks of the cave, but Sage and I speak of you. Who you are matters more than what you swing.", "We test character before blade. Four small trials, Minslaire. Come find us when you are ready."] },
    repeat: { name: "Elder Marcus", lines: ["Four trials, then the cave. Find us at the Blue House."] },
  },
  {
    id: "elder2",
    name: "Elder Sarah",
    tx: 23, ty: 14, color: "#73558b",
    dialog: { name: "Elder Sarah", lines: ["The old records can wait. First, we watch how you watch.", "The Well, the study, the widow's table, the Trader's purse — each sees a different part of you.", "Pass them, and we will trust you with steel."] },
    repeat: { name: "Elder Sarah", lines: ["The trials await. Speak at the Well, the study, the widow, the Bazaar."] },
  },
];

export const swordCaseDialog: Dialog = {
  name: "Sword Case",
  lines: ["Your father's blade...", "Encased in glass the day he and mother vanished.", "It waits for its master. Not yet."],
};

// Door elders positions (village tiles)
export const eldersAtDoorPositions = [
  { id: "elderMossDoor", name: "Elder Moss", tx: 29, ty: 8, color: "#8b7355" },
  { id: "elderSageDoor", name: "Elder Sage", tx: 31, ty: 8, color: "#73558b" },
  { id: "elderThornDoor", name: "Elder Thorn", tx: 30, ty: 9, color: "#6b6b8b" },
];

type ElderState = {
  openingBlack: boolean;
  memoryActive: boolean;
  memoryIndex: number;
  memoryDone: boolean;
  tinslaireInsideTalked: boolean;
  eldersAtDoorReady: boolean;
  eldersDoorDialogDone: boolean;
  currentArea: string; // 'village' | interior key
  currentInterior: string | null;
  hp: number;
  st: number;
  // dialog queue (FireRed style)
  activeDialog: { name: string; lines: string[]; index: number } | null;
  dialogSourceId: string | null; // to mark spoken
  spoken: Set<string>;
  // helpers
  startMemory: () => void;
  advanceDialog: () => void;
  showDialog: (dlg: Dialog, sourceId: string | null) => void;
  setArea: (area: string, interior: string | null) => void;
  setOpeningBlack: (v: boolean) => void;
};

export const useElder = create<ElderState>((set, get) => ({
  openingBlack: true,
  memoryActive: false,
  memoryIndex: 0,
  memoryDone: false,
  tinslaireInsideTalked: false,
  eldersAtDoorReady: false,
  eldersDoorDialogDone: false,
  currentArea: "home", // start inside Red House
  currentInterior: "home",
  hp: 100,
  st: 100,
  activeDialog: null,
  dialogSourceId: null,
  spoken: new Set<string>(),

  startMemory: () => set({ memoryActive: true, memoryIndex: 0, activeDialog: { name: "Father", lines: fatherMemoryLines, index: 0 }, dialogSourceId: "fatherMemory" }),
  showDialog: (dlg, sourceId) => set({ activeDialog: { name: dlg.name, lines: dlg.lines, index: 0 }, dialogSourceId: sourceId }),
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
      const next: Partial<ElderState> = { activeDialog: null, dialogSourceId: null };
      if (wasMemory) { next.memoryActive = false; next.memoryDone = true; next.openingBlack = false; }
      if (wasTinslaireInside) { next.tinslaireInsideTalked = true; next.eldersAtDoorReady = true; }
      if (wasMossDoor) { next.eldersDoorDialogDone = true; }
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

// helper to get elderville world pos (same as world.ts villageGx/Gz but duplicated to avoid circular)
export function isInside() {
  const s = useElder.getState();
  return s.currentArea !== "village";
}

// set initial spawn inside home interior (-3, 0.5) — same offset as InteriorRoom
const _offX = 42.5, _offZ = 45;
rt.player.pos.set(_offX + 4 + 0.5, 2, _offZ + 5 + 0.5);
rt.player.yaw = Math.PI;
