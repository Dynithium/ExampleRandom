import { rt, useUI } from "./state";
import { useElder } from "./eldervilleStory";
import { sfx } from "./audio";

const SAVE_KEY = "minslaire_save_slot_1";

export type SaveData = {
  version: number;
  timestamp: number;
  player: {
    x: number;
    y: number;
    z: number;
    yaw: number;
  };
  elderState: {
    openingBlack: boolean;
    memoryActive: boolean;
    memoryIndex: number;
    memoryDone: boolean;
    tinslaireInsideTalked: boolean;
    eldersAtDoorReady: boolean;
    eldersDoorDialogDone: boolean;
    wellTrialState: string;
    scholarTrialState: string;
    widowTrialState: string;
    marketTrialState: string;
    combatTrialState: string;
    dummiesHealth: number[];
    carryingGrain: boolean;
    hasSword: boolean;
    currentArea: string;
    currentInterior: string | null;
    hp: number;
    st: number;
    spoken: string[];
  };
  env: {
    time: number;
  };
  ui: {
    pixel: number;
    scanlines: boolean;
    muted: boolean;
    daySpeed: number;
  };
};

export function saveGame(key = SAVE_KEY): boolean {
  try {
    const elder = useElder.getState();
    const ui = useUI.getState();
    const data: SaveData = {
      version: 1,
      timestamp: Date.now(),
      player: {
        x: rt.player.pos.x,
        y: rt.player.pos.y,
        z: rt.player.pos.z,
        yaw: rt.player.yaw,
      },
      elderState: {
        openingBlack: elder.openingBlack,
        memoryActive: elder.memoryActive,
        memoryIndex: elder.memoryIndex,
        memoryDone: elder.memoryDone,
        tinslaireInsideTalked: elder.tinslaireInsideTalked,
        eldersAtDoorReady: elder.eldersAtDoorReady,
        eldersDoorDialogDone: elder.eldersDoorDialogDone,
        wellTrialState: elder.wellTrialState,
        scholarTrialState: elder.scholarTrialState,
        widowTrialState: elder.widowTrialState,
        marketTrialState: elder.marketTrialState,
        combatTrialState: elder.combatTrialState,
        dummiesHealth: elder.dummiesHealth,
        carryingGrain: elder.carryingGrain,
        hasSword: elder.hasSword,
        currentArea: elder.currentArea,
        currentInterior: elder.currentInterior,
        hp: elder.hp,
        st: elder.st,
        spoken: Array.from(elder.spoken),
      },
      env: {
        time: rt.env.time,
      },
      ui: {
        pixel: ui.pixel,
        scanlines: ui.scanlines,
        muted: ui.muted,
        daySpeed: ui.daySpeed,
      },
    };
    localStorage.setItem(key, JSON.stringify(data));
    sfx.questComplete();
    return true;
  } catch (err) {
    console.error("Save failed:", err);
    return false;
  }
}

export function loadGame(key = SAVE_KEY): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data: SaveData = JSON.parse(raw);

    // restore player
    rt.player.pos.set(data.player.x, data.player.y, data.player.z);
    rt.player.yaw = data.player.yaw;

    // restore env
    rt.env.time = data.env.time;

    // restore elder state
    useElder.setState({
      openingBlack: data.elderState.openingBlack,
      memoryActive: data.elderState.memoryActive,
      memoryIndex: data.elderState.memoryIndex,
      memoryDone: data.elderState.memoryDone,
      tinslaireInsideTalked: data.elderState.tinslaireInsideTalked,
      eldersAtDoorReady: data.elderState.eldersAtDoorReady,
      eldersDoorDialogDone: data.elderState.eldersDoorDialogDone,
      wellTrialState: data.elderState.wellTrialState as any,
      scholarTrialState: data.elderState.scholarTrialState as any,
      widowTrialState: data.elderState.widowTrialState as any,
      marketTrialState: data.elderState.marketTrialState as any,
      combatTrialState: data.elderState.combatTrialState as any,
      dummiesHealth: data.elderState.dummiesHealth || [60, 60, 60],
      carryingGrain: data.elderState.carryingGrain,
      hasSword: data.elderState.hasSword,
      currentArea: data.elderState.currentArea,
      currentInterior: data.elderState.currentInterior,
      hp: data.elderState.hp,
      st: data.elderState.st,
      spoken: new Set(data.elderState.spoken || []),
      activeDialog: null,
      dialogSourceId: null,
      scholarPuzzleOpen: false,
    });

    // restore ui settings
    useUI.setState({
      pixel: data.ui.pixel,
      scanlines: data.ui.scanlines,
      muted: data.ui.muted,
      daySpeed: data.ui.daySpeed,
      started: true,
      pauseMenu: false,
    });

    sfx.questComplete();
    return true;
  } catch (err) {
    console.error("Load failed:", err);
    return false;
  }
}

export function hasSave(key = SAVE_KEY): boolean {
  try {
    return !!localStorage.getItem(key);
  } catch {
    return false;
  }
}

export function deleteSave(key = SAVE_KEY): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getSaveSummary(key = SAVE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data: SaveData = JSON.parse(raw);
    const date = new Date(data.timestamp).toLocaleString();
    let trials = 0;
    if (data.elderState.wellTrialState === "completed") trials++;
    if (data.elderState.scholarTrialState === "completed") trials++;
    if (data.elderState.widowTrialState === "completed") trials++;
    if (data.elderState.marketTrialState === "completed") trials++;

    const mins = Math.floor(data.env.time * 24 * 60);
    const hh = Math.floor(mins / 60);
    const mm = Math.floor((mins % 60) / 10) * 10;
    const clock = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

    const loc = data.elderState.currentArea === "village" ? "Elderville" : data.elderState.currentInterior || "Interior";

    return {
      date,
      trialsPassed: trials,
      location: loc,
      hp: data.elderState.hp,
      clock,
    };
  } catch {
    return null;
  }
}

export function startNewGame(): void {
  // reset to fresh initial state in bedroom
  const offX = 72.5, offZ = 75;
  rt.player.pos.set(offX + 4 + 0.5, 2, offZ + 5 + 0.5);
  rt.player.yaw = Math.PI;
  rt.env.time = 0.26;

  useElder.setState({
    openingBlack: false,
    memoryActive: false,
    memoryIndex: 0,
    memoryDone: true,
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
  });

  useUI.setState({
    started: true,
    pauseMenu: false,
  });
}
