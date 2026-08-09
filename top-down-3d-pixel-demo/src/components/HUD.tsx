import { useEffect, useRef, useState } from "react";
import { useUI, rt } from "../game/state";
import { pressInteract, setTouchAxis } from "../game/input";
import { sfx } from "../game/audio";

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
      className={"pbtn px-2 py-1.5 text-[8px] leading-none " + className}
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

export function HUD() {
  const prompt = useUI((s) => s.prompt);
  const dialogue = useUI((s) => s.dialogue);
  const clock = useUI((s) => s.clock);
  const pixel = useUI((s) => s.pixel);
  const scanlines = useUI((s) => s.scanlines);
  const muted = useUI((s) => s.muted);
  const paused = useUI((s) => s.paused);
  const daySpeed = useUI((s) => s.daySpeed);
  const started = useUI((s) => s.started);
  const [res, setRes] = useState("");
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    const update = () =>
      setRes(`${Math.round(window.innerWidth / pixel)}x${Math.round(window.innerHeight / pixel)}`);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [pixel]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-pixel">
      {/* ---------------------------------------------------------- top left — now ELDERVILLE */}
      <div className="absolute left-3 top-3 flex flex-col gap-2">
        <div className="panel px-3 py-2">
          <div className="text-[10px] tracking-widest text-[#ffd75e]">MINSLAIRE — ELDERVILLE</div>
          <div className="mt-1 text-[6px] leading-relaxed text-[#7f92c4]">
            PIXELMOOR ENGINE · ELDERVILLE VILLAGE · {res}
          </div>
        </div>
        <div className="panel flex items-center gap-2 px-3 py-2">
          <span className="text-[10px] text-[#8fb7ff]">{clock}</span>
          <span className="text-[7px] text-[#7f92c4]">· DAY/NIGHT CYCLE</span>
        </div>
      </div>

      {/* --------------------------------------------------------- top right */}
      <div className="pointer-events-auto absolute right-3 top-3 flex w-[172px] flex-col gap-2">
        <div className="panel flex flex-col gap-2 p-2">
          <div className="text-[7px] text-[#7f92c4]">PIXEL SIZE</div>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 4, 8].map((p) => (
              <Btn key={p} on={pixel === p} onClick={() => useUI.getState().setPixel(p)}>
                {p}x
              </Btn>
            ))}
          </div>
          <div className="text-[7px] text-[#7f92c4]">TIME OF DAY</div>
          <div className="grid grid-cols-3 gap-1">
            <Btn on={paused} onClick={() => useUI.getState().toggle("paused")}>
              STOP
            </Btn>
            <Btn on={!paused && daySpeed === 1} onClick={() => {
              useUI.setState({ paused: false, daySpeed: 1 });
            }}>
              1x
            </Btn>
            <Btn on={!paused && daySpeed === 6} onClick={() => {
              useUI.setState({ paused: false, daySpeed: 6 });
            }}>
              6x
            </Btn>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <Btn on={scanlines} onClick={() => useUI.getState().toggle("scanlines")}>
              CRT
            </Btn>
            <Btn on={!muted} onClick={() => useUI.getState().toggle("muted")}>
              {muted ? "MUTE" : "SFX"}
            </Btn>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- bottom left */}
      {!touch && (
        <div className="panel absolute bottom-3 left-3 flex flex-col gap-1.5 px-3 py-2 text-[7px] leading-relaxed text-[#9db0dd]">
          <div>
            <span className="text-[#ffd75e]">WASD</span> MOVE
          </div>
          <div>
            <span className="text-[#ffd75e]">Q / R</span> ROTATE CAMERA
          </div>
          <div>
            <span className="text-[#ffd75e]">WHEEL</span> ZOOM
          </div>
          <div>
            <span className="text-[#ffd75e]">E</span> INTERACT
          </div>
        </div>
      )}

      {/* -------------------------------------------------- prompt + dialog */}
      {prompt && !dialogue && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
          <div className="panel floaty px-3 py-2 text-[8px] text-[#ffe9a8]">
            <span className="text-[#ffd75e]">{touch ? "[A]" : "[E]"}</span> {prompt}
          </div>
        </div>
      )}
      {dialogue && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(620px,92vw)] -translate-x-1/2">
          <div className="panel px-4 py-3">
            <div className="mb-2 text-[9px] tracking-wider text-[#ffd75e]">{dialogue.title}</div>
            <div className="whitespace-pre-line text-[8px] leading-[1.9] text-[#dbe6ff]">
              {dialogue.text}
            </div>
            <div className="mt-2 text-right text-[7px] text-[#7f92c4]">
              <span className="blink">▼</span> {touch ? "[A]" : "[E]"} CLOSE
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ touch controls */}
      {touch && (
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

      {/* -------------------------------------------------------- start card — Elderville */}
      {!started && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[#070a14]/80">
          <div className="panel max-w-[440px] px-6 py-6 text-center">
            <div className="text-[15px] tracking-widest text-[#ffd75e]">MINSLAIRE</div>
            <div className="text-[8px] tracking-[0.2em] text-[#7f92c4]">ELDERVILLE VILLAGE · PIXELMOOR ENGINE</div>
            <div className="mt-3 text-[7px] leading-[2] text-[#9db0dd]">
              A WHIMSICAL VOXEL VILLAGE.
              <br />
              REAL 3D GEOMETRY RENDERED TINY, THEN BLOWN UP.
              <br />
              WAKE IN THE RED HOUSE. HEAR THE HUM. MEET THE ELDERS.
            </div>
            <button
              onClick={() => {
                sfx.unlock();
                sfx.ui();
                useUI.getState().start();
              }}
              className="pbtn mt-5 px-5 py-3 text-[10px] text-[#ffe9a8]"
            >
              ▶ WAKE UP
            </button>
            <div className="mt-4 text-[7px] text-[#5f719e]">WASD TO WALK · E TO TALK · Q/R ROTATE · SPACE ATTACK</div>
          </div>
        </div>
      )}
    </div>
  );
}
