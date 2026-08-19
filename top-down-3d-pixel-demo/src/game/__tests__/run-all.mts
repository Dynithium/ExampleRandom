/**
 * Agent Mode test suite.
 *
 *   npm run test:agent
 *
 * These run against the REAL game modules (world generation, the zustand story
 * store, the agent harness) with small stubs for the browser APIs those modules
 * touch. No browser or network required.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const suites = [
  ["pathfinding", "agent.pathfinding.mts"],
  ["story completability", "agent.story.mts"],
  ["reply parser", "agent.parser.mts"],
  ["observation builder", "agent.observation.mts"],
  ["vision capture", "agent.vision.mts"],
];

let failed = 0;
for (const [label, file] of suites) {
  console.log(`\n${"=".repeat(64)}\n  ${label.toUpperCase()}\n${"=".repeat(64)}`);
  const r = spawnSync(process.execPath, ["--import", "tsx", join(here, file)], {
    stdio: "inherit",
  });
  if (r.status !== 0) failed++;
}
console.log(`\n${"=".repeat(64)}`);
console.log(failed === 0 ? "  ALL AGENT SUITES PASSED" : `  ${failed} SUITE(S) FAILED`);
console.log("=".repeat(64));
process.exit(failed === 0 ? 0 : 1);
