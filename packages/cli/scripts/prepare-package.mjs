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
 *   node_modules/@gef-bootstrap/<runtime package>    -- the full internal runtime dependency
 *                                                       closure, bundled instead of fetched from
 *                                                       a private package registry
 *   LICENSE                                          -- the repository legal payload
 *   vendor/MANIFEST.json                             -- sha256 of every vendored artefact
 *
 * Usage: node scripts/prepare-package.mjs [--pack --destination <dir>]
 */

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
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
  {
    name: "m62-m63-final",
    source: "packages/m62-m63-final/src/index.mjs",
    target: "src/index.mjs",
    supportingFiles: [
      { source: "packages/m62-m63-final/src/v11-performance-telemetry.mjs", target: "src/v11-performance-telemetry.mjs" },
    ],
  },
];

/** Workspace runtime packages bundled into the tarball. */
const RUNTIME_PACKAGES = ["contracts", "kernel", "preflight", "config", "project-identity"];

/** Package payload copied verbatim from the package directory. */
const PAYLOAD = ["dist", "bin", "schemas", "README.md", "package.json"];
const CLI_SCHEMA_ASSETS = [
  "gef-cli-state.schema.json",
  "gef-cli-receipt.schema.json",
  "gef-cli-upgrade-state.schema.json",
  "gef-cli-upgrade-compatibility-matrix.schema.json",
  "gef-cli-upgrade-compatibility-matrix.json",
];

/** Lockfile-pinned native prebuilds required by the supported release platforms. */
const KOFFI_NATIVE_PREBUILDS = [
  { name: "@koromix/koffi-linux-x64", os: "linux", cpu: "x64" },
  { name: "@koromix/koffi-darwin-x64", os: "darwin", cpu: "x64" },
  { name: "@koromix/koffi-darwin-arm64", os: "darwin", cpu: "arm64" },
  { name: "@koromix/koffi-win32-x64", os: "win32", cpu: "x64" },
];
const KOFFI_VERSION = "3.3.0";

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

function parseArguments(argv) {
  const destinationIndex = argv.indexOf("--destination");
  return { pack: argv.includes("--pack"), destination: destinationIndex === -1 ? undefined : argv[destinationIndex + 1] };
}

/** Copy the immutable CLI package payload into the isolated staging directory. */
function stagePayload(staging) {
  for (const entry of PAYLOAD) {
    const source = join(cliRoot, entry);
    if (!existsSync(source)) throw new Error(`Package payload is missing: ${entry} (build the workspace first)`);
    cpSync(source, join(staging, entry), { recursive: true });
  }

}

/** Preserve the exact engine and supporting-file manifest order. */
function stageEngines(staging, manifest) {
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

    for (const support of engine.supportingFiles ?? []) {
      const supportSource = join(repositoryRoot, support.source);
      if (!existsSync(supportSource)) throw new Error(`Engine support source is missing: ${support.source}`);
      const supportTarget = join(staging, "vendor", "engines", engine.name, support.target);
      mkdirSync(dirname(supportTarget), { recursive: true });
      cpSync(supportSource, supportTarget);
      manifest.artifacts.push({
        kind: "engine-support",
        name: `${engine.name}/${support.target}`,
        source: support.source,
        target: `vendor/engines/${engine.name}/${support.target}`,
        sha256: sha256(supportTarget),
      });
    }
  }

}

/** Hash the schema assets already copied with the package payload. */
function stageSchemaAssets(staging, manifest) {
  for (const name of CLI_SCHEMA_ASSETS) {
    const target = join(staging, "schemas", name);
    if (!existsSync(target)) throw new Error(`CLI schema asset is missing: schemas/${name}`);
    manifest.artifacts.push({
      kind: "cli-schema",
      name,
      source: `packages/cli/schemas/${name}`,
      target: `schemas/${name}`,
      sha256: sha256(target),
    });
  }

}

function readLockedNativePackage(name, packageLock) {
  const entry = packageLock.packages?.["node_modules/" + name];
  const packageName = name.split("/").at(-1);
  if (entry?.version !== KOFFI_VERSION) throw new Error("Native package version is not pinned as expected: " + name);
  const expectedResolved = "https://registry.npmjs.org/" + name + "/-/" + packageName + "-" + KOFFI_VERSION + ".tgz";
  if (entry.resolved !== expectedResolved) throw new Error("Native package registry URL differs from the lockfile policy: " + name);
  const integrity = entry.integrity?.split(/\s+/).find((value) => value.startsWith("sha512-"));
  if (integrity === undefined) throw new Error("Native package has no SHA-512 lockfile integrity: " + name);
  return { version: entry.version, integrity };
}

function verifyNativePackageIntegrity(archive, expectedIntegrity, name) {
  const actualIntegrity = "sha512-" + createHash("sha512").update(readFileSync(archive)).digest("base64");
  if (actualIntegrity !== expectedIntegrity) throw new Error("Native package archive does not match package-lock.json: " + name);
}

function stageLockedNativePackage(staging, manifest, packageLock, nativePackage) {
  const { name, os, cpu } = nativePackage;
  const locked = readLockedNativePackage(name, packageLock);
  const archiveDirectory = join(staging, ".native-package-archives");
  mkdirSync(archiveDirectory, { recursive: true });
  const packageSpec = name + "@" + locked.version;
  const packed = spawnSync(
    process.execPath,
    [resolveNpmCli(), "pack", "--ignore-scripts", "--json", "--pack-destination", archiveDirectory, packageSpec],
    { cwd: repositoryRoot, encoding: "utf8", timeout: 300_000 },
  );
  if (packed.status !== 0) throw new Error("Unable to retrieve lockfile-pinned native package " + name + ": " + packed.stderr);
  const packedMetadata = JSON.parse(packed.stdout);
  if (!Array.isArray(packedMetadata) || packedMetadata.length !== 1 || typeof packedMetadata[0].filename !== "string") {
    throw new Error("npm pack returned unexpected metadata for native package " + name);
  }
  const archive = join(archiveDirectory, packedMetadata[0].filename);
  if (!existsSync(archive)) throw new Error("npm pack did not produce the native package archive: " + name);
  verifyNativePackageIntegrity(archive, locked.integrity, name);
  if (packedMetadata[0].integrity !== locked.integrity) throw new Error("npm pack integrity differs from package-lock.json: " + name);

  const listing = spawnSync(systemTarExecutable(), ["-tzf", archive], { encoding: "utf8", timeout: 120_000 });
  if (listing.status !== 0) throw new Error("Unable to inspect native package archive " + name + ": " + listing.stderr);
  const archiveEntries = listing.stdout.split(/\r?\n/).filter(Boolean);
  if (archiveEntries.length === 0 || archiveEntries.some((entry) =>
    entry.startsWith("/") || /^[A-Za-z]:/.test(entry) || entry.split(/[\\/]/).includes("..") ||
    !(entry === "package" || entry.startsWith("package/")))) {
    throw new Error("Native package archive has an unexpected path: " + name);
  }

  const target = join(staging, "node_modules", ...name.split("/"));
  mkdirSync(target, { recursive: true });
  const extracted = spawnSync(systemTarExecutable(), ["-xzf", archive, "-C", target, "--strip-components=1"], {
    encoding: "utf8",
    timeout: 120_000,
  });
  if (extracted.status !== 0) throw new Error("Unable to stage native package " + name + ": " + extracted.stderr);
  const declared = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  if (declared.name !== name || declared.version !== locked.version ||
    !declared.os?.includes(os) || !declared.cpu?.includes(cpu)) {
    throw new Error("Staged native package identity or platform does not match the lock: " + name);
  }
  const stagedFiles = readdirSync(target, { recursive: true });
  if (!stagedFiles.some((entry) => String(entry).endsWith(".node"))) {
    throw new Error("Staged native package has no Koffi binary: " + name);
  }

  manifest.artifacts.push({
    kind: "native-runtime",
    name,
    version: declared.version,
    target: "node_modules/" + name,
    integrity: locked.integrity,
  });
}

function comparePackageNames(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
function updateStagedNativeDependencies(staging, packageLock) {
  const manifestPath = join(staging, "package.json");
  const packageMetadata = JSON.parse(readFileSync(manifestPath, "utf8"));
  const bundleDependencies = new Set(packageMetadata.bundleDependencies ?? packageMetadata.bundledDependencies ?? []);
  const dependencies = { ...(packageMetadata.dependencies ?? {}) };
  const optionalDependencies = { ...(packageMetadata.optionalDependencies ?? {}) };
  for (const name of RUNTIME_PACKAGES) {
    const runtimeMetadata = JSON.parse(readFileSync(join(repositoryRoot, "packages", name, "package.json"), "utf8"));
    if (typeof runtimeMetadata.name !== "string" || !runtimeMetadata.name.startsWith("@gef-bootstrap/") ||
      typeof runtimeMetadata.version !== "string") {
      throw new Error("Internal runtime package identity is invalid: " + name);
    }
    if (dependencies[runtimeMetadata.name] !== undefined && dependencies[runtimeMetadata.name] !== runtimeMetadata.version) {
      throw new Error("Staged package dependency version differs from the workspace: " + runtimeMetadata.name);
    }
    dependencies[runtimeMetadata.name] = runtimeMetadata.version;
    bundleDependencies.add(runtimeMetadata.name);
  }
  for (const nativePackage of KOFFI_NATIVE_PREBUILDS) {
    bundleDependencies.add(nativePackage.name);
    optionalDependencies[nativePackage.name] = readLockedNativePackage(nativePackage.name, packageLock).version;
  }
  packageMetadata.bundleDependencies = [...bundleDependencies].sort(comparePackageNames);
  packageMetadata.dependencies = Object.fromEntries(Object.entries(dependencies).sort(([left], [right]) => left.localeCompare(right)));
  packageMetadata.optionalDependencies = Object.fromEntries(
    Object.entries(optionalDependencies).sort(([left], [right]) => left.localeCompare(right)),
  );
  writeFileSync(manifestPath, JSON.stringify(packageMetadata, null, 2) + "\n");
}

/** Bundle lockfile-verified prebuilds so the same tarball works on every release OS. */
function stageNativeRuntime(staging, manifest) {
  const packageLock = JSON.parse(readFileSync(join(repositoryRoot, "package-lock.json"), "utf8"));
  const koffiSource = join(repositoryRoot, "node_modules", "koffi");
  const koffiLock = readLockedNativePackage("koffi", packageLock);
  if (!existsSync(koffiSource)) throw new Error("Koffi runtime package is missing (run npm ci)");
  const koffiManifest = JSON.parse(readFileSync(join(koffiSource, "package.json"), "utf8"));
  if (koffiManifest.version !== koffiLock.version) throw new Error("Installed Koffi version does not match package-lock.json");
  const koffiTarget = join(staging, "node_modules", "koffi");
  mkdirSync(koffiTarget, { recursive: true });
  cpSync(koffiSource, koffiTarget, { recursive: true });
  manifest.artifacts.push({
    kind: "native-runtime",
    name: "koffi",
    version: koffiManifest.version,
    target: "node_modules/koffi",
    integrity: koffiLock.integrity,
  });

  for (const nativePackage of KOFFI_NATIVE_PREBUILDS) {
    stageLockedNativePackage(staging, manifest, packageLock, nativePackage);
  }
  updateStagedNativeDependencies(staging, packageLock);
}

/** Copy built workspace modules with their packaged manifests. */
function stageWorkspaceRuntime(staging, manifest) {
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

}

/** Include the repository's license in the exact staging manifest. */
function stageLegalPayload(staging, manifest) {
  const license = join(repositoryRoot, "LICENSE");
  if (!existsSync(license)) throw new Error("Repository LICENSE is missing");
  cpSync(license, join(staging, "LICENSE"));
  manifest.artifacts.push({ kind: "legal", name: "LICENSE", source: "LICENSE", target: "LICENSE", sha256: sha256(join(staging, "LICENSE")) });

}

/** Assemble the staged package and return its directory. */
export function stage() {
  const staging = join(tmpdir(), `gef-cli-package-${process.pid.toString(36)}-${Date.now().toString(36)}`);
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });

  stagePayload(staging);
  const manifest = { schemaVersion: 1, kind: "gef.cli.vendored-artifacts", artifacts: [] };

  stageEngines(staging, manifest);
  stageSchemaAssets(staging, manifest);
  stageNativeRuntime(staging, manifest);
  stageWorkspaceRuntime(staging, manifest);
  stageLegalPayload(staging, manifest);
  writeFileSync(join(staging, "vendor", "MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return staging;
}

function resolveNpmCli() {
  const platformCandidate = process.platform === "win32"
    ? join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")
    : resolve(dirname(process.execPath), "..", "lib", "node_modules", "npm", "bin", "npm-cli.js");
  const candidates = [process.env.npm_execpath, platformCandidate];
  const npmCli = candidates.find((candidate) => typeof candidate === "string" && isAbsolute(candidate) && existsSync(candidate));
  if (npmCli === undefined) throw new Error("Unable to resolve npm CLI from the active Node.js installation");
  return npmCli;
}

function systemTarExecutable() {
  const executable = process.platform === "win32"
    ? join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe")
    : "/usr/bin/tar";
  if (!isAbsolute(executable) || !existsSync(executable)) {
    throw new Error("Supported system tar executable is unavailable");
  }
  return executable;
}

/** Pack the staged package, leaving the package directory untouched. */
export function pack(destination) {
  const staging = stage();
  try {
    mkdirSync(destination, { recursive: true });
    // Execute npm through the current Node binary so command lookup never depends on PATH
    // and no command shell is involved on any platform.
    const packed = spawnSync(
      process.execPath,
      [resolveNpmCli(), "pack", "--ignore-scripts", "--pack-destination", destination],
      { cwd: staging, encoding: "utf8", timeout: 300_000 },
    );
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
