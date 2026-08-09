import { useEffect, useState } from "react";
import { useElder, fatherMemoryLines } from "../game/eldervilleStory";
import { useUI } from "../game/state";
import { MemoryCutscene3D } from "../game/MemoryCutscene3D";

// FireRed dialog box
function DialogBox({ name, line, index, total }: { name: string; line: string; index: number; total: number }) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 w-[min(680px,96vw)] -translate-x-1/2">
      <div
        className="relative rounded-[4px] border-[3px] border-[#203868] bg-[#f0e8c8] p-[2px]"
        style={{ boxShadow: "0 0 0 2px #181818, 4px 4px 0 rgba(0,0,0,0.35)" }}
      >
        <div className="border-2 border-[#4868a0] bg-[#f0e8c8] p-3">
          <div className="mb-1 text-[10px] font-bold tracking-widest text-[#2868c0]">{name.toUpperCase()}</div>
          <div className="text-[10px] leading-[1.7] text-[#181818]" style={{ fontFamily: "monospace" }}>
            {line}
          </div>
          <div className="mt-1 text-right text-[7px] text-[#687888]">
            {index + 1}/{total} <span className="ml-2 inline-block animate-pulse">▼</span> [E]
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
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#181818]">
      <div className="text-center">
        <div className="text-[14px] font-bold tracking-widest text-[#f0e8c8]" style={{ fontFamily: "monospace" }}>
          You wake to the hum.
        </div>
        <div className="mt-2 text-[11px] text-[#687888]" style={{ fontFamily: "monospace" }}>
          Your suit hums before you do.
        </div>
        {blink && (
          <div className="mt-6 text-[11px] font-bold text-[#98d0f8]" style={{ fontFamily: "monospace" }}>
            [ Press E to wake ]
          </div>
        )}
      </div>
      {/* dust motes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/3 h-1 w-1 bg-[#f0e8c8] opacity-40" />
        <div className="absolute left-2/3 top-1/2 h-1 w-1 bg-[#f0e8c8] opacity-30" />
        <div className="absolute left-1/2 top-2/3 h-1 w-1 bg-[#f0e8c8] opacity-50" />
      </div>
      <button onClick={onWake} className="absolute inset-0" aria-label="wake" />
    </div>
  );
}

// beautiful voxel 3D memory — uses same engine as village, pixelated, animated
function MemoryCutscene({ index }: { index: number }) {
  return (
    <div className="absolute inset-0 z-20">
      <MemoryCutscene3D index={index} />
    </div>
  );
}

export function EldervilleHUD() {
  const openingBlack = useElder((s) => s.openingBlack);
  const memoryActive = useElder((s) => s.memoryActive);
  const memoryIndex = useElder((s) => s.memoryIndex);
  const activeDialog = useElder((s) => s.activeDialog);
  const currentArea = useElder((s) => s.currentArea);
  const currentInterior = useElder((s) => s.currentInterior);
  const hp = useElder((s) => s.hp);
  const st = useElder((s) => s.st);
  const showDialog = useElder((s) => s.showDialog);
  const advanceDialog = useElder((s) => s.advanceDialog);

  const locationName = currentArea === "village" ? "Elderville Village" : currentInterior ? ({ home: "Your Home", council: "Council Hall", homesteadA: "Farmer's Homestead", homesteadB: "Weaver's Homestead" } as any)[currentInterior] || currentArea : currentArea;

  // wake handler
  const handleWake = () => {
    const s = useElder.getState();
    if (s.openingBlack && !s.memoryActive) {
      useUI.getState().start();
      s.startMemory();
    }
  };

  // E only for waking — dialog itself is handled by EldervillePlayer via rt.input.interact
  // (keeping this separate prevents double-advance on last line)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        const s = useElder.getState();
        if (s.openingBlack && !s.memoryActive) {
          e.preventDefault();
          useUI.getState().start();
          s.startMemory();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Top HUD bar like original style.css #hud */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-10 flex w-[min(560px,96vw)] -translate-x-1/2 justify-between gap-2 rounded border-[3px] border-[#203868] bg-[#f0e8c8] px-3 py-2 font-bold" style={{ fontFamily: "monospace" }}>
        <div className="text-[11px] text-[#181818]">
          HP: <span className="text-[#2868c0]">{hp}</span>/100
        </div>
        <div className="text-[11px] text-[#181818]">
          ST: <span className="text-[#2868c0]">{st}</span>/100
        </div>
        <div className="text-[11px] text-[#181818]">
          Location: <span className="text-[#2868c0]">{locationName}</span>
        </div>
      </div>

      {/* Opening black */}
      {openingBlack && !memoryActive && <OpeningBlack onWake={handleWake} />}

      {/* Memory cutscene */}
      {memoryActive && <MemoryCutscene index={memoryIndex} />}

      {/* Dialog box (overrides HUD) — show for memory or any dialog */}
      {activeDialog && (
        <div onClick={() => advanceDialog()} className="absolute inset-0 z-40 cursor-pointer">
          <DialogBox name={activeDialog.name} line={activeDialog.lines[activeDialog.index]} index={activeDialog.index} total={activeDialog.lines.length} />
        </div>
      )}

      {/* Bottom controls hint like original footer */}
      {!activeDialog && !openingBlack && (
        <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 text-center text-[10px] text-[#a8b0c0]" style={{ fontFamily: "monospace" }}>
          <span className="font-bold text-[#e8e0c8]">Move:</span> WASD / Arrow Keys | <span className="font-bold text-[#e8e0c8]">Interact:</span> E | <span className="font-bold text-[#e8e0c8]">Attack:</span> Space
        </div>
      )}
    </>
  );
}
