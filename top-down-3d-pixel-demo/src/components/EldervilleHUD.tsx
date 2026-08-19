import { useEffect, useState } from "react";
import { useElder } from "../game/eldervilleStory";
import { activeTrial, completedCount, TRIAL_COUNT } from "../game/quests";
import { rt, useUI } from "../game/state";
import { MemoryCutsceneOverlay } from "../game/MemoryCutscene3D";
import { ScholarPuzzleModal } from "./ScholarPuzzleModal";
import { PixelPortrait } from "./PixelPortraits";

// FireRed / Golden Ornate dialog box with authentic pixel art character portraits
function DialogBox({ name, line, index, total }: { name: string; line: string; index: number; total: number }) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 w-[min(720px,96vw)] -translate-x-1/2 font-pixel">
      <div
        className="relative rounded-[6px] border-[3px] border-[#203868] bg-[#f0e8c8] p-[3px]"
        style={{ boxShadow: "0 0 0 2px #181818, 0 8px 24px rgba(0,0,0,0.6)" }}
      >
        <div className="flex gap-3.5 border-2 border-[#4868a0] bg-[#f0e8c8] p-3.5">
          {/* Authentic Pixel Art Character Portrait */}
          <PixelPortrait name={name} />

          {/* Text Content */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-1 text-[11px] font-bold tracking-widest text-[#2868c0]">{name.toUpperCase()}</div>
              <div className="text-[10.5px] leading-[1.7] text-[#181818]" style={{ fontFamily: "monospace" }}>
                {line}
              </div>
            </div>
            <div className="mt-2 text-right text-[7.5px] font-bold text-[#687888]">
              PAGE {index + 1}/{total} <span className="ml-2 inline-block animate-pulse text-[#2868c0]">▼</span> [PRESS E / CLICK]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpeningBlack({ onWake }: { onWake: () => void }) {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#181818] font-pixel">
      <div className="text-center">
        <div className="text-[16px] font-bold tracking-widest text-[#ffd75e]" style={{ fontFamily: "monospace" }}>
          You wake to the hum.
        </div>
        <div className="mt-2 text-[11px] text-[#7f92c4]" style={{ fontFamily: "monospace" }}>
          Your life suit warms to your skin before you open your eyes.
        </div>
        {blink && (
          <div className="mt-7 text-[12px] font-bold text-[#98d0f8]" style={{ fontFamily: "monospace" }}>
            [ PRESS E TO WAKE ]
          </div>
        )}
      </div>
      {/* dust motes drifting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/3 h-1.5 w-1.5 bg-[#f0e8c8] opacity-40 animate-pulse" />
        <div className="absolute left-2/3 top-1/2 h-1.5 w-1.5 bg-[#f0e8c8] opacity-30 animate-pulse" />
        <div className="absolute left-1/2 top-2/3 h-1.5 w-1.5 bg-[#f0e8c8] opacity-50 animate-pulse" />
      </div>
      <button onClick={onWake} className="absolute inset-0" aria-label="wake" />
    </div>
  );
}

export function EldervilleHUD() {
  const started = useUI((s) => s.started);
  const openingBlack = useElder((s) => s.openingBlack);
  const memoryActive = useElder((s) => s.memoryActive);
  const memoryIndex = useElder((s) => s.memoryIndex);
  const activeDialog = useElder((s) => s.activeDialog);
  const tinslaireInsideTalked = useElder((s) => s.tinslaireInsideTalked);
  const eldersDoorDialogDone = useElder((s) => s.eldersDoorDialogDone);
  const scholarPuzzleOpen = useElder((s) => s.scholarPuzzleOpen);
  const currentArea = useElder((s) => s.currentArea);
  const currentInterior = useElder((s) => s.currentInterior);
  const hp = useElder((s) => s.hp);
  const st = useElder((s) => s.st);
  const advanceDialog = useElder((s) => s.advanceDialog);
  const elder = useElder((s) => s);
  const locationName = currentArea === "village" ? "Elderville Settlement" : currentInterior ? ({ home: "Your Home", council: "Council Hall", homesteadA: "Farmer's Homestead (Widow Oren)", homesteadB: "Weaver's Homestead", granary: "The Granary", orchardHut: "Orchard Keeper's Hut", watchhouse: "Plaza Watchhouse", cave: "Outskirts Cave (Depths)" } as any)[currentInterior] || currentArea : currentArea;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && !e.repeat) {
        const s = useElder.getState();
        if (s.openingBlack && !s.memoryActive) {
          e.preventDefault();
          useUI.getState().start();
          s.startMemory();
        } else if (s.memoryActive && s.activeDialog) {
          // EldervillePlayer is unmounted during the memory cutscene, so the
          // normal interact path never runs — advance from here instead.
          e.preventDefault();
          rt.input.interact = false;
          s.advanceDialog();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // If on Title Screen, do not render HUD or opening black
  if (!started) return null;

  // ---- Objective, derived from the single quest spine ---------------------
  // This used to be a 25-branch if/else that re-encoded the trial order a third
  // time (after the interaction gates and the objective marker). It now reads
  // quests.ts, so the tracker and the gates cannot drift apart.
  // Subscribe to the store (not getState()) so the tracker re-renders whenever
  // any trial field moves — the spine reads ~20 of them and listing each as its
  // own selector is how the old objective chain drifted out of sync.
  const trial = activeTrial(elder);
  const done = completedCount(elder);

  let objective = "Explore Elderville";
  let trialLabel: string | null = null;
  if (openingBlack) objective = "Wake up and listen to the life suit hum";
  else if (memoryActive) objective = "Remember your father's blade lesson";
  else if (!tinslaireInsideTalked) objective = "Speak with Tinslaire in your home";
  else if (!eldersDoorDialogDone) objective = "Meet the Council of Elders at your doorstep";
  else if (trial) {
    trialLabel = `TRIAL ${trial.n}/${TRIAL_COUNT} · ${trial.title}`;
    objective = trial.stages[Math.min(trial.stageOf(elder), trial.stages.length - 1)];
  } else {
    trialLabel = `ALL ${TRIAL_COUNT} TRIALS PASSED`;
    objective = "The compass needle tugs east... Rest now — the Eastern Forest awaits.";
  }

  // wake handler
  const handleWake = () => {
    const s = useElder.getState();
    if (s.openingBlack && !s.memoryActive) {
      useUI.getState().start();
      s.startMemory();
    }
  };

  return (
    <>
      {/* Top HUD bar with stats & live diegetic objective */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-10 flex w-[min(640px,96vw)] -translate-x-1/2 flex-col gap-1.5 rounded-md border-[3px] border-[#203868] bg-[#f0e8c8] px-3.5 py-2 font-bold shadow-xl" style={{ fontFamily: "monospace" }}>
        <div className="flex items-center justify-between text-[11px] text-[#181818]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#e85050]">❤ HP:</span> <span className="text-[#203868]">{hp}</span>/100
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#3890c8]">⚡ ST:</span> <span className="text-[#203868]">{st}</span>/100
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#e89020]">📍</span> <span className="text-[#181818]">{locationName}</span>
          </div>
        </div>
        <div className="border-t border-[#b09058] pt-1 text-[10.5px] text-[#704820]">
          {trialLabel && (
            <div className="mb-0.5 flex items-center gap-2">
              <span className="font-bold text-[#2868c0]">{trialLabel}</span>
              <span className="flex gap-[2px]">
                {Array.from({ length: TRIAL_COUNT }, (_, i) => (
                  <span
                    key={i}
                    className="inline-block h-[6px] w-[6px] border border-[#b09058]"
                    style={{ background: i < done ? "#e0a020" : "transparent" }}
                  />
                ))}
              </span>
            </div>
          )}
          <span className="font-bold text-[#e06810]">◆ QUEST:</span> <span className="font-bold text-[#181818]">{objective}</span>
        </div>
      </div>

      {/* Opening black */}
      {openingBlack && !memoryActive && <OpeningBlack onWake={handleWake} />}

      {/* Memory cutscene UI overlay */}
      {memoryActive && <MemoryCutsceneOverlay index={memoryIndex} />}

      {/* Scholar Puzzle Modal (Trial 2) */}
      {scholarPuzzleOpen && <ScholarPuzzleModal />}

      {/* Dialog box */}
      {activeDialog && !scholarPuzzleOpen && (
        <div onClick={() => advanceDialog()} className="absolute inset-0 z-40 cursor-pointer">
          <DialogBox name={activeDialog.name} line={activeDialog.lines[activeDialog.index]} index={activeDialog.index} total={activeDialog.lines.length} />
        </div>
      )}

      {/* Bottom controls reminder */}
      {!activeDialog && !openingBlack && !scholarPuzzleOpen && (
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-10 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-center text-[10px] text-[#d0d8e8] shadow backdrop-blur-xs" style={{ fontFamily: "monospace" }}>
          <span className="font-bold text-[#ffd75e]">WASD</span> Move · <span className="font-bold text-[#ffd75e]">E</span> Talk/Interact · <span className="font-bold text-[#ffd75e]">SPACE</span> Strike · <span className="font-bold text-[#ffd75e]">R</span> Guard · <span className="font-bold text-[#ffd75e]">SHIFT</span> Dodge · <span className="font-bold text-[#ffd75e]">Q/C</span> Turn Camera · <span className="font-bold text-[#ffd75e]">P</span> Pause
        </div>
      )}
    </>
  );
}
