import { symlinkSync } from "node:fs";

/** Create a directory alias with the strongest primitive the host allows. */
export function createAlias(target, linkPath) {
  try {
    symlinkSync(target, linkPath, "dir");
    return "symlink";
  } catch (cause) {
    if (cause?.code !== "EPERM" && cause?.code !== "EACCES") throw cause;
  }
  try {
    symlinkSync(target, linkPath, "junction");
    return "junction";
  } catch (cause) {
    return `unavailable:${cause?.code ?? "UNKNOWN"}`;
  }
}
