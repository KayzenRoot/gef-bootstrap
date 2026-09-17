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

export { ADMITTED_VERBS, CLI_CONTRACT_VERSION, parseArgv, usageText } from "./parser.js";
export type { CliVerb as ParsedVerb, ParseFailure, ParseOutcome, ParsedCommand, ParsedMeta } from "./parser.js";

export {
  ENVELOPE_SCHEMA_VERSION,
  renderHelp,
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
  ArtifactAlreadyPresentError,
  CLI_COMMAND_IDS,
  EngineUnavailableError,
  buildRegistry,
  cliRegistrations,
  fingerprint,
  loadEngines,
  observeTarget,
  persistGovernedArtifact,
  rootDescriptorFor,
} from "./registry.js";
export type { ApplyReceipt, ApplyRequest, CliCommandInput, Engines, InstallPlanResult, TargetObservation } from "./registry.js";

export { FALLBACK_PRODUCT_VERSION, main, resolveProductVersion, runCli } from "./main.js";
export type { RunDependencies } from "./main.js";
