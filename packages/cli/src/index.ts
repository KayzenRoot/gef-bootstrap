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

export * from "./engines.js";

export {
  JOURNAL_SUBDIRECTORY,
  OWNER_MARKER,
  PRIVATE_DIRECTORY,
  PROBE_DIRECTORY,
  PrivateAuthorityError,
  createPrivateArea,
  fingerprintOf,
  isLexicallyContained,
  measureCaseSemantics,
} from "./private-authority.js";
export type { OwnedDirectory, OwnedFile, PrivateArea, PrivateAuthorityReason, RemovalReport, WriteReport } from "./private-authority.js";



export {
  CLI_COMMAND_IDS,
  DIAGNOSTIC_FILE_MAX_BYTES,
  DIAGNOSTIC_SOURCE_MAX_FILES,
  EngineUnavailableError,
  GEF_STATE_DIRECTORY,
  GIT_APPROVED_EXECUTABLES,
  GIT_EXECUTABLE_POLICY_REF,
  GIT_METADATA_MAX_BYTES,
  GIT_TOOL_ID,
  HELP_INVENTORY,
  SUPPORTED_CHECKPOINT_SCHEMA_VERSIONS,
  buildRegistry,
  cliRegistrations,
  DEFAULT_GIT_TRUST_POLICY,
  GIT_TRUST_POLICY_REF,
  beginGitToolInvocation,
  createCliToolObservationPort,
  endGitToolInvocation,
  gitPort,
  containedEntryKind,
  diagnosticReadLimits,
  fingerprint,
    gitProbeEnvironment,
  gitTool,
  gitToolDescriptor,
  inspectAdmittedExecutable,
  runGitProbe,
  parseGitVersion,
  resolveGitToolWith,
  GIT_VERSION_PARSER_REF,
  loadEngines,
  gitBinaryAvailable,
  observeCanonicalSources,
  observeDocumentation,
  observeGitTool,
  observeGovernance,
  observeGovernanceFileLimits,
  observeGovernanceFiles,
  observeRepository,
  observeRepositoryDirtiness,
  observeTarget,
  readContainedDiagnosticFile,
  readGitMetadata,
  readRecordedArtifact,
  recordedBaselineSupported,
  validateGovernanceCheckpoint,
} from "./registry.js";
export type {
  BackupManifestResult,
  CapabilityEnvelopeResult,
  CapabilityObservation,
  DependencySecurityResult,
  DiagnosisComposition,
  DiagnosisInput,
  DiagnosisVerb,
  DiagnosticReadOutcome,
  DiagnosticReadStatus,
  DoctorFindingResult,
  DocumentationManifestResult,
  GithubSecurityResult,
  GovernanceObservation,
  IntegritySnapshotResult,
  InvariantResultValue,
  MutationVerb,
  NavigationPlanResult,
  OperatorStatusResult,
  RepairSuggestionResult,
  GitExecutableTrustPolicy,
  GitProbeOutcome,
  PhysicalTrustInspection,
  PermissionProof,
  ApprovedExecutableRoot,
  ResolvedGitTool,
  SyncToolObservationPort,
  CanonicalResolutionResult,
  CanonicalSourceInput,
  CliCommandInput,
  DirtinessObservation,
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

export {
  JOURNAL_DIRECTORY,
  TRANSACTION_PRIVATE_DIRECTORY,
  applyGovernedCreate,
  cliPrimitiveFor,
  createAuthorizationPort,
  createJournalPort,
  createPhysicalPort,
  createStatePort,
  detectCaseSemantics,
  relativeRef,
} from "./transaction.js";
export {
  ADMITTED_MUTATION_BINDINGS,
  bindingAllowsSurface,
  bindingFor,
  resolveMutationBinding,
} from "./transaction.js";
export type {
  AuthorizedMutationBinding,
  MutationBindingQuery,
  MutationPurpose,
  MutationSurfaceMode,
} from "./transaction.js";
export type {
  AuthorizationContext,
  AuthorizationDecision,
  GovernedCreateOutcome,
  GovernedCreateOverrides,
  GovernedCreateRequest,
  PhysicalPortOptions,
} from "./transaction.js";

export { FALLBACK_PRODUCT_VERSION, main, resolveProductVersion, runCli } from "./main.js";
export type { RunDependencies } from "./main.js";
