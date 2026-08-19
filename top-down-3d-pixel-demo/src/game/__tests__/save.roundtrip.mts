/**
 * Save/load must survive the twelve-trial spine.
 *
 * The spine derives the active trial purely from the store's trial fields, so a
 * field that is written by saveGame but not read back by loadGame silently
 * rewinds the player's progress on load. That is exactly what happened when
 * trials 5-10 were added: saveGame gained the fields, loadGame did not, and a
 * mid-trial-6 save reloaded as "end of trial 4" with all puzzle progress gone.
 * Round-trip the whole spine here so the two halves can never drift again.
 */
const store=new Map<string,string>();
(globalThis as any).window={addEventListener(){},removeEventListener(){},dispatchEvent(){}};
(globalThis as any).localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>void store.set(k,v),removeItem:(k:string)=>void store.delete(k)};
(globalThis as any).document={querySelectorAll:()=>[]};
const {useElder}=await import("../eldervilleStory.ts");
const save=await import("../save.ts");
const q=await import("../quests.ts");
const s=()=>useElder.getState();
let fail=0; const ok=(c:boolean,m:string)=>{console.log((c?"  PASS  ":"  FAIL  ")+m); if(!c)fail++;};

// Put the store deep into the spine, mid-trial-6, with partial puzzle progress.
s().setWellTrialState("completed"); s().setScholarTrialState("completed");
s().setWidowTrialState("completed"); s().setMarketTrialState("completed");
s().setWatchTrialState("assigned"); for(const i of s().watchOrder) s().lightBrazier(i);
s().setWatchTrialState("completed");
s().setSluiceTrialState("assigned");
s().cycleSluice(0); s().cycleSluice(0); // head -> OPEN
const before={
  active:q.activeTrial(s())?.id, done:q.completedCount(s()),
  gates:[...s().sluiceGates], braziers:[...s().braziersLit], order:[...s().watchOrder],
  blightRow:s().blightRow, sacks:[...s().sacksWeighed], scrap:[...s().scrapHealth],
  muster:s().musterStep, rows:[...s().rowsInspected],
};
ok(save.saveGame(), "saveGame() succeeds mid-trial-6");

// Wipe to a fresh game, then load.
save.startNewGame();
ok(q.completedCount(s())===0, "startNewGame resets progress to 0");
ok(s().sluiceGates.every(g=>g===0), "startNewGame resets sluice gates");
ok(s().braziersLit.every(b=>!b), "startNewGame resets braziers");
ok(s().watchTrialState==="not_started", "startNewGame resets trial-5 state");
ok(s().scrapHealth.every(h=>h===40), "startNewGame resets construct hp");

ok(save.loadGame(), "loadGame() succeeds");
const after={
  active:q.activeTrial(s())?.id, done:q.completedCount(s()),
  gates:[...s().sluiceGates], braziers:[...s().braziersLit], order:[...s().watchOrder],
  blightRow:s().blightRow, sacks:[...s().sacksWeighed], scrap:[...s().scrapHealth],
  muster:s().musterStep, rows:[...s().rowsInspected],
};
ok(JSON.stringify(before)===JSON.stringify(after),
   `round-trip preserves spine state\n         before=${JSON.stringify(before)}\n         after =${JSON.stringify(after)}`);
ok(after.active==="sluice","resumes on trial 6 (the active one)");

// A v1 save must be REFUSED, not half-applied.
store.set("minslaire_save_slot_1", JSON.stringify({version:1,timestamp:Date.now(),
  player:{x:0,y:2,z:0,yaw:0},
  elderState:{wellTrialState:"completed",spoken:[]},
  env:{time:0}, ui:{pixel:3,scanlines:true,muted:false,daySpeed:1}}));
ok(save.loadGame()===false, "a v1 save is refused (would strand the spine on undefined states)");

// getSaveSummary must not throw on a rejected/foreign payload
store.set("minslaire_save_slot_1", "{not json");
let threw=false; try{ save.getSaveSummary(); }catch{ threw=true; }
ok(!threw, "getSaveSummary survives corrupt JSON");
console.log(fail===0?"\nSAVE ROUND-TRIP OK":`\n${fail} FAILURE(S)`);
process.exit(fail?1:0);
