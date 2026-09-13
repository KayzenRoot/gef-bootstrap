import type { ConfigDiagnostic, GefProjectConfigDocument } from "@gef-bootstrap/config";
import type {
  BindingStrength,
  ProjectIdentityAssessment,
  RemoteObservation,
  RepositoryIdentityProjection,
  RepositoryRemoteLocator,
  RepositoryResolution,
} from "@gef-bootstrap/project-identity";

export type ObservationStatus = "OBSERVED" | "NOT_PRESENT" | "UNAVAILABLE" | "MALFORMED" | "POLICY_REDACTED" | "UNKNOWN";

export interface ObservedValue<T> {
  readonly status: ObservationStatus;
  readonly value?: T;
  readonly reasonCode?: string;
}

export interface PreflightGap {
  readonly code: string;
  readonly owner: "M02" | "M03" | "M04" | "M16" | "M29" | "M30" | "M38" | "M51" | "EXTERNAL";
  readonly blocking: boolean;
  readonly remediationRef?: string;
}

export type EnvironmentFact = "platform" | "architecture" | "runtime" | "workingDirectory";
export interface RuntimeObservation { readonly family: string; readonly version: string }
export interface EnvironmentObservationRequest {
  readonly facts?: readonly EnvironmentFact[];
  readonly environmentKeys?: readonly string[];
  readonly allowedEnvironmentKeys?: readonly string[];
}
export interface EnvironmentObservation {
  readonly schemaVersion: 1;
  readonly platform?: ObservedValue<string>;
  readonly architecture?: ObservedValue<string>;
  readonly runtime?: ObservedValue<RuntimeObservation>;
  readonly workingDirectory?: ObservedValue<string>;
  readonly requestedEnvironment: Readonly<Record<string, ObservedValue<string>>>;
  readonly gaps: readonly PreflightGap[];
}
export interface EnvironmentObservationPort {
  platform(): string;
  architecture(): string;
  runtime(): RuntimeObservation;
  workingDirectory(): string;
  readEnvironment(key: string): string | undefined;
}

export type GitFactFamily = "repository" | "head" | "status" | "remotes";
export type RepositoryPresence = "PRESENT" | "ABSENT" | "INVALID" | "UNAVAILABLE";
export interface GitRepositoryObservation {
  readonly presence: RepositoryPresence;
  readonly root?: string;
  readonly reasonCode?: string;
}
export type GitHeadState = "BRANCH" | "DETACHED" | "UNBORN" | "UNAVAILABLE";
export interface GitHeadObservation {
  readonly state: GitHeadState;
  readonly branch?: string;
  readonly headOid?: string;
  readonly reasonCode?: string;
}
export interface GitStatusSummary {
  readonly staged: number;
  readonly unstaged: number;
  readonly untracked: number;
  readonly conflicted: number;
}
export interface GitStatusObservation {
  readonly summary: GitStatusSummary;
  readonly paths?: readonly string[];
  readonly reasonCode?: string;
}
export interface GitRemotesObservation {
  readonly remotes: readonly RemoteObservation[];
  readonly reasonCode?: string;
}
export interface GitObservationRequest {
  readonly startingDirectory: string;
  readonly facts: readonly GitFactFamily[];
  readonly statusDetail?: "SUMMARY" | "PATHS";
}
export interface GitObservation {
  readonly schemaVersion: 1;
  readonly repository?: GitRepositoryObservation;
  readonly head?: GitHeadObservation;
  readonly status?: GitStatusObservation;
  readonly remotes?: GitRemotesObservation;
  readonly gaps: readonly PreflightGap[];
}
export interface GitObservationPort {
  observeRepository(startingDirectory: string): Promise<GitRepositoryObservation> | GitRepositoryObservation;
  observeHead(repositoryRoot: string): Promise<GitHeadObservation> | GitHeadObservation;
  observeStatus(repositoryRoot: string, detail: "SUMMARY" | "PATHS"): Promise<GitStatusObservation> | GitStatusObservation;
  observeRemotes(repositoryRoot: string): Promise<GitRemotesObservation> | GitRemotesObservation;
}

export type AuthenticationStatus = "NOT_REQUIRED" | "AVAILABLE" | "MISSING" | "EXPIRED_OR_REJECTED" | "UNAVAILABLE" | "UNKNOWN";
export type ProviderCapabilityStatus = "AVAILABLE" | "MISSING_PERMISSION" | "NOT_SUPPORTED" | "NOT_OBSERVABLE_WITHOUT_ATTEMPT" | "AUTH_REQUIRED" | "PROVIDER_UNAVAILABLE" | "UNKNOWN";
export interface ProviderCapabilityResult { readonly capability: string; readonly status: ProviderCapabilityStatus; readonly reasonCode?: string }
export interface HostedRepositoryResult {
  readonly locator: RepositoryRemoteLocator;
  readonly stableRepositoryId?: string;
  readonly visibility?: "public" | "private" | "internal";
  readonly archived?: boolean;
  readonly fork?: boolean;
  readonly defaultBranch?: string;
  readonly authenticationStatus: AuthenticationStatus;
  readonly capabilities: readonly ProviderCapabilityResult[];
}
export interface HostedProfileRequest {
  readonly profileId: string;
  readonly expectedHost: string;
  readonly repository: RepositoryResolution;
  readonly capabilities?: readonly string[];
  readonly required?: boolean;
}
export type HostedReadiness = "READY" | "READY_WITH_GAPS" | "BLOCKED_AUTH" | "BLOCKED_PERMISSION" | "BLOCKED_IDENTITY" | "BLOCKED_PROVIDER" | "NOT_REQUIRED";
export interface HostedProfileObservation {
  readonly schemaVersion: 1;
  readonly profileId: string;
  readonly readiness: HostedReadiness;
  readonly repository?: HostedRepositoryResult;
  readonly gaps: readonly PreflightGap[];
}
export interface HostedProfilePort {
  observeRepository(input: {
    readonly profileId: string;
    readonly host: string;
    readonly locator: RepositoryRemoteLocator;
    readonly capabilities: readonly string[];
  }): Promise<HostedRepositoryResult> | HostedRepositoryResult;
}

export type ToolPresenceStatus = "FOUND" | "ABSENT" | "AMBIGUOUS" | "UNAVAILABLE";
export type ToolCompatibilityStatus = "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN" | "NOT_CHECKED";
export type ToolProbeStatus = "NOT_REQUIRED" | "SUCCEEDED" | "FAILED" | "TIMED_OUT" | "CANCELLED" | "UNOBSERVABLE";
export interface ToolDescriptor {
  readonly toolId: string;
  readonly source: "BUILTIN" | "PROFILE";
  readonly resolution:
    | { readonly kind: "PATH_NAME"; readonly executable: string }
    | { readonly kind: "TRUSTED_PATH"; readonly executable: string; readonly policyRef: string };
  readonly versionProbe?: { readonly argv: readonly string[]; readonly timeoutMs: number; readonly maxOutputBytes: number };
}
export interface ToolResolutionResult {
  readonly status: ToolPresenceStatus;
  readonly executableIdentity?: string;
  readonly executable?: string;
  readonly reasonCode?: string;
}
export interface ToolProbeSpec {
  readonly executable: string;
  readonly argv: readonly string[];
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly env: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
}
export interface ToolProbeResult {
  readonly status: Exclude<ToolProbeStatus, "NOT_REQUIRED" | "UNOBSERVABLE">;
  readonly exitCode?: number;
  readonly stdout: string;
  readonly stderr: string;
}
export interface ToolObservationPort {
  resolve(descriptor: ToolDescriptor): Promise<ToolResolutionResult> | ToolResolutionResult;
  probe(spec: ToolProbeSpec): Promise<ToolProbeResult> | ToolProbeResult;
}
export interface ToolCompatibilityPort {
  classify(toolId: string, observedVersion: string): ToolCompatibilityStatus;
}
export interface ToolObservationRequest {
  readonly descriptor: ToolDescriptor;
  readonly requireVersion?: boolean;
  readonly required?: boolean;
  readonly parseVersion?: (stdout: string, stderr: string) => string | null;
  readonly compatibility?: ToolCompatibilityPort;
  readonly signal?: AbortSignal;
}
export interface ToolObservation {
  readonly schemaVersion: 1;
  readonly toolId: string;
  readonly presence: ToolPresenceStatus;
  readonly executableIdentity?: string;
  readonly observedVersion?: string;
  readonly probeStatus: ToolProbeStatus;
  readonly compatibility: ToolCompatibilityStatus;
  readonly gaps: readonly PreflightGap[];
}

export interface ProjectConfigObservation {
  readonly status: "MISSING" | "VALID" | "INVALID";
  readonly document?: GefProjectConfigDocument;
  readonly fingerprint: string;
  readonly diagnostics: readonly ConfigDiagnostic[];
}
export type ProjectMode = "NEW_PROJECT" | "EXISTING_PROJECT" | "MODE_UNRESOLVED";
export type ProjectPreflightReadiness =
  | "READY"
  | "READY_WITH_GAPS"
  | "BLOCKED_PRECONDITION"
  | "BLOCKED_IDENTITY"
  | "BLOCKED_REPOSITORY"
  | "BLOCKED_PROVIDER"
  | "BLOCKED_TOOLCHAIN"
  | "BLOCKED_POLICY"
  | "BLOCKED_STALE"
  | "CANCELLED"
  | "TIMED_OUT";
export interface ExpectedStateBinding { readonly kind: string; readonly value: string }
export interface ProjectPreflightRequirements {
  readonly projectRoot: string;
  readonly mode?: ProjectMode;
  readonly requireProjectConfig?: boolean;
  readonly identityBindingStrength?: BindingStrength;
  readonly requireRepository?: boolean;
  readonly gitFacts?: readonly GitFactFamily[];
  readonly statusDetail?: "SUMMARY" | "PATHS";
  readonly environment?: EnvironmentObservationRequest;
  readonly hosted?: Omit<HostedProfileRequest, "repository">;
  readonly tools?: readonly ToolObservationRequest[];
  readonly expectedBindings?: readonly ExpectedStateBinding[];
  readonly diagnosticMode?: boolean;
}
export interface ProjectPreflightSnapshot {
  readonly schemaVersion: 1;
  readonly requirementFingerprint: string;
  readonly mode: ProjectMode;
  readonly projectConfig?: ProjectConfigObservation;
  readonly identity?: ProjectIdentityAssessment;
  readonly environment?: EnvironmentObservation;
  readonly git?: GitObservation;
  readonly repositoryResolution?: RepositoryResolution;
  readonly repositoryProjection?: RepositoryIdentityProjection;
  readonly hosted?: HostedProfileObservation;
  readonly tools: readonly ToolObservation[];
  readonly expectedStateBindings: readonly ExpectedStateBinding[];
  readonly gaps: readonly PreflightGap[];
  readonly readiness: ProjectPreflightReadiness;
  readonly counters: PreflightCountersSnapshot;
}

export interface RequirementDigestPort { readonly algorithm: string; digest(canonicalInput: string): string }
export interface PreflightCountersSnapshot {
  readonly environmentReads: Readonly<Record<string, number>>;
  readonly gitReads: Readonly<Record<string, number>>;
  readonly providerReads: number;
  readonly toolResolutions: Readonly<Record<string, number>>;
  readonly toolProbes: Readonly<Record<string, number>>;
  readonly cacheHits: number;
  readonly skippedByPrerequisite: number;
}
export interface MutablePreflightCounters {
  readonly environmentReads: Map<string, number>;
  readonly gitReads: Map<string, number>;
  providerReads: number;
  readonly toolResolutions: Map<string, number>;
  readonly toolProbes: Map<string, number>;
  cacheHits: number;
  skippedByPrerequisite: number;
}
