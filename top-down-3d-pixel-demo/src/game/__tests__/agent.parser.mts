/** The JSON extractor is the #1 real-world failure point: models wrap output in
 *  markdown, add prose, emit reasoning preambles. Verify each case. */
function extractJson(text: string): any | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");
  if (a === -1 || b <= a) return null;
  try { return JSON.parse(cleaned.slice(a, b + 1)); } catch {
    for (let end = b; end > a; end--) {
      if (cleaned[end] !== "}") continue;
      try { return JSON.parse(cleaned.slice(a, end + 1)); } catch {}
    }
    return null;
  }
}
const cases: [string,string,string|null][] = [
  ["bare json", '{"thought":"go","action":"interact"}', "interact"],
  ["markdown fence", '```json\n{"thought":"go","action":"interact"}\n```', "interact"],
  ["plain fence", '```\n{"action":"attack"}\n```', "attack"],
  ["prose before", 'I will advance the dialog.\n{"action":"interact"}', "interact"],
  ["prose after", '{"action":"interact"}\nThat advances the line.', "interact"],
  ["prose both sides", 'Thinking...\n{"action":"move_to","tx":12,"ty":10}\nDone.', "move_to"],
  ["nested object", '{"thought":"x","action":"set_dials","dials":["green","blue","red","gold"]}', "set_dials"],
  ["trailing junk brace", '{"action":"wait","seconds":1} } extra', "wait"],
  ["no json at all", 'I am not sure what to do here.', null],
  ["empty", '', null],
];
let fail=0;
for (const [name, input, want] of cases) {
  const got = extractJson(input);
  const act = got?.action ?? null;
  const ok = act === want;
  console.log((ok?"  PASS  ":"  FAIL  ")+name.padEnd(20)+" -> "+JSON.stringify(act));
  if(!ok)fail++;
}
// dials arg normalisation
const COLOR: Record<string,number> = {green:0,earth:0,blue:1,water:1,red:2,fire:2,gold:3,yellow:3,light:3};
const norm = (raw:any) => {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/).filter(Boolean);
  if (list.length !== 4) return null;
  const ids = list.map((c:any)=>{const k=String(c).trim().toLowerCase();
    return k in COLOR ? COLOR[k] : Number.isFinite(Number(k)) ? Number(k) : -1;});
  return ids.some((n:number)=>n<0||n>3) ? null : ids;
};
console.log("\n=== set_dials argument shapes ===");
for (const [label, raw, want] of [
  ["array of colours", ["green","blue","red","gold"], "[0,1,2,3]"],
  ["comma string", "green,blue,red,gold", "[0,1,2,3]"],
  ["space string", "green blue red gold", "[0,1,2,3]"],
  ["mixed case", ["Green","BLUE","Red","Gold"], "[0,1,2,3]"],
  ["element names", ["earth","water","fire","light"], "[0,1,2,3]"],
  ["numeric", [0,1,2,3], "[0,1,2,3]"],
  ["wrong count", ["green","blue"], "null"],
  ["bad colour", ["green","blue","red","purple"], "null"],
] as any[]) {
  const got = JSON.stringify(norm(raw));
  const ok = got === want;
  console.log((ok?"  PASS  ":"  FAIL  ")+String(label).padEnd(20)+" -> "+got);
  if(!ok)fail++;
}
console.log(fail===0?"\nPARSER ROBUST":`\n${fail} FAILURE(S)`);
