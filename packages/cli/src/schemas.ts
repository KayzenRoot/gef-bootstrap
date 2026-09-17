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
    transaction: input.transaction,
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

/** Schema asset names as packaged; used by payload tests. */
export const SCHEMA_ASSETS: readonly string[] = Object.freeze(["gef-cli-state.schema.json", "gef-cli-receipt.schema.json"]);
