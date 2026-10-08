// Standalone assert check (no JS unit-test runner in this repo). Run with:
//   bun src/lib/utils/result.test.ts
import assert from "node:assert/strict";
import { errorMessage, expectOk } from "./result";

// An ok Result and non-Result values pass through.
assert.doesNotThrow(() => expectOk({ status: "ok", data: null }));
assert.doesNotThrow(() => expectOk(undefined));
assert.doesNotThrow(() => expectOk(null));
assert.doesNotThrow(() => expectOk("plain value"));

// An error Result throws with the backend message.
assert.throws(
  () => expectOk({ status: "error", error: "device busy" }),
  (e: unknown) => e instanceof Error && e.message === "device busy",
);
// Non-string error payloads are stringified instead of dropped.
assert.throws(
  () => expectOk({ status: "error", error: { code: 7 } }),
  (e: unknown) => e instanceof Error && e.message === "[object Object]",
);

assert.equal(errorMessage(new Error("boom")), "boom");
assert.equal(errorMessage("raw"), "raw");
assert.equal(errorMessage(42), "42");

console.log("result: all assertions passed");
