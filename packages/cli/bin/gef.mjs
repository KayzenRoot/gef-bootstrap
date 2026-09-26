#!/usr/bin/env node
// GEF Bootstrap CLI executable shim.
//
// Resolves the built CLI entry without a shell pipeline. A broken or unbuilt installation
// fails closed with a bounded capability message and a non-zero exit code instead of
// emitting an unhandled stack trace.
const FAIL_CLOSED_EXIT = 40; // DEPENDENCY_OR_CAPABILITY_FAILURE

try {
  const { main } = await import("../dist/main.js");
  await main();
} catch (cause) {
  const detail = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : cause?.name ?? "UNKNOWN";
  process.stderr.write(`gef: CLI entry is unavailable (${detail}). Build the workspace or reinstall the package.\n`);
  process.exitCode = FAIL_CLOSED_EXIT;
}
