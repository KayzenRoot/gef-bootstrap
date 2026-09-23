// V1.1 Execution Capsule projection
// Pure deterministic projection over admitted M14 context + compiled M15 execution-pack truth.
// No filesystem, Git, network, process, clock or provider observation.

import type {
  AdmittedContextInput,
  CompiledExecutionPack,
  OperationOptions,
  Result,
} from "./types.js";
import {
  canonical,
  cancelled,
  compareCodePoint,
  deepFreeze,
  fail,
} from "./utils.js";
import { computeSealedDigests, findSealedDigestDrift } from "./s05-receipt.js";

export type ExecutionCapsuleState = "COMPILED" | "INDETERMINATE" | "STALE" | "REJECTED";
export type ExecutionCapsuleCertainty = "SUFFICIENT" | "INSUFFICIENT";
export type ExecutionCapsuleAssurance = "STANDARD" | "ELEVATED";
export type ExecutionCapsuleLadderLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
export type ExecutionCapsuleDriftClass =
  | "NONE"
  | "LOCAL_COMPATIBLE"
  | "SEED_RECOMPILE_REQUIRED"
  | "CONTEXT_EXPANSION_REQUIRED"
  | "CONFLICT";
export type ExecutionCapsuleDriftAction = "RECOMPILE" | "EXPAND_CONTEXT" | "ESCALATE" | "HALT";
export type ExecutionCapsuleProofState =
  | "REUSABLE"
  | "STALE_SOURCE"
  | "STALE_TEST"
  | "STALE_CONFIG"
  | "STALE_TOOLCHAIN"
  | "PLATFORM_MISMATCH"
  | "DEPENDENCY_UNKNOWN"
  | "CONFLICT"
  | "INDETERMINATE";
export type ExecutionCapsuleFileMode =
  | "NEW_FILE_SEED"
  | "EXISTING_FILE_PATCH_INTENT"
  | "STRUCTURE_ONLY"
  | "READ_ONLY";

export interface ExecutionCapsuleBaseInput {
  readonly repository: string;
  readonly branch: string;
  readonly headSha: string;
  readonly treeFingerprint: string;
  readonly productionBranchTouched: boolean;
}

export interface ExecutionCapsuleWorkOrderInput {
  readonly id: string;
  readonly source: string;
  readonly scopeDigest: string;
  readonly assurance?: ExecutionCapsuleAssurance | undefined;
}

export interface ExecutionCapsuleTriggeredRead {
  readonly path: string;
  readonly trigger: string;
}

export interface ExecutionCapsuleNavigationInput {
  readonly mustRead: readonly string[];
  readonly readIfTriggered?: readonly ExecutionCapsuleTriggeredRead[] | undefined;
  readonly writeAllowed: readonly string[];
  readonly writeForbidden: readonly string[];
}

export interface ExecutionCapsuleAffectedFile {
  readonly path: string;
  readonly mode: ExecutionCapsuleFileMode;
  readonly fingerprint: string | null;
}

export interface ExecutionCapsuleAffectedInput {
  readonly files: readonly ExecutionCapsuleAffectedFile[];
  readonly symbols?: readonly string[] | undefined;
  readonly dependencies?: readonly string[] | undefined;
  readonly dependencyClosureDigest: string;
  readonly dependencyKnowledgeComplete: boolean;
}

export interface ExecutionCapsuleAcceptanceCriterion {
  readonly id: string;
  readonly criterion: string;
  readonly proofObligation: string;
}

export interface ExecutionCapsuleEscalation {
  readonly trigger: string;
  readonly escalateTo: ExecutionCapsuleLadderLevel;
}

export interface ExecutionCapsuleSelectedTestsInput {
  readonly ladderLevel: ExecutionCapsuleLadderLevel;
  readonly tests: readonly string[];
  readonly escalation: readonly ExecutionCapsuleEscalation[];
  readonly finalSweepRequired: boolean;
}

export interface ExecutionCapsuleProofReferenceInput {
  readonly proofId: string;
  readonly state: ExecutionCapsuleProofState;
  readonly bindsTo: string;
  /**
   * Callers may send this sentinel only to prove the hard boundary.
   * Any value other than false is rejected. Output always seals false.
   */
  readonly manufacturesProductionCredit?: false | undefined;
}

export interface ExecutionCapsuleFingerprintInput {
  readonly ref: string;
  readonly fingerprint: string;
}

export interface ExecutionCapsuleCompileInput {
  readonly base: ExecutionCapsuleBaseInput;
  readonly workOrder: ExecutionCapsuleWorkOrderInput;
  readonly context: AdmittedContextInput;
  readonly compiledPack: CompiledExecutionPack;
  readonly navigation: ExecutionCapsuleNavigationInput;
  readonly affected: ExecutionCapsuleAffectedInput;
  readonly constraints: readonly string[];
  readonly acceptanceCriteria: readonly ExecutionCapsuleAcceptanceCriterion[];
  readonly selectedTests: ExecutionCapsuleSelectedTestsInput;
  readonly proofReferences: readonly ExecutionCapsuleProofReferenceInput[];
  readonly inputFingerprints?: readonly ExecutionCapsuleFingerprintInput[] | undefined;
  readonly driftClass: ExecutionCapsuleDriftClass;
  readonly stopCondition: string;
  readonly openQuestions?: readonly string[] | undefined;
  readonly expiresAt?: string | null | undefined;
  /** Explicitly ignored by semantic identity; useful for CTX-DET volatile-input proof. */
  readonly volatileMetadata?: Readonly<Record<string, unknown>> | undefined;
}

export interface ExecutionCapsule {
  readonly schemaVersion: "1.0";
  readonly capsuleId: string;
  readonly capsuleVersion: "1.0";
  readonly releaseLine: "1.1.x";
  readonly state: ExecutionCapsuleState;
  readonly certainty: ExecutionCapsuleCertainty;
  readonly base: {
    readonly repository: string;
    readonly branch: string;
    readonly headSha: string;
    readonly treeFingerprint: string;
    readonly productionBranchTouched: false;
  };
  readonly workOrder: {
    readonly id: string;
    readonly source: string;
    readonly scopeDigest: string;
    readonly assurance?: ExecutionCapsuleAssurance | undefined;
  };
  readonly navigation: {
    readonly mustRead: readonly string[];
    readonly readIfTriggered?: readonly ExecutionCapsuleTriggeredRead[] | undefined;
    readonly writeAllowed: readonly string[];
    readonly writeForbidden: readonly string[];
    readonly searchSuppressed: true;
  };
  readonly affected: {
    readonly files: readonly ExecutionCapsuleAffectedFile[];
    readonly symbols: readonly string[];
    readonly dependencies: readonly string[];
    readonly dependencyClosureDigest: string;
  };
  readonly constraints: readonly string[];
  readonly acceptanceCriteria: readonly ExecutionCapsuleAcceptanceCriterion[];
  readonly selectedTests: {
    readonly ladderLevel: ExecutionCapsuleLadderLevel;
    readonly tests: readonly string[];
    readonly escalation: readonly ExecutionCapsuleEscalation[];
    readonly finalSweepRequired: boolean;
  };
  readonly proofReferences: readonly {
    readonly proofId: string;
    readonly state: ExecutionCapsuleProofState;
    readonly bindsTo: string;
    readonly manufacturesProductionCredit: false;
  }[];
  readonly fingerprints: {
    readonly canonicalization: "GEF-CANONICAL-JSON-CODEPOINT-v1";
    readonly capsuleFingerprint: string;
    readonly inputs: readonly ExecutionCapsuleFingerprintInput[];
  };
  readonly invalidation: {
    readonly driftClasses: readonly ExecutionCapsuleDriftClass[];
    readonly onDrift: ExecutionCapsuleDriftAction;
    readonly expiresAt?: string | null | undefined;
  };
  readonly stopCondition: string;
  readonly openQuestions?: readonly string[] | undefined;
}

const RAW_SHA256 = /^[0-9a-f]{64}$/;
const SHA256_WITH_PREFIX = /^sha256:([0-9a-f]{64})$/;
const REPOSITORY_ID = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const HEAD_SHA = /^[0-9a-f]{40}$/;
const WORK_ORDER_ID = /^GBS-[A-Z0-9-]+$/;

const PROOF_STATES = new Set<ExecutionCapsuleProofState>([
  "REUSABLE",
  "STALE_SOURCE",
  "STALE_TEST",
  "STALE_CONFIG",
  "STALE_TOOLCHAIN",
  "PLATFORM_MISMATCH",
  "DEPENDENCY_UNKNOWN",
  "CONFLICT",
  "INDETERMINATE",
]);

const FILE_MODES = new Set<ExecutionCapsuleFileMode>([
  "NEW_FILE_SEED",
  "EXISTING_FILE_PATCH_INTENT",
  "STRUCTURE_ONLY",
  "READ_ONLY",
]);

const LADDER_LEVELS = new Set<ExecutionCapsuleLadderLevel>(["L0", "L1", "L2", "L3", "L4", "L5"]);

function rawSha(value: string): string | null {
  const normalized = value.toLowerCase();
  if (RAW_SHA256.test(normalized)) return normalized;
  const prefixed = SHA256_WITH_PREFIX.exec(normalized);
  return prefixed?.[1] ?? null;
}

function rawDigest(options: OperationOptions, value: unknown): Result<string> {
  if (!options.digest || options.digest.algorithm !== "sha256" || typeof options.digest.digest !== "function") {
    return fail("CAPSULE_DIGEST_CAPABILITY_INVALID", "Injected SHA-256 digest capability is required");
  }
  try {
    const output = options.digest.digest(canonical(value)).toLowerCase();
    if (!RAW_SHA256.test(output)) {
      return fail("CAPSULE_DIGEST_RESULT_INVALID", "Digest capability must return 64 hexadecimal characters");
    }
    return { ok: true, value: output };
  } catch {
    return fail("CAPSULE_DIGEST_CAPABILITY_FAILURE", "Unable to compute deterministic capsule digest");
  }
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort(compareCodePoint);
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  const a = sortedUnique(left);
  const b = sortedUnique(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function normalizeSlug(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.length === 0 ? "unknown" : normalized;
}

function capsuleId(repository: string, workOrderId: string): string {
  return `gef.capsule.${normalizeSlug(repository)}.${normalizeSlug(workOrderId)}`;
}

function driftAction(drift: ExecutionCapsuleDriftClass): ExecutionCapsuleDriftAction {
  if (drift === "CONTEXT_EXPANSION_REQUIRED") return "EXPAND_CONTEXT";
  if (drift === "CONFLICT") return "HALT";
  return "RECOMPILE";
}

function receiptState(status: string): ExecutionCapsuleState | null {
  if (status === "VALID") return null;
  if (status === "STALE_CONTEXT" || status === "STALE_POLICY") return "STALE";
  if (status === "INDETERMINATE") return "INDETERMINATE";
  return "REJECTED";
}

function contextValidityState(validity: string): ExecutionCapsuleState | null {
  if (validity === "VALID") return null;
  if (
    validity === "STALE" ||
    validity === "PROJECT_MISMATCH" ||
    validity === "SOURCE_PACK_MISMATCH" ||
    validity === "POLICY_UNSUPPORTED"
  ) return "STALE";
  if (validity === "INDETERMINATE" || validity === "PARTIAL") return "INDETERMINATE";
  return "REJECTED";
}

function strongerState(current: ExecutionCapsuleState, candidate: ExecutionCapsuleState): ExecutionCapsuleState {
  const rank: Record<ExecutionCapsuleState, number> = {
    COMPILED: 0,
    INDETERMINATE: 1,
    STALE: 2,
    REJECTED: 3,
  };
  return rank[candidate] > rank[current] ? candidate : current;
}

function semanticProjection(capsule: Omit<ExecutionCapsule, "fingerprints"> & {
  readonly fingerprints: {
    readonly canonicalization: "GEF-CANONICAL-JSON-CODEPOINT-v1";
    readonly inputs: readonly ExecutionCapsuleFingerprintInput[];
  };
}): unknown {
  const invalidation = {
    driftClasses: capsule.invalidation.driftClasses,
    onDrift: capsule.invalidation.onDrift,
  };
  return {
    ...capsule,
    invalidation,
  };
}

function fingerprintInputs(input: ExecutionCapsuleCompileInput): Result<readonly ExecutionCapsuleFingerprintInput[]> {
  const tree = rawSha(input.base.treeFingerprint);
  const scope = rawSha(input.workOrder.scopeDigest);
  const contextDigest = rawSha(input.context.capsule.semanticDigest);
  const packDigest = rawSha(input.compiledPack.pack.semanticDigest);
  if (tree === null) return fail("CAPSULE_FINGERPRINT_INVALID", "Base tree fingerprint must be SHA-256", "base.treeFingerprint");
  if (scope === null) return fail("CAPSULE_FINGERPRINT_INVALID", "Work Order scope digest must be SHA-256", "workOrder.scopeDigest");
  if (contextDigest === null) return fail("CAPSULE_FINGERPRINT_INVALID", "M14 context digest must be SHA-256", "context.capsule.semanticDigest");
  if (packDigest === null) return fail("CAPSULE_FINGERPRINT_INVALID", "M15 pack digest must be SHA-256", "compiledPack.pack.semanticDigest");

  const merged: ExecutionCapsuleFingerprintInput[] = [
    { ref: "base.tree", fingerprint: tree },
    { ref: "workOrder.scope", fingerprint: scope },
    { ref: "m14.context", fingerprint: contextDigest },
    { ref: "m15.pack", fingerprint: packDigest },
  ];
  for (const item of input.inputFingerprints ?? []) {
    if (!nonEmpty(item.ref)) return fail("CAPSULE_FINGERPRINT_INVALID", "Fingerprint ref must be non-empty");
    const value = rawSha(item.fingerprint);
    if (value === null) return fail("CAPSULE_FINGERPRINT_INVALID", "Input fingerprint must be SHA-256", item.ref);
    merged.push({ ref: item.ref, fingerprint: value });
  }

  const byRef = new Map<string, string>();
  for (const item of merged) {
    const previous = byRef.get(item.ref);
    if (previous !== undefined && previous !== item.fingerprint) {
      return fail("CAPSULE_FINGERPRINT_CONFLICT", `Conflicting fingerprints for ${item.ref}`, item.ref);
    }
    byRef.set(item.ref, item.fingerprint);
  }
  return {
    ok: true,
    value: [...byRef.entries()]
      .map(([ref, fingerprint]) => ({ ref, fingerprint }))
      .sort((a, b) => compareCodePoint(a.ref, b.ref)),
  };
}

function normalizeFiles(files: readonly ExecutionCapsuleAffectedFile[]): Result<readonly ExecutionCapsuleAffectedFile[]> {
  const seen = new Set<string>();
  const normalized: ExecutionCapsuleAffectedFile[] = [];
  for (const file of files) {
    if (!nonEmpty(file.path)) return fail("CAPSULE_AFFECTED_FILE_INVALID", "Affected file path must be non-empty");
    if (seen.has(file.path)) return fail("CAPSULE_AFFECTED_FILE_DUPLICATE", `Duplicate affected file: ${file.path}`, file.path);
    seen.add(file.path);
    if (!FILE_MODES.has(file.mode)) return fail("CAPSULE_AFFECTED_FILE_INVALID", `Unsupported file mode: ${String(file.mode)}`, file.path);
    const fingerprint = file.fingerprint === null ? null : rawSha(file.fingerprint);
    if (file.fingerprint !== null && fingerprint === null) {
      return fail("CAPSULE_FINGERPRINT_INVALID", "Affected-file fingerprint must be SHA-256 or null", file.path);
    }
    normalized.push({ path: file.path, mode: file.mode, fingerprint });
  }
  normalized.sort((a, b) => compareCodePoint(a.path, b.path) || compareCodePoint(a.mode, b.mode));
  return { ok: true, value: normalized };
}

function normalizeCriteria(
  criteria: readonly ExecutionCapsuleAcceptanceCriterion[],
): Result<readonly ExecutionCapsuleAcceptanceCriterion[]> {
  if (criteria.length === 0) return fail("CAPSULE_ACCEPTANCE_EMPTY", "At least one acceptance criterion is required");
  const ids = new Set<string>();
  const normalized: ExecutionCapsuleAcceptanceCriterion[] = [];
  for (const item of criteria) {
    if (!nonEmpty(item.id) || !nonEmpty(item.criterion) || !nonEmpty(item.proofObligation)) {
      return fail("CAPSULE_ACCEPTANCE_INVALID", "Acceptance criterion fields must be non-empty", item.id);
    }
    if (ids.has(item.id)) return fail("CAPSULE_ACCEPTANCE_DUPLICATE", `Duplicate acceptance criterion: ${item.id}`, item.id);
    ids.add(item.id);
    normalized.push({ ...item });
  }
  normalized.sort((a, b) => compareCodePoint(a.id, b.id));
  return { ok: true, value: normalized };
}

function normalizeEscalation(
  entries: readonly ExecutionCapsuleEscalation[],
): Result<readonly ExecutionCapsuleEscalation[]> {
  if (entries.length === 0) return fail("CAPSULE_ESCALATION_EMPTY", "At least one escalation rule is required");
  const seen = new Set<string>();
  const normalized: ExecutionCapsuleEscalation[] = [];
  for (const item of entries) {
    if (!nonEmpty(item.trigger) || !LADDER_LEVELS.has(item.escalateTo)) {
      return fail("CAPSULE_ESCALATION_INVALID", "Escalation trigger/level is invalid", item.trigger);
    }
    const key = `${item.trigger}\0${item.escalateTo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ ...item });
  }
  normalized.sort((a, b) => compareCodePoint(a.trigger, b.trigger) || compareCodePoint(a.escalateTo, b.escalateTo));
  return { ok: true, value: normalized };
}

function normalizeProofs(
  proofs: readonly ExecutionCapsuleProofReferenceInput[],
): Result<ExecutionCapsule["proofReferences"]> {
  const ids = new Set<string>();
  const normalized: Array<ExecutionCapsule["proofReferences"][number]> = [];
  for (const proof of proofs) {
    if (!nonEmpty(proof.proofId) || !PROOF_STATES.has(proof.state)) {
      return fail("CAPSULE_PROOF_INVALID", "Proof reference id/state is invalid", proof.proofId);
    }
    if (ids.has(proof.proofId)) return fail("CAPSULE_PROOF_DUPLICATE", `Duplicate proof id: ${proof.proofId}`, proof.proofId);
    ids.add(proof.proofId);
    const bindsTo = rawSha(proof.bindsTo);
    if (bindsTo === null) return fail("CAPSULE_FINGERPRINT_INVALID", "Proof binding must be SHA-256", proof.proofId);
    const raw = proof as ExecutionCapsuleProofReferenceInput & { readonly manufacturesProductionCredit?: unknown };
    if (raw.manufacturesProductionCredit !== undefined && raw.manufacturesProductionCredit !== false) {
      return fail("CAPSULE_PRODUCTION_CREDIT_FORBIDDEN", "Proof reuse may never manufacture production credit", proof.proofId);
    }
    normalized.push({
      proofId: proof.proofId,
      state: proof.state,
      bindsTo,
      manufacturesProductionCredit: false,
    });
  }
  normalized.sort((a, b) => compareCodePoint(a.proofId, b.proofId));
  return { ok: true, value: normalized };
}

function knownBindingState(input: ExecutionCapsuleCompileInput): ExecutionCapsuleState {
  const capsule = input.context.capsule;
  const handoff = input.context.handoff;
  const pack = input.compiledPack.pack;
  const receipt = input.compiledPack.receipt;

  let state: ExecutionCapsuleState = "COMPILED";

  const capsuleState = contextValidityState(capsule.validity);
  if (capsuleState !== null) state = strongerState(state, capsuleState);
  const handoffState = contextValidityState(handoff.capsuleValidity);
  if (handoffState !== null) state = strongerState(state, handoffState);
  if (!handoff.readyForM15Consumption || handoff.blockerCodes.length > 0) {
    state = strongerState(state, "INDETERMINATE");
  }

  const receiptMapped = receiptState(receipt.status);
  if (receiptMapped !== null) state = strongerState(state, receiptMapped);
  if (!receipt.replayable) state = strongerState(state, "STALE");

  if (
    handoff.capsuleSemanticDigest !== capsule.semanticDigest ||
    pack.contextIdentity !== capsule.semanticDigest ||
    pack.contextDigest !== capsule.semanticDigest ||
    receipt.contextIdentity !== capsule.semanticDigest ||
    receipt.contextDigest !== capsule.semanticDigest ||
    receipt.semanticDigest !== pack.semanticDigest ||
    receipt.packId !== pack.packId ||
    pack.taskIdentity !== capsule.taskIntentEnvelope.semanticIdentity
  ) {
    state = strongerState(state, "STALE");
  }

  if (!input.affected.dependencyKnowledgeComplete) state = strongerState(state, "INDETERMINATE");
  if ((input.openQuestions?.length ?? 0) > 0) state = strongerState(state, "INDETERMINATE");

  if (!sameStringSet(input.constraints, pack.constraints) || input.stopCondition !== pack.stopCondition) {
    state = strongerState(state, "REJECTED");
  }

  const requiredReads = new Set(input.navigation.mustRead);
  if (capsule.selectedUnits.some((unit) => !requiredReads.has(unit.semanticPayloadRef))) {
    state = strongerState(state, "REJECTED");
  }

  const affected = new Set(input.affected.files.map((file) => file.path));
  const targetFiles = new Set(pack.instructions.flatMap((instruction) => [...instruction.targetFiles]));
  if ([...targetFiles].some((path) => !affected.has(path))) {
    state = strongerState(state, "REJECTED");
  }

  if (input.driftClass === "CONFLICT") state = strongerState(state, "REJECTED");
  else if (input.driftClass === "SEED_RECOMPILE_REQUIRED") state = strongerState(state, "STALE");
  else if (input.driftClass === "CONTEXT_EXPANSION_REQUIRED") state = strongerState(state, "INDETERMINATE");

  return state;
}

export function validateExecutionCapsuleContract(capsule: ExecutionCapsule): Result<true> {
  if (capsule.schemaVersion !== "1.0" || capsule.capsuleVersion !== "1.0" || capsule.releaseLine !== "1.1.x") {
    return fail("CAPSULE_SCHEMA_INVALID", "Execution Capsule version identity is invalid");
  }
  if (!/^gef\.capsule\.[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/.test(capsule.capsuleId)) {
    return fail("CAPSULE_SCHEMA_INVALID", "capsuleId does not conform to the V1.1 schema");
  }
  if (!REPOSITORY_ID.test(capsule.base.repository) || !HEAD_SHA.test(capsule.base.headSha)) {
    return fail("CAPSULE_SCHEMA_INVALID", "Base repository/head binding is invalid");
  }
  if (capsule.base.productionBranchTouched !== false || capsule.base.branch === "main") {
    return fail("CAPSULE_PRODUCTION_BRANCH_FORBIDDEN", "Compiled Execution Capsule may not target production main");
  }
  if (rawSha(capsule.base.treeFingerprint) === null || rawSha(capsule.workOrder.scopeDigest) === null) {
    return fail("CAPSULE_SCHEMA_INVALID", "Base/work-order fingerprints must be SHA-256");
  }
  if (!WORK_ORDER_ID.test(capsule.workOrder.id) || !nonEmpty(capsule.workOrder.source)) {
    return fail("CAPSULE_SCHEMA_INVALID", "Work Order identity/source is invalid");
  }
  if (capsule.constraints.length === 0 || capsule.acceptanceCriteria.length === 0) {
    return fail("CAPSULE_SCHEMA_INVALID", "Constraints and acceptance criteria must be non-empty");
  }
  if (capsule.selectedTests.escalation.length === 0) {
    return fail("CAPSULE_SCHEMA_INVALID", "Selected tests must declare escalation rules");
  }
  if (capsule.selectedTests.ladderLevel === "L5" && capsule.selectedTests.finalSweepRequired !== true) {
    return fail("CAPSULE_FINAL_SWEEP_REQUIRED", "L5 selection must retain finalSweepRequired=true");
  }
  if (capsule.certainty === "INSUFFICIENT" && capsule.state !== "INDETERMINATE") {
    return fail("CAPSULE_SCHEMA_INVALID", "INSUFFICIENT certainty may only produce INDETERMINATE");
  }
  if (capsule.state === "COMPILED" && capsule.certainty !== "SUFFICIENT") {
    return fail("CAPSULE_SCHEMA_INVALID", "COMPILED requires SUFFICIENT certainty");
  }
  if (rawSha(capsule.fingerprints.capsuleFingerprint) === null || capsule.fingerprints.inputs.length === 0) {
    return fail("CAPSULE_SCHEMA_INVALID", "Capsule fingerprint/input fingerprints are invalid");
  }
  if (capsule.proofReferences.some((proof) => proof.manufacturesProductionCredit !== false)) {
    return fail("CAPSULE_PRODUCTION_CREDIT_FORBIDDEN", "Proof references cannot manufacture production credit");
  }
  return { ok: true, value: true };
}

export function serializeExecutionCapsuleCanonical(capsule: ExecutionCapsule): string {
  return canonical(capsule);
}

export function verifyExecutionCapsuleFingerprint(
  capsule: ExecutionCapsule,
  options: OperationOptions,
): Result<boolean> {
  const projection = semanticProjection({
    ...capsule,
    fingerprints: {
      canonicalization: capsule.fingerprints.canonicalization,
      inputs: capsule.fingerprints.inputs,
    },
  });
  const digest = rawDigest(options, projection);
  if (!digest.ok) return digest;
  return { ok: true, value: digest.value === capsule.fingerprints.capsuleFingerprint };
}

export function compileExecutionCapsule(
  input: ExecutionCapsuleCompileInput,
  options: OperationOptions,
): Result<ExecutionCapsule> {
  const c = cancelled(options);
  if (c) return c;

  if (!REPOSITORY_ID.test(input.base.repository)) {
    return fail("CAPSULE_BASE_INVALID", "Repository must use owner/name identity", input.base.repository);
  }
  if (!nonEmpty(input.base.branch) || !HEAD_SHA.test(input.base.headSha)) {
    return fail("CAPSULE_BASE_INVALID", "Branch/head binding is invalid");
  }
  if (input.base.productionBranchTouched !== false || input.base.branch === "main") {
    return fail("CAPSULE_PRODUCTION_BRANCH_FORBIDDEN", "Execution Capsule cannot authorize production main");
  }
  if (!WORK_ORDER_ID.test(input.workOrder.id) || !nonEmpty(input.workOrder.source)) {
    return fail("CAPSULE_WORK_ORDER_INVALID", "Work Order id/source is invalid");
  }
  if (input.constraints.length === 0) {
    return fail("CAPSULE_CONSTRAINTS_EMPTY", "Execution Capsule requires at least one constraint");
  }
  if (!nonEmpty(input.stopCondition)) {
    return fail("CAPSULE_STOP_CONDITION_EMPTY", "Execution Capsule requires a STOP CONDITION");
  }
  if (!LADDER_LEVELS.has(input.selectedTests.ladderLevel)) {
    return fail("CAPSULE_TEST_SELECTION_INVALID", "Unknown validation ladder level");
  }
  if (input.selectedTests.ladderLevel === "L5" && !input.selectedTests.finalSweepRequired) {
    return fail("CAPSULE_FINAL_SWEEP_REQUIRED", "L5 selection cannot waive final exact-head assurance");
  }

  const escalation = normalizeEscalation(input.selectedTests.escalation);
  if (!escalation.ok) return escalation;
  const criteria = normalizeCriteria(input.acceptanceCriteria);
  if (!criteria.ok) return criteria;
  const files = normalizeFiles(input.affected.files);
  if (!files.ok) return files;
  const proofs = normalizeProofs(input.proofReferences);
  if (!proofs.ok) return proofs;
  const inputs = fingerprintInputs(input);
  if (!inputs.ok) return inputs;

  const dependencyClosureDigest = rawSha(input.affected.dependencyClosureDigest);
  if (dependencyClosureDigest === null) {
    return fail("CAPSULE_FINGERPRINT_INVALID", "Dependency closure digest must be SHA-256", "affected.dependencyClosureDigest");
  }
  const treeFingerprint = rawSha(input.base.treeFingerprint);
  const scopeDigest = rawSha(input.workOrder.scopeDigest);
  if (treeFingerprint === null || scopeDigest === null) {
    return fail("CAPSULE_FINGERPRINT_INVALID", "Base tree and scope digests must be SHA-256");
  }

  const writeAllowed = sortedUnique(input.navigation.writeAllowed);
  const writeForbidden = sortedUnique(input.navigation.writeForbidden);
  const forbidden = new Set(writeForbidden);
  const conflict = writeAllowed.find((path) => forbidden.has(path));
  if (conflict !== undefined) {
    return fail("CAPSULE_WRITE_SET_CONFLICT", `Write path is both allowed and forbidden: ${conflict}`, conflict);
  }

  const mustRead = sortedUnique(input.navigation.mustRead);
  const readIfTriggered = [...(input.navigation.readIfTriggered ?? [])]
    .map((entry) => ({ path: entry.path, trigger: entry.trigger }))
    .sort((a, b) => compareCodePoint(a.path, b.path) || compareCodePoint(a.trigger, b.trigger));
  if (mustRead.some((path) => !nonEmpty(path)) || readIfTriggered.some((entry) => !nonEmpty(entry.path) || !nonEmpty(entry.trigger))) {
    return fail("CAPSULE_NAVIGATION_INVALID", "Navigation paths/triggers must be non-empty");
  }

  // M15 is an admitted input, but admission is validity-bound rather than trust-by-shape.
  // Recompute all four sealed digests so a copied/tampered pack cannot ride on an old receipt.
  const recomputedSeals = computeSealedDigests(input.compiledPack.pack, options);
  if (!recomputedSeals.ok) {
    return fail("CAPSULE_M15_SEAL_INVALID", "Unable to re-verify the compiled M15 pack seals");
  }
  const trustedPackSeals = {
    graphDigest: input.compiledPack.pack.graphDigest,
    toolPlanDigest: input.compiledPack.pack.toolPlanDigest,
    validationPlanDigest: input.compiledPack.pack.validationPlanDigest,
    semanticDigest: input.compiledPack.pack.semanticDigest,
  };
  const packDrift = findSealedDigestDrift(recomputedSeals.value, trustedPackSeals);
  const receipt = input.compiledPack.receipt;
  const receiptDrift =
    receipt.graphDigest !== trustedPackSeals.graphDigest ||
    receipt.toolPlanDigest !== trustedPackSeals.toolPlanDigest ||
    receipt.validationPlanDigest !== trustedPackSeals.validationPlanDigest ||
    receipt.semanticDigest !== trustedPackSeals.semanticDigest;
  if (packDrift.length > 0 || receiptDrift) {
    return fail(
      "CAPSULE_M15_SEAL_INVALID",
      `Compiled M15 pack/receipt seal mismatch: ${packDrift.join(",") || "receipt"}`,
      input.compiledPack.pack.packId,
    );
  }

  const state = knownBindingState(input);
  const certainty: ExecutionCapsuleCertainty = state === "INDETERMINATE" ? "INSUFFICIENT" : "SUFFICIENT";

  const base = {
    repository: input.base.repository,
    branch: input.base.branch,
    headSha: input.base.headSha,
    treeFingerprint,
    productionBranchTouched: false as const,
  };
  const workOrder = {
    id: input.workOrder.id,
    source: input.workOrder.source,
    scopeDigest,
    ...(input.workOrder.assurance === undefined ? {} : { assurance: input.workOrder.assurance }),
  };
  const navigation = {
    mustRead,
    ...(readIfTriggered.length === 0 ? {} : { readIfTriggered }),
    writeAllowed,
    writeForbidden,
    searchSuppressed: true as const,
  };
  const affected = {
    files: files.value,
    symbols: sortedUnique(input.affected.symbols ?? []),
    dependencies: sortedUnique(input.affected.dependencies ?? []),
    dependencyClosureDigest,
  };
  const selectedTests = {
    ladderLevel: input.selectedTests.ladderLevel,
    tests: sortedUnique(input.selectedTests.tests),
    escalation: escalation.value,
    finalSweepRequired: input.selectedTests.finalSweepRequired,
  };
  const invalidationBase = {
    driftClasses: [input.driftClass] as readonly ExecutionCapsuleDriftClass[],
    onDrift: driftAction(input.driftClass),
  };
  const openQuestions = sortedUnique(input.openQuestions ?? []);

  const preFingerprint = {
    schemaVersion: "1.0" as const,
    capsuleId: capsuleId(input.base.repository, input.workOrder.id),
    capsuleVersion: "1.0" as const,
    releaseLine: "1.1.x" as const,
    state,
    certainty,
    base,
    workOrder,
    navigation,
    affected,
    constraints: sortedUnique(input.constraints),
    acceptanceCriteria: criteria.value,
    selectedTests,
    proofReferences: proofs.value,
    fingerprints: {
      canonicalization: "GEF-CANONICAL-JSON-CODEPOINT-v1" as const,
      inputs: inputs.value,
    },
    invalidation: invalidationBase,
    stopCondition: input.stopCondition,
    ...(openQuestions.length === 0 ? {} : { openQuestions }),
  };

  const semanticDigest = rawDigest(options, semanticProjection(preFingerprint));
  if (!semanticDigest.ok) return semanticDigest;

  const capsule: ExecutionCapsule = deepFreeze({
    ...preFingerprint,
    fingerprints: {
      canonicalization: "GEF-CANONICAL-JSON-CODEPOINT-v1",
      capsuleFingerprint: semanticDigest.value,
      inputs: inputs.value,
    },
    invalidation: {
      ...invalidationBase,
      ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt }),
    },
  });

  const validation = validateExecutionCapsuleContract(capsule);
  if (!validation.ok) return validation;
  return { ok: true, value: capsule };
}
