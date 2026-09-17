/**
 * Governed filesystem mutation for the CLI.
 *
 * The CLI does not mutate project-managed files directly. Every managed effect is applied
 * through the kernel transaction engine (`compileTransactionPlan` + `applyTransaction`) and
 * the filesystem effect adapter, which runs the full safety chain per intent:
 *
 *   authorizeFilesystemPath -> observe -> evaluateFilesystemOverwrite
 *     -> proveFilesystemTraversal -> atomicFacts -> composeFilesystemPhysicalSafety
 *     -> captureRecovery -> stage -> verifyStage -> revalidateCommitBarrier
 *     -> promote -> verifyPost -> cleanup
 *
 * This module supplies the two ports the kernel deliberately leaves to the caller for its
 * substrate: a `FilesystemIntentResolver` and a real `FilesystemPhysicalPort`. It does not
 * introduce a parallel transaction layer; the semantics (staging, commit barrier, exact
 * target binding, recovery and rollback) are supplied by the existing kernel mechanisms.
 *
 * Physical capability declarations are truthful: a managed CREATE uses a race-resistant
 * no-clobber exclusive create, so `noClobberCreate` and `raceResistant` are declared true
 * while `visibilityAtomic` is declared false.
 */

import { createHash, randomBytes } from "node:crypto";
import { link, lstat, mkdir, open, readFile, rename, rm, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { existsSync } from "node:fs";

import { PrivateAuthorityError, createPrivateArea, measureCaseSemantics, PRIVATE_DIRECTORY, PROBE_DIRECTORY, safeSegment } from "./private-authority.js";
import type { OwnedDirectory, PrivateArea } from "./private-authority.js";

import { loadEngines } from "./engines.js";

import type { GefError } from "@gef-bootstrap/contracts";
import {
  applyTransaction,
  authorizeFilesystemPath,
  compileTransactionPlan,
  composeFilesystemPhysicalSafety,
  createFilesystemEffectAdapter,
  evaluateFilesystemOverwrite,
  proveFilesystemTraversal,
} from "@gef-bootstrap/kernel";
import type {
  DigestPort,
  FilesystemEntryObservation,
  FilesystemExecutionContext,
  FilesystemIntentResolver,
  FilesystemPathCapsule,
  FilesystemPhysicalPort,
  FilesystemPrimitiveCapability,
  FilesystemResolvedIntent,
  FilesystemResult,
  TransactionIntent,
  TransactionPlan,
  TransactionPlanBody,
  TransactionAuthorizationPort,
  TransactionJournalPort,
  TransactionPorts,
  TransactionStatePort,
  VerificationObligation,
} from "@gef-bootstrap/kernel";

export const TRANSACTION_PRIVATE_DIRECTORY = PRIVATE_DIRECTORY;

const sha256 = (value: string | Uint8Array): string => createHash("sha256").update(value).digest("hex");

function ok<T>(value: T): FilesystemResult<T> {
  return { ok: true, value };
}

function portError(intent: TransactionIntent, reason: string, summary: string, category: "PRECONDITION" | "CAPABILITY" | "EXECUTION" | "VERIFICATION" | "RECOVERY" = "EXECUTION"): FilesystemResult<never> {
  return {
    ok: false,
    error: {
      schemaVersion: 1,
      id: `cli-tx-${reason}`,
      category,
      reasonCode: `gef.${category.toLowerCase()}.cli_transaction_${reason}`,
      severity: category === "RECOVERY" ? "CRITICAL" : "ERROR",
      summary,
      retryability: category === "RECOVERY" ? "REQUIRES_EFFECT_CHECK" : "NEVER",
      recoverability: category === "RECOVERY" ? "RECOVERY_REQUIRED" : "NONE_REQUIRED",
      effectStatus: "NONE",
      terminal: category === "RECOVERY" ? "RECOVERY_REQUIRED" : "BLOCKED",
      causes: [],
      evidenceRefs: [],
      remediations: [],
      metadata: { intentId: intent.intentId, intentKind: intent.kind },
    },
  };
}

// ---------------------------------------------------------------------------
// Observation
// ---------------------------------------------------------------------------

async function observeEntry(relativePath: string, physicalPath: string): Promise<FilesystemEntryObservation> {
  try {
    const info = await lstat(physicalPath);
    const kind = info.isSymbolicLink() ? "SYMLINK" : info.isFile() ? "FILE" : info.isDirectory() ? "DIRECTORY" : "SPECIAL";
    const base = {
      relativePath,
      kind,
      accessible: true,
      identityToken: `${String(info.dev)}:${String(info.ino)}`,
      filesystemId: String(info.dev),
      linkCount: Number(info.nlink),
    } as const;
    if (kind === "FILE") return { ...base, fingerprint: sha256(await readFile(physicalPath)) };
    return base;
  } catch (cause: unknown) {
    const code = cause !== null && typeof cause === "object" && "code" in cause ? String((cause as { readonly code: unknown }).code) : "";
    if (code === "ENOENT") return { relativePath, kind: "ABSENT", accessible: true };
    if (code === "EACCES" || code === "EPERM") return { relativePath, kind: "UNKNOWN", accessible: false };
    throw cause;
  }
}

async function observeChain(capsule: FilesystemPathCapsule) {
  const separator = capsule.pathFlavor === "WINDOWS" ? "\\" : "/";
  const components = capsule.normalizedRelativePath.split(separator).filter((part) => part.length > 0);
  const ancestors: FilesystemEntryObservation[] = [await observeEntry("", capsule.physicalRoot)];
  let current = capsule.physicalRoot;
  const prefix: string[] = [];
  for (const component of components.slice(0, -1)) {
    prefix.push(component);
    current = join(current, component);
    const observed = await observeEntry(prefix.join(separator), current);
    if (observed.kind === "ABSENT") break;
    ancestors.push(observed);
  }
  return { ancestors, target: await observeEntry(capsule.normalizedRelativePath, capsule.physicalTarget) };
}


// ---------------------------------------------------------------------------
// Capability probes
// ---------------------------------------------------------------------------
//
// A probe is a capability measurement, not a governed effect. Case semantics is measured
// read-only, because it is needed before the transaction authorization gate runs and no
// project-visible path may be created before that gate succeeds. Durability is probed after the
// gate, inside an invocation-owned directory of the private area, so it can never touch project
// content.
//
// The private area is containment- and alias-proven by `private-authority.ts`: a symlink or
// reparse point anywhere between the target root and the private path makes the measurement fail
// closed instead of redirecting a write outside the target.

const PROBE_ATTEMPTS = 8;

const caseSemanticsCache = new Map<string, "SENSITIVE" | "INSENSITIVE" | "UNKNOWN">();
const durabilityCache = new Map<string, "CRASH_DURABLE" | "UNPROVEN">();

/**
 * Measure filesystem case semantics without creating anything.
 *
 * Traversal proof refuses to run against ambiguous case semantics, so this is measured rather than
 * assumed. Ambiguity fails closed as `UNKNOWN`.
 */
export async function detectCaseSemantics(root: string): Promise<"SENSITIVE" | "INSENSITIVE" | "UNKNOWN"> {
  const cached = caseSemanticsCache.get(root);
  if (cached !== undefined) return cached;
  let semantics: "SENSITIVE" | "INSENSITIVE" | "UNKNOWN";
  try {
    semantics = await measureCaseSemantics(root);
  } catch {
    semantics = "UNKNOWN";
  }
  caseSemanticsCache.set(root, semantics);
  return semantics;
}

async function probeDurability(privateArea: PrivateArea): Promise<"CRASH_DURABLE" | "UNPROVEN"> {
  const cacheKey = privateArea.targetRoot;
  const cached = durabilityCache.get(cacheKey);
  if (cached !== undefined) return cached;
  let owned: OwnedDirectory;
  try {
    owned = await privateArea.createOwnedProbeDirectory();
  } catch (cause: unknown) {
    // A namespace conflict (alias, escape, non-directory) is a containment failure and must abort
    // the transaction; only an unprovable platform capability degrades to UNPROVEN.
    if (cause instanceof PrivateAuthorityError) throw cause;
    durabilityCache.set(cacheKey, "UNPROVEN");
    return "UNPROVEN";
  }
  const settle = (value: "CRASH_DURABLE" | "UNPROVEN"): "CRASH_DURABLE" | "UNPROVEN" => {
    durabilityCache.set(cacheKey, value);
    return value;
  };
  try {
    const file = join(owned.path, "durability-probe");
    await writeFile(file, "probe", { flag: "wx" });
    const handle = await open(file, "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      const directory = await open(owned.path, "r");
      try {
        await directory.sync();
      } finally {
        await directory.close();
      }
      return settle("CRASH_DURABLE");
    } catch {
      // Directory fsync is unavailable on some platforms; the platform is then classified
      // honestly rather than assumed durable.
      return settle("UNPROVEN");
    }
  } catch {
    return settle("UNPROVEN");
  } finally {
    await privateArea.releaseOwnedDirectory(owned, ["durability-probe"]).catch(() => undefined);
  }
}

export function cliPrimitiveFor(operation: "CREATE" | "UPDATE" | "REMOVE" | "MOVE_DESTINATION", durability: "CRASH_DURABLE" | "UNPROVEN"): FilesystemPrimitiveCapability {
  return {
    capabilityRef: `cli:${process.platform}:${operation}:v1`,
    operation,
    // An exclusive create is race-resistant and cannot clobber. It is deliberately NOT
    // declared visibility-atomic: the destination file becomes visible while being written.
    visibilityAtomic: false,
    raceResistant: true,
    noClobberCreate: true,
    replaceExisting: false,
    requiresSameFilesystem: false,
    durability,
  };
}

// ---------------------------------------------------------------------------
// Physical port
// ---------------------------------------------------------------------------

export interface PhysicalPortOptions {
  /** Absolute project root the CLI is authorized to mutate. */
  readonly targetRoot: string;
  readonly rootRef: string;
  /** payloadRef -> exact bytes to stage. */
  readonly payloads: ReadonlyMap<string, string>;
  /** Transaction identity used for the private staging area and the commit barrier. */
  readonly transactionId: string;
  /** Probed case semantics; traversal proof refuses to run while these are ambiguous. */
  readonly caseSemantics: "SENSITIVE" | "INSENSITIVE";
  /** Containment- and alias-proven private area for probes and staging. */
  readonly privateArea: PrivateArea;
  /** Authorization/policy reference recorded on the plan. */
  readonly policyRef: string;
}

interface PreparedIntent {
  readonly capsule: FilesystemPathCapsule;
  readonly durability: "CRASH_DURABLE" | "UNPROVEN";
  readonly stagePath: string;
  readonly desiredFingerprint?: string;
  readonly recoveryRef?: string;
}

export function createPhysicalPort(options: PhysicalPortOptions): FilesystemPhysicalPort {
  const prepared = new Map<string, PreparedIntent>();

  const rootDescriptor = {
    rootRef: options.rootRef,
    rootKind: "project-directory",
    physicalRoot: options.targetRoot,
    pathFlavor: (sep === "\\" ? "WINDOWS" : "POSIX") as "WINDOWS" | "POSIX",
    caseSemantics: options.caseSemantics,
    allowedOperations: ["READ", "CREATE", "STAGE"] as const,
    policyRef: options.policyRef,
    pathSemanticsRef: `cli:${process.platform}:v1`,
  };

  const requirePrepared = (intent: TransactionIntent): PreparedIntent | undefined => prepared.get(intent.intentId);

  return {
    async observe(path: FilesystemPathCapsule, _context: FilesystemExecutionContext) {
      void _context;
      return ok(await observeChain(path));
    },

    async atomicFacts(request) {
      let durability: "CRASH_DURABLE" | "UNPROVEN";
      try {
        durability = await probeDurability(options.privateArea);
      } catch (cause: unknown) {
        const reason = cause instanceof PrivateAuthorityError ? cause.reason : "UNAVAILABLE";
        return portError(request.intent, `private_authority_${reason.toLowerCase()}`, "The private transaction area is not safely contained by the target", "CAPABILITY");
      }
      let destination = request.path.physicalRoot;
      try {
        destination = (await stat(dirname(request.path.physicalTarget))).isDirectory() ? dirname(request.path.physicalTarget) : request.path.physicalRoot;
      } catch {
        destination = request.path.physicalRoot;
      }
      const staging = await options.privateArea.ensureStagingDirectory(options.transactionId);
      const destinationId = String((await stat(destination)).dev);
      const stagingId = String((await stat(staging)).dev);
      return ok({
        primitive: cliPrimitiveFor("CREATE", durability),
        stagingAuthorityRef: `${options.rootRef}:${PRIVATE_DIRECTORY}`,
        ...(stagingId === undefined ? {} : { stagingFilesystemId: stagingId }),
        ...(destinationId === undefined ? {} : { destinationFilesystemId: destinationId }),
      });
    },

    async captureRecovery(request) {
      const observed = await observeEntry(request.target.normalizedRelativePath, request.target.physicalTarget);
      if (observed.kind !== "ABSENT") {
        return portError(request.intent, "target_not_absent", "Managed creation requires an absent target; existing content is never overwritten", "PRECONDITION");
      }
      const recoveryRef = `cli-absent:${request.intent.intentId}:${request.transactionId}`;
      let durability: "CRASH_DURABLE" | "UNPROVEN";
      try {
        durability = await probeDurability(options.privateArea);
      } catch (cause: unknown) {
        const reason = cause instanceof PrivateAuthorityError ? cause.reason : "UNAVAILABLE";
        return portError(request.intent, `private_authority_${reason.toLowerCase()}`, "The private transaction area is not safely contained by the target", "CAPABILITY");
      }
      prepared.set(request.intent.intentId, {
        capsule: request.target,
        durability,
        stagePath: join(await options.privateArea.ensureStagingDirectory(request.transactionId), `${request.intent.intentId}.stage`),
        ...(request.intent.desiredFingerprint === undefined ? {} : { desiredFingerprint: request.intent.desiredFingerprint }),
        recoveryRef,
      });
      return ok({ recoveryRef });
    },

    async verifyRecovery(request) {
      const observed = await observeEntry("", request.recoveryRef.includes(":") ? options.targetRoot : options.targetRoot);
      void observed;
      const state = requirePrepared(request.intent);
      if (state === undefined) return portError(request.intent, "recovery_unprepared", "Recovery verification requires prepared transaction-private state", "RECOVERY");
      const target = await observeEntry(state.capsule.normalizedRelativePath, state.capsule.physicalTarget);
      if (target.kind !== "ABSENT") return portError(request.intent, "recovery_pre_state_changed", "Recorded recovery assumption (absent target) no longer holds", "RECOVERY");
      return ok(true);
    },

    async stage(request) {
      const state = requirePrepared(request.intent);
      if (state === undefined) return portError(request.intent, "safety_not_prepared", "Staging requires a current physical-safety capability", "CAPABILITY");
      const payloadRef = request.payloadRef ?? request.intent.payloadRef;
      const payload = payloadRef === undefined ? undefined : options.payloads.get(payloadRef);
      if (payload === undefined) return portError(request.intent, "payload_unavailable", "Staged payload is not available to the transaction", "CAPABILITY");
      await mkdir(dirname(state.stagePath), { recursive: true });
      await writeFile(state.stagePath, payload, { flag: "wx" });
      return ok({ stageRef: state.stagePath, fingerprint: sha256(payload) });
    },

    async verifyStage(request) {
      const state = requirePrepared(request.intent);
      if (state === undefined) return portError(request.intent, "stage_unprepared", "Staged verification requires prepared state", "VERIFICATION");
      let staged: Buffer;
      try {
        staged = await readFile(request.stageRef);
      } catch {
        return portError(request.intent, "stage_unreadable", "Staged content could not be read back", "VERIFICATION");
      }
      const observed = sha256(staged);
      if (request.desiredFingerprint !== undefined && observed !== request.desiredFingerprint) {
        return portError(request.intent, "stage_fingerprint_mismatch", "Staged content does not match the admitted desired fingerprint", "VERIFICATION");
      }
      for (const obligation of request.obligations as readonly VerificationObligation[]) void obligation;
      return ok(true);
    },

    async promote(request) {
      const state = requirePrepared(request.intent);
      if (state === undefined) return portError(request.intent, "promotion_unprepared", "Promotion requires prepared state", "EXECUTION");
      let staged: Buffer;
      try {
        staged = await readFile(request.stageRef);
      } catch {
        return portError(request.intent, "stage_missing", "Promotion requires staged content", "EXECUTION");
      }
      const separator = state.capsule.pathFlavor === "WINDOWS" ? "\\" : "/";
      const components = state.capsule.normalizedRelativePath.split(separator).filter((part) => part.length > 0);
      let current = state.capsule.physicalRoot;
      for (const component of components.slice(0, -1)) {
        current = join(current, component);
        await mkdir(current, { recursive: true });
      }
      // Race-resistant no-clobber create: `link` refuses an existing destination and makes the
      // entry visible fully formed; the exclusive-write fallback is equally no-clobber.
      let postFingerprint: string | undefined;
      try {
        await link(request.stageRef, state.capsule.physicalTarget);
        await unlink(request.stageRef).catch(() => undefined);
        postFingerprint = sha256(staged);
      } catch (cause: unknown) {
        const code = cause !== null && typeof cause === "object" && "code" in cause ? String((cause as { readonly code: unknown }).code) : "";
        if (code === "EEXIST") return portError(request.intent, "no_clobber_violation", "Destination exists; managed creation never overwrites", "PRECONDITION");
        let handle;
        try {
          handle = await open(state.capsule.physicalTarget, "wx");
          await handle.writeFile(staged);
          await handle.sync();
          if (durabilityRequired(state)) await syncDirectory(dirname(state.capsule.physicalTarget));
          postFingerprint = sha256(staged);
        } catch (writeCause: unknown) {
          const writeCode = writeCause !== null && typeof writeCause === "object" && "code" in writeCause ? String((writeCause as { readonly code: unknown }).code) : "";
          if (writeCode === "EEXIST") return portError(request.intent, "no_clobber_violation", "Destination exists; managed creation never overwrites", "PRECONDITION");
          return portError(request.intent, "promote_failed", `Managed creation failed at the destination: ${writeCode || "UNKNOWN"}`, "EXECUTION");
        } finally {
          if (handle !== undefined) await handle.close().catch(() => undefined);
        }
      }
      void rename;
      return ok(postFingerprint === undefined ? {} : { postFingerprint });
    },

    async verifyPost(request) {
      const state = requirePrepared(request.intent);
      if (state === undefined) return portError(request.intent, "post_state_unprepared", "Post-state verification requires prepared state", "VERIFICATION");
      const observations: FilesystemEntryObservation[] = [await observeEntry(state.capsule.normalizedRelativePath, state.capsule.physicalTarget)];
      const target = observations[0];
      if (target === undefined) return portError(request.intent, "post_state_missing", "Post-state observation failed", "VERIFICATION");
      if (request.desiredFingerprint !== undefined && target.fingerprint !== request.desiredFingerprint) {
        return portError(request.intent, "post_fingerprint_mismatch", "Destination content does not match the admitted desired fingerprint", "VERIFICATION");
      }
      return ok(observations);
    },

    async cleanup(request) {
      // Only the staged files this transaction wrote are named here; removal is non-recursive and
      // revalidates the directory identity, so an alias swap or foreign content is never deleted.
      const stagedFiles = [...prepared.values()].map((state) => state.stagePath.slice(state.stagePath.lastIndexOf(sep) + 1));
      await options.privateArea.releaseStagingDirectory(request.transactionId, stagedFiles).catch(() => undefined);
      return ok(true);
    },

    async restore(request) {
      const state = requirePrepared(request.intent);
      if (state === undefined) return portError(request.intent, "restore_unprepared", "Rollback requires prepared state", "RECOVERY");
      const observed = await observeEntry(state.capsule.normalizedRelativePath, state.capsule.physicalTarget);
      if (observed.kind === "ABSENT") return ok({});
      // Managed creation owns exactly the content whose fingerprint it promoted. Rollback
      // refuses to remove any other content, so a concurrent writer is never destroyed.
      if (state.recoveryRef === undefined) return portError(request.intent, "rollback_unowned", "Rollback refuses to remove content outside this transaction's ownership", "RECOVERY");
      if (state.desiredFingerprint === undefined || observed.fingerprint !== state.desiredFingerprint) {
        return portError(request.intent, "rollback_fingerprint_mismatch", "Rollback refuses to remove content it does not own", "RECOVERY");
      }
      await rm(state.capsule.physicalTarget, { force: true });
      return ok({});
    },
  };
}

function durabilityRequired(state: PreparedIntent): boolean {
  return state.durability === "CRASH_DURABLE";
}

async function syncDirectory(directory: string): Promise<void> {
  try {
    const handle = await open(directory, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch {
    // Directory fsync is unavailable on some platforms; the durability probe already
    // classified the platform, so this is not a silent downgrade.
  }
}


// ---------------------------------------------------------------------------
// Journal port
// ---------------------------------------------------------------------------

export const JOURNAL_DIRECTORY = `${PRIVATE_DIRECTORY}/journal`;

/**
 * File-backed transaction journal.
 *
 * The kernel requires durable journal evidence for a mutation transaction. The journal records
 * the transaction lifecycle (begin / update / finish) and survives `cleanup`, so recovery
 * evidence is inspectable after the run instead of being an in-memory artefact.
 */
export function createJournalPort(privateArea: PrivateArea): TransactionJournalPort {
  const persist = async (transactionId: string, phase: "BEGIN" | "UPDATE" | "FINISH" | "ROLLBACK", snapshot: unknown) => {
    // The journal path is containment- and alias-proven before the file is opened.
    const file = await privateArea.ensureJournalFile(transactionId);
    await writeFile(file, `${JSON.stringify({ schemaVersion: 1, kind: "gef.cli.transaction-journal", transactionId, phase, snapshot }, null, 2)}\n`, { flag: "w" });
    return ok(true as const);
  };
  const transactionIdOf = (snapshot: unknown): string => {
    const candidate = snapshot !== null && typeof snapshot === "object" ? (snapshot as { readonly transactionId?: unknown }).transactionId : undefined;
    return typeof candidate === "string" && candidate.length > 0 ? candidate : "unbound";
  };
  return {
    begin: (snapshot) => persist(transactionIdOf(snapshot), "BEGIN", snapshot),
    update: (snapshot) => persist(transactionIdOf(snapshot), "UPDATE", snapshot),
    finish: (snapshot) => persist(transactionIdOf(snapshot), "FINISH", snapshot),
    beginRollback: (snapshot) => persist(transactionIdOf(snapshot), "ROLLBACK", snapshot),
    updateRollback: (snapshot) => persist(transactionIdOf(snapshot), "ROLLBACK", snapshot),
    finishRollback: (snapshot) => persist(transactionIdOf(snapshot), "ROLLBACK", snapshot),
  };
}



// ---------------------------------------------------------------------------
// Authorization binding
// ---------------------------------------------------------------------------

export type MutationPurpose = "STATE_INIT" | "STATE_ADOPT" | "RECEIPT_INIT" | "RECEIPT_ADOPT";

export type MutationSurfaceMode = "EXACT" | "PREFIX";

/**
 * One deterministic authorization binding per admitted mutation command and purpose.
 *
 * A binding fixes which command may perform which mutation purpose, under which policy, with which
 * module owner, over which declared plan surface, and in which safety classification. It is the
 * only way a mutation transaction can be authorized: an unadmitted combination has no binding and
 * therefore cannot pass the gate, at the initial call or at the commit barrier.
 */
export interface AuthorizedMutationBinding {
  readonly commandId: string;
  readonly verb: "init" | "adopt";
  readonly purpose: MutationPurpose;
  readonly policyRef: string;
  readonly moduleOwner: string;
  readonly artifact: string;
  readonly surfaceMode: MutationSurfaceMode;
  /** Operation context the owning safety decision is evaluated in. */
  readonly classification: "MUTATING" | "REVERSIBLE";
}

export const ADMITTED_MUTATION_BINDINGS: readonly AuthorizedMutationBinding[] = Object.freeze([
  {
    commandId: "gef.init.run",
    verb: "init",
    purpose: "STATE_INIT",
    policyRef: "cli:init:managed-write:v1",
    moduleOwner: "m48-m54-maintenance",
    artifact: ".gef/init-state.json",
    surfaceMode: "EXACT",
    classification: "MUTATING",
  },
  {
    commandId: "gef.adopt.apply",
    verb: "adopt",
    purpose: "STATE_ADOPT",
    policyRef: "cli:adopt:managed-write:v1",
    moduleOwner: "security-reliability-integrations",
    artifact: ".gef/adopt-state.json",
    surfaceMode: "EXACT",
    classification: "MUTATING",
  },
  {
    // Receipt persistence has its own admitted purpose: it must not borrow a state-command
    // identity under an unrelated receipt policy.
    commandId: "gef.init.run",
    verb: "init",
    purpose: "RECEIPT_INIT",
    policyRef: "cli:receipt:managed-write:v1",
    moduleOwner: "cli.transport",
    artifact: ".gef/receipts/",
    surfaceMode: "PREFIX",
    classification: "REVERSIBLE",
  },
  {
    commandId: "gef.adopt.apply",
    verb: "adopt",
    purpose: "RECEIPT_ADOPT",
    policyRef: "cli:receipt:managed-write:v1",
    moduleOwner: "cli.transport",
    artifact: ".gef/receipts/",
    surfaceMode: "PREFIX",
    classification: "REVERSIBLE",
  },
]);

export function bindingAllowsSurface(binding: AuthorizedMutationBinding, surface: string): boolean {
  return binding.surfaceMode === "EXACT" ? surface === binding.artifact : surface.startsWith(binding.artifact);
}

export interface MutationBindingQuery {
  readonly commandId: string;
  readonly purpose: MutationPurpose;
  readonly policyRef: string;
  readonly moduleOwner: string;
  readonly surface: string;
}

/** Resolve the admitted binding for a claimed mutation, or `undefined` when none is admitted. */
export function resolveMutationBinding(query: MutationBindingQuery): AuthorizedMutationBinding | undefined {
  return ADMITTED_MUTATION_BINDINGS.find(
    (binding) =>
      binding.commandId === query.commandId &&
      binding.purpose === query.purpose &&
      binding.policyRef === query.policyRef &&
      binding.moduleOwner === query.moduleOwner &&
      bindingAllowsSurface(binding, query.surface),
  );
}

/** The binding a command/purpose pair is admitted under, or `undefined` when none is. */
export function bindingFor(commandId: string, purpose: MutationPurpose): AuthorizedMutationBinding | undefined {
  const candidates = ADMITTED_MUTATION_BINDINGS.filter((binding) => binding.commandId === commandId && binding.purpose === purpose);
  const [binding] = candidates;
  return candidates.length === 1 ? binding : undefined;
}

// ---------------------------------------------------------------------------
// Authorization port
// ---------------------------------------------------------------------------

export interface AuthorizationDecision {
  readonly authorized: boolean;
  readonly reason?: string;
}

export interface AuthorizationContext {
  /** The admitted binding this port authorizes. */
  readonly binding: AuthorizedMutationBinding;
  readonly runId: string;
  /** Absolute project root the transaction is bound to. */
  readonly targetRef: string;
  /**
   * Evaluates the owning authorization decision for the bound operation. Defaults to the verified
   * safety engine; a failure to obtain a decision is a denial, never an allow.
   */
  readonly decide?: (binding: AuthorizedMutationBinding) => Promise<AuthorizationDecision> | AuthorizationDecision;
  /** Revocation hook, re-evaluated on every authorization call including the commit barrier. */
  readonly isRevoked?: () => boolean;
}

function authorizationDenial(context: AuthorizationContext, reason: string, summary: string): GefError {
  return {
    schemaVersion: 1,
    id: `cli-authorization-${reason}`,
    category: "AUTHORIZATION",
    reasonCode: `gef.authorization.${reason}`,
    severity: "ERROR",
    summary,
    retryability: "REQUIRES_NEW_AUTHORIZATION",
    recoverability: "NONE_REQUIRED",
    effectStatus: "NONE",
    terminal: "BLOCKED",
    commandId: context.binding.commandId,
    runId: context.runId,
    targetRef: context.targetRef,
    causes: [],
    evidenceRefs: [],
    remediations: [],
    metadata: { policyRef: context.binding.policyRef, purpose: context.binding.purpose, reason },
  };
}

/**
 * Default decision: the verified safety engine must admit the mutation *in the bound operation
 * context*. A generic mutating classification is not enough — the binding decides which
 * classification the decision is evaluated under. Fails closed.
 */
async function safetyEngineDecision(binding: AuthorizedMutationBinding): Promise<AuthorizationDecision> {
  try {
    const engines = await loadEngines();
    const decision = engines.safetyDecision({ classification: binding.classification, blastRadius: "known", requested: "AUTO", restricted: false });
    if (decision.state !== "READY" || decision.confirmation === "FORBIDDEN") {
      return { authorized: false, reason: `safety_decision_${decision.state}_${decision.confirmation}` };
    }
    return { authorized: true };
  } catch (cause: unknown) {
    return { authorized: false, reason: `safety_engine_unavailable:${cause instanceof Error ? cause.message : String(cause)}` };
  }
}

/**
 * Real transaction authorization.
 *
 * The kernel calls this at the initial gate and again at the commit barrier. Every call is
 * re-evaluated: the binding (policy requirement, run, command, target) is re-checked against the
 * plan being applied and the owning decision is asked again, so an authorization that lapses
 * between staging and commit is refused with no target-visible effect. An unprovable decision is
 * a denial.
 */
export function createAuthorizationPort(context: AuthorizationContext): TransactionAuthorizationPort {
  const deny = (reason: string, summary: string) => ({ ok: false as const, error: authorizationDenial(context, reason, summary) });
  return {
    async authorize(request) {
      if (context.isRevoked?.() === true) return deny("revoked", "Authorization was revoked before the transaction committed");
      if (request.runId !== context.runId) return deny("run_mismatch", "Authorization is bound to a different run");
      const expected = context.binding;
      const refs = [...request.authorizationRefs];
      if (!refs.includes(expected.policyRef)) return deny("policy_not_admitted", "Authorization reference was not presented to the transaction");
      const declared = [...request.plan.authorizationRequirements];
      if (!declared.includes(expected.policyRef)) return deny("requirement_not_declared", "Transaction plan does not declare the admitted policy requirement");
      if (request.plan.targetBinding.targetRef !== `target:${context.targetRef}`) return deny("target_mismatch", "Transaction plan is bound to a different target");

      // The command/purpose/policy/owner/surface binding is re-derived from what the plan actually
      // declares, so a valid policy string paired with an unrelated command identity — or a state
      // command paired with a receipt policy — has no admitted binding and is refused.
      const surfaces = [...request.plan.mutationSurface];
      const owners = [...request.plan.expectedPreState].map((binding) => binding.owner);
      const [surface] = surfaces;
      if (surface === undefined || surfaces.length !== 1) return deny("binding_surface_ambiguous", "Transaction plan must declare exactly one mutation surface");
      const moduleOwner = owners[0];
      if (moduleOwner === undefined || owners.some((owner) => owner !== moduleOwner)) {
        return deny("binding_owner_ambiguous", "Transaction plan must declare exactly one module owner");
      }
      const resolved = resolveMutationBinding({
        commandId: expected.commandId,
        purpose: expected.purpose,
        policyRef: expected.policyRef,
        moduleOwner,
        surface,
      });
      if (resolved === undefined || resolved !== expected) {
        return deny(
          "binding_not_admitted",
          `No admitted authorization binding for ${expected.commandId}/${expected.purpose} over ${surface}`,
        );
      }
      if (request.plan.securityClass !== "S1_MANAGED_WRITE") return deny("binding_security_class", "Transaction plan security class is outside the admitted binding");

      let decision: AuthorizationDecision;
      try {
        decision = await (context.decide ?? safetyEngineDecision)(expected);
      } catch (cause: unknown) {
        return deny("decision_unavailable", `Authorization decision could not be proven: ${cause instanceof Error ? cause.message : String(cause)}`);
      }
      if (decision.authorized !== true) return deny("denied", `Authorization denied: ${decision.reason ?? "no reason supplied"}`);
      return { ok: true, value: true };
    },
  };
}

// ---------------------------------------------------------------------------
// Intent resolver and governed driver
// ---------------------------------------------------------------------------

export interface GovernedCreateRequest {
  readonly targetRoot: string;
  readonly relativePath: string;
  readonly content: string;
  readonly contentFingerprint: string;
  readonly runId: string;
  readonly transactionId: string;
  readonly policyRef: string;
  readonly moduleOwner: string;
  /** Command identity the authorization decision is bound to. */
  readonly commandId: string;
  /** Mutation purpose the authorization binding is resolved for. */
  readonly purpose: MutationPurpose;
}

export interface GovernedCreateOutcome {
  readonly ok: boolean;
  readonly outcome: string;
  readonly planDigest?: string;
  readonly receiptDigest?: string;
  readonly postFingerprint?: string;
  readonly error?: GefError;
}

function resolverFor(request: GovernedCreateRequest, caseSemantics: "SENSITIVE" | "INSENSITIVE", _privateArea: PrivateArea): FilesystemIntentResolver {
  void _privateArea;
  const root = {
    rootRef: `target:${request.targetRoot}`,
    rootKind: "project-directory",
    physicalRoot: request.targetRoot,
    pathFlavor: (sep === "\\" ? "WINDOWS" : "POSIX") as "WINDOWS" | "POSIX",
    caseSemantics,
    allowedOperations: ["READ", "CREATE", "STAGE"] as const,
    policyRef: request.policyRef,
    pathSemanticsRef: `cli:${process.platform}:v1`,
  };
  return {
    resolve(intent: TransactionIntent): FilesystemResult<FilesystemResolvedIntent> {
      return ok({
        target: { root, relativePath: request.relativePath, expected: { expectedKind: "ABSENT", allowAbsentNoop: false } },
        payloadRef: intent.payloadRef ?? request.relativePath,
        desiredFingerprint: request.contentFingerprint,
        requireCrashDurability: false,
      });
    },
  };
}

function planBodyFor(request: GovernedCreateRequest): TransactionPlanBody {
  // The managed artifact is the mutation target; the project directory is only the binding.
  // `mutationSurface` must list each intent target verbatim, so both use the managed ref.
  const managedRef = request.relativePath;
  return {
    schemaVersion: 1,
    planContractVersion: "1.0",
    targetBinding: { targetRef: `target:${request.targetRoot}`, bindingStrength: "OPERATIONAL_ONLY" },
    expectedPreState: [
      { key: managedRef, owner: request.moduleOwner, predicate: "EXACT", value: "absent", contractVersion: "cli-tx-v1" },
    ],
    securityClass: "S1_MANAGED_WRITE",
    authorizationRequirements: [request.policyRef],
    mutationSurface: [managedRef],
    intents: [
      {
        intentId: "i1",
        kind: "CREATE_MANAGED_ARTIFACT",
        targetRef: managedRef,
        securityClass: "S1_MANAGED_WRITE",
        recoveryClass: "REVERSIBLE_MANAGED",
        dependsOn: [],
        desiredFingerprint: request.contentFingerprint,
        payloadRef: request.relativePath,
      },
    ],
    ordering: [],
    verificationObligations: [
      { verificationId: "v1", phase: "STAGED", targetRef: managedRef },
      { verificationId: "v2", phase: "POST_STATE", targetRef: managedRef },
    ],
    recoveryRequirements: [{ intentId: "i1", recoveryClass: "REVERSIBLE_MANAGED", requirementRef: "cli-managed-create-v1" }],
    externalEffectDeclarations: [],
    policyRefs: [{ policyId: request.policyRef, version: "1" }],
  };
}

const CLIENT_DIGEST_PORT: DigestPort = { digest: (canonicalValue: string) => sha256(canonicalValue) };

/**
 * Pre-state observation port for a managed create.
 *
 * The pre-state binding is a real observation of the admitted target, so the kernel commit
 * barrier can detect a target that appeared or changed after planning.
 */
export function createStatePort(targetRoot: string, managedRef: string): TransactionStatePort {
  return {
    async observeBinding(binding) {
      if (binding.key !== managedRef && binding.key !== `target:${managedRef}`) return ok(undefined);
      // A real observation of the admitted target, so `revalidatePreState` can detect a target
      // that appeared or changed between planning and the commit barrier.
      const observed = await observeEntry(managedRef, join(targetRoot, managedRef));
      if (observed.kind === "ABSENT") return ok("absent");
      return ok(observed.fingerprint ?? observed.kind);
    },
    observeTargetFingerprint() {
      return ok(undefined);
    },
  };
}

/**
 * Apply one managed CREATE through the kernel transaction engine.
 *
 * The destination must be absent. The safety chain, staging, commit barrier, post-state
 * verification and receipt all come from the kernel; this function only wires the ports.
 */
function privateAuthorityFailure(cause: unknown, request: GovernedCreateRequest): GovernedCreateOutcome {
  const reason = cause instanceof PrivateAuthorityError ? cause.reason : "UNAVAILABLE";
  return {
    ok: false,
    outcome: "BLOCKED_BEFORE_EFFECT",
    error: {
      schemaVersion: 1,
      id: `cli-private-authority-${reason}`,
      category: "PRECONDITION",
      reasonCode: `gef.precondition.private_authority_${reason.toLowerCase()}`,
      severity: "ERROR",
      summary: "The private transaction area is not safely contained by the target",
      retryability: "MANUAL_ONLY",
      recoverability: "NONE_REQUIRED",
      effectStatus: "NONE",
      terminal: "BLOCKED",
      commandId: request.commandId,
      runId: request.runId,
      targetRef: request.targetRoot,
      causes: [],
      evidenceRefs: [],
      remediations: [],
      metadata: { reason, detail: cause instanceof Error ? cause.message : String(cause) },
    },
  };
}

export interface GovernedCreateOverrides {
  /** Test seam only: the production default is the real authorization port. */
  readonly authorization?: TransactionAuthorizationPort;
}

export async function applyGovernedCreate(request: GovernedCreateRequest, overrides?: GovernedCreateOverrides): Promise<GovernedCreateOutcome> {
  // Containment and alias proof for the private area, established before anything is created.
  const privateArea = createPrivateArea(request.targetRoot);
  try {
    await privateArea.assertContainment([PRIVATE_DIRECTORY]);
  } catch (cause: unknown) {
    return privateAuthorityFailure(cause, request);
  }

  // Read-only measurement: nothing project-visible is created before the authorization gate.
  const caseSemantics = await detectCaseSemantics(request.targetRoot);
  if (caseSemantics === "UNKNOWN") {
    return {
      ok: false,
      outcome: "BLOCKED_BEFORE_EFFECT",
      error: {
        schemaVersion: 1,
        id: "cli-tx-case-semantics-unknown",
        category: "CAPABILITY",
        reasonCode: "gef.capability.filesystem_case_semantics_unknown",
        severity: "ERROR",
        summary: "Filesystem case semantics could not be proven for the target root",
        retryability: "NEVER",
        recoverability: "NONE_REQUIRED",
        effectStatus: "NONE",
        terminal: "BLOCKED",
        causes: [],
        evidenceRefs: [],
        remediations: [],
        metadata: { targetRoot: request.targetRoot },
      },
    };
  }

  const body = planBodyFor(request);
  const compiled = compileTransactionPlan(body, CLIENT_DIGEST_PORT);
  if (!compiled.ok) return { ok: false, outcome: "BLOCKED_BEFORE_EFFECT", error: compiled.error };
  const plan = compiled.value;

  const payloads = new Map<string, string>([[request.relativePath, request.content]]);
  const effects = createFilesystemEffectAdapter({
    transactionId: request.transactionId,
    resolver: resolverFor(request, caseSemantics, privateArea),
    physical: createPhysicalPort({ targetRoot: request.targetRoot, rootRef: `target:${request.targetRoot}`, transactionId: request.transactionId, caseSemantics, privateArea, payloads, policyRef: request.policyRef }),
  });

  const binding = bindingFor(request.commandId, request.purpose);
  if (binding === undefined) {
    return {
      ok: false,
      outcome: "BLOCKED_BEFORE_EFFECT",
      error: {
        schemaVersion: 1,
        id: `cli-authorization-binding-${request.commandId}`,
        category: "AUTHORIZATION",
        reasonCode: "gef.authorization.binding_not_admitted",
        severity: "ERROR",
        summary: "No admitted authorization binding for this command and mutation purpose",
        retryability: "REQUIRES_NEW_AUTHORIZATION",
        recoverability: "NONE_REQUIRED",
        effectStatus: "NONE",
        terminal: "BLOCKED",
        commandId: request.commandId,
        runId: request.runId,
        targetRef: request.targetRoot,
        causes: [],
        evidenceRefs: [],
        remediations: [],
        metadata: { purpose: request.purpose },
      },
    };
  }
  const authorization =
    overrides?.authorization ?? createAuthorizationPort({ binding, runId: request.runId, targetRef: request.targetRoot });

  const ports: TransactionPorts = {
    digest: CLIENT_DIGEST_PORT,
    state: createStatePort(request.targetRoot, request.relativePath),
    authorization,
    journal: createJournalPort(privateArea),
    effects,
  };

  let result: Awaited<ReturnType<typeof applyTransaction>>;
  try {
    result = await applyTransaction({ plan, runId: request.runId, transactionId: request.transactionId, authorizationRefs: [binding.policyRef], ports });
  } catch (cause: unknown) {
    // A containment refusal raised by the private authority during journal or staging work is a
    // governed block, never an internal failure.
    if (cause instanceof PrivateAuthorityError) return privateAuthorityFailure(cause, request);
    throw cause;
  }
  if (!result.ok) return { ok: false, outcome: result.outcome, planDigest: plan.planDigest, ...(result.error === undefined ? {} : { error: result.error }) };
  const applied = result.receipt.appliedIntentResults.find((entry) => entry.intentId === "i1");
  return {
    ok: true,
    outcome: result.outcome,
    planDigest: result.receipt.planDigest,
    receiptDigest: result.receipt.receiptDigest,
    ...(applied?.postFingerprint === undefined ? {} : { postFingerprint: applied.postFingerprint }),
  };
}

/** Relative POSIX-style path of a physical path under the project root, for reporting. */
export function relativeRef(targetRoot: string, physicalPath: string): string {
  return relative(targetRoot, physicalPath).split(sep).join("/");
}
