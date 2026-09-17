#!/usr/bin/env node
/**
 * Build the distributable CLI tarball.
 *
 * The package directory is never used as a scratch area. A staging directory is assembled,
 * populated with everything the packaged CLI needs at runtime, and packed from there. Nothing
 * is written into `packages/cli`, so a concurrently running CLI in this workspace cannot have
 * its module resolution disturbed by a pack in progress.
 *
 * Staged contents:
 *   dist/, bin/, schemas/, README.md, package.json   -- the package payload itself
 *   vendor/engines/<name>/...                        -- the verified V1 engine modules
 *   node_modules/@gef-bootstrap/{contracts,kernel}   -- the runtime the CLI depends on, so npm
 *                                                       bundles it (`bundleDependencies`)
 *                                                       instead of demanding it from a registry
 *   LICENSE                                          -- the repository legal payload
 *   vendor/MANIFEST.json                             -- sha256 of every vendored artefact
 *
 * Usage: node scripts/prepare-package.mjs [--pack --destination <dir>]
 */

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(cliRoot, "..", "..");

/** Engine modules the CLI resolves at runtime, with their packaged destination. */
const ENGINES = [
  { name: "m48-m54-maintenance", source: "packages/m48-m54-maintenance/src/index.mjs", target: "src/index.mjs" },
  { name: "area-h-governance", source: "packages/area-h-governance/index.mjs", target: "index.mjs" },
  { name: "security-reliability-integrations", source: "packages/security-reliability-integrations/src/index.js", target: "src/index.js" },
  { name: "m41-m47-platform", source: "packages/m41-m47-platform/src/index.mjs", target: "src/index.mjs" },
  { name: "m55-m61-quality", source: "packages/m55-m61-quality/src/index.mjs", target: "src/index.mjs" },
  { name: "m62-m63-final", source: "packages/m62-m63-final/src/index.mjs", target: "src/index.mjs" },
];

/** Workspace runtime packages bundled into the tarball. */
const RUNTIME_PACKAGES = ["contracts", "kernel"];

/** Package payload copied verbatim from the package directory. */
const PAYLOAD = ["dist", "bin", "schemas", "README.md", "package.json"];

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

function parseArguments(argv) {
  const destinationIndex = argv.indexOf("--destination");
  return { pack: argv.includes("--pack"), destination: destinationIndex === -1 ? undefined : argv[destinationIndex + 1] };
}

/** Assemble the staged package and return its directory. */
export function stage() {
  const staging = join(tmpdir(), `gef-cli-package-${process.pid.toString(36)}-${Date.now().toString(36)}`);
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });

  for (const entry of PAYLOAD) {
    const source = join(cliRoot, entry);
    if (!existsSync(source)) throw new Error(`Package payload is missing: ${entry} (build the workspace first)`);
    cpSync(source, join(staging, entry), { recursive: true });
  }

  const manifest = { schemaVersion: 1, kind: "gef.cli.vendored-artifacts", artifacts: [] };

  for (const engine of ENGINES) {
    const source = join(repositoryRoot, engine.source);
    if (!existsSync(source)) throw new Error(`Engine source is missing: ${engine.source}`);
    const target = join(staging, "vendor", "engines", engine.name, engine.target);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target);
    manifest.artifacts.push({
      kind: "engine",
      name: engine.name,
      source: engine.source,
      target: `vendor/engines/${engine.name}/${engine.target}`,
      sha256: sha256(target),
    });
  }

  for (const name of RUNTIME_PACKAGES) {
    const packageDirectory = join(repositoryRoot, "packages", name);
    const dist = join(packageDirectory, "dist");
    if (!existsSync(dist)) throw new Error(`Runtime package is not built: packages/${name}/dist`);
    const target = join(staging, "node_modules", "@gef-bootstrap", name);
    mkdirSync(target, { recursive: true });
    cpSync(dist, join(target, "dist"), { recursive: true });
    cpSync(join(packageDirectory, "package.json"), join(target, "package.json"));
    const declared = JSON.parse(readFileSync(join(packageDirectory, "package.json"), "utf8"));
    manifest.artifacts.push({ kind: "runtime-package", name: `@gef-bootstrap/${name}`, version: declared.version, target: `node_modules/@gef-bootstrap/${name}` });
  }

  const license = join(repositoryRoot, "LICENSE");
  if (!existsSync(license)) throw new Error("Repository LICENSE is missing");
  cpSync(license, join(staging, "LICENSE"));
  manifest.artifacts.push({ kind: "legal", name: "LICENSE", source: "LICENSE", target: "LICENSE", sha256: sha256(join(staging, "LICENSE")) });

  writeFileSync(join(staging, "vendor", "MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return staging;
}

/** Pack the staged package, leaving the package directory untouched. */
export function pack(destination) {
  const staging = stage();
  try {
    mkdirSync(destination, { recursive: true });
    // npm ships as a `.cmd` shim on Windows, which needs a shell; elsewhere argv is passed directly.
    const packed =
      process.platform === "win32"
        ? spawnSync(`npm pack --ignore-scripts --pack-destination "${destination}"`, { cwd: staging, encoding: "utf8", timeout: 300_000, shell: true })
        : spawnSync("npm", ["pack", "--ignore-scripts", "--pack-destination", destination], { cwd: staging, encoding: "utf8", timeout: 300_000 });
    if (packed.status !== 0) throw new Error(`npm pack failed: ${packed.stderr}`);
    const tarball = packed.stdout.trim().split("\n").pop().trim();
    const produced = join(destination, tarball);
    if (!existsSync(produced)) throw new Error(`npm pack produced no tarball at ${produced}`);
    return produced;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const args = parseArguments(process.argv.slice(2));
  if (args.pack) {
    if (args.destination === undefined) throw new Error("--pack requires --destination <dir>");
    process.stdout.write(`${pack(resolve(args.destination))}\n`);
  } else {
    rmSync(stage(), { recursive: true, force: true });
    process.stdout.write(`staged package verified (${PAYLOAD.length} payload entries)\n`);
  }
}
