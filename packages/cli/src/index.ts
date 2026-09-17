/**
 * Public CLI surface.
 *
 * The CLI is library/application-API first and thin CLI second (ARCHITECTURE.md A3). This
 * module exports the transport pieces so they can be exercised programmatically and tested
 * without shell coupling; the process entry lives in `main.ts`.
 */

import type { GefResult } from "@gef-bootstrap/contracts";
import { projectExitCode } from "@gef-bootstrap/kernel";

/** The single argv-to-exit-code projection used by the CLI. */
export function processExitCodeFor(result: GefResult<unknown>): number {
  return projectExitCode(result);
}

export { ADMITTED_VERBS, CLI_CONTRACT_VERSION, parseArgv } from "./parser.js";
export type { CliVerb as ParsedVerb, ParseFailure, ParseOutcome, ParsedCommand, ParsedMeta } from "./parser.js";

export {
  ENVELOPE_SCHEMA_VERSION,
  renderHelp,
  renderHelpJson,
  renderLines,
  renderResultHuman,
  renderResultJson,
  renderUsageFailureHuman,
  renderUsageFailureJson,
  renderVersion,
  renderVersionJson,
  resultEnvelope,
} from "./render.js";
export type { JsonEnvelope, JsonErrorProjection } from "./render.js";

export {
  CLI_COMMAND_IDS,
  EngineUnavailableError,
  GEF_STATE_DIRECTORY,
  HELP_INVENTORY,
  buildRegistry,
  cliRegistrations,
  fingerprint,
  loadEngines,
  observeCanonicalSources,
  observeRepository,
  observeTarget,
  readRecordedArtifact,
} from "./registry.js";
export type {
  BackupManifestResult,
  CanonicalResolutionResult,
  CanonicalSourceInput,
  CliCommandInput,
  DriftResult,
  EngineKey,
  Engines,
  HelpEntry,
  InstallPlanResult,
  RecordedArtifact,
  RepositoryObservation,
  RepositoryStateInput,
  RepositoryStateResult,
  SafetyDecisionResult,
  TargetObservation,
} from "./registry.js";

export {
  CLI_RECEIPT_SCHEMA_ID,
  CLI_STATE_SCHEMA_ID,
  SCHEMA_ASSETS,
  SUPPORTED_SCHEMA_MAJOR,
  SUPPORTED_SCHEMA_VERSION,
  UnsupportedDocumentVersionError,
  buildReceiptDocument,
  buildStateDocument,
  requireSupportedSchemaVersion,
} from "./schemas.js";
export type { ReceiptDocument, StateDocument, TransactionSummary } from "./schemas.js";

export { JOURNAL_DIRECTORY, TRANSACTION_PRIVATE_DIRECTORY, applyGovernedCreate, cliPrimitiveFor, createJournalPort, createPhysicalPort, createStatePort, detectCaseSemantics, relativeRef } from "./transaction.js";
export type { GovernedCreateOutcome, GovernedCreateRequest, PhysicalPortOptions } from "./transaction.js";

export { FALLBACK_PRODUCT_VERSION, main, resolveProductVersion, runCli } from "./main.js";
export type { RunDependencies } from "./main.js";
