/**
 * Bounded V1.0 to V1.1 upgrade preview and migration record.
 *
 * The module reads only the packaged compatibility assets and contained target files supplied by
 * the registry. A single new managed state record is written by the existing kernel CREATE path;
 * the V1.0 state and its receipt remain byte-for-byte unchanged.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { Engines, InstallPlanResult, UpgradePreviewResult } from "./engines.js";
import { CLI_CONTRACT_VERSION } from "./parser.js";
import { SUPPORTED_SCHEMA_MAJOR, SUPPORTED_SCHEMA_VERSION } from "./schemas.js";

export const UPGRADE_STATE_REF = ".gef/upgrade-state.json";
export const UPGRADE_MIGRATION_ID = "GEF-UPGRADE-STATE-V1-1";
export const UPGRADE_SOURCE_REFS = Object.freeze([".gef/init-state.json", ".gef/adopt-state.json"] as const);
export const UPGRADE_MATRIX_ASSET = "gef-cli-upgrade-compatibility-matrix.json";
export const UPGRADE_MATRIX_SCHEMA_ASSET = "gef-cli-upgrade-compatibility-matrix.schema.json";
export const UPGRADE_STATE_SCHEMA_ASSET = "gef-cli-upgrade-state.schema.json";

type ReadStatus = "OK" | "ABSENT" | "UNREADABLE" | "ALIAS_REFUSED" | "NOT_REGULAR" | "OVER_BUDGET";

export interface UpgradeReadOutcome {
  readonly status: ReadStatus;
  readonly bytes: Uint8Array | null;
  readonly limit: string | null;
}

export interface UpgradeRepositoryEvidence {
  readonly dirtiness: "OBSERVED" | "UNKNOWN" | "NOT_APPLICABLE";
  readonly input: Readonly<Record<string, unknown>>;
  readonly observationLimits: readonly string[];
}

export interface UpgradePreviewOptions {
  readonly targetRoot: string;
  readonly productVersion: string;
  readonly platform: string;
  readonly nodeMajor: number;
  readonly observationFingerprint: string;
  readonly repository: UpgradeRepositoryEvidence;
  readonly readFile: (relativeRef: string) => UpgradeReadOutcome;
  readonly engines: Engines;
}

export type UpgradeReadiness = "READY" | "NOOP" | "CONFLICTING" | "USER_MODIFIED" | "RECOVERY_REQUIRED" | "INDETERMINATE" | "UNSUPPORTED";
export type UpgradeCompatibilityState = "SUPPORTED" | "UNSUPPORTED" | "INDETERMINATE";

interface CompatibilityRow {
  readonly from: string;
  readonly to: string;
  readonly stateSchemaMajor: number;
  readonly receiptSchemaMajor: number;
  readonly migrationId: string;
  readonly migrationOrder: readonly string[];
  readonly recoveryStrategy: string;
  readonly evidenceState: "PROVISIONAL" | "VERIFIED";
  readonly evidenceRefs: readonly string[];
}

interface CompatibilityMatrix {
  readonly platforms: readonly string[];
  readonly minimumNodeMajor: number;
  readonly requiredCapabilities: readonly string[];
  readonly rows: readonly CompatibilityRow[];
}

interface SourceState {
  readonly ref: string;
  readonly bytes: Uint8Array;
  readonly fingerprint: string;
  readonly receiptRef: string;
  readonly receiptBytes: Uint8Array;
  readonly receiptFingerprint: string;
  readonly runId: string;
  readonly version: string;
}

export interface UpgradeStateDocument {
  readonly schemaVersion: string;
  readonly kind: "gef.upgrade.state";
  readonly commandId: "gef.upgrade.apply";
  readonly contractVersion: string;
  readonly productVersion: string;
  readonly sourceVersion: string;
  readonly targetVersion: string;
  readonly migrationId: string;
  readonly runId: string;
  readonly sourceRef: string;
  readonly sourceFingerprint: string;
  readonly sourceReceiptFingerprint: string;
  readonly planDigest: string;
  readonly observationFingerprint: string;
  readonly transaction: { readonly planDigest: string; readonly outcome: "APPLIED" };
}

export interface UpgradeComposition {
  readonly body: Readonly<Record<string, unknown>>;
  readonly digest: string;
  readonly readiness: UpgradeReadiness;
  readonly compatibility: UpgradeCompatibilityState;
  readonly source?: SourceState;
  readonly existingDocument?: UpgradeStateDocument;
  readonly existingBytes?: Uint8Array;
  readonly preconditions: readonly { readonly key: string; readonly owner: string; readonly value: string }[];
}

const sha256 = (value: string | Uint8Array): string => createHash("sha256").update(value).digest("hex");

function stable(value: unknown): string {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return JSON.stringify(value);
  return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function parseJson(bytes: Uint8Array): unknown {
  try { return JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown; }
  catch { return undefined; }
}

function readAsset(name: string): unknown {
  const path = fileURLToPath(new URL(`../schemas/${name}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function assetFingerprint(name: string): string | null {
  try { return sha256(readFileSync(fileURLToPath(new URL(`../schemas/${name}`, import.meta.url)))); }
  catch { return null; }
}

function verifyPackagedAssets(): boolean {
  const manifestPath = fileURLToPath(new URL("../vendor/MANIFEST.json", import.meta.url));
  if (!existsSync(manifestPath)) return true;
  try {
    const manifest = record(JSON.parse(readFileSync(manifestPath, "utf8")) as unknown);
    const artifacts = manifest?.["artifacts"];
    if (!Array.isArray(artifacts)) return false;
    for (const name of [UPGRADE_MATRIX_ASSET, UPGRADE_MATRIX_SCHEMA_ASSET, UPGRADE_STATE_SCHEMA_ASSET]) {
      const artifact = artifacts.map(record).find((item) => item?.["kind"] === "cli-schema" && item["name"] === name && item["target"] === `schemas/${name}`);
      if (artifact === undefined || artifact === null || typeof artifact["sha256"] !== "string") return false;
      const bytes = readFileSync(fileURLToPath(new URL(`../schemas/${name}`, import.meta.url)));
      if (sha256(bytes) !== artifact["sha256"]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function loadMatrix(): CompatibilityMatrix | null {
  try {
    if (!verifyPackagedAssets()) return null;
    const matrix = record(readAsset(UPGRADE_MATRIX_ASSET));
    const matrixSchema = record(readAsset(UPGRADE_MATRIX_SCHEMA_ASSET));
    const stateSchema = record(readAsset(UPGRADE_STATE_SCHEMA_ASSET));
    if (matrix === null || matrixSchema === null || stateSchema === null) return null;
    if (matrix["$schema"] !== "https://json-schema.org/draft/2020-12/schema" || matrix["$id"] !== "urn:gef:schema:cli-upgrade-compatibility-matrix:1") return null;
    if (matrixSchema["$schema"] !== "https://json-schema.org/draft/2020-12/schema" || matrixSchema["type"] !== "object" || matrixSchema["additionalProperties"] !== false) return null;
    if (stateSchema["$schema"] !== "https://json-schema.org/draft/2020-12/schema" || stateSchema["$id"] !== "urn:gef:schema:cli-upgrade-state:1" || stateSchema["additionalProperties"] !== false) return null;
    const platforms = matrix["supportedPlatforms"];
    const capabilities = matrix["requiredCapabilities"];
    const rows = matrix["compatibility"];
    const minimumNodeMajor = matrix["minimumNodeMajor"];
    if (!exactKeys(matrix, ["$schema", "$id", "schemaVersion", "product", "supportedPlatforms", "minimumNodeMajor", "requiredCapabilities", "compatibility"])) return null;
    if (matrix["schemaVersion"] !== 1 || matrix["product"] !== "gef-bootstrap") return null;
    if (!Array.isArray(platforms) || !platforms.every((item) => typeof item === "string")) return null;
    if (!Array.isArray(capabilities) || !capabilities.every((item) => typeof item === "string" && item.length > 0)) return null;
    if (!Array.isArray(rows) || rows.length === 0 || !Number.isInteger(minimumNodeMajor)) return null;
    const parsedRows: CompatibilityRow[] = [];
    for (const entry of rows) {
      const row = record(entry);
      if (row === null || !exactKeys(row, ["from", "to", "stateSchemaMajor", "receiptSchemaMajor", "migrationId", "migrationOrder", "recoveryStrategy", "evidenceState", "evidenceRefs"])) return null;
      if (typeof row["from"] !== "string" || typeof row["to"] !== "string" || typeof row["migrationId"] !== "string" || typeof row["recoveryStrategy"] !== "string") return null;
      if (row["evidenceState"] !== "PROVISIONAL" && row["evidenceState"] !== "VERIFIED") return null;
      if (!Array.isArray(row["evidenceRefs"]) || row["evidenceRefs"].length === 0 || !row["evidenceRefs"].every((item) => typeof item === "string" && item.length > 0)) return null;
      if (!Number.isInteger(row["stateSchemaMajor"]) || !Number.isInteger(row["receiptSchemaMajor"]) || !Array.isArray(row["migrationOrder"]) || !row["migrationOrder"].every((item) => typeof item === "string")) return null;
      parsedRows.push({
        from: row["from"], to: row["to"], stateSchemaMajor: row["stateSchemaMajor"] as number,
        receiptSchemaMajor: row["receiptSchemaMajor"] as number, migrationId: row["migrationId"],
        migrationOrder: row["migrationOrder"] as string[], recoveryStrategy: row["recoveryStrategy"],
        evidenceState: row["evidenceState"], evidenceRefs: row["evidenceRefs"] as string[],
      });
    }
    return { platforms, minimumNodeMajor: minimumNodeMajor as number, requiredCapabilities: capabilities, rows: parsedRows };
  } catch {
    return null;
  }
}

function validLegacyState(value: unknown): { readonly runId: string; readonly version: string; readonly commandId: string } | null {
  const state = record(value);
  if (state === null || !exactKeys(state, ["schemaVersion", "kind", "verb", "commandId", "contractVersion", "productVersion", "runId", "planDigest", "observationFingerprint", "transaction"])) return null;
  if (state["schemaVersion"] !== SUPPORTED_SCHEMA_VERSION || typeof state["contractVersion"] !== "string") return null;
  if (state["kind"] !== "gef.init.state" && state["kind"] !== "gef.adopt.state") return null;
  const verb = state["kind"] === "gef.init.state" ? "init" : "adopt";
  const commandId = verb === "init" ? "gef.init.run" : "gef.adopt.apply";
  if (state["verb"] !== verb || state["commandId"] !== commandId) return null;
  if (typeof state["productVersion"] !== "string" || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(state["productVersion"])) return null;
  if (typeof state["runId"] !== "string" || !/^[A-Za-z0-9-]{1,128}$/.test(state["runId"])) return null;
  if (typeof state["planDigest"] !== "string" || !/^[0-9a-f]{64}$/.test(state["planDigest"])) return null;
  if (typeof state["observationFingerprint"] !== "string" || !/^[0-9a-f]{64}$/.test(state["observationFingerprint"])) return null;
  const transaction = record(state["transaction"]);
  if (transaction === null || !exactKeys(transaction, ["planDigest", "outcome"]) && !exactKeys(transaction, ["planDigest", "outcome", "receiptDigest", "postFingerprint"])) return null;
  if (typeof transaction["planDigest"] !== "string" || !/^[0-9a-f]{64}$/.test(transaction["planDigest"])) return null;
  if (transaction["outcome"] !== "APPLIED" && transaction["outcome"] !== "NOOP_APPLIED") return null;
  if (transaction["receiptDigest"] !== undefined && (typeof transaction["receiptDigest"] !== "string" || !/^[0-9a-f]{64}$/.test(transaction["receiptDigest"]))) return null;
  if (transaction["postFingerprint"] !== undefined && (typeof transaction["postFingerprint"] !== "string" || !/^[0-9a-f]{64}$/.test(transaction["postFingerprint"]))) return null;
  return { runId: state["runId"], version: state["productVersion"], commandId };
}

function validReceipt(value: unknown, expected: { readonly runId: string; readonly commandId: string; readonly productVersion: string; readonly fileFingerprint: string }): boolean {
  const receipt = record(value);
  if (receipt === null) return false;
  const required = ["schemaVersion", "kind", "runId", "commandId", "contractVersion", "productVersion", "effectStatus", "lifecyclePhases", "resultDigest", "transaction"];
  if (!exactKeys(receipt, required) || receipt["schemaVersion"] !== SUPPORTED_SCHEMA_VERSION || receipt["kind"] !== "gef.cli.receipt") return false;
  if (receipt["runId"] !== expected.runId || receipt["commandId"] !== expected.commandId || receipt["effectStatus"] !== "CONFIRMED" || receipt["productVersion"] !== expected.productVersion) return false;
  if (typeof receipt["contractVersion"] !== "string" || typeof receipt["productVersion"] !== "string" || typeof receipt["resultDigest"] !== "string" || !/^[0-9a-f]{64}$/.test(receipt["resultDigest"])) return false;
  if (!Array.isArray(receipt["lifecyclePhases"]) || !receipt["lifecyclePhases"].every((item) => typeof item === "string")) return false;
  const transaction = record(receipt["transaction"]);
  if (transaction === null || (!exactKeys(transaction, ["planDigest", "outcome", "receiptDigest", "postFingerprint"]) && !exactKeys(transaction, ["planDigest", "outcome", "postFingerprint"]) && !exactKeys(transaction, ["planDigest", "outcome", "receiptDigest"]) && !exactKeys(transaction, ["planDigest", "outcome"]))) return false;
  if (transaction["outcome"] !== "APPLIED" && transaction["outcome"] !== "NOOP_APPLIED") return false;
  if (transaction["receiptDigest"] !== undefined && (typeof transaction["receiptDigest"] !== "string" || !/^[0-9a-f]{64}$/.test(transaction["receiptDigest"]))) return false;
  if (transaction["postFingerprint"] !== undefined && (typeof transaction["postFingerprint"] !== "string" || !/^[0-9a-f]{64}$/.test(transaction["postFingerprint"]))) return false;
  return transaction["postFingerprint"] === expected.fileFingerprint && typeof transaction["planDigest"] === "string" && /^[0-9a-f]{64}$/.test(transaction["planDigest"]);
}

function validUpgradeState(value: unknown): UpgradeStateDocument | null {
  const state = record(value);
  const keys = ["schemaVersion", "kind", "commandId", "contractVersion", "productVersion", "sourceVersion", "targetVersion", "migrationId", "runId", "sourceRef", "sourceFingerprint", "sourceReceiptFingerprint", "planDigest", "observationFingerprint", "transaction"];
  if (state === null || !exactKeys(state, keys)) return null;
  if (state["schemaVersion"] !== SUPPORTED_SCHEMA_VERSION || state["kind"] !== "gef.upgrade.state" || state["commandId"] !== "gef.upgrade.apply") return null;
  if (typeof state["contractVersion"] !== "string" || typeof state["productVersion"] !== "string" || typeof state["sourceVersion"] !== "string" || typeof state["targetVersion"] !== "string" || typeof state["migrationId"] !== "string" || typeof state["runId"] !== "string" || typeof state["sourceRef"] !== "string") return null;
  for (const key of ["sourceFingerprint", "sourceReceiptFingerprint", "planDigest", "observationFingerprint"] as const) {
    if (typeof state[key] !== "string" || !/^[0-9a-f]{64}$/.test(state[key] as string)) return null;
  }
  const transaction = record(state["transaction"]);
  if (transaction === null || !exactKeys(transaction, ["planDigest", "outcome"]) || transaction["outcome"] !== "APPLIED" || transaction["planDigest"] !== state["planDigest"]) return null;
  if (!/^[A-Za-z0-9-]{1,128}$/.test(state["runId"]) || !/^\.gef\/(init|adopt)-state\.json$/.test(state["sourceRef"])) return null;
  return state as unknown as UpgradeStateDocument;
}

function readValidatedSource(options: UpgradePreviewOptions, ref: typeof UPGRADE_SOURCE_REFS[number]): { readonly status: "ABSENT" | "INVALID" | "VALID"; readonly source?: SourceState; readonly reason?: string } {
  const outcome = options.readFile(ref);
  if (outcome.status === "ABSENT") return { status: "ABSENT" };
  if (outcome.status !== "OK" || outcome.bytes === null) return { status: "INVALID", reason: outcome.limit ?? `SOURCE_${outcome.status}` };
  const state = validLegacyState(parseJson(outcome.bytes));
  if (state === null) return { status: "INVALID", reason: "SOURCE_STATE_SCHEMA_INVALID" };
  const receiptRef = `.gef/receipts/${state.runId}.json`;
  const receiptOutcome = options.readFile(receiptRef);
  if (receiptOutcome.status !== "OK" || receiptOutcome.bytes === null) return { status: "INVALID", reason: "SOURCE_RECEIPT_UNAVAILABLE" };
  const sourceFingerprint = sha256(outcome.bytes);
  if (!validReceipt(parseJson(receiptOutcome.bytes), { runId: state.runId, commandId: state.commandId, productVersion: state.version, fileFingerprint: sourceFingerprint })) {
    return { status: "INVALID", reason: "SOURCE_RECEIPT_UNVERIFIED" };
  }
  return {
    status: "VALID",
    source: {
      ref, bytes: outcome.bytes, fingerprint: sourceFingerprint, receiptRef, receiptBytes: receiptOutcome.bytes,
      receiptFingerprint: sha256(receiptOutcome.bytes), runId: state.runId, version: state.version,
    },
  };
}

export function upgradePreconditionKey(ref: string): string {
  return `upgrade-precondition:${ref}`;
}

export function upgradeRepositoryIdentityFingerprint(input: Readonly<Record<string, unknown>>): string {
  return sha256(stable({
    repo: input["repo"] ?? null,
    head: input["head"] ?? null,
    branch: input["branch"] ?? null,
    operation: input["operation"] ?? null,
  }));
}

export function composeUpgradePreview(options: UpgradePreviewOptions): UpgradeComposition {
  const matrix = loadMatrix();
  const stateOutcome = options.readFile(UPGRADE_STATE_REF);
  const sourceResults = UPGRADE_SOURCE_REFS.map((ref) => readValidatedSource(options, ref));
  const validSources = sourceResults.flatMap((entry) => entry.status === "VALID" && entry.source !== undefined ? [entry.source] : []);
  const sourcePresentCount = sourceResults.filter((entry) => entry.status !== "ABSENT").length;
  const selected = validSources[0];
  const row = selected === undefined || matrix === null ? undefined : matrix.rows.find((entry) => entry.from === selected.version && entry.to === options.productVersion && entry.evidenceState === "VERIFIED");
  const gitObserved = options.repository.dirtiness === "OBSERVED";
  const environmentKnown = matrix !== null && gitObserved;
  const availableCapabilities = {
    trustedGit: gitObserved,
    managedReceipt: selected !== undefined,
    kernelTransaction: true,
    "jsonSchema2020-12": matrix !== null,
  };
  const requirements: Record<string, unknown> = {
    platform: options.platform,
    stateSchemaMajor: row?.stateSchemaMajor ?? SUPPORTED_SCHEMA_MAJOR,
    receiptSchemaMajor: row?.receiptSchemaMajor ?? SUPPORTED_SCHEMA_MAJOR,
    ...Object.fromEntries((matrix?.requiredCapabilities ?? []).map((capability) => [capability, true])),
  };
  const observed: Record<string, unknown> = {
    platform: options.platform,
    stateSchemaMajor: SUPPORTED_SCHEMA_MAJOR,
    receiptSchemaMajor: SUPPORTED_SCHEMA_MAJOR,
    ...availableCapabilities,
  };
  const engineCompatibility = options.engines.compatibility(requirements, observed);
  let compatibility: UpgradeCompatibilityState = engineCompatibility.state;
  if (matrix === null || !gitObserved || selected === undefined) compatibility = "INDETERMINATE";
  else if (!matrix.platforms.includes(options.platform) || options.nodeMajor < matrix.minimumNodeMajor || row === undefined) compatibility = "UNSUPPORTED";

  let readiness: UpgradeReadiness = compatibility === "UNSUPPORTED" ? "UNSUPPORTED" : compatibility === "INDETERMINATE" ? "INDETERMINATE" : "READY";
  let stateReason = "UPGRADE_READY";
  let existingDocument: UpgradeStateDocument | undefined;
  let existingBytes: Uint8Array | undefined;

  if (matrix === null) { readiness = "INDETERMINATE"; stateReason = "COMPATIBILITY_ASSET_INVALID"; }
  else if (!gitObserved) { readiness = "INDETERMINATE"; stateReason = "TRUSTED_GIT_OBSERVATION_UNAVAILABLE"; }
  else if (sourcePresentCount > 1) { readiness = "CONFLICTING"; stateReason = "MULTIPLE_SOURCE_STATES"; }
  else if (sourceResults.some((entry) => entry.status === "INVALID")) {
    const invalidIndex = sourceResults.findIndex((entry) => entry.status === "INVALID");
    const invalidRef = UPGRADE_SOURCE_REFS[invalidIndex];
    const invalidPath = invalidRef === undefined ? null : options.readFile(invalidRef);
    readiness = invalidPath?.status === "OK" ? "USER_MODIFIED" : "INDETERMINATE";
    stateReason = sourceResults[invalidIndex]?.reason ?? "SOURCE_STATE_INVALID";
  }
  else if (selected === undefined) { readiness = "INDETERMINATE"; stateReason = "SOURCE_STATE_ABSENT"; }
  else if (row === undefined) { readiness = "UNSUPPORTED"; stateReason = "VERSION_PAIR_UNSUPPORTED"; }

  if (stateOutcome.status !== "ABSENT") {
    if (stateOutcome.status !== "OK" || stateOutcome.bytes === null) {
      readiness = "INDETERMINATE";
      stateReason = "UPGRADE_STATE_UNREADABLE";
    } else {
      const parsed = parseJson(stateOutcome.bytes);
      const document = validUpgradeState(parsed);
      if (document === null) {
        readiness = "USER_MODIFIED";
        stateReason = "UPGRADE_STATE_SCHEMA_INVALID";
      } else {
        const sourceStillMatches = selected !== undefined && document.sourceRef === selected.ref && document.sourceFingerprint === selected.fingerprint && document.sourceReceiptFingerprint === selected.receiptFingerprint;
        if (!sourceStillMatches || document.sourceVersion !== selected?.version || document.productVersion !== options.productVersion || document.targetVersion !== options.productVersion || document.migrationId !== row?.migrationId) {
          readiness = "CONFLICTING";
          stateReason = "UPGRADE_STATE_SOURCE_CONFLICT";
        } else {
          const receiptRef = `.gef/receipts/${document.runId}.json`;
          const receiptOutcome = options.readFile(receiptRef);
          const stateFingerprint = sha256(stateOutcome.bytes);
          if (receiptOutcome.status !== "OK" || receiptOutcome.bytes === null || !validReceipt(parseJson(receiptOutcome.bytes), { runId: document.runId, commandId: "gef.upgrade.apply", productVersion: document.targetVersion, fileFingerprint: stateFingerprint })) {
            readiness = "RECOVERY_REQUIRED";
            stateReason = "UPGRADE_STATE_RECEIPT_UNVERIFIED";
          } else {
            if (compatibility === "SUPPORTED") {
              readiness = "NOOP";
              stateReason = "UPGRADE_ALREADY_APPLIED";
              existingDocument = document;
              existingBytes = stateOutcome.bytes;
            }
          }
        }
      }
    }
  }

  const currentVersion = selected?.version ?? null;
  const migrations = row === undefined ? [] : [row.migrationId];
  const preview: UpgradePreviewResult = options.engines.upgradePreview(currentVersion, options.productVersion, migrations);
  const install: InstallPlanResult = options.engines.installPlan({ platform: options.platform, target: options.targetRoot, version: options.productVersion, current: currentVersion });
  const backupEntries = [
    ...(selected === undefined ? [] : [
      { id: selected.ref, digest: selected.fingerprint },
      { id: selected.receiptRef, digest: selected.receiptFingerprint },
    ]),
    ...(stateOutcome.status === "OK" && stateOutcome.bytes !== null ? [{ id: UPGRADE_STATE_REF, digest: sha256(stateOutcome.bytes) }] : []),
  ];
  const backupManifest = options.engines.backupManifest(backupEntries);
  const backupBytesVerified = backupEntries.every((entry) => {
    const observed = options.readFile(entry.id);
    return observed.status === "OK" && observed.bytes !== null && sha256(observed.bytes) === entry.digest;
  });
  const backup = { ...backupManifest, verified: backupManifest.verified && backupBytesVerified, entries: backupEntries };
  const recovery = options.engines.recoveryPlan({ journal: [], candidateMatches: backup.verified, corrupt: !backup.verified });
  const assetIntegrity = options.engines.integritySnapshot({
    matrix: assetFingerprint(UPGRADE_MATRIX_ASSET),
    compatibilitySchema: assetFingerprint(UPGRADE_MATRIX_SCHEMA_ASSET),
    stateSchema: assetFingerprint(UPGRADE_STATE_SCHEMA_ASSET),
  });
  const source = selected === undefined ? null : {
    ref: selected.ref,
    runId: selected.runId,
    version: selected.version,
    fingerprint: selected.fingerprint,
    receiptRef: selected.receiptRef,
    receiptFingerprint: selected.receiptFingerprint,
  };
  const inventory: Array<{ path: string; present: boolean; classification: string; fingerprint: string | null }> = UPGRADE_SOURCE_REFS.map((ref, index) => {
    const observed = options.readFile(ref);
    const verified = sourceResults[index]?.status === "VALID" && sourceResults[index]?.source?.ref === ref;
    const conflicting = sourcePresentCount > 1;
    const classification = conflicting ? "CONFLICTING" : verified ? "UNCHANGED" : observed.status === "ABSENT" ? "ABSENT" : observed.status === "OK" ? "USER_MODIFIED" : "INDETERMINATE";
    return { path: ref, present: observed.status !== "ABSENT", classification, fingerprint: observed.status === "OK" && observed.bytes !== null ? sha256(observed.bytes) : null };
  });
  UPGRADE_SOURCE_REFS.forEach((ref, index) => {
    const observed = options.readFile(ref);
    if (observed.status !== "OK" || observed.bytes === null) return;
    const legacy = validLegacyState(parseJson(observed.bytes));
    if (legacy === null) return;
    const receiptRef = `.gef/receipts/${legacy.runId}.json`;
    const receipt = options.readFile(receiptRef);
    const receiptValid = sourceResults[index]?.status === "VALID" && sourceResults[index]?.source?.receiptRef === receiptRef;
    inventory.push({
      path: receiptRef,
      present: receipt.status !== "ABSENT",
      classification: receiptValid ? "UNCHANGED" : receipt.status === "OK" ? "USER_MODIFIED" : "INDETERMINATE",
      fingerprint: receipt.status === "OK" && receipt.bytes !== null ? sha256(receipt.bytes) : null,
    });
  });
  if (stateOutcome.status === "ABSENT") inventory.push({ path: UPGRADE_STATE_REF, present: false, classification: "GEF_MANAGED_CHANGED", fingerprint: null });
  else if (stateOutcome.status !== "OK" || stateOutcome.bytes === null) inventory.push({ path: UPGRADE_STATE_REF, present: true, classification: "INDETERMINATE", fingerprint: null });
  else {
    const parsedState = validUpgradeState(parseJson(stateOutcome.bytes));
    const validSourceBinding = parsedState !== null && selected !== undefined && parsedState.sourceRef === selected.ref && parsedState.sourceFingerprint === selected.fingerprint && parsedState.sourceReceiptFingerprint === selected.receiptFingerprint;
    const recoveryReceipt = parsedState === null ? null : options.readFile(`.gef/receipts/${parsedState.runId}.json`);
    const verifiedRecovery = parsedState !== null && recoveryReceipt?.status === "OK" && recoveryReceipt.bytes !== null && validReceipt(parseJson(recoveryReceipt.bytes), { runId: parsedState.runId, commandId: "gef.upgrade.apply", productVersion: parsedState.targetVersion, fileFingerprint: sha256(stateOutcome.bytes) });
    const classification = parsedState === null ? "USER_MODIFIED" : !validSourceBinding ? "CONFLICTING" : !verifiedRecovery ? "RECOVERY_REQUIRED" : "UNCHANGED";
    inventory.push({ path: UPGRADE_STATE_REF, present: true, classification, fingerprint: sha256(stateOutcome.bytes) });
    if (parsedState !== null && recoveryReceipt?.status === "OK" && recoveryReceipt.bytes !== null) inventory.push({ path: `.gef/receipts/${parsedState.runId}.json`, present: true, classification: verifiedRecovery ? "UNCHANGED" : "USER_MODIFIED", fingerprint: sha256(recoveryReceipt.bytes) });
  }
  const body = {
    verb: "upgrade",
    readOnly: true,
    target: options.targetRoot,
    observationFingerprint: options.observationFingerprint,
    compatibility: { state: compatibility, missing: [...engineCompatibility.missing], matrixAsset: UPGRADE_MATRIX_ASSET, row: row ?? null },
    assetIntegrity,
    state: { readiness, reason: stateReason, source, targetVersion: options.productVersion, existingState: stateOutcome.status === "OK" },
    inventory,
    preview,
    install,
    repository: { dirtiness: options.repository.dirtiness, identity: { repo: options.repository.input["repo"] ?? null, head: options.repository.input["head"] ?? null, branch: options.repository.input["branch"] ?? null }, observationLimits: [...options.repository.observationLimits] },
    backup,
    recovery: {
      ...recovery,
      strategy: row?.recoveryStrategy ?? null,
      capturedBeforeWrite: true,
      backupBytesVerified,
      interruptedTransactionAction: "START_FRESH_RUN_ONLY",
      foreignJournalPolicy: "NO_AUTHORIZATION",
    },
    steps: row?.migrationOrder ?? [],
  };
  const digest = sha256(stable(body));
  const bodyWithDigest = { ...body, planDigest: digest };
  const preconditions = selected === undefined ? [] : [
    { key: upgradePreconditionKey(selected.ref), owner: "m48-m54-maintenance", value: selected.fingerprint },
    { key: upgradePreconditionKey(selected.receiptRef), owner: "m48-m54-maintenance", value: selected.receiptFingerprint },
  ];
  if (options.repository.input["repo"] !== undefined) {
    preconditions.push({
      key: "upgrade-precondition:repository-identity",
      owner: "m48-m54-maintenance",
      value: upgradeRepositoryIdentityFingerprint(options.repository.input),
    });
  }
  return {
    body: bodyWithDigest,
    digest,
    readiness,
    compatibility,
    ...(selected === undefined ? {} : { source: selected }),
    ...(existingDocument === undefined ? {} : { existingDocument }),
    ...(existingBytes === undefined ? {} : { existingBytes }),
    preconditions,
  };
}

export function buildUpgradeStateDocument(input: {
  readonly productVersion: string;
  readonly runId: string;
  readonly source: SourceState;
  readonly planDigest: string;
  readonly observationFingerprint: string;
  readonly migrationId: string;
}): UpgradeStateDocument {
  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    kind: "gef.upgrade.state",
    commandId: "gef.upgrade.apply",
    contractVersion: CLI_CONTRACT_VERSION,
    productVersion: input.productVersion,
    sourceVersion: input.source.version,
    targetVersion: input.productVersion,
    migrationId: input.migrationId,
    runId: input.runId,
    sourceRef: input.source.ref,
    sourceFingerprint: input.source.fingerprint,
    sourceReceiptFingerprint: input.source.receiptFingerprint,
    planDigest: input.planDigest,
    observationFingerprint: input.observationFingerprint,
    transaction: { planDigest: input.planDigest, outcome: "APPLIED" },
  };
}

export function upgradeStateFingerprint(bytes: Uint8Array): string {
  return sha256(bytes);
}
