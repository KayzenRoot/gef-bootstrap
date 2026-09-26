import { fail, isRecord } from "./runtime.js";
import type { TemplateResult } from "./types.js";

class JsonFailure extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

const MAX_JSON_DEPTH = 64;
const MAX_JSON_MEMBERS = 16384;

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

class StrictJsonParser {
  #index = 0;
  #members = 0;

  constructor(private readonly text: string) {}

  parse(): unknown {
    this.#skipWhitespace();
    const value = this.#value(0);
    this.#skipWhitespace();
    if (this.#index !== this.text.length) throw new JsonFailure("JSON_TRAILING_DATA", "Unexpected trailing JSON data.");
    return value;
  }

  #skipWhitespace(): void {
    while (this.#index < this.text.length) {
      const code = this.text.charCodeAt(this.#index);
      if (code !== 0x20 && code !== 0x0a && code !== 0x0d && code !== 0x09) break;
      this.#index += 1;
    }
  }

  #value(depth: number): unknown {
    if (depth > MAX_JSON_DEPTH) throw new JsonFailure("JSON_TOO_DEEP", "JSON nesting exceeds the admitted bound.");
    this.#skipWhitespace();
    const char = this.text[this.#index];
    if (char === "{") return this.#object(depth + 1);
    if (char === "[") return this.#array(depth + 1);
    if (char === '"') return this.#string();
    if (char === "t" && this.text.startsWith("true", this.#index)) { this.#index += 4; return true; }
    if (char === "f" && this.text.startsWith("false", this.#index)) { this.#index += 5; return false; }
    if (char === "n" && this.text.startsWith("null", this.#index)) { this.#index += 4; return null; }
    return this.#number();
  }

  #object(depth: number): Record<string, unknown> {
    this.#index += 1;
    this.#skipWhitespace();
    const result = Object.create(null) as Record<string, unknown>;
    const keys = new Set<string>();
    if (this.text[this.#index] === "}") { this.#index += 1; return result; }
    while (true) {
      this.#skipWhitespace();
      if (this.text[this.#index] !== '"') throw new JsonFailure("JSON_OBJECT_KEY_INVALID", "Object member name must be a JSON string.");
      const key = this.#string();
      if (keys.has(key)) throw new JsonFailure("JSON_DUPLICATE_KEY", "Duplicate JSON object member name is forbidden.");
      keys.add(key);
      this.#members += 1;
      if (this.#members > MAX_JSON_MEMBERS) throw new JsonFailure("JSON_TOO_COMPLEX", "JSON member count exceeds the admitted bound.");
      this.#skipWhitespace();
      if (this.text[this.#index] !== ":") throw new JsonFailure("JSON_COLON_EXPECTED", "Expected ':' after object member name.");
      this.#index += 1;
      result[key] = this.#value(depth);
      this.#skipWhitespace();
      const delimiter = this.text[this.#index];
      if (delimiter === "}") { this.#index += 1; return result; }
      if (delimiter !== ",") throw new JsonFailure("JSON_OBJECT_DELIMITER_INVALID", "Expected ',' or '}' in object.");
      this.#index += 1;
    }
  }

  #array(depth: number): unknown[] {
    this.#index += 1;
    this.#skipWhitespace();
    const result: unknown[] = [];
    if (this.text[this.#index] === "]") { this.#index += 1; return result; }
    while (true) {
      this.#members += 1;
      if (this.#members > MAX_JSON_MEMBERS) throw new JsonFailure("JSON_TOO_COMPLEX", "JSON member count exceeds the admitted bound.");
      result.push(this.#value(depth));
      this.#skipWhitespace();
      const delimiter = this.text[this.#index];
      if (delimiter === "]") { this.#index += 1; return result; }
      if (delimiter !== ",") throw new JsonFailure("JSON_ARRAY_DELIMITER_INVALID", "Expected ',' or ']' in array.");
      this.#index += 1;
    }
  }

  #string(): string {
    const start = this.#index;
    this.#index += 1;
    let escaped = false;
    while (this.#index < this.text.length) {
      const code = this.text.charCodeAt(this.#index);
      if (!escaped && code === 0x22) {
        this.#index += 1;
        const token = this.text.slice(start, this.#index);
        let value: unknown;
        try { value = JSON.parse(token) as unknown; } catch { throw new JsonFailure("JSON_STRING_INVALID", "Invalid JSON string."); }
        if (typeof value !== "string" || hasUnpairedSurrogate(value)) throw new JsonFailure("JSON_STRING_UNICODE_INVALID", "JSON string contains an invalid Unicode scalar sequence.");
        return value;
      }
      if (!escaped && code < 0x20) throw new JsonFailure("JSON_STRING_CONTROL", "Unescaped control character in JSON string.");
      if (!escaped && code === 0x5c) escaped = true;
      else escaped = false;
      this.#index += 1;
    }
    throw new JsonFailure("JSON_STRING_UNCLOSED", "Unclosed JSON string.");
  }

  #number(): number {
    const remaining = this.text.slice(this.#index);
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(remaining);
    if (!match) throw new JsonFailure("JSON_VALUE_INVALID", "Invalid JSON value.");
    this.#index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new JsonFailure("JSON_NUMBER_NONFINITE", "JSON number is outside the finite runtime range.");
    return value;
  }
}

export function parseStrictJson(text: string): TemplateResult<unknown> {
  try {
    return { ok: true, value: new StrictJsonParser(text).parse() };
  } catch (error) {
    if (error instanceof JsonFailure) return fail(error.code, "FORMAT", error.message);
    return fail("JSON_INVALID", "FORMAT", "Manifest is not valid strict JSON.");
  }
}

export function ownField(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

export function ownRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}
