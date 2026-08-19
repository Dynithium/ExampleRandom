/** Verify buildObservation() renders correctly at each story beat, using the real store. */
const store = new Map<string,string>();
(globalThis as any).window = { addEventListener(){}, removeEventListener(){}, dispatchEvent(){} };
(globalThis as any).localStorage = { getItem:(k:string)=>store.get(k)??null, setItem:(k:string,v:string)=>void store.set(k,v), removeItem:(k:string)=>void store.delete(k) };
(globalThis as any).document = { querySelectorAll: () => [] };

const { useElder } = await import("../eldervilleStory.ts");
const { rt } = await import("../state.ts");
const { buildObservation } = await import("../agent.ts");

let fail=0; const ok=(c:boolean,m:string)=>{console.log((c?"  PASS  ":"  FAIL  ")+m); if(!c)fail++;};

console.log("=== 1. opening (black screen) ===");
useElder.setState({openingBlack:true, memoryActive:false, currentArea:"home", currentInterior:"home"});
rt.player.pos.set(72.5+4.5, 2, 75+5.5);
let o = buildObservation();
ok(o.includes("ONLY 'interact'"), "tells the agent only interact works");
ok(o.includes("AREA: home"), "reports area home");

console.log("\n=== 2. dialog open ===");
useElder.setState({openingBlack:false, activeDialog:{name:"Tinslaire",lines:["a","b","c"],index:1} as any});
o = buildObservation();
ok(o.includes("DIALOG OPEN — Tinslaire (line 2/3)"), "dialog line counter");
ok(o.includes("ONLY useful action is 'interact'"), "constrains action space");

console.log("\n=== 3. archive puzzle, journal NOT read ===");
useElder.setState({activeDialog:null, scholarPuzzleOpen:true, scholarTrialState:"assigned", scholarDials:[2,0,3,1], currentArea:"council"});
o = buildObservation();
ok(o.includes("ARCHIVE PUZZLE PANEL IS OPEN"), "announces the panel");
ok(o.includes("set_dials"), "advertises set_dials");
ok(o.includes("has not been read yet"), "withholds the answer before the desk is read");
ok(!o.includes("Green, Blue, Red, Gold"), "does NOT leak the solution early");

console.log("\n=== 4. archive puzzle, journal read ===");
useElder.setState({scholarTrialState:"desk_read"});
o = buildObservation();
ok(o.includes("the order is Green, Blue, Red, Gold"), "reveals order once earned");
ok(o.includes("slot1=RED/Fire"), "renders current dial state: "+(o.match(/dials: (.*)/)||[])[1]);

console.log("\n=== 5. boss fight ===");
useElder.setState({scholarPuzzleOpen:false, currentArea:"cave", caveStage:"boss_awake", bossHp:28, hasSword:true});
rt.player.pos.set(72.5+7.5, 2, 75+8.5);
rt.boss.pos.set(72.5+7.5, 2, 75+3.5);
o = buildObservation();
ok(/BOSS: Cave Machine HP 28\/40/.test(o), "boss hp");
ok(/units N of you/.test(o), "boss direction: "+(o.match(/— (.*?) of you/)||[])[1]);

console.log("\n=== 6. blade trial dummies ===");
useElder.setState({currentArea:"village", caveStage:"not_entered", combatTrialState:"assigned", dummiesHealth:[60,20,0]});
rt.player.pos.set(0,2,0);
o = buildObservation();
ok(o.includes("DUMMIES: hp 60 / 20 / 0"), "dummy hp line");

console.log("\n=== 7. POIs are contextual ===");
useElder.setState({widowTrialState:"assigned", carryingGrain:false});
o = buildObservation();
ok(o.includes("Grain sack"), "grain sack appears when the trial is active");
useElder.setState({carryingGrain:true});
o = buildObservation();
ok(!o.includes("Grain sack"), "grain sack hidden once carried");

console.log("\n=== sample observation ===");
useElder.setState({currentArea:"village",widowTrialState:"completed",carryingGrain:false,combatTrialState:"not_started"});
console.log(buildObservation().split("\n").slice(0,9).map(l=>"    "+l).join("\n"));
console.log(fail===0?"\nOBSERVATION BUILDER OK":`\n${fail} FAILURE(S)`);
