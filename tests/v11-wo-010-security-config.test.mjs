import test from "node:test";
import assert from "node:assert/strict";
import { resolveConfiguration } from "../packages/config/dist/index.js";

test("WO-010: configuration path reconstruction treats __proto__ as data", () => {
  const marker = "gbsV11Wo010PrototypePollutionProbe";
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, marker);
  try {
    const input = JSON.parse(`{"repositoryBinding":{"__proto__":{"${marker}":"polluted"}}}`);
    const snapshot = resolveConfiguration({ override: input });

    assert.equal(Object.getOwnPropertyDescriptor(Object.prototype, marker), undefined);
    assert.equal(Object.hasOwn(snapshot.effective.repositoryBinding, "__proto__"), true);
    assert.equal(snapshot.effective.repositoryBinding.__proto__[marker], "polluted");
    assert.equal(Object.getPrototypeOf(snapshot.effective), Object.prototype);
  } finally {
    if (previous) Object.defineProperty(Object.prototype, marker, previous);
    else delete Object.prototype[marker];
  }
});
