export type TemplateResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: TemplateError };

export interface TemplateError {
  readonly code: string;
  readonly stage: "FORMAT" | "VARIABLES" | "CONDITIONS" | "RENDERING" | "VALIDATION" | "CONTROL";
  readonly summary: string;
  readonly ref?: string;
}

export interface DigestPort {
  digest(input: string | Uint8Array): string;
}

export interface TemplateReadControl {
  readonly signal?: AbortSignal;
  readonly deadlineMs?: number;
  readonly nowMs?: () => number;
}

export interface TemplateSourcePort {
  read(ref: string, control: TemplateReadControl): Promise<Uint8Array | null>;
}

export interface TemplateBudgets {
  readonly maxManifestBytes: number;
  readonly maxEntries: number;
  readonly maxSourceBytes: number;
  readonly maxAggregateSourceBytes: number;
  readonly maxMarkers: number;
  readonly maxMarkerLength: number;
  readonly maxNestingDepth: number;
  readonly maxVariables: number;
  readonly maxBindings: number;
  readonly maxValueBytes: number;
  readonly maxRenderedBytesPerEntry: number;
  readonly maxRenderedBytesTotal: number;
  readonly maxTargetBytes: number;
  readonly maxTargetComponents: number;
  readonly maxTargetComponentBytes: number;
  readonly maxEvidenceEntries: number;
}

export interface TemplateControl extends TemplateReadControl {
  readonly budgets: TemplateBudgets;
}

export type TemplateEntryKind = "TEXT_TEMPLATE" | "BINARY_COPY";
export type LineEndingPolicy = "PRESERVE_SOURCE" | "LF" | "CRLF";
export type VariableType = "STRING" | "BOOLEAN" | "INTEGER" | "ENUM";
export type VariableContext = "TEXT_CONTENT" | "TARGET_PATH_SEGMENT" | "CONDITION_REFERENCE";
export type VariableBindingSource = "PROFILE_BINDING" | "EXPLICIT_INPUT";
export type VariableValueClass = "PLAIN" | "SENSITIVE_REFERENCE";
export type ScalarValue = string | boolean | number;

export interface VariableDeclaration {
  readonly id: string;
  readonly type: VariableType;
  readonly required: boolean;
  readonly defaultValue?: ScalarValue;
  readonly enumValues?: readonly string[];
  readonly allowedBindingSources: readonly VariableBindingSource[];
  readonly allowedContexts: readonly VariableContext[];
  readonly valueClass: VariableValueClass;
}

export interface TemplateEntryDescriptor {
  readonly entryId: string;
  readonly kind: TemplateEntryKind;
  readonly sourceRef: string;
  readonly targetPattern: string;
  readonly lineEndings?: LineEndingPolicy;
  readonly sourceBytes: readonly number[];
  readonly sourceDigest: string;
  readonly tokens?: readonly TemplateToken[];
}

export type TemplateToken =
  | { readonly kind: "LITERAL"; readonly text: string }
  | { readonly kind: "VAR"; readonly id: string }
  | { readonly kind: "IF"; readonly id: string; readonly ordinal: number }
  | { readonly kind: "ELSE" }
  | { readonly kind: "END" }
  | { readonly kind: "LITERAL_OPEN" };

export interface TemplateDescriptor {
  readonly schemaVersion: 1;
  readonly templateContractVersion: "1.0";
  readonly templateId: string;
  readonly templateVersion: string;
  readonly entries: readonly TemplateEntryDescriptor[];
  readonly variables: readonly VariableDeclaration[];
  readonly sourceBundleDigest: string;
  readonly templateSemanticDigest: string;
}

export interface BindingCandidate {
  readonly id: string;
  readonly value: unknown;
  readonly sourceRef?: string;
  readonly classification?: "PLAIN" | "SECRET_MATERIAL";
}

export interface VariableBindingInput {
  readonly profile?: readonly BindingCandidate[];
  readonly explicit?: readonly BindingCandidate[];
}

export interface VariableResolutionEntry {
  readonly id: string;
  readonly type: VariableType;
  readonly status: "BOUND" | "UNBOUND_OPTIONAL";
  readonly source: "TEMPLATE_DEFAULT" | VariableBindingSource | "NONE";
  readonly value?: ScalarValue;
  readonly projection?: string;
  readonly valueClass: VariableValueClass;
  readonly allowedContexts: readonly VariableContext[];
  readonly provenanceRef?: string;
}

export interface VariableResolutionSnapshot {
  readonly templateSemanticDigest: string;
  readonly entries: readonly VariableResolutionEntry[];
  readonly variableValueDigest: string;
  readonly variableResolutionDigest: string;
}

export interface ConditionDecision {
  readonly conditionNodeId: string;
  readonly variableId: string;
  readonly evaluationStatus: "TRUE" | "FALSE" | "NOT_EVALUATED";
  readonly selectedBranch?: "PRIMARY" | "ALTERNATE" | "EMPTY";
}

export interface SelectedTemplateEntry {
  readonly entryId: string;
  readonly selectedTokens: readonly TemplateToken[];
  readonly decisions: readonly ConditionDecision[];
  readonly conditionTreeDigest: string;
}

export interface ConditionalSelectionSnapshot {
  readonly templateSemanticDigest: string;
  readonly variableValueDigest: string;
  readonly entries: readonly SelectedTemplateEntry[];
  readonly staticConditionRefs: readonly string[];
  readonly evaluatedConditionRefs: readonly string[];
  readonly conditionalDecisionDigest: string;
}

export interface RenderArtifact {
  readonly entryId: string;
  readonly kind: TemplateEntryKind;
  readonly logicalTarget: string;
  readonly renderedTargetDigest: string;
  readonly renderedContentDigest: string;
  readonly byteLength: number;
  readonly content: readonly number[];
}

export interface RenderSnapshot {
  readonly templateSemanticDigest: string;
  readonly variableValueDigest: string;
  readonly conditionalDecisionDigest: string;
  readonly artifacts: readonly RenderArtifact[];
  readonly renderSnapshotDigest: string;
  readonly gaps: readonly string[];
}

export interface DesiredArtifact {
  readonly entryId: string;
  readonly kind: TemplateEntryKind;
  readonly logicalTarget: string;
  readonly targetCollisionKey: string;
  readonly renderedTargetDigest: string;
  readonly renderedContentDigest: string;
  readonly byteLength: number;
  readonly contentRef: readonly number[];
}

export interface TemplateValidationSnapshot {
  readonly outcome: "VALIDATED_FOR_EFFECT_PLANNING" | "BLOCKED" | "INDETERMINATE";
  readonly renderSnapshotDigest: string;
  readonly artifacts: readonly DesiredArtifact[];
  readonly downstreamRequirements: readonly string[];
  readonly templateValidationDigest: string;
  readonly gaps: readonly string[];
}

export interface EvaluateTemplateInput {
  readonly bindings?: VariableBindingInput;
}

export interface EvaluateTemplateResult {
  readonly template: TemplateDescriptor;
  readonly variables: VariableResolutionSnapshot;
  readonly conditions: ConditionalSelectionSnapshot;
  readonly render: RenderSnapshot;
  readonly validation: TemplateValidationSnapshot;
}
