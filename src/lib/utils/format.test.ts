// Standalone assert check (no JS unit-test runner in this repo). Run with:
//   bun src/lib/utils/format.test.ts
import assert from "node:assert/strict";
import { formatModelSize } from "./format";

// Unknown sizes return null so the caller can show a translated placeholder
// instead of a hardcoded English string.
assert.equal(formatModelSize(null), null);
assert.equal(formatModelSize(undefined), null);
assert.equal(formatModelSize(0), null);
assert.equal(formatModelSize(-5), null);
assert.equal(formatModelSize(Number.NaN), null);

// Known sizes format in MB below 1 GB and in GB above, with sensible precision.
assert.match(formatModelSize(75)!, /MB$/);
assert.match(formatModelSize(75)!, /75/);
assert.match(formatModelSize(150)!, /^150 MB$/);
assert.match(formatModelSize(1536)!, /GB$/);
assert.match(formatModelSize(1536)!, /1[.,]5/);
assert.match(formatModelSize(10 * 1024)!, /^10 GB$/);

console.log("format: all assertions passed");
