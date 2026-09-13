import { createHash } from "node:crypto";
import { DEFAULT_TEMPLATE_BUDGETS } from "../packages/template-engine/dist/index.js";

export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

export const digest = Object.freeze({
  digest(input) {
    const hash = createHash("sha256");
    if (typeof input === "string") hash.update(input, "utf8");
    else hash.update(Buffer.from(input));
    return `sha256:${hash.digest("hex")}`;
  },
});

export function control(overrides = {}) {
  return { budgets: { ...DEFAULT_TEMPLATE_BUDGETS, ...(overrides.budgets ?? {}) }, ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== "budgets")) };
}

export function sourcePort(files) {
  const calls = [];
  const map = new Map(Object.entries(files).map(([ref, value]) => [ref, value instanceof Uint8Array ? value : encoder.encode(value)]));
  return {
    calls,
    async read(ref) {
      calls.push(ref);
      const value = map.get(ref);
      return value === undefined ? null : Uint8Array.from(value);
    },
  };
}

export function baseManifest(overrides = {}) {
  return {
    schemaVersion: 1,
    templateContractVersion: "1.0",
    templateId: "demo.template",
    templateVersion: "1.0.0",
    entries: [
      {
        entryId: "readme",
        kind: "TEXT_TEMPLATE",
        sourceRef: "content/readme.txt",
        targetPattern: "README.md",
        textPolicy: { lineEndings: "LF" },
      },
    ],
    variables: [],
    ...overrides,
  };
}

export function bundle(manifest = baseManifest(), files = {}) {
  return sourcePort({
    "template.json": JSON.stringify(manifest),
    "content/readme.txt": "hello\n",
    ...files,
  });
}

export function utf8(text) {
  return encoder.encode(text);
}

export function bytesToText(bytes) {
  return decoder.decode(Uint8Array.from(bytes));
}
