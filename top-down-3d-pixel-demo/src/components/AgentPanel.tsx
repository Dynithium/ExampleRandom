import { useEffect, useState } from "react";
import { useAgent, startRun, stopRun, stepOnce } from "../game/agent";
import { sfx } from "../game/audio";

/**
 * Agent Mode UI (F4) — configure any OpenAI-compatible endpoint and let an
 * LLM play Act I through the real input pipeline. Backed entirely by game/agent.ts.
 */
export function AgentPanel() {
  const panelOpen = useAgent((s) => s.panelOpen);
  const running = useAgent((s) => s.running);
  const busy = useAgent((s) => s.busy);
  const step = useAgent((s) => s.step);
  const deaths = useAgent((s) => s.deaths);
  const startedAt = useAgent((s) => s.startedAt);
  const finishedReason = useAgent((s) => s.finishedReason);
  const log = useAgent((s) => s.log);
  const error = useAgent((s) => s.error);
  const baseUrl = useAgent((s) => s.baseUrl);
  const model = useAgent((s) => s.model);
  const apiKey = useAgent((s) => s.apiKey);
  const maxSteps = useAgent((s) => s.maxSteps);
  const setPanelOpen = useAgent((s) => s.setPanelOpen);
  const setConfig = useAgent((s) => s.setConfig);
  const [elapsed, setElapsed] = useState(0);

  // F4 toggles the panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "F4") {
        e.preventDefault();
        sfx.ui();
        const a = useAgent.getState();
        a.setPanelOpen(!a.panelOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // elapsed run timer
  useEffect(() => {
    if (!running || !startedAt) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [running, startedAt]);

  if (!panelOpen) return null;

  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const recent = log.slice(-9).reverse();

  const field =
    "w-full border border-[#203868] bg-[#070b1a] px-2 py-1.5 text-[8px] text-[#c0d0f0] outline-none focus:border-[#38508c]";

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-[70] w-[310px] font-pixel">
      <div className="panel flex max-h-[calc(100dvh-1rem)] flex-col gap-2.5 p-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#284888] pb-2">
          <div>
            <div className="text-[11px] font-bold tracking-[0.2em] text-[#ffd75e]">AGENT MODE</div>
            <div className="text-[7px] text-[#7f92c4]">LLM BENCHMARK · TOGGLES ON F4</div>
          </div>
          <button
            onClick={() => {
              sfx.ui();
              setPanelOpen(false);
            }}
            className="pbtn px-2 py-1 text-[8px] text-[#ff8f8f]"
          >
            ✕
          </button>
        </div>
        {/* Status */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="border border-[#203868] bg-[#070b1a] p-1.5">
            <div className="text-[6.5px] text-[#7f92c4]">STEP</div>
            <div className="text-[10px] font-bold text-[#8fb7ff]">{step}/{maxSteps}</div>
          </div>
          <div className="border border-[#203868] bg-[#070b1a] p-1.5">
            <div className="text-[6.5px] text-[#7f92c4]">DEATHS</div>
            <div className="text-[10px] font-bold text-[#ff8f8f]">{deaths}</div>
          </div>
          <div className="border border-[#203868] bg-[#070b1a] p-1.5">
            <div className="text-[6.5px] text-[#7f92c4]">TIME</div>
            <div className="text-[10px] font-bold text-[#c0d0f0]">{running ? mmss : "--:--"}</div>
          </div>
          <div className="border border-[#203868] bg-[#070b1a] p-1.5">
            <div className="text-[6.5px] text-[#7f92c4]">STATE</div>
            <div className={"text-[10px] font-bold " + (running ? (busy ? "text-[#ffd75e]" : "text-[#8fe06a]") : "text-[#5f719e]")}>
              {running ? (busy ? "THINK" : "ACT") : "IDLE"}
            </div>
          </div>
        </div>

        {finishedReason && (
          <div className="border border-[#203868] bg-[#070b1a] p-1.5 text-center text-[7.5px] font-bold text-[#8fe06a]">
            {finishedReason}
          </div>
        )}
        {error && (
          <div className="border border-[#d03838] bg-[#3a1212] p-1.5 text-center text-[7.5px] font-bold text-[#ff9090]">
            {error}
          </div>
        )}

        {/* Config */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[8px] font-bold tracking-wider text-[#7f92c4]">ENDPOINT (OPENAI-COMPATIBLE)</div>
          <input className={field} value={baseUrl} placeholder="https://api.openai.com/v1" onChange={(e) => setConfig({ baseUrl: e.target.value })} />
          <input className={field} value={model} placeholder="gpt-4o-mini" onChange={(e) => setConfig({ model: e.target.value })} />
          <input className={field} type="password" value={apiKey} placeholder="API key (stored locally)" onChange={(e) => setConfig({ apiKey: e.target.value })} />
          <label className="flex items-center justify-between text-[8px] text-[#7f92c4]">
            MAX STEPS
            <input
              className="w-16 border border-[#203868] bg-[#070b1a] px-2 py-1 text-right text-[8px] text-[#c0d0f0] outline-none focus:border-[#38508c]"
              type="number"
              min={1}
              max={1000}
              value={maxSteps}
              onChange={(e) => setConfig({ maxSteps: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })}
            />
          </label>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-1.5">
          {running ? (
            <button
              onClick={() => {
                sfx.ui();
                stopRun("stopped by player");
              }}
              className="pbtn py-2 text-[9px] font-bold tracking-wider text-[#ff8f8f]"
            >
              ■ STOP RUN
            </button>
          ) : (
            <button
              onClick={() => {
                sfx.ui();
                startRun();
              }}
              className="pbtn py-2 text-[9px] font-bold tracking-wider text-[#8fe06a]"
            >
              ▶ START RUN
            </button>
          )}
          <button
            onClick={() => {
              sfx.ui();
              void stepOnce();
            }}
            disabled={running || busy}
            className="pbtn py-2 text-[9px] font-bold tracking-wider text-[#8fb7ff] disabled:opacity-40"
          >
            ⚡ STEP ONCE
          </button>
        </div>
        <div className="text-[6.5px] leading-relaxed text-[#5f719e]">
          Starts a fresh game and hands control to the LLM — synthetic keys + pathfound walking, no teleports. Avoid touching movement keys while it runs.
        </div>

        {/* Log */}
        <div className="flex flex-col gap-1">
          <div className="text-[8px] font-bold tracking-wider text-[#7f92c4]">ACTION LOG</div>
          <div className="flex max-h-[180px] flex-col gap-1 overflow-y-auto border border-[#203868] bg-[#070b1a] p-1.5">
            {recent.length === 0 && <div className="text-[7.5px] text-[#5f719e]">No actions yet.</div>}
            {recent.map((l) => (
              <div key={l.step} className="text-[7px] leading-[1.6]">
                <span className="text-[#5f719e]">#{l.step}</span>{" "}
                <span className={l.ok ? "text-[#8fe06a]" : "text-[#ff8f8f]"}>{l.action}</span>
                {l.note ? <span className="text-[#7f92c4]"> — {l.note}</span> : null}
                {l.thought ? <div className="pl-3 text-[#5f719e]">“{l.thought}”</div> : null}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
