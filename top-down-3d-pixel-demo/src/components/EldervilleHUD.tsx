import { useEffect, useState } from "react";
import { useElder } from "../game/eldervilleStory";
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
  const wellTrialState = useElder((s) => s.wellTrialState);
  const scholarTrialState = useElder((s) => s.scholarTrialState);
  const widowTrialState = useElder((s) => s.widowTrialState);
  const marketTrialState = useElder((s) => s.marketTrialState);
  const combatTrialState = useElder((s) => s.combatTrialState);
  const carryingGrain = useElder((s) => s.carryingGrain);
  const hasSword = useElder((s) => s.hasSword);
  const caveStage = useElder((s) => s.caveStage);
  const carryingBody = useElder((s) => s.carryingBody);
  const hasCompass = useElder((s) => s.hasCompass);
  const scholarPuzzleOpen = useElder((s) => s.scholarPuzzleOpen);
  const currentArea = useElder((s) => s.currentArea);
  const currentInterior = useElder((s) => s.currentInterior);
  const hp = useElder((s) => s.hp);
  const st = useElder((s) => s.st);
  const advanceDialog = useElder((s) => s.advanceDialog);
  const locationName = currentArea === "village" ? "Elderville Settlement" : currentInterior ? ({ home: "Your Home", council: "Council Hall", homesteadA: "Farmer's Homestead (Widow Oren)", homesteadB: "Weaver's Homestead", cave: "Outskirts Cave (Depths)" } as any)[currentInterior] || currentArea : currentArea;

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

  // Dynamic Objective Determination
  let objective = "Explore Elderville";
  if (openingBlack) objective = "Wake up and listen to the life suit hum";
  else if (memoryActive) objective = "Remember your father's blade lesson";
  else if (!tinslaireInsideTalked) objective = "Speak with Tinslaire in your home";
  else if (!eldersDoorDialogDone) objective = "Meet the Council of Elders at your doorstep";
  // Trial 1: The Well's Echo
  else if (wellTrialState === "not_started") objective = "Trial 1: Speak with Elder Moss at Central Well (Far South-East)";
  else if (wellTrialState === "assigned") objective = "Trial 1: Inspect the rope mechanism at Central Well";
  else if (wellTrialState === "inspected") objective = "Trial 1: Report the underground grinding to Elder Moss";
  // Trial 2: The Scholar's Request
  else if (wellTrialState === "completed" && scholarTrialState === "not_started") objective = "Trial 1 Passed (1/4) · Speak with Elder Sage outside Council Hall";
  else if (scholarTrialState === "assigned") objective = "Trial 2: Enter Council Hall & investigate Sage's study desk";
  else if (scholarTrialState === "desk_read") objective = "Trial 2: Solve the 4-dial elemental archive bookcase in Council Hall";
  else if (scholarTrialState === "puzzle_solved") objective = "Trial 2: Deliver the ancient scroll to Elder Sage outside";
  // Trial 3: The Widow's Task
  else if (scholarTrialState === "completed" && widowTrialState === "not_started") objective = "Trial 2 Passed (2/4) · Speak with Elder Thorn near Western Homestead";
  else if (widowTrialState === "assigned" && !carryingGrain) objective = "Trial 3: Lift the heavy grain sack in Grand Gardens crop terrace";
  else if (carryingGrain) objective = "Trial 3: Deliver harvest grain to Widow Oren inside Farmer's Homestead";
  else if (widowTrialState === "delivered") objective = "Trial 3: Speak with Elder Thorn outside the Homestead";
  // Trial 4: The Honest Change
  else if (widowTrialState === "completed" && marketTrialState === "not_started") objective = "Trial 3 Passed (3/4) · Visit Bazaar Trader at Southern Marketplace";
  else if (marketTrialState === "overpaid") objective = "Trial 4: Return the 50 extra silver coins with honor to Trader";
  // Combat Trial: Blade Training
  else if (marketTrialState === "completed" && combatTrialState === "not_started") objective = "All 4 Virtues Proven! Meet the Council behind Blue House for Blade Trial";
  else if (combatTrialState === "assigned") objective = "Blade Trial: Strike down 3 training dummies behind Blue House (SPACE · Guard R · Dodge SHIFT)";
  else if (combatTrialState === "completed" && !hasSword) objective = "★ Trials Complete! Retrieve Father's Blade from the sword case in the Red House";
  else if (hasSword && caveStage === "not_entered") objective = "⚔ Father's Blade at your side — Enter the Outskirts Cave (far north-east, where the gate road ends)";
  else if (caveStage === "entered") objective = "Delve deeper into the Outskirts Cave — follow the glow-moss";
  else if (caveStage === "boss_awake") objective = "Slay the Cave Machine! (SPACE strike · K arrows · SHIFT dodge · R guard)";
  else if (caveStage === "boss_defeated" && !carryingBody) objective = "Don't leave the body — lift the chassis (E)";
  else if (carryingBody && currentArea === "cave") objective = "Haul the body out of the cave and back to Elderville";
  else if (carryingBody) objective = "Carry the machine body to the Forge (east district, follow the needle)";
  else if (caveStage === "delivered" || hasCompass) objective = "★ The compass needle tugs east... Rest now — the Eastern Forest awaits (next expedition)";

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
          <span className="font-bold text-[#ffd75e]">WASD</span> Move · <span className="font-bold text-[#ffd75e]">E</span> Talk · <span className="font-bold text-[#ffd75e]">SPACE</span> Strike · <span className="font-bold text-[#ffd75e]">K</span> Bow · <span className="font-bold text-[#ffd75e]">R</span> Guard · <span className="font-bold text-[#ffd75e]">SHIFT</span> Dodge · <span className="font-bold text-[#ffd75e]">P</span> Pause
        </div>
      )}
    </>
  );
}
