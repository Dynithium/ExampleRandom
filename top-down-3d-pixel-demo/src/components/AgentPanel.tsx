import { useEffect, useState, type ReactNode } from "react";
import {
  useAgent,
  ENDPOINT_PRESETS,
  startRun,
  stopRun,
  testConnection,
  benchmarkProgress,
  downloadResults,
} from "../game/agent";
import { sfx } from "../game/audio";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[7.5px] font-bold tracking-wider text-[#7f92c4]">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded border border-[#284888] bg-[#070b1a] px-2 py-1.5 text-[11px] text-[#f0e8c8] outline-none focus:border-[#ffd75e]";

export function AgentSetup({ onStarted }: { onStarted?: () => void }) {
  const baseUrl = useAgent((s) => s.baseUrl);
  const model = useAgent((s) => s.model);
  const apiKey = useAgent((s) => s.apiKey);
  const maxSteps = useAgent((s) => s.maxSteps);
  const testNote = useAgent((s) => s.testNote);
  const error = useAgent((s) => s.error);
  const running = useAgent((s) => s.running);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const applyPreset = (id: string) => {
    const p = ENDPOINT_PRESETS.find((x) => x.id === id);
    if (!p) return;
    useAgent.getState().setConfig({ baseUrl: p.url, model: p.model });
    sfx.ui();
  };

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: "monospace" }}>
      <div>
        <div className="text-[11px] font-bold tracking-[0.18em] text-[#ffd75e]">AGENT BENCHMARK</div>
        <div className="mt-1 text-[8px] leading-relaxed text-[#7f92c4]">
          Paste any OpenAI-compatible endpoint. The model plays Act I through the same
          walk, talk, and combat the human does — no teleports, no skipped trials.
        </div>
      </div>

      <Field label="PRESET">
        <select
          className={inputCls}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) applyPreset(e.target.value);
          }}
        >
          <option value="">Choose a host…</option>
          {ENDPOINT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="ENDPOINT (OpenAI-compatible)">
        <input
          className={inputCls}
          value={baseUrl}
          placeholder="https://api.openai.com/v1"
          onChange={(e) => useAgent.getState().setConfig({ baseUrl: e.target.value })}
          spellCheck={false}
        />
      </Field>

      <Field label="MODEL">
        <input
          className={inputCls}
          value={model}
          placeholder="gpt-4o-mini"
          onChange={(e) => useAgent.getState().setConfig({ model: e.target.value })}
          spellCheck={false}
        />
      </Field>

      <Field label="API KEY (stored only in this browser)">
        <div className="flex gap-1.5">
          <input
            className={inputCls}
            type={showKey ? "text" : "password"}
            value={apiKey}
            placeholder="sk-…  (optional for local servers)"
            onChange={(e) => useAgent.getState().setConfig({ apiKey: e.target.value })}
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="pbtn shrink-0 px-2 text-[8px]"
            onClick={() => {
              sfx.ui();
              setShowKey((v) => !v);
            }}
          >
            {showKey ? "HIDE" : "SHOW"}
          </button>
        </div>
      </Field>

      <Field label="MAX STEPS">
        <input
          className={inputCls}
          type="number"
          min={20}
          max={2000}
          value={maxSteps}
          onChange={(e) =>
            useAgent.getState().setConfig({ maxSteps: Math.max(20, Math.min(2000, Number(e.target.value) || 200)) })
          }
        />
      </Field>

      <div className="rounded border border-[#203868] bg-[#070b1a] p-2 text-[7.5px] leading-relaxed text-[#8aa0c8]">
        Browser calls need CORS. OpenRouter, Groq, and local servers (Ollama / LM Studio with CORS on)
        usually work. Official OpenAI may block the browser unless you proxy it.
      </div>

      {testNote && (
        <div className="rounded border border-[#284888] bg-[#102038] p-2 text-[8px] text-[#8fb7ff]">{testNote}</div>
      )}
      {error && !running && (
        <div className="rounded border border-[#881818] bg-[#3a1212] p-2 text-[8px] text-[#ff9090]">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={testing || running}
          className="pbtn py-2 text-[8.5px] font-bold tracking-wider text-[#8fb7ff] disabled:opacity-40"
          onClick={async () => {
            sfx.ui();
            setTesting(true);
            await testConnection();
            setTesting(false);
          }}
        >
          {testing ? "TESTING…" : "TEST LINK"}
        </button>
        <button
          type="button"
          disabled={running || !baseUrl || !model}
          className="pbtn py-2 text-[8.5px] font-bold tracking-wider text-[#8fe06a] disabled:opacity-40"
          onClick={() => {
            sfx.door();
            startRun();
            onStarted?.();
          }}
        >
          ▶ START BENCH
        </button>
      </div>

      {running && (
        <button
          type="button"
          className="pbtn py-2 text-[8.5px] font-bold tracking-wider text-[#ff8f8f]"
          onClick={() => {
            sfx.ui();
            stopRun("stopped from settings");
          }}
        >
          ■ STOP RUN
        </button>
      )}
    </div>
  );
}

function formatElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function AgentOverlay() {
  const running = useAgent((s) => s.running);
  const busy = useAgent((s) => s.busy);
  const step = useAgent((s) => s.step);
  const maxSteps = useAgent((s) => s.maxSteps);
  const deaths = useAgent((s) => s.deaths);
  const startedAt = useAgent((s) => s.startedAt);
  const finishedReason = useAgent((s) => s.finishedReason);
  const log = useAgent((s) => s.log);
  const error = useAgent((s) => s.error);
  const model = useAgent((s) => s.model);
  const [, tick] = useState(0);
  const { checks, score, maxScore } = benchmarkProgress();

  useEffect(() => {
    if (!running || !startedAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, startedAt]);

  if (!running && !finishedReason) return null;

  const elapsed = startedAt ? Date.now() - startedAt : 0;
  const last = log[log.length - 1];
  const done = !running && !!finishedReason;

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-30 w-[min(320px,46vw)] font-pixel">
      <div
        className="pointer-events-auto rounded-md border-[3px] border-[#203868] bg-[#0c142c]/95 p-2.5 text-[#f0e8c8] shadow-2xl"
        style={{ fontFamily: "monospace" }}
      >
        <div className="flex items-start justify-between gap-2 border-b border-[#284888] pb-1.5">
          <div>
            <div className="text-[8px] font-bold tracking-[0.16em] text-[#ffd75e]">
              {done ? "BENCH RESULT" : "AGENT LIVE"}
            </div>
            <div className="mt-0.5 truncate text-[7px] text-[#7f92c4]">{model}</div>
          </div>
          <div className="text-right text-[8px] font-bold text-[#8fe06a]">
            {score}/{maxScore}
            <div className="text-[7px] font-normal text-[#7f92c4]">
              {step}/{maxSteps} · {deaths} die · {formatElapsed(elapsed)}
            </div>
          </div>
        </div>

        <div className="mt-1.5 flex flex-col gap-0.5">
          {checks.map((c) => (
            <div key={c.label} className={"text-[7.5px] " + (c.done ? "text-[#8fe06a]" : "text-[#5f719e]")}>
              {c.done ? "☑" : "☐"} {c.label}
              {c.points > 1 ? ` +${c.points}` : ""}
            </div>
          ))}
        </div>

        {last && (
          <div className="mt-1.5 rounded border border-[#203868] bg-[#070b1a] p-1.5 text-[7.5px] leading-relaxed text-[#c0d0f0]">
            <div className="text-[#ffd75e]">{last.thought || "…"}</div>
            <div className={last.ok ? "text-[#8fb7ff]" : "text-[#ff9090]"}>
              #{last.step} {last.action}
              {last.note ? ` — ${last.note}` : ""}
            </div>
          </div>
        )}

        {busy && running && <div className="mt-1 animate-pulse text-[7px] text-[#8fb7ff]">thinking…</div>}

        {error && <div className="mt-1 text-[7.5px] text-[#ff9090]">{error}</div>}
        {done && finishedReason && (
          <div className="mt-1.5 text-[8px] font-bold text-[#ffd75e]">{finishedReason}</div>
        )}

        <div className="mt-2 flex gap-1.5">
          {running ? (
            <button
              type="button"
              className="pbtn flex-1 py-1 text-[7.5px] text-[#ff8f8f]"
              onClick={() => {
                sfx.ui();
                stopRun("stopped from overlay");
              }}
            >
              STOP
            </button>
          ) : (
            <button
              type="button"
              className="pbtn flex-1 py-1 text-[7.5px] text-[#8fe06a]"
              onClick={() => {
                sfx.door();
                startRun();
              }}
            >
              RUN AGAIN
            </button>
          )}
          <button
            type="button"
            className="pbtn flex-1 py-1 text-[7.5px] text-[#8fb7ff]"
            onClick={() => {
              sfx.ui();
              downloadResults();
            }}
          >
            EXPORT
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentSetupModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-4 font-pixel backdrop-blur-xs">
      <div className="panel flex w-full max-w-[460px] max-h-[92dvh] flex-col gap-3 overflow-y-auto border-[3px] border-[#203868] bg-[#0c142c] p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[13px] font-bold tracking-[0.22em] text-[#ffd75e]">AGENT MODE</div>
            <div className="mt-1 text-[8px] text-[#7f92c4]">Fair-play Act I benchmark</div>
          </div>
          <button
            type="button"
            className="pbtn px-2 py-1 text-[8px] text-[#ff8f8f]"
            onClick={() => {
              sfx.ui();
              onClose();
            }}
          >
            ✕
          </button>
        </div>
        <AgentSetup onStarted={onClose} />
      </div>
    </div>
  );
}
