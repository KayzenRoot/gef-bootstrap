export type PackStatus='VALID'|'STALE_CONTEXT'|'STALE_POLICY'|'CAPABILITY_MISMATCH'|'GRAPH_INVALID'|'BLOCKED'|'INDETERMINATE';
export interface DigestPort{algorithm:'sha256';digest(input:string):string}
export interface Binding{projectId:string;sourcePackIdentity:string;profileIdentity:string;profileDigest:string;policyVersion:string;checkpointIdentity:string;capabilityIdentity:string}
export interface ContextReceipt extends Binding{contextIdentity:string;status:'VALID';semanticDigest:string}
export interface Instruction{instructionId:string;objective:string;targetFiles:readonly string[];dependsOn:readonly string[];mutationDomains:readonly string[];validationIds:readonly string[];rollbackPlan?:string;provenanceRefs:readonly string[]}
export interface ExecutorCapabilityContract{capabilityIdentity:string;capabilities:readonly string[];tools:readonly string[];maxParallelism:number}
export interface WorkNode extends Instruction{wave:number;critical:boolean}
export interface ValidationRequirement{validationId:string;command:string;scope:'FOCUSED'|'REGRESSION'|'SECURITY';covers:readonly string[]}
export interface CognitionBudget{maxReads:number;maxSearches:number;maxToolCalls:number;maxAmbiguityBranches:number}
export interface ToolInvocation{tool:string;purpose:string;afterNodeIds:readonly string[]}
export interface ExecutionPack extends Binding{packId:string;contextIdentity:string;instructions:readonly Instruction[];workDag:readonly WorkNode[];criticalPath:readonly string[];safeParallelWaves:readonly (readonly string[])[];validations:readonly ValidationRequirement[];readOnceIndex:Readonly<Record<string,readonly string[]>>;negativeSearchLedger:readonly string[];toolBlueprint:readonly ToolInvocation[];cognitionBudget:CognitionBudget;noDiscoveryBoundary:readonly string[];guardrailBindings:readonly string[];evidenceSlots:readonly string[];semanticDigest:string}
export interface PackReceipt{packId:string;status:PackStatus;semanticDigest:string;diagnostics:readonly string[];replayable:boolean}
