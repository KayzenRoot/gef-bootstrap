import { utf8Length } from "./runtime.js";

export function measureRenderedUtf8Bytes(
  chunks: readonly string[],
  policy: "PRESERVE_SOURCE" | "LF" | "CRLF",
  limit: number,
): number {
  if (policy === "PRESERVE_SOURCE") {
    let total = 0;
    for (const chunk of chunks) {
      total += utf8Length(chunk);
      if (total > limit) return limit + 1;
    }
    return total;
  }

  const newlineBytes = policy === "CRLF" ? 2 : 1;
  let total = 0;
  let pendingCr = false;

  const add = (count: number): boolean => {
    total += count;
    return total <= limit;
  };

  for (const chunk of chunks) {
    for (let index = 0; index < chunk.length;) {
      const code = chunk.charCodeAt(index);
      if (pendingCr) {
        if (!add(newlineBytes)) return limit + 1;
        pendingCr = false;
        if (code === 0x0a) {
          index += 1;
          continue;
        }
      }
      if (code === 0x0d) {
        pendingCr = true;
        index += 1;
        continue;
      }
      if (code === 0x0a) {
        if (!add(newlineBytes)) return limit + 1;
        index += 1;
        continue;
      }
      if (code <= 0x7f) {
        if (!add(1)) return limit + 1;
        index += 1;
      } else if (code <= 0x7ff) {
        if (!add(2)) return limit + 1;
        index += 1;
      } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < chunk.length) {
        if (!add(4)) return limit + 1;
        index += 2;
      } else {
        if (!add(3)) return limit + 1;
        index += 1;
      }
    }
  }

  if (pendingCr && !add(newlineBytes)) return limit + 1;
  return total;
}
