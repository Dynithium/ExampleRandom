import { useEffect } from "react";
import { useAgent, startRun, stopRun, benchmarkProgress, stepOnce } from "../game/agent";
import { useElder } from "../game/eldervilleStory";
import { sfx } from "../game/audio";

/**
 * Agent Mode panel — drives the LLM benchmark in game/agent.ts.
 *
 * The agent module was fully implemented but had no UI and was never imported,
 * so the whole feature (and its autopilot) was unreachable dead code. This panel
 * is the missing entry point. Toggle it with the ⌁ button or the "G" key.
 */
export function AgentPanel() {
  const panelOpen = useAgent((s) => s.panelOpen);
  const running = useAgent((s) => s.running);
  const busy = useAgent((s) => s.busy);
  const step = useAgent((s) => s.step);
  const deaths = useAgent((s) => s.deaths);
  const log = useAgent((s) => s.log);
  const error = useAgent((s) => s.error);
  const finishedReason = useAgent((s) => s.finishedReason);
  const baseUrl = useAgent((s) => s.baseUrl);
  const model = useAgent((s) => s.model);
  const apiKey = useAgent((s) => s.apiKey);
  const maxSteps = useAgent((s) => s.maxSteps);
  const setConfig = useAgent((s) => s.setConfig);
  const setPanelOpen = useAgent((s) => s.setPanelOpen);

  // re-render the checklist as the story advances
  useElder((s) => s.caveStage);
  useElder((s) => s.hasCompass);
  const { checks, score, maxScore } = benchmarkProgress();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (typing) return;
      if (e.code === "KeyG" && !e.repeat) {
        e.preventDefault();
        useAgent.getState().setPanelOpen(!useAgent.getState().panelOpen);
        sfx.ui();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!panelOpen) {
    return (
      <button
        onClick={() => {
          sfx.ui();
          setPanelOpen(true);
        }}
        title="Agent Mode (G)"
        className="pointer-events-auto absolute right-2 top-2 z-30 h-8 w-8 border-2 border-[#38508c] bg-[#1b2444] text-[11px] text-[#b9c9ee] hover:bg-[#26325e]"
      >
        ⌁
      </button>
    );
  }

  const field = "w-full border-2 border-[#2b3a63] bg-[#070c1e] px-2 py-1 text-[8px] text-[#c0d0f0] outline-none focus:border-[#4868a0]";

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-30 flex max-h-[92vh] w-[330px] flex-col gap-2.5 overflow-y-auto border-[3px] border-[#203868] bg-[#0c142c]/95 p-3 font-pixel shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#284888] pb-1.5">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#ffd75e]">AGENT MODE</div>
          <div className="text-[6.5px] text-[#7f92c4]">LLM plays Act I as a benchmark</div>
        </div>
        <button onClick={() => { sfx.ui(); setPanelOpen(false); }} className="pbtn px-2 py-1 text-[8px] text-[#ff8f8f]">
          ✕
        </button>
      </div>

      {/* config */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[7px] font-bold tracking-wider text-[#7f92c4]">ENDPOINT (OpenAI-compatible)</label>
        <input className={field} value={baseUrl} disabled={running} onChange={(e) => setConfig({ baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />
        <label className="text-[7px] font-bold tracking-wider text-[#7f92c4]">MODEL</label>
        <input className={field} value={model} disabled={running} onChange={(e) => setConfig({ model: e.target.value })} placeholder="gpt-4o-mini" />
        <label className="text-[7px] font-bold tracking-wider text-[#7f92c4]">API KEY (stored locally)</label>
        <input className={field} type="password" value={apiKey} disabled={running} onChange={(e) => setConfig({ apiKey: e.target.value })} placeholder="sk-…" />
        <label className="text-[7px] font-bold tracking-wider text-[#7f92c4]">MAX STEPS</label>
        <input className={field} type="number" min={1} value={maxSteps} disabled={running} onChange={(e) => setConfig({ maxSteps: Math.max(1, Number(e.target.value) || 1) })} />
      </div>

      {/* controls */}
      <div className="grid grid-cols-2 gap-1.5">
        {!running ? (
          <button onClick={() => { sfx.ui(); startRun(); }} className="pbtn py-1.5 text-[8px] font-bold tracking-wider text-[#8fe06a]">
            ▶ START RUN
          </button>
        ) : (
          <button onClick={() => { sfx.ui(); stopRun("stopped by user"); }} className="pbtn py-1.5 text-[8px] font-bold tracking-wider text-[#ff8f8f]">
            ■ STOP
          </button>
        )}
        <button onClick={() => { sfx.ui(); void stepOnce(); }} disabled={running || busy} className="pbtn py-1.5 text-[8px] font-bold tracking-wider text-[#8fb7ff] disabled:opacity-40">
          ↷ STEP ONCE
        </button>
      </div>

      {/* status */}
      <div className="flex justify-between border-y border-[#1e2a52] py-1 text-[7.5px] text-[#c0d0f0]">
        <span>STEP <strong className="text-[#ffd75e]">{step}</strong>/{maxSteps}</span>
        <span>DEATHS <strong className="text-[#e85050]">{deaths}</strong></span>
        <span>{busy ? <span className="text-[#ffd75e]">● BUSY</span> : running ? <span className="text-[#8fe06a]">● RUNNING</span> : <span className="text-[#7f92c4]">● IDLE</span>}</span>
      </div>

      {error && <div className="border border-[#d03838] bg-[#3a1212] p-1.5 text-[7px] text-[#ff9090]">{error}</div>}
      {finishedReason && !error && <div className="border border-[#48a028] bg-[#143014] p-1.5 text-[7px] text-[#8fe06a]">{finishedReason}</div>}

      {/* benchmark checklist */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[7px] font-bold tracking-wider text-[#7f92c4]">
          <span>BENCHMARK PROGRESS</span>
          <span className="text-[#ffd75e]">{score}/{maxScore}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 text-[7px]">
              <span className={c.done ? "text-[#8fe06a]" : "text-[#44506f]"}>{c.done ? "✔" : "○"}</span>
              <span className={c.done ? "text-[#c0d0f0]" : "text-[#5f719e]"}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* action log */}
      <div>
        <div className="mb-1 text-[7px] font-bold tracking-wider text-[#7f92c4]">ACTION LOG</div>
        <div className="flex max-h-40 flex-col-reverse gap-1 overflow-y-auto border border-[#1e2a52] bg-[#070c1e] p-1.5">
          {log.length === 0 && <div className="text-[7px] text-[#44506f]">No actions yet.</div>}
          {log.map((l) => (
            <div key={l.step} className="text-[7px] leading-relaxed">
              <span className="text-[#7f92c4]">#{l.step}</span>{" "}
              <span className={l.ok ? "text-[#8fe06a]" : "text-[#ff9090]"}>{l.action}</span>
              {l.note && <span className="text-[#7f92c4]"> · {l.note}</span>}
              {l.thought && <div className="pl-3 italic text-[#5f719e]">{l.thought}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
