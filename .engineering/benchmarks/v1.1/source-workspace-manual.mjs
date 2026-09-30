#!/usr/bin/env node

// Source-workspace/manual entry for the matched CLI ROI benchmark.
// It calls the public application runner directly with the same argv and process capabilities
// supplied by the installed `gef` shim. Output remains the ordinary JSON result envelope.

import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const cliEntry = pathToFileURL(resolve(repositoryRoot, "packages/cli/dist/index.js")).href;
const { resolveProductVersion, runCli } = await import(cliEntry);
const target = process.argv[2];

if (!target) {
  process.stderr.write("source-workspace benchmark requires a target directory\n");
  process.exitCode = 10;
} else {
  process.exitCode = await runCli({
    argv: ["init", "--target", target, "--json"],
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
    env: process.env,
    cwd: repositoryRoot,
    platform: process.platform,
    nodeVersion: process.version,
    architecture: process.arch,
    productVersion: resolveProductVersion(),
    stdoutIsTty: false,
  });
}
