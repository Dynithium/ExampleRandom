import { useState } from "react";
import { useElder } from "../game/eldervilleStory";
import { sfx } from "../game/audio";

const ELEMENTS = [
  { id: 0, name: "EARTH", color: "#48a028", border: "#287018", bg: "#1f4a16" },
  { id: 1, name: "WATER", color: "#3890c8", border: "#205888", bg: "#183e5c" },
  { id: 2, name: "FIRE", color: "#d03838", border: "#881818", bg: "#5c1818" },
  { id: 3, name: "LIGHT", color: "#e8b040", border: "#987018", bg: "#5c4410" },
];

export function ScholarPuzzleModal() {
  const scholarTrialState = useElder((s) => s.scholarTrialState);
  const setScholarPuzzleOpen = useElder((s) => s.setScholarPuzzleOpen);
  const dials = useElder((s) => s.scholarDials);
  const cycleScholarDial = useElder((s) => s.cycleScholarDial);
  const pullScholarLever = useElder((s) => s.pullScholarLever);

  const solved = scholarTrialState === "puzzle_solved" || scholarTrialState === "completed";
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const deskRead = ["desk_read", "puzzle_solved", "completed"].includes(scholarTrialState);
  const [showNotes, setShowNotes] = useState(deskRead);

  const cycleDial = (index: number) => {
    if (solved) return;
    sfx.puzzleClick();
    setErrorMsg(null);
    cycleScholarDial(index);
  };

  const handlePullLever = () => {
    if (solved) return;
    const isCorrect = pullScholarLever();
    if (isCorrect) {
      sfx.puzzleUnlock();
    } else {
      sfx.puzzleError();
      setErrorMsg("The internal gears jam and click... The elemental order is discordant.");
    }
  };

  const handleClose = () => {
    sfx.ui();
    setScholarPuzzleOpen(false);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-pixel backdrop-blur-xs">
      <div className="panel flex w-full max-w-[480px] flex-col gap-4 border-[3px] border-[#203868] bg-[#0e1730] p-5 text-[#f0e8c8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#284888] pb-2">
          <div>
            <div className="text-[13px] font-bold tracking-[0.2em] text-[#ffd75e]">ANCIENT ARCHIVE MECHANISM</div>
            <div className="text-[8px] text-[#7f92c4]">Council Hall Study · Shelf Elemental Lock</div>
          </div>
          <button onClick={handleClose} className="pbtn px-2.5 py-1 text-[9px] text-[#ff8f8f]" aria-label="close">
            ✕ CLOSE
          </button>
        </div>

        {!solved ? (
          <div className="text-[8.5px] leading-relaxed text-[#c0d0f0]">
            Four elemental frequency tumblers lock the glass casing. Turn the brass dials to resonate in the ancient
            order of harmony to release the wedged scroll.
          </div>
        ) : (
          <div className="rounded border border-[#48a028] bg-[#143014] p-3 text-center text-[10px] font-bold text-[#8fe06a] animate-bounce">
            ★ CLICK! The brass casing slides open! You retrieved the Pre-War Frequency Scroll!
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 py-1">
          {dials.map((val, i) => {
            const el = ELEMENTS[val];
            return (
              <div
                key={i}
                onClick={() => cycleDial(i)}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded border-2 p-2.5 transition-all hover:scale-105"
                style={{ backgroundColor: el.bg, borderColor: el.border }}
              >
                <div className="text-[7px] font-bold tracking-wider text-[#ffd75e]">SLOT {i + 1}</div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-[14px] shadow-md"
                  style={{ backgroundColor: el.color, borderColor: el.border }}
                >
                  {["🌱", "💧", "🔥", "☀️"][val]}
                </div>
                <div className="text-center text-[8px] font-bold" style={{ color: el.color }}>
                  {el.name}
                </div>
                <div className="text-[6.5px] text-[#a0b0d0]">CLICK TO TURN</div>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="rounded border border-[#d03838] bg-[#3a1212] p-2 text-center text-[8px] font-bold text-[#ff9090]">
            {errorMsg}
          </div>
        )}

        <div className="rounded border border-[#203868] bg-[#070c1e] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-[#ffd75e]">📜 RESEARCH JOURNAL CLUE:</span>
            {deskRead ? (
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="text-[7.5px] text-[#8fb7ff] underline hover:text-[#ffd75e]"
              >
                {showNotes ? "HIDE NOTES" : "SHOW NOTES"}
              </button>
            ) : (
              <span className="text-[7px] text-[#7f92c4]">LOCKED</span>
            )}
          </div>
          {deskRead ? (
            showNotes && (
              <div className="mt-2 text-[7.5px] italic leading-relaxed text-[#c0d0e8]">
                1. First, the Mountain Earth (<span className="font-bold text-[#48a028]">Green</span>) anchored the
                foundation.
                <br />
                2. Second, the Deep Ocean (<span className="font-bold text-[#3890c8]">Blue</span>) filled the trenches.
                <br />
                3. Third, the Molten Core (<span className="font-bold text-[#d03838]">Red</span>) warmed the
                bio-membrane.
                <br />
                4. Fourth, the Golden Sun (<span className="font-bold text-[#e8b040]">Gold</span>) illuminated the seal.
              </div>
            )
          ) : (
            <div className="mt-2 text-[7.5px] italic leading-relaxed text-[#7f92c4]">
              The harmony order is written in Elder Sage&apos;s journal, open on the study desk. Read the desk first —
              the shelf is a test of patience, not guessing.
            </div>
          )}
        </div>

        {!solved ? (
          <button onClick={handlePullLever} className="pbtn w-full py-2.5 text-[11px] font-bold tracking-widest text-[#ffe9a8]">
            PULL ARCHIVE LEVER [TEST HARMONY]
          </button>
        ) : (
          <button onClick={handleClose} className="pbtn w-full py-2.5 text-[11px] font-bold tracking-widest text-[#8fe06a]">
            TAKE SCROLL & DELIVER TO SAGE
          </button>
        )}
      </div>
    </div>
  );
}
