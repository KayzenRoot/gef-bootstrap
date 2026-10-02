/**
 * Schema contract for persisted CLI documents.
 *
 * Every document the CLI persists is bound to an explicit JSON Schema 2020-12 contract
 * shipped in `packages/cli/schemas`:
 *
 *   urn:gef:schema:cli-state:1    -> .gef/<verb>-state.json
 *   urn:gef:schema:cli-receipt:1  -> .gef/receipts/<runId>.json
 *
 * Emitted documents always carry an explicit `schemaVersion`. A document whose major version
 * is not supported fails closed rather than being interpreted optimistically.
 */

export const CLI_STATE_SCHEMA_ID = "urn:gef:schema:cli-state:1";
export const CLI_RECEIPT_SCHEMA_ID = "urn:gef:schema:cli-receipt:1";
export const PROJECT_DRIFT_OBSERVATION_MODEL = "PROJECT_DRIFT_V1" as const;

export type StateObservationModel = typeof PROJECT_DRIFT_OBSERVATION_MODEL | "LEGACY_FULL_OBSERVATION_V1";

/** The only schema version this build can emit or consume. */
export const SUPPORTED_SCHEMA_VERSION = "1.0";
export const SUPPORTED_SCHEMA_MAJOR = 1;

export class UnsupportedDocumentVersionError extends Error {
  readonly observed: unknown;
  readonly supportedMajor: number;
  constructor(observed: unknown, supportedMajor: number) {
    super(`Unsupported CLI document schema version: ${String(observed)} (supported major ${String(supportedMajor)})`);
    this.name = "UnsupportedDocumentVersionError";
    this.observed = observed;
    this.supportedMajor = supportedMajor;
  }
}

/**
 * Validate the document version contract. Fails closed for a missing, malformed or
 * unsupported-major version so a future incompatible document is never silently accepted.
 */
export function requireSupportedSchemaVersion(document: unknown, supportedMajor: number = SUPPORTED_SCHEMA_MAJOR): string {
  if (document === null || typeof document !== "object") throw new UnsupportedDocumentVersionError(document, supportedMajor);
  const version = (document as { readonly schemaVersion?: unknown }).schemaVersion;
  if (typeof version !== "string") throw new UnsupportedDocumentVersionError(version, supportedMajor);
  const match = /^([0-9]+)\.([0-9]+)$/.exec(version);
  if (match === null) throw new UnsupportedDocumentVersionError(version, supportedMajor);
  const major = Number(match[1]);
  if (major !== supportedMajor) throw new UnsupportedDocumentVersionError(version, supportedMajor);
  return version;
}

export interface TransactionSummary {
  readonly planDigest: string;
  readonly receiptDigest?: string;
  readonly outcome: "APPLIED" | "NOOP_APPLIED";
  readonly postFingerprint?: string;
}

export interface StateDocumentInput {
  readonly verb: "init" | "adopt";
  readonly commandId: string;
  readonly contractVersion: string;
  readonly productVersion: string;
  readonly runId: string;
  readonly planDigest: string;
  readonly observationFingerprint: string;
  readonly transaction: TransactionSummary;
}

export interface ParsedStateDocument {
  readonly runId: string;
  readonly productVersion: string;
  readonly commandId: string;
  readonly observationFingerprint: string;
  readonly observationModel: StateObservationModel;
}

export interface StateDocument {
  readonly schemaVersion: string;
  readonly kind: string;
  readonly verb: string;
  readonly commandId: string;
  readonly contractVersion: string;
  readonly productVersion: string;
  readonly runId: string;
  readonly planDigest: string;
  readonly observationFingerprint: string;
  readonly observationModel: typeof PROJECT_DRIFT_OBSERVATION_MODEL;
  readonly transaction: TransactionSummary;
}

export function buildStateDocument(input: StateDocumentInput): StateDocument {
  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    kind: `gef.${input.verb}.state`,
    verb: input.verb,
    commandId: input.commandId,
    contractVersion: input.contractVersion,
    productVersion: input.productVersion,
    runId: input.runId,
    planDigest: input.planDigest,
    observationFingerprint: input.observationFingerprint,
    observationModel: PROJECT_DRIFT_OBSERVATION_MODEL,
    transaction: input.transaction,
  };
}

/**
 * Parse a persisted init/adopt baseline without reinterpreting unknown fields or semantics.
 *
 * V1.1.0 documents have the exact legacy key set and recorded the full observation. New documents
 * have one additional explicit model discriminator. Unknown models, extra fields, invalid hashes,
 * inconsistent verb/command pairs and malformed transaction summaries are rejected.
 */
export function parseStateDocument(value: unknown): ParsedStateDocument | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const state = value as Record<string, unknown>;
  const legacyKeys = ["schemaVersion", "kind", "verb", "commandId", "contractVersion", "productVersion", "runId", "planDigest", "observationFingerprint", "transaction"];
  const modelKeys = [...legacyKeys, "observationModel"];
  const keys = Object.keys(state);
  const exactKeys = (expected: readonly string[]) => keys.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(state, key));
  const legacy = exactKeys(legacyKeys);
  const current = exactKeys(modelKeys) && state["observationModel"] === PROJECT_DRIFT_OBSERVATION_MODEL;
  if (!legacy && !current) return null;
  if (state["schemaVersion"] !== SUPPORTED_SCHEMA_VERSION || typeof state["contractVersion"] !== "string") return null;
  if (state["kind"] !== "gef.init.state" && state["kind"] !== "gef.adopt.state") return null;
  const verb = state["kind"] === "gef.init.state" ? "init" : "adopt";
  const commandId = verb === "init" ? "gef.init.run" : "gef.adopt.apply";
  if (state["verb"] !== verb || state["commandId"] !== commandId) return null;
  if (typeof state["productVersion"] !== "string" || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(state["productVersion"])) return null;
  if (legacy && !["1.0.0", "1.1.0"].includes(state["productVersion"])) return null;
  if (current && !["1.1.1", "1.1.2"].includes(state["productVersion"])) return null;
  if (typeof state["runId"] !== "string" || !/^[A-Za-z0-9-]{1,128}$/.test(state["runId"])) return null;
  if (typeof state["planDigest"] !== "string" || !/^[0-9a-f]{64}$/.test(state["planDigest"])) return null;
  if (typeof state["observationFingerprint"] !== "string" || !/^[0-9a-f]{64}$/.test(state["observationFingerprint"])) return null;
  const transaction = state["transaction"];
  if (transaction === null || typeof transaction !== "object" || Array.isArray(transaction)) return null;
  const summary = transaction as Record<string, unknown>;
  const transactionKeys = Object.keys(summary);
  const simpleTransaction = ["planDigest", "outcome"];
  const completeTransaction = ["planDigest", "outcome", "receiptDigest", "postFingerprint"];
  const exactTransactionKeys = (expected: readonly string[]) => transactionKeys.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(summary, key));
  if (!exactTransactionKeys(simpleTransaction) && !exactTransactionKeys(completeTransaction)) return null;
  if (summary["planDigest"] !== state["planDigest"] || (summary["outcome"] !== "APPLIED" && summary["outcome"] !== "NOOP_APPLIED")) return null;
  if (summary["receiptDigest"] !== undefined && (typeof summary["receiptDigest"] !== "string" || !/^[0-9a-f]{64}$/.test(summary["receiptDigest"]))) return null;
  if (summary["postFingerprint"] !== undefined && (typeof summary["postFingerprint"] !== "string" || !/^[0-9a-f]{64}$/.test(summary["postFingerprint"]))) return null;
  return {
    runId: state["runId"],
    productVersion: state["productVersion"],
    commandId,
    observationFingerprint: state["observationFingerprint"],
    observationModel: current ? PROJECT_DRIFT_OBSERVATION_MODEL : "LEGACY_FULL_OBSERVATION_V1",
  };
}

export interface ReceiptDocumentInput {
  readonly runId: string;
  readonly commandId: string;
  readonly contractVersion: string;
  readonly productVersion: string;
  readonly effectStatus: string;
  readonly lifecyclePhases: readonly string[];
  readonly resultDigest: string;
  readonly transaction: TransactionSummary;
}

export interface ReceiptDocument {
  readonly schemaVersion: string;
  readonly kind: string;
  readonly runId: string;
  readonly commandId: string;
  readonly contractVersion: string;
  readonly productVersion: string;
  readonly effectStatus: string;
  readonly lifecyclePhases: readonly string[];
  readonly resultDigest: string;
  readonly transaction: TransactionSummary;
}

export function buildReceiptDocument(input: ReceiptDocumentInput): ReceiptDocument {
  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    kind: "gef.cli.receipt",
    runId: input.runId,
    commandId: input.commandId,
    contractVersion: input.contractVersion,
    productVersion: input.productVersion,
    effectStatus: input.effectStatus,
    lifecyclePhases: [...input.lifecyclePhases],
    resultDigest: input.resultDigest,
    transaction: input.transaction,
  };
}

/** Schema asset names as packaged; used by payload integrity tests. */
export const SCHEMA_ASSETS: readonly string[] = Object.freeze([
  "gef-cli-state.schema.json",
  "gef-cli-receipt.schema.json",
  "gef-cli-upgrade-state.schema.json",
  "gef-cli-upgrade-compatibility-matrix.schema.json",
]);
