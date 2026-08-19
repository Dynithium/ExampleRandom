import { useEffect, useState } from "react";
import {
  useAgent,
  startRun,
  stopRun,
  pauseRun,
  benchmarkProgress,
  stepOnce,
  detectVision,
  fetchModels,
  exportReport,
} from "../game/agent";
import { useElder } from "../game/eldervilleStory";
import { sfx } from "../game/audio";

/**
 * Agent Mode panel — configuration + live telemetry for the LLM benchmark in
 * game/agent.ts. Toggle with the ⌁ button or the "G" key.
 */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[7px] font-bold tracking-widest text-[#7f92c4]">{label}</span>
      {children}
      {hint && <span className="text-[6.5px] leading-relaxed text-[#5f6f9c]">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded border border-[#203868] bg-[#070b1a] px-2 py-1.5 font-pixel text-[8px] text-[#dce6ff] outline-none focus:border-[#4a7fd8]";

export function AgentPanel() {
  const s = useAgent();
  const setConfig = s.setConfig;
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // re-render the checklist as the story advances
  useElder((st) => st.caveStage);
  useElder((st) => st.hasCompass);
  useElder((st) => st.wellTrialState);
  useElder((st) => st.scholarTrialState);
  useElder((st) => st.widowTrialState);
  useElder((st) => st.marketTrialState);
  useElder((st) => st.combatTrialState);
  const { checks, score, maxScore } = benchmarkProgress();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
        return;
      if (e.code === "KeyG" && !e.repeat) {
        e.preventDefault();
        sfx.ui();
        useAgent.getState().setPanelOpen(!useAgent.getState().panelOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!s.panelOpen) {
    return (
      <button
        onClick={() => {
          sfx.ui();
          s.setPanelOpen(true);
        }}
        title="Agent Mode (G)"
        className="pbtn pointer-events-auto absolute bottom-3 left-3 z-40 h-9 w-9 font-pixel text-[11px] text-[#8fe06a]"
      >
        ⌁
      </button>
    );
  }

  const vis = s.visionSupport;
  const visColor =
    vis === "yes" ? "#8fe06a" : vis === "no" ? "#ff9090" : vis === "checking" ? "#ffd75e" : "#7f92c4";
  const visLabel =
    vis === "yes" ? "VISION: SUPPORTED" : vis === "no" ? "VISION: NOT SUPPORTED" : vis === "checking" ? "CHECKING…" : "VISION: UNKNOWN";

  const pct = Math.round((score / maxScore) * 100);

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-40 flex max-h-[92vh] w-[360px] flex-col gap-2.5 overflow-y-auto border-[3px] border-[#203868] bg-[#0c142c]/97 p-3 font-pixel shadow-2xl backdrop-blur-sm">
      {/* header */}
      <div className="flex items-center justify-between border-b border-[#284888] pb-1.5">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#8fe06a]">⌁ AGENT MODE</div>
          <div className="text-[6.5px] tracking-wider text-[#7f92c4]">LLM PLAYS ACT I · BENCHMARK</div>
        </div>
        <button onClick={() => s.setPanelOpen(false)} className="pbtn px-2 py-1 text-[8px] text-[#ff8f8f]">
          ✕
        </button>
      </div>

      {/* ---- configuration ---- */}
      <div className="flex flex-col gap-2">
        <Field label="OPENAI-COMPATIBLE ENDPOINT" hint="Any /v1 base URL: OpenAI, OpenRouter, Groq, Together, llama.cpp, Ollama (http://localhost:11434/v1).">
          <input
            className={inputCls}
            value={s.baseUrl}
            spellCheck={false}
            placeholder="https://api.openai.com/v1"
            onChange={(e) => setConfig({ baseUrl: e.target.value.trim() })}
            disabled={s.running}
          />
        </Field>

        <Field label="API KEY" hint="Stored only in this browser's localStorage. Never sent anywhere but your endpoint.">
          <div className="flex gap-1">
            <input
              className={inputCls}
              type={showKey ? "text" : "password"}
              value={s.apiKey}
              spellCheck={false}
              placeholder="sk-…"
              onChange={(e) => setConfig({ apiKey: e.target.value.trim() })}
              disabled={s.running}
            />
            <button onClick={() => setShowKey((v) => !v)} className="pbtn px-2 text-[8px] text-[#8fb7ff]">
              {showKey ? "🙈" : "👁"}
            </button>
          </div>
        </Field>

        <Field label="MODEL">
          <div className="flex gap-1">
            <input
              className={inputCls}
              value={s.model}
              spellCheck={false}
              list="agent-models"
              placeholder="gpt-4o-mini"
              onChange={(e) => setConfig({ model: e.target.value.trim() })}
              disabled={s.running}
            />
            <datalist id="agent-models">
              {s.models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <button
              onClick={() => void fetchModels()}
              disabled={s.loadingModels || s.running}
              title="List models from /models"
              className="pbtn whitespace-nowrap px-2 text-[7.5px] text-[#8fb7ff]"
            >
              {s.loadingModels ? "…" : "LIST"}
            </button>
          </div>
        </Field>

        {/* vision */}
        <div className="rounded border border-[#203868] bg-[#070c1e] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-bold tracking-wider" style={{ color: visColor }}>
              {visLabel}
            </span>
            <button
              onClick={() => void detectVision()}
              disabled={vis === "checking" || s.running}
              className="pbtn px-2 py-0.5 text-[7px] text-[#8fb7ff]"
            >
              CHECK
            </button>
          </div>
          {s.visionNote && (
            <div className="mt-1 text-[6.5px] leading-relaxed text-[#7f92c4]">{s.visionNote}</div>
          )}
          <label className="mt-1.5 flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={s.useVision}
              onChange={(e) => setConfig({ useVision: e.target.checked })}
              disabled={s.running}
            />
            <span className="text-[7px] text-[#c0d0f0]">
              Send screenshots when supported
            </span>
          </label>
          <div className="mt-1 text-[6.5px] leading-relaxed text-[#5f6f9c]">
            Probes the endpoint with a 1×1 image — the only reliable test, since the
            OpenAI-compatible spec has no capability field. Text observations are always sent.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="MAX STEPS">
            <input
              className={inputCls}
              type="number"
              min={1}
              max={2000}
              value={s.maxSteps}
              onChange={(e) => setConfig({ maxSteps: Math.max(1, Number(e.target.value) || 1) })}
              disabled={s.running}
            />
          </Field>
          <Field label="TEMPERATURE">
            <input
              className={inputCls}
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={s.temperature}
              onChange={(e) => setConfig({ temperature: Number(e.target.value) })}
              disabled={s.running}
            />
          </Field>
        </div>
      </div>

      {/* ---- controls ---- */}
      <div className="flex gap-1.5">
        {!s.running ? (
          <button onClick={() => startRun()} className="pbtn flex-1 py-2 text-[9px] font-bold text-[#8fe06a]">
            ▶ START RUN
          </button>
        ) : (
          <>
            <button onClick={() => pauseRun()} className="pbtn flex-1 py-2 text-[9px] font-bold text-[#ffd75e]">
              {s.paused ? "▶ RESUME" : "⏸ PAUSE"}
            </button>
            <button onClick={() => stopRun()} className="pbtn flex-1 py-2 text-[9px] font-bold text-[#ff8f8f]">
              ■ STOP
            </button>
          </>
        )}
        <button
          onClick={() => void stepOnce()}
          disabled={s.busy || s.running}
          title="Single step (debug)"
          className="pbtn px-2 py-2 text-[9px] text-[#8fb7ff]"
        >
          ⏭
        </button>
      </div>

      {/* ---- telemetry ---- */}
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          ["STEP", `${s.step}/${s.maxSteps}`],
          ["DEATHS", String(s.deaths)],
          ["FAILED", String(s.failedActions)],
          ["TOKENS", `${((s.promptTokens + s.completionTokens) / 1000).toFixed(1)}k`],
        ].map(([k, v]) => (
          <div key={k} className="rounded border border-[#203868] bg-[#070c1e] py-1">
            <div className="text-[6px] tracking-wider text-[#7f92c4]">{k}</div>
            <div className="text-[8px] font-bold text-[#dce6ff]">{v}</div>
          </div>
        ))}
      </div>

      {(s.busy || s.status !== "idle") && (
        <div className="flex items-center gap-1.5 text-[7px] text-[#8fb7ff]">
          {s.busy && <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#8fe06a]" />}
          <span>{s.status}</span>
        </div>
      )}

      {s.error && (
        <div className="rounded border border-[#d03838] bg-[#3a1212] p-2 text-[7px] leading-relaxed text-[#ff9090]">
          {s.error}
        </div>
      )}

      {/* ---- score ---- */}
      <div className="rounded border border-[#203868] bg-[#070c1e] p-2">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold tracking-wider text-[#ffd75e]">
            SCORE {score}/{maxScore}
          </span>
          <span className="text-[7px] text-[#7f92c4]">{pct}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-[#131c38]">
          <div className="h-full bg-[#8fe06a] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between text-[7px]">
              <span className={c.done ? "text-[#8fe06a]" : "text-[#6a7aa8]"}>
                {c.done ? "✔" : "○"} {c.label}
              </span>
              <span className="text-[#5f6f9c]">{c.points}p</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- result ---- */}
      {s.result && (
        <div
          className="rounded border p-2"
          style={{
            borderColor: s.result.completed ? "#48a028" : "#886018",
            background: s.result.completed ? "#143014" : "#2a2010",
          }}
        >
          <div className="text-[8px] font-bold" style={{ color: s.result.completed ? "#8fe06a" : "#ffd75e" }}>
            {s.result.completed ? "★ ACT I COMPLETE" : "RUN ENDED"}
          </div>
          <div className="mt-1 text-[7px] leading-relaxed text-[#c0d0f0]">
            {s.result.score}/{s.result.maxScore} pts · {s.result.steps} steps · {s.result.deaths} deaths ·{" "}
            {s.result.seconds}s
            <br />
            {s.result.reason}
          </div>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(exportReport());
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="pbtn mt-1.5 w-full py-1 text-[7.5px] text-[#8fb7ff]"
          >
            {copied ? "✔ COPIED" : "⧉ COPY JSON REPORT"}
          </button>
        </div>
      )}

      {/* ---- what the model sees ---- */}
      {s.lastShot && (
        <div>
          <div className="mb-1 text-[6.5px] tracking-widest text-[#7f92c4]">LAST FRAME SENT TO MODEL</div>
          <img src={s.lastShot} alt="agent view" className="w-full rounded border border-[#203868]" />
        </div>
      )}

      {/* ---- log ---- */}
      {s.log.length > 0 && (
        <div>
          <div className="mb-1 text-[6.5px] tracking-widest text-[#7f92c4]">ACTION LOG</div>
          <div className="flex max-h-44 flex-col gap-1 overflow-y-auto">
            {[...s.log].reverse().map((l) => (
              <div key={l.step} className="rounded border border-[#182a52] bg-[#070c1e] p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-bold" style={{ color: l.ok ? "#8fe06a" : "#ff9090" }}>
                    #{l.step} {l.action}
                  </span>
                  <span className="text-[6px] text-[#5f6f9c]">
                    {l.usedVision ? "👁 " : ""}
                    {(l.ms / 1000).toFixed(1)}s
                  </span>
                </div>
                {l.thought && <div className="text-[6.5px] italic text-[#a0b0d0]">{l.thought}</div>}
                {l.note && <div className="text-[6.5px] text-[#7f92c4]">→ {l.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
