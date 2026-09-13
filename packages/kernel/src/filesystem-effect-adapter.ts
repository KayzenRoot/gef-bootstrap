import { createGefError } from "./errors.js";
import { composeFilesystemPhysicalSafety } from "./filesystem-atomic.js";
import { evaluateFilesystemOverwrite } from "./filesystem-overwrite.js";
import { authorizeFilesystemPath } from "./filesystem-paths.js";
import type { FilesystemIntentResolver, FilesystemPhysicalPort, FilesystemResolvedIntent, FilesystemResolvedPath, FilesystemStageReceipt } from "./filesystem-ports.js";
import { proveFilesystemTraversal } from "./filesystem-traversal.js";
import type { FilesystemOperation, FilesystemPathCapsule, FilesystemPhysicalSafetyCapability, FilesystemResult } from "./filesystem-types.js";
import type { TransactionEffectPort } from "./transaction-ports.js";
import type { AppliedIntentResult, TransactionIntent, TransactionPlan, TransactionStateBinding, VerificationObligation } from "./transaction-types.js";

interface PreparedTarget {
  readonly path: FilesystemPathCapsule;
  readonly safety: FilesystemPhysicalSafetyCapability;
}

interface IntentState {
  readonly resolved: FilesystemResolvedIntent;
  readonly target: PreparedTarget;
  readonly source?: PreparedTarget;
  readonly stage?: FilesystemStageReceipt;
}

export interface FilesystemEffectAdapterOptions {
  readonly transactionId: string;
  readonly resolver: FilesystemIntentResolver;
  readonly physical: FilesystemPhysicalPort;
}

type AdapterCategory = "PRECONDITION" | "CAPABILITY" | "EXECUTION" | "VERIFICATION" | "RECOVERY";

function adapterError(intent: TransactionIntent, reason: string, summary: string, category: AdapterCategory = "PRECONDITION"): FilesystemResult<never> {
  return {
    ok: false,
    error: createGefError({
      id: `m06-effect-${reason}`,
      category,
      reason: `filesystem_effect.${reason}`,
      severity: category === "RECOVERY" ? "CRITICAL" : "ERROR",
      summary,
      retryability: category === "RECOVERY" ? "REQUIRES_EFFECT_CHECK" : "NEVER",
      recoverability: category === "RECOVERY" ? "RECOVERY_REQUIRED" : "NONE_REQUIRED",
      terminal: category === "RECOVERY" ? "RECOVERY_REQUIRED" : "BLOCKED",
      targetRef: intent.targetRef,
      metadata: { intentId: intent.intentId, intentKind: intent.kind },
    }),
  };
}

function applyOperation(intent: TransactionIntent): FilesystemOperation | undefined {
  switch (intent.kind) {
    case "CREATE_MANAGED_ARTIFACT": return "CREATE";
    case "UPDATE_MANAGED_ARTIFACT": return "UPDATE";
    case "REMOVE_MANAGED_ARTIFACT": return "REMOVE";
    case "MOVE_MANAGED_ARTIFACT": return "MOVE_DESTINATION";
    default: return undefined;
  }
}

function safetySignature(target: PreparedTarget): string {
  return JSON.stringify({
    rootRef: target.safety.rootRef,
    path: target.safety.normalizedRelativePath,
    operation: target.safety.operation,
    capabilityRef: target.safety.capabilityRef,
    identity: target.safety.observedIdentityToken ?? null,
    dependencies: [...target.safety.dependencyTokens],
    durability: target.safety.durability,
    visibilityAtomic: target.safety.visibilityAtomic,
  });
}

function samePrepared(left: PreparedTarget, right: PreparedTarget): boolean {
  return safetySignature(left) === safetySignature(right);
}

async function prepareTarget(
  physical: FilesystemPhysicalPort,
  intent: TransactionIntent,
  resolved: FilesystemResolvedPath,
  operation: FilesystemOperation,
  desiredFingerprint: string | undefined,
  requireCrashDurability: boolean,
  replaceExisting = false,
): Promise<FilesystemResult<PreparedTarget>> {
  const path = authorizeFilesystemPath({ root: resolved.root, relativePath: resolved.relativePath, operation });
  if (!path.ok) return path;
  const observed = await physical.observe(path.value);
  if (!observed.ok) return observed;
  const overwrite = evaluateFilesystemOverwrite({
    path: path.value,
    observation: observed.value.target,
    ...(resolved.expected === undefined ? {} : { expected: resolved.expected }),
    ...(desiredFingerprint === undefined ? {} : { desiredFingerprint }),
    ...(replaceExisting ? { replaceExistingDestination: true } : {}),
  });
  if (!overwrite.ok) return overwrite;
  if (overwrite.value.noop) return adapterError(intent, "unexpected_noop", "M05 must resolve no-op state before opening a physical mutation capability");
  const traversal = proveFilesystemTraversal({ path: path.value, ancestors: observed.value.ancestors, target: observed.value.target });
  if (!traversal.ok) return traversal;
  const facts = await physical.atomicFacts({ intent, path: path.value, ...(desiredFingerprint === undefined ? {} : { desiredFingerprint }), requireCrashDurability });
  if (!facts.ok) return facts;
  if (facts.value.stagingAuthorityRef.trim().length === 0) return adapterError(intent, "staging_authority_missing", "Transaction-private staging has no governed authority binding", "CAPABILITY");
  const atomic = composeFilesystemPhysicalSafety({
    path: path.value,
    overwrite: overwrite.value,
    traversal: traversal.value,
    primitive: facts.value.primitive,
    requireCrashDurability,
    ...(facts.value.stagingFilesystemId === undefined ? {} : { stagingFilesystemId: facts.value.stagingFilesystemId }),
    ...(facts.value.destinationFilesystemId === undefined ? {} : { destinationFilesystemId: facts.value.destinationFilesystemId }),
  });
  if (!atomic.ok) return atomic;
  return { ok: true, value: Object.freeze({ path: path.value, safety: atomic.value }) };
}

async function prepareIntent(options: FilesystemEffectAdapterOptions, intent: TransactionIntent): Promise<FilesystemResult<IntentState>> {
  const resolved = options.resolver.resolve(intent);
  if (!resolved.ok) return resolved;
  const operation = applyOperation(intent);
  if (operation === undefined) return adapterError(intent, "unsupported_intent", "Filesystem effect adapter accepts only managed filesystem intents", "CAPABILITY");
  const desiredFingerprint = resolved.value.desiredFingerprint ?? intent.desiredFingerprint;
  const durable = resolved.value.requireCrashDurability ?? false;
  const target = await prepareTarget(options.physical, intent, resolved.value.target, operation, desiredFingerprint, durable, resolved.value.target.replaceExisting ?? false);
  if (!target.ok) return target;

  if (intent.kind !== "MOVE_MANAGED_ARTIFACT") return { ok: true, value: Object.freeze({ resolved: resolved.value, target: target.value }) };
  if (resolved.value.source === undefined) return adapterError(intent, "move_source_missing", "Managed move requires independently resolved source and destination paths");
  const source = await prepareTarget(options.physical, intent, resolved.value.source, "MOVE_SOURCE", undefined, durable, false);
  if (!source.ok) return source;
  return { ok: true, value: Object.freeze({ resolved: resolved.value, target: target.value, source: source.value }) };
}

function stateBinding(intent: TransactionIntent, suffix: string, value: string): TransactionStateBinding {
  return Object.freeze({ key: `m06:${intent.intentId}:${suffix}`, owner: "m06.filesystem", predicate: "EXACT" as const, value, contractVersion: "m06-fs-post-v1" });
}

function expectedPost(intent: TransactionIntent, resolved: FilesystemResolvedIntent): string | undefined {
  return resolved.desiredFingerprint ?? intent.desiredFingerprint;
}

export function createFilesystemEffectAdapter(options: FilesystemEffectAdapterOptions): TransactionEffectPort {
  const states = new Map<string, IntentState>();

  return {
    checkPhysicalSafety: async (intent) => {
      const prepared = await prepareIntent(options, intent);
      if (!prepared.ok) return prepared;
      states.set(intent.intentId, prepared.value);
      return { ok: true, value: true };
    },

    captureRecovery: async (intent) => {
      const state = states.get(intent.intentId);
      if (state === undefined) return adapterError(intent, "safety_not_prepared", "Recovery capture requires a current physical-safety capability", "CAPABILITY");
      const captured = await options.physical.captureRecovery({ transactionId: options.transactionId, intent, target: state.target.path, ...(state.source === undefined ? {} : { source: state.source.path }) });
      return captured.ok ? { ok: true, value: captured.value.recoveryRef } : captured;
    },

    verifyRecoveryMaterial: async (request) => {
      if (request.transactionId !== options.transactionId) return adapterError(request.intent, "transaction_binding_mismatch", "Recovery material is bound to another transaction", "RECOVERY");
      return options.physical.verifyRecovery({
        transactionId: options.transactionId,
        intent: request.intent,
        recoveryRef: request.recoveryRef,
        ...(request.expectedPreFingerprint === undefined ? {} : { expectedPreFingerprint: request.expectedPreFingerprint }),
        ...(request.expectedPostFingerprint === undefined ? {} : { expectedPostFingerprint: request.expectedPostFingerprint }),
      });
    },

    stage: async (intent) => {
      const state = states.get(intent.intentId);
      if (state === undefined) return adapterError(intent, "safety_not_prepared", "Staging requires a current physical-safety capability", "CAPABILITY");
      const payloadRef = state.resolved.payloadRef ?? intent.payloadRef;
      const desiredFingerprint = expectedPost(intent, state.resolved);
      const staged = await options.physical.stage({
        transactionId: options.transactionId,
        intent,
        target: state.target.path,
        ...(state.source === undefined ? {} : { source: state.source.path }),
        ...(payloadRef === undefined ? {} : { payloadRef }),
        ...(desiredFingerprint === undefined ? {} : { desiredFingerprint }),
      });
      if (!staged.ok) return staged;
      states.set(intent.intentId, Object.freeze({ ...state, stage: staged.value }));
      return { ok: true, value: true };
    },

    verifyStaged: async (intent, obligations) => {
      const state = states.get(intent.intentId);
      if (state?.stage === undefined) return adapterError(intent, "stage_missing", "Staged verification requires transaction-private staged state", "VERIFICATION");
      const desiredFingerprint = expectedPost(intent, state.resolved);
      return options.physical.verifyStage({
        transactionId: options.transactionId,
        intent,
        stageRef: state.stage.stageRef,
        ...(desiredFingerprint === undefined ? {} : { desiredFingerprint }),
        obligations,
      });
    },

    revalidateCommitBarrier: async (plan: TransactionPlan) => {
      for (const intent of plan.intents) {
        const existing = states.get(intent.intentId);
        if (existing === undefined) return adapterError(intent, "missing_prepared_state", "Commit barrier is missing prepared physical state", "PRECONDITION");
        const refreshed = await prepareIntent(options, intent);
        if (!refreshed.ok) return refreshed;
        const sourceShapeChanged = (existing.source === undefined) !== (refreshed.value.source === undefined);
        const sourceChanged = existing.source !== undefined && refreshed.value.source !== undefined && !samePrepared(existing.source, refreshed.value.source);
        if (!samePrepared(existing.target, refreshed.value.target) || sourceShapeChanged || sourceChanged) return adapterError(intent, "stale_physical_state", "Filesystem identity or physical capability changed before the commit barrier", "PRECONDITION");
        states.set(intent.intentId, Object.freeze({ ...refreshed.value, ...(existing.stage === undefined ? {} : { stage: existing.stage }) }));
      }
      return { ok: true, value: true };
    },

    promote: async (intent) => {
      const state = states.get(intent.intentId);
      if (state?.stage === undefined) return adapterError(intent, "stage_missing", "Promotion requires verified transaction-private staged state", "EXECUTION");
      return options.physical.promote({ transactionId: options.transactionId, intent, target: state.target.path, ...(state.source === undefined ? {} : { source: state.source.path }), stageRef: state.stage.stageRef, capabilityRef: state.target.safety.capabilityRef });
    },

    verifyPostState: async (plan, applied: readonly AppliedIntentResult[], obligations: readonly VerificationObligation[]) => {
      const bindings: TransactionStateBinding[] = [];
      for (const result of applied) {
        const state = states.get(result.intentId);
        if (state === undefined) continue;
        const intent = plan.intents.find((candidate) => candidate.intentId === result.intentId);
        if (intent === undefined) continue;
        const relevant = obligations.filter((item) => item.targetRef === undefined || item.targetRef === intent.targetRef);
        const desiredFingerprint = expectedPost(intent, state.resolved);
        const verified = await options.physical.verifyPost({
          transactionId: options.transactionId,
          intent,
          target: state.target.path,
          ...(state.source === undefined ? {} : { source: state.source.path }),
          ...(desiredFingerprint === undefined ? {} : { desiredFingerprint }),
          obligations: relevant,
        });
        if (!verified.ok) return verified;
        const target = verified.value[0];
        if (target === undefined) return adapterError(intent, "post_state_missing", "Post-state verification did not observe the actual destination", "VERIFICATION");
        if (intent.kind === "REMOVE_MANAGED_ARTIFACT") {
          if (target.kind !== "ABSENT") return adapterError(intent, "remove_post_state_mismatch", "Removed target is still present after promotion", "VERIFICATION");
          bindings.push(stateBinding(intent, "target", "ABSENT"));
        } else {
          if (desiredFingerprint !== undefined && target.fingerprint !== desiredFingerprint) return adapterError(intent, "post_fingerprint_mismatch", "Actual destination does not match the admitted desired fingerprint", "VERIFICATION");
          bindings.push(stateBinding(intent, "target", target.fingerprint ?? target.identityToken ?? target.kind));
        }
        if (intent.kind === "MOVE_MANAGED_ARTIFACT") {
          const source = verified.value[1];
          if (source === undefined || source.kind !== "ABSENT") return adapterError(intent, "move_source_still_present", "Move source remains present after atomic promotion", "VERIFICATION");
          bindings.push(stateBinding(intent, "source", "ABSENT"));
        }
      }
      return { ok: true, value: Object.freeze(bindings) };
    },

    cleanup: (request) => options.physical.cleanup(request),

    restore: async (request) => {
      const resolved = options.resolver.resolve(request.intent);
      if (!resolved.ok) return resolved;
      let target: PreparedTarget;
      let source: PreparedTarget | undefined;
      const durable = resolved.value.requireCrashDurability ?? false;

      if (request.intent.kind === "CREATE_MANAGED_ARTIFACT") {
        const rollbackPath: FilesystemResolvedPath = Object.freeze({ ...resolved.value.target, expected: { ownershipRef: `m05:${request.intent.intentId}`, ...(request.expectedCurrentFingerprint === undefined ? {} : { expectedFingerprint: request.expectedCurrentFingerprint }) } });
        const prepared = await prepareTarget(options.physical, request.intent, rollbackPath, "REMOVE", undefined, durable, false);
        if (!prepared.ok) return prepared;
        target = prepared.value;
      } else if (request.intent.kind === "REMOVE_MANAGED_ARTIFACT") {
        const prepared = await prepareTarget(options.physical, request.intent, resolved.value.target, "CREATE", request.expectedPreFingerprint, durable, false);
        if (!prepared.ok) return prepared;
        target = prepared.value;
      } else if (request.intent.kind === "MOVE_MANAGED_ARTIFACT") {
        if (resolved.value.source === undefined) return adapterError(request.intent, "move_source_missing", "Move rollback requires both original endpoints", "RECOVERY");
        const currentDestination: FilesystemResolvedPath = Object.freeze({ ...resolved.value.target, expected: { ownershipRef: `m05:${request.intent.intentId}`, ...(request.expectedCurrentFingerprint === undefined ? {} : { expectedFingerprint: request.expectedCurrentFingerprint }) } });
        const preparedSource = await prepareTarget(options.physical, request.intent, currentDestination, "MOVE_SOURCE", undefined, durable, false);
        if (!preparedSource.ok) return preparedSource;
        const preparedDestination = await prepareTarget(options.physical, request.intent, resolved.value.source, "MOVE_DESTINATION", request.expectedPreFingerprint, durable, false);
        if (!preparedDestination.ok) return preparedDestination;
        target = preparedSource.value;
        source = preparedDestination.value;
      } else {
        const rollbackPath: FilesystemResolvedPath = Object.freeze({ ...resolved.value.target, expected: { ownershipRef: `m05:${request.intent.intentId}`, ...(request.expectedCurrentFingerprint === undefined ? {} : { expectedFingerprint: request.expectedCurrentFingerprint }) } });
        const prepared = await prepareTarget(options.physical, request.intent, rollbackPath, "RESTORE", request.expectedPreFingerprint, durable, false);
        if (!prepared.ok) return prepared;
        target = prepared.value;
      }

      return options.physical.restore({ transactionId: options.transactionId, intent: request.intent, recoveryRef: request.recoveryRef, target: target.path, ...(source === undefined ? {} : { source: source.path }), capabilityRef: target.safety.capabilityRef });
    },
  };
}
