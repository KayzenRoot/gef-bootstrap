#!/usr/bin/env node
// GEF Bootstrap CLI executable shim.
//
// Resolves the built CLI entry without a shell pipeline. A broken or unbuilt installation
// fails closed with a bounded capability message and a non-zero exit code instead of
// emitting an unhandled stack trace.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FAIL_CLOSED_EXIT = 40; // DEPENDENCY_OR_CAPABILITY_FAILURE

/** Run the existing CLI boundary with injectable effects for real fail-closed tests. */
export async function launchCli({
  loadEntry = () => import("../dist/main.js"),
  writeError = message => process.stderr.write(message),
  setExitCode = code => { process.exitCode = code; },
} = {}) {
  try {
    const { main } = await loadEntry();
    await main();
  } catch (cause) {
    const detail = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : cause?.name ?? "UNKNOWN";
    writeError(`gef: CLI entry is unavailable (${detail}). Build the workspace or reinstall the package.\n`);
    setExitCode(FAIL_CLOSED_EXIT);
  }
}

if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  if (process.argv[2] === "parallel") {
    const { runParallel } = await import("./parallel.mjs");
    process.exitCode = await runParallel(process.argv.slice(3));
  } else {
    await launchCli();
  }
}
