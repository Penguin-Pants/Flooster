import assert from "node:assert/strict";
import { formatKeyCombination, getKeyName } from "./keyboard";

const keyboardEvent = (value: { code?: string; key?: string }): KeyboardEvent =>
  value as KeyboardEvent;

const compoundKeys = [
  ["ScrollLock", "scrolllock", "Scroll Lock"],
  ["CapsLock", "capslock", "Caps Lock"],
  ["NumLock", "numlock", "Num Lock"],
  ["PageUp", "pageup", "Page Up"],
  ["PageDown", "pagedown", "Page Down"],
  ["PrintScreen", "printscreen", "Print Screen"],
] as const;

for (const [code, stored, displayed] of compoundKeys) {
  assert.equal(getKeyName(keyboardEvent({ code })), stored);
  assert.equal(formatKeyCombination(stored, "linux"), displayed);
}

assert.equal(getKeyName(keyboardEvent({ key: "CapsLock" })), "capslock");

// The Meta key must record the same token whether the `e.code` path or the
// `e.key` fallback handles it, on every OS.
for (const [osType, expected] of [
  ["macos", "command"],
  ["windows", "super"],
  ["linux", "super"],
] as const) {
  assert.equal(
    getKeyName(keyboardEvent({ code: "MetaLeft" }), osType),
    expected,
  );
  assert.equal(getKeyName(keyboardEvent({ key: "Meta" }), osType), expected);
  assert.equal(getKeyName(keyboardEvent({ key: "OS" }), osType), expected);
}
assert.equal(
  getKeyName(keyboardEvent({ code: "AudioVolumeUp" })),
  "audiovolumeup",
);

console.log("keyboard: all assertions passed");
