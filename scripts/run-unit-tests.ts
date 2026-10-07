#!/usr/bin/env bun
// Runs every standalone `*.test.ts` under src/ with bun. The tests are plain
// assert scripts (no test runner in this repo); a new test file is picked up
// automatically instead of needing a hand-maintained list in package.json.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const collect = (dir: string, out: string[]): string[] => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collect(path, out);
    } else if (entry.endsWith(".test.ts")) {
      out.push(path);
    }
  }
  return out;
};

const tests = collect("src", []).sort();
if (tests.length === 0) {
  console.error("No *.test.ts files found under src/");
  process.exit(1);
}

let failed = 0;
for (const test of tests) {
  const result = spawnSync("bun", [test], { stdio: "inherit" });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAILED: ${test}`);
  }
}

console.log(`${tests.length - failed}/${tests.length} test files passed`);
process.exit(failed === 0 ? 0 : 1);
