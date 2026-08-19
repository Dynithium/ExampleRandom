import { useEffect, useRef, useState } from "react";
import { useUI, rt } from "../game/state";
import { useElder } from "../game/eldervilleStory";
import { pressInteract, setTouchAxis } from "../game/input";
import { sfx } from "../game/audio";
import { saveGame, loadGame, hasSave, getSaveSummary, startNewGame } from "../game/save";

function Btn({
  children,
  onClick,
  on,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  on?: boolean;
  className?: string;
}) {
  return (
    <button
      data-on={on ? "true" : "false"}
      onClick={() => {
        sfx.ui();
        onClick();
      }}
      className={"pbtn px-2.5 py-2 text-[8.5px] leading-none " + className}
    >
      {children}
    </button>
  );
}

function Stick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);

  const move = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (clientX - cx) / (r.width / 2.2);
    let dy = (clientY - cy) / (r.height / 2.2);
    const m = Math.hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    setTouchAxis(dx, -dy);
    if (knob.current) knob.current.style.transform = `translate(${dx * 26}px, ${dy * 26}px)`;
  };

  const end = () => {
    active.current = null;
    setTouchAxis(0, 0);
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
  };

  return (
    <div
      ref={base}
      className="panel relative h-28 w-28 rounded-full"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        useUI.getState().start();
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        ref={knob}
        className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 border-2 border-[#5b78c9] bg-[#2a3765]"
      >
        <div className="absolute inset-1 border-2 border-[#3b4d84]" />
      </div>
    </div>
  );
}

function LoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-4 font-pixel backdrop-blur-xs">
      <div className="panel flex w-full max-w-[520px] flex-col gap-4 border-[3px] border-[#203868] bg-[#0c142c] p-6 text-[#f0e8c8] shadow-2xl">
        <div className="border-b border-[#284888] pb-2 text-center">
          <div className="text-[14px] font-bold tracking-[0.25em] text-[#ffd75e]">LORE OF MINSLAIRE</div>
          <div className="mt-1 text-[8px] text-[#7f92c4]">The Post-WW3 World & Elderville Settlement</div>
        </div>

        <div className="flex flex-col gap-3 text-[8.5px] leading-[1.8] text-[#c0d0f0]">
          <div>
            <strong className="text-[#ffd75e]">THE TOXIC WORLD:</strong> Following World War 3, the atmosphere became permanently toxic. Humanity survives solely through bio-synthetic life suits bonded to the skin at birth. If removed, the wearer perishes.
          </div>
          <div>
            <strong className="text-[#ffd75e]">THE LIFE SUIT HUM:</strong> The suits hum constantly, providing breathable air and sustaining vital signs. When a body gives out, a mysterious failsafe returns fallen wanderers back to the Safe Camp (Red House).
          </div>
          <div>
            <strong className="text-[#ffd75e]">ELDERVILLE & THE ELDERS:</strong> A sprawling settlement governed by the Council of Elders (Elder Moss, Elder Sage, Elder Thorn) in the Blue House. The elders test Minslaire's virtues before sending him to face the Outskirts Cave.
          </div>
        </div>

        <button
          onClick={() => {
            sfx.ui();
            onClose();
          }}
          className="pbtn mt-2 w-full py-2.5 text-[10px] font-bold tracking-widest text-[#ffe9a8]"
        >
          ✔ RETURN TO MENU
        </button>
      </div>
    </div>
  );
}

function PauseMenu() {
  const pixel = useUI((s) => s.pixel);
  const scanlines = useUI((s) => s.scanlines);
  const muted = useUI((s) => s.muted);
  const paused = useUI((s) => s.paused);
  const daySpeed = useUI((s) => s.daySpeed);
  const clock = useUI((s) => s.clock);
  const isNight = rt.env.night > 0.45;
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleSave = () => {
    const ok = saveGame();
    if (ok) {
      setSaveToast("✔ EXPEDITION PROGRESS SAVED TO DISK");
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  const handleLoad = () => {
    const ok = loadGame();
    if (ok) {
      setSaveToast("✔ PROGRESS LOADED SUCCESSFULLY");
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  const handleTitleReturn = () => {
    sfx.ui();
    // Leaving to the title mid-run used to keep the live story state, so the
    // title screen sat on top of a still-running world and "CONTINUE" resumed
    // in-memory progress rather than the file on disk. Close any open modal
    // state as well, otherwise a dialog/puzzle would still be waiting when a
    // new game started.
    useElder.setState({
      activeDialog: null,
      dialogSourceId: null,
      scholarPuzzleOpen: false,
    });
    useUI.setState({ started: false, pauseMenu: false, paused: false });
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-pixel backdrop-blur-xs">
      <div className="panel flex w-full max-w-[440px] flex-col gap-4 border-[3px] border-[#203868] bg-[#0c142c] p-5 shadow-2xl">
        {/* Title */}
        <div className="border-b border-[#284888] pb-2 text-center">
          <div className="text-[14px] font-bold tracking-[0.25em] text-[#ffd75e]">PAUSE MENU</div>
          <div className="mt-1 flex items-center justify-center gap-2 text-[8px] text-[#7f92c4]">
            <span>TIME: <strong className="text-[#8fb7ff]">{clock}</strong></span>
            <span>·</span>
            <span>{isNight ? "🌙 NIGHT" : "☀️ DAY"}</span>
          </div>
        </div>

        {/* Save / Load Row */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[8px] font-bold tracking-wider text-[#7f92c4]">GAME PROGRESS</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSave}
              className="pbtn py-2 text-[9px] font-bold tracking-wider text-[#8fe06a]"
            >
              💾 SAVE GAME
            </button>
            <button
              onClick={handleLoad}
              disabled={!hasSave()}
              className="pbtn py-2 text-[9px] font-bold tracking-wider text-[#8fb7ff] disabled:opacity-40"
            >
              📂 LOAD SAVE
            </button>
          </div>
          {saveToast && (
            <div className="rounded border border-[#48a028] bg-[#102a10] p-1.5 text-center text-[7.5px] font-bold text-[#8fe06a]">
              {saveToast}
            </div>
          )}
        </div>

        {/* Pixel Size */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[8px] font-bold tracking-wider text-[#7f92c4]">PIXEL RESOLUTION SCALE</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 4, 8].map((p) => (
              <Btn key={p} on={pixel === p} onClick={() => useUI.getState().setPixel(p)}>
                {p}x {p === 4 ? "(DEF)" : ""}
              </Btn>
            ))}
          </div>
        </div>

        {/* Time of Day Cycle Speed */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[8px] font-bold tracking-wider text-[#7f92c4]">DAY / NIGHT CYCLE SPEED</div>
          <div className="grid grid-cols-3 gap-1.5">
            <Btn on={paused} onClick={() => useUI.getState().toggle("paused")}>
              FREEZE
            </Btn>
            <Btn
              on={!paused && daySpeed === 1}
              onClick={() => {
                useUI.setState({ paused: false, daySpeed: 1 });
              }}
            >
              1x NORMAL
            </Btn>
            <Btn
              on={!paused && daySpeed === 6}
              onClick={() => {
                useUI.setState({ paused: false, daySpeed: 6 });
              }}
            >
              6x FAST
            </Btn>
          </div>
        </div>

        {/* Display & Audio toggles */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[8px] font-bold tracking-wider text-[#7f92c4]">EFFECTS & AUDIO</div>
          <div className="grid grid-cols-2 gap-1.5">
            <Btn on={scanlines} onClick={() => useUI.getState().toggle("scanlines")}>
              CRT SCANLINES: {scanlines ? "ON" : "OFF"}
            </Btn>
            <Btn on={!muted} onClick={() => useUI.getState().toggle("muted")}>
              AUDIO: {muted ? "MUTED" : "ON"}
            </Btn>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-1 flex flex-col gap-2">
          <button
            onClick={() => {
              sfx.ui();
              useUI.getState().setPauseMenu(false);
            }}
            className="pbtn w-full py-2.5 text-[10.5px] font-bold tracking-widest text-[#ffe9a8]"
          >
            ▶ RESUME GAME [P / ESC]
          </button>
          <button
            onClick={handleTitleReturn}
            className="pbtn w-full py-2 text-[8.5px] tracking-wider text-[#c0d0f0]"
          >
            🏠 RETURN TO TITLE SCREEN
          </button>
        </div>
      </div>
    </div>
  );
}

function TitleScreen() {
  const [showLore, setShowLore] = useState(false);
  const saveInfo = getSaveSummary();

  const handleNewGame = () => {
    sfx.unlock();
    sfx.door();
    startNewGame();
  };

  const handleContinue = () => {
    sfx.unlock();
    loadGame();
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-[#070a14]/90 p-4 font-pixel">
      {showLore && <LoreModal onClose={() => setShowLore(false)} />}

      <div className="panel flex w-full max-w-[500px] flex-col items-center gap-5 border-[3px] border-[#203868] bg-[#0c142c] px-7 py-8 text-center shadow-2xl">
        {/* Title & Logo */}
        <div>
          <div className="text-[24px] font-bold tracking-[0.3em] text-[#ffd75e]" style={{ textShadow: "0 0 12px rgba(255,215,94,0.4)" }}>
            MINSLAIRE
          </div>
          <div className="mt-1 text-[9px] font-bold tracking-[0.25em] text-[#8fb7ff]">
            ACT I: THE CALLING · ELDERVILLE PROLOGUE
          </div>
          <div className="mt-2 text-[7.5px] tracking-widest text-[#7f92c4]">
            A RETRO 3D PIXEL-ART ACTION RPG
          </div>
        </div>

        {/* Save Summary Banner if save exists */}
        {saveInfo && (
          <div className="w-full rounded border border-[#203868] bg-[#070b1a] p-2.5 text-left text-[8px] text-[#c0d0f0]">
            <div className="flex items-center justify-between font-bold text-[#ffd75e]">
              <span>💾 SAVED EXPEDITION</span>
              <span>{saveInfo.clock} · {saveInfo.location}</span>
            </div>
            <div className="mt-1 text-[7px] text-[#7f92c4]">
              TRIALS COMPLETED: <strong className="text-[#8fe06a]">{saveInfo.trialsPassed}/4</strong> · HP: {saveInfo.hp}/100
            </div>
          </div>
        )}

        {/* Menu Actions */}
        <div className="flex w-full flex-col gap-2.5">
          <button
            onClick={handleNewGame}
            className="pbtn w-full py-3 text-[11px] font-bold tracking-widest text-[#ffe9a8] hover:scale-[1.02] transition-transform"
          >
            ▶ BEGIN EXPEDITION (NEW GAME)
          </button>

          {saveInfo && (
            <button
              onClick={handleContinue}
              className="pbtn w-full py-2.5 text-[10px] font-bold tracking-widest text-[#8fe06a] hover:scale-[1.02] transition-transform"
            >
              💾 CONTINUE JOURNEY
            </button>
          )}

          <button
            onClick={() => {
              sfx.ui();
              setShowLore(true);
            }}
            className="pbtn w-full py-2 text-[9px] tracking-wider text-[#8fb7ff]"
          >
            📜 WORLD & STORY LORE
          </button>
        </div>

        {/* Footer controls hint */}
        <div className="border-t border-[#1e2a52] pt-2 text-[7.5px] text-[#5f719e]">
          WASD MOVE · E TALK/INTERACT · SPACE ATTACK · P PAUSE/SAVE
        </div>
      </div>
    </div>
  );
}

export function HUD() {
  const prompt = useUI((s) => s.prompt);
  const pauseMenu = useUI((s) => s.pauseMenu);
  const started = useUI((s) => s.started);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-pixel">
      {/* ------------------------------------------------------- Title Screen */}
      {!started && <TitleScreen />}

      {/* ------------------------------------------------------- Pause Menu */}
      {started && pauseMenu && <PauseMenu />}

      {/* -------------------------------------------------- interact prompt */}
      {started && prompt && !pauseMenu && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <div className="panel floaty px-3 py-2 text-[8.5px] font-bold text-[#ffe9a8] shadow-lg">
            <span className="text-[#ffd75e]">{touch ? "[A]" : "[E]"}</span> {prompt}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ touch controls */}
      {started && touch && (
        <>
          <div className="pointer-events-auto absolute bottom-6 left-5">
            <Stick />
          </div>
          <div className="pointer-events-auto absolute bottom-8 right-5 flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <Btn onClick={() => (rt.cam.targetYaw += Math.PI / 2)} className="h-9 w-9 text-[12px]">
                ↺
              </Btn>
              <Btn onClick={() => (rt.cam.targetYaw -= Math.PI / 2)} className="h-9 w-9 text-[12px]">
                ↻
              </Btn>
              <Btn onClick={() => useUI.getState().toggle("pauseMenu")} className="h-9 w-9 text-[9px]">
                P
              </Btn>
            </div>
            <button
              onPointerDown={() => {
                useUI.getState().start();
                pressInteract();
              }}
              className="pbtn h-16 w-16 rounded-full text-[14px] text-[#ffd75e]"
            >
              A
            </button>
          </div>
        </>
      )}
    </div>
  );
}
