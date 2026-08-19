import { rt, useUI } from "./state";
import { useElder } from "./eldervilleStory";
import { sfx } from "./audio";

const SAVE_KEY = "minslaire_save_slot_1";

/**
 * Bumped to 2 when Act I went from four trials to twelve: the elderState shape
 * gained the trial-5..10 fields, and a v1 save spread into the new store would
 * leave those undefined — the quest spine would then read `undefined` trial
 * states and strand the player. loadGame refuses anything that isn't this.
 */
const SAVE_VERSION = 2;

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
    watchTrialState: string;
    braziersLit: boolean[];
    watchOrder: number[];
    sluiceTrialState: string;
    sluiceGates: number[];
    blightTrialState: string;
    rowsInspected: boolean[];
    blightRow: number;
    tallyTrialState: string;
    sacksWeighed: boolean[];
    musterTrialState: string;
    musterStep: number;
    scrapTrialState: string;
    scrapHealth: number[];
    carryingGrain: boolean;
    hasSword: boolean;
    scholarDials: number[];
    caveStage: string;
    bossHp: number;
    carryingBody: boolean;
    hasCompass: boolean;
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
      version: SAVE_VERSION,
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
        watchTrialState: elder.watchTrialState,
        braziersLit: elder.braziersLit,
        watchOrder: elder.watchOrder,
        sluiceTrialState: elder.sluiceTrialState,
        sluiceGates: elder.sluiceGates,
        blightTrialState: elder.blightTrialState,
        rowsInspected: elder.rowsInspected,
        blightRow: elder.blightRow,
        tallyTrialState: elder.tallyTrialState,
        sacksWeighed: elder.sacksWeighed,
        musterTrialState: elder.musterTrialState,
        musterStep: elder.musterStep,
        scrapTrialState: elder.scrapTrialState,
        scrapHealth: elder.scrapHealth,
        carryingGrain: elder.carryingGrain,
        hasSword: elder.hasSword,
        scholarDials: elder.scholarDials,
        caveStage: elder.caveStage,
        bossHp: elder.bossHp,
        carryingBody: elder.carryingBody,
        hasCompass: elder.hasCompass,
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
    // version was written on every save but never checked, so a save from an
    // older/incompatible build would be spread into the store and fail in
    // half-applied pieces. Refuse it instead.
    if (data?.version !== SAVE_VERSION || !data.player || !data.elderState || !data.env) {
      console.warn("Save ignored: unsupported format", data?.version);
      return false;
    }

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
      // Trials 5-10. These are written by saveGame and MUST be read back here:
      // omitting them silently rolled a loaded game back to the end of trial 4,
      // because the quest spine derives the active trial purely from these
      // fields. Every one is defaulted so a partially-written save degrades to
      // "that trial not started" rather than to `undefined`, which the spine
      // would read as neither done nor in progress.
      watchTrialState: (data.elderState.watchTrialState as any) || "not_started",
      braziersLit: data.elderState.braziersLit ?? [false, false, false],
      watchOrder: data.elderState.watchOrder ?? [0, 2, 1],
      sluiceTrialState: (data.elderState.sluiceTrialState as any) || "not_started",
      sluiceGates: data.elderState.sluiceGates ?? [0, 0, 0],
      blightTrialState: (data.elderState.blightTrialState as any) || "not_started",
      rowsInspected: data.elderState.rowsInspected ?? [false, false, false],
      blightRow: data.elderState.blightRow ?? 1,
      tallyTrialState: (data.elderState.tallyTrialState as any) || "not_started",
      sacksWeighed: data.elderState.sacksWeighed ?? [false, false, false, false],
      musterTrialState: (data.elderState.musterTrialState as any) || "not_started",
      musterStep: data.elderState.musterStep ?? 0,
      scrapTrialState: (data.elderState.scrapTrialState as any) || "not_started",
      scrapHealth: data.elderState.scrapHealth ?? [40, 40, 40],
      carryingGrain: data.elderState.carryingGrain,
      hasSword: data.elderState.hasSword,
      scholarDials: data.elderState.scholarDials ?? [2, 0, 3, 1],
      caveStage: (data.elderState.caveStage as any) || "not_entered",
      bossHp: data.elderState.bossHp ?? 40,
      carryingBody: data.elderState.carryingBody,
      hasCompass: data.elderState.hasCompass,
      currentArea: data.elderState.currentArea,
      currentInterior: data.elderState.currentInterior,
      hp: data.elderState.hp,
      st: data.elderState.st,
      spoken: new Set(data.elderState.spoken || []),
      activeDialog: null,
      dialogSourceId: null,
      scholarPuzzleOpen: false,
    });

    // The opening flashback is driven entirely by activeDialog, which we clear
    // above (a saved dialog cursor can't be meaningfully resumed). Restoring
    // memoryActive/openingBlack without it left the player staring at a black
    // screen with no dialog to advance and no way out. If a save was taken mid
    // cutscene, treat the cutscene as finished.
    const restored = useElder.getState();
    if (restored.memoryActive || restored.openingBlack) {
      useElder.setState({
        memoryActive: false,
        openingBlack: false,
        memoryDone: true,
      });
    }

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

    const loc =
      data.elderState.currentArea === "village"
        ? "Elderville"
        : data.elderState.currentArea === "cave"
          ? "Outskirts Cave"
          : data.elderState.currentInterior || "Interior";

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
    watchTrialState: "not_started",
    braziersLit: [false, false, false],
    watchOrder: [0, 2, 1],
    sluiceTrialState: "not_started",
    sluiceGates: [0, 0, 0],
    blightTrialState: "not_started",
    rowsInspected: [false, false, false],
    blightRow: 1,
    tallyTrialState: "not_started",
    sacksWeighed: [false, false, false, false],
    musterTrialState: "not_started",
    musterStep: 0,
    scrapTrialState: "not_started",
    scrapHealth: [40, 40, 40],
    carryingGrain: false,
    hasSword: false,
    scholarDials: [2, 0, 3, 1],
    caveStage: "not_entered",
    bossHp: 40,
    carryingBody: false,
    hasCompass: false,
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
