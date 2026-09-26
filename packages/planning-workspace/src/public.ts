export const PLANNING_WORKSPACE_SCHEMA_VERSION = "1.0.0" as const;

export type PlanningStatus = "PLANNED" | "ACTIVE" | "FROZEN" | "REVIEWED" | "PROMOTED" | "BLOCKED" | "STALE" | "SUPERSEDED";
export type DependencyKind = "AREA_CONTAINS_MODULE" | "MODULE_CONTAINS_SESSION" | "REQUIRES_BEFORE" | "CONSUMES_CONTRACT" | "PRODUCES_FOR" | "INFORMATIONAL";

export interface SourceRef { id: string; fingerprint?: string }
export interface AreaRecord { areaId: string; name: string; ordinal: number; moduleIds: readonly string[]; status: PlanningStatus; sourceRefs?: readonly SourceRef[] }
export interface ModuleRecord { moduleId: string; areaId: string; name: string; ordinal: number; sessionIds: readonly string[]; classificationRef: string; status: PlanningStatus; sourceRefs?: readonly SourceRef[] }
export interface SessionRecord { sessionId: string; moduleId: string; title: string; ordinal: number; objective: string; status: PlanningStatus; sourceRefs: readonly SourceRef[]; dependencyIds: readonly string[]; openQuestionCount: number; stopCondition: string; decisionSummary?: string }
export interface DependencyRecord { dependencyId: string; fromId: string; toId: string; kind: DependencyKind; sourceRef?: SourceRef }
export interface PlanningWorkspace { schemaVersion: typeof PLANNING_WORKSPACE_SCHEMA_VERSION; workspaceId: string; areas: readonly AreaRecord[]; modules: readonly ModuleRecord[]; sessions: readonly SessionRecord[]; dependencies: readonly DependencyRecord[]; dependencyCoverage: "COMPLETE" | "INCOMPLETE" }
export interface PlanningDiagnostic { code: string; message: string; ids?: readonly string[] }
export interface ValidationResult { ok: boolean; diagnostics: readonly PlanningDiagnostic[] }
export interface TraversalOptions { maxNodes?: number; isCancelled?: () => boolean }

const statuses = new Set<PlanningStatus>(["PLANNED","ACTIVE","FROZEN","REVIEWED","PROMOTED","BLOCKED","STALE","SUPERSEDED"]);
const kinds = new Set<DependencyKind>(["AREA_CONTAINS_MODULE","MODULE_CONTAINS_SESSION","REQUIRES_BEFORE","CONSUMES_CONTRACT","PRODUCES_FOR","INFORMATIONAL"]);
const validId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(v) && !["__proto__","prototype","constructor"].includes(v);
const stable = <T>(values: readonly T[], key: (v:T)=>string) => [...values].sort((a,b)=>key(a).localeCompare(key(b),"en"));
const copyRef = (r: SourceRef): SourceRef => Object.freeze({id:r.id, ...(r.fingerprint ? {fingerprint:r.fingerprint}: {})});

export function validatePlanningWorkspace(input: unknown): ValidationResult {
  const d: PlanningDiagnostic[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) return {ok:false, diagnostics:Object.freeze([{code:"INVALID_WORKSPACE",message:"Workspace must be an object."}])};
  const w = input as Record<string, unknown>;
  if (w.schemaVersion !== PLANNING_WORKSPACE_SCHEMA_VERSION) d.push({code:"UNSUPPORTED_SCHEMA_VERSION",message:"Unsupported planning workspace schema version."});
  if (!validId(w.workspaceId)) d.push({code:"INVALID_WORKSPACE_ID",message:"workspaceId is invalid."});
  for (const k of ["areas","modules","sessions","dependencies"] as const) if (!Array.isArray(w[k])) d.push({code:"INVALID_COLLECTION",message:`${k} must be an array.`});
  if (d.length || !Array.isArray(w.areas) || !Array.isArray(w.modules) || !Array.isArray(w.sessions) || !Array.isArray(w.dependencies)) return {ok:false, diagnostics:Object.freeze(d)};
  const areas = w.areas as unknown[]; const modules = w.modules as unknown[]; const sessions = w.sessions as unknown[]; const deps = w.dependencies as unknown[];
  const areaIds = new Set<string>(); const moduleIds = new Set<string>(); const sessionIds = new Set<string>(); const depIds = new Set<string>();
  const ordArea = new Set<number>();
  for (const raw of areas) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) { d.push({code:"INVALID_AREA",message:"Area must be an object."}); continue; }
    const a=raw as Record<string,unknown>; if(!validId(a.areaId)||areaIds.has(a.areaId)){d.push({code:"DUPLICATE_OR_INVALID_AREA",message:"Area ID invalid or duplicated."});} else areaIds.add(a.areaId);
    if(typeof a.ordinal!=="number"||!Number.isSafeInteger(a.ordinal)||ordArea.has(a.ordinal as number)) d.push({code:"INVALID_AREA_ORDINAL",message:"Area ordinal must be a unique safe integer."}); else ordArea.add(a.ordinal as number);
    if(!statuses.has(a.status as PlanningStatus)) d.push({code:"INVALID_STATUS",message:"Unknown area status."});
    if(!Array.isArray(a.moduleIds)) d.push({code:"INVALID_AREA_MODULES",message:"Area moduleIds must be an array."});
  }
  for (const raw of modules) {
    if(!raw||typeof raw!=="object"||Array.isArray(raw)){d.push({code:"INVALID_MODULE",message:"Module must be an object."});continue;} const m=raw as Record<string,unknown>;
    if(!validId(m.moduleId)||moduleIds.has(m.moduleId)){d.push({code:"DUPLICATE_OR_INVALID_MODULE",message:"Module ID invalid or duplicated."});} else moduleIds.add(m.moduleId);
    if(!validId(m.areaId)||!areaIds.has(m.areaId)) d.push({code:"ORPHAN_MODULE",message:"Module area does not exist."});
    if(typeof m.ordinal!=="number"||!Number.isSafeInteger(m.ordinal)) d.push({code:"INVALID_MODULE_ORDINAL",message:"Module ordinal must be a safe integer."});
    if(!Array.isArray(m.sessionIds)) d.push({code:"INVALID_MODULE_SESSIONS",message:"Module sessionIds must be an array."});
    if(typeof m.classificationRef!=="string"||!m.classificationRef) d.push({code:"MISSING_CLASSIFICATION_REF",message:"Module classification must reference canonical Scope."});
    if(!statuses.has(m.status as PlanningStatus)) d.push({code:"INVALID_STATUS",message:"Unknown module status."});
  }
  for (const raw of sessions) {
    if(!raw||typeof raw!=="object"||Array.isArray(raw)){d.push({code:"INVALID_SESSION",message:"Session must be an object."});continue;} const s=raw as Record<string,unknown>;
    if(!validId(s.sessionId)||sessionIds.has(s.sessionId)){d.push({code:"DUPLICATE_OR_INVALID_SESSION",message:"Session ID invalid or duplicated."});} else sessionIds.add(s.sessionId);
    if(!validId(s.moduleId)||!moduleIds.has(s.moduleId)) d.push({code:"ORPHAN_SESSION",message:"Session module does not exist."});
    if(typeof s.ordinal!=="number"||!Number.isSafeInteger(s.ordinal)) d.push({code:"INVALID_SESSION_ORDINAL",message:"Session ordinal must be a safe integer."});
    if(typeof s.openQuestionCount!=="number"||!Number.isSafeInteger(s.openQuestionCount)||s.openQuestionCount<0) d.push({code:"INVALID_OPEN_QUESTIONS",message:"openQuestionCount must be a non-negative integer."});
    if(typeof s.stopCondition!=="string"||!s.stopCondition) d.push({code:"MISSING_STOP_CONDITION",message:"Session stop condition is required."});
    if(!statuses.has(s.status as PlanningStatus)) d.push({code:"INVALID_STATUS",message:"Unknown session status."});
  }
  const allIds = new Set([...areaIds,...moduleIds,...sessionIds]);
  for (const raw of deps) {
    if(!raw||typeof raw!=="object"||Array.isArray(raw)){d.push({code:"INVALID_DEPENDENCY",message:"Dependency must be an object."});continue;} const x=raw as Record<string,unknown>;
    if(!validId(x.dependencyId)||depIds.has(x.dependencyId)){d.push({code:"DUPLICATE_OR_INVALID_DEPENDENCY",message:"Dependency ID invalid or duplicated."});} else depIds.add(x.dependencyId);
    if(!validId(x.fromId)||!allIds.has(x.fromId)||!validId(x.toId)||!allIds.has(x.toId)) d.push({code:"MISSING_DEPENDENCY_ENDPOINT",message:"Dependency endpoint is missing."});
    if(!kinds.has(x.kind as DependencyKind)) d.push({code:"INVALID_DEPENDENCY_KIND",message:"Unknown dependency kind."});
  }
  for (const raw of areas as Record<string,unknown>[]) if(Array.isArray(raw.moduleIds)) for(const id of raw.moduleIds) if(typeof id!=="string"||!moduleIds.has(id)) d.push({code:"UNKNOWN_AREA_MODULE",message:"Area references an unknown module."});
  for (const raw of modules as Record<string,unknown>[]) if(Array.isArray(raw.sessionIds)) for(const id of raw.sessionIds) if(typeof id!=="string"||!sessionIds.has(id)) d.push({code:"UNKNOWN_MODULE_SESSION",message:"Module references an unknown session."});
  return {ok:d.length===0, diagnostics:Object.freeze(d.map(x=>Object.freeze({...x, ...(x.ids?{ids:Object.freeze([...x.ids])}:{})})))};
}

export function areaTopologyIndex(w: PlanningWorkspace) {
  return Object.freeze(stable(w.areas,a=>a.areaId).map(a=>Object.freeze({areaId:a.areaId, moduleIds:Object.freeze([...a.moduleIds].sort())})));
}
export function areaBoundarySealInput(w: PlanningWorkspace, areaId: string): string {
  const a=w.areas.find(x=>x.areaId===areaId); if(!a) throw new Error("AREA_NOT_FOUND");
  const refs=stable(a.sourceRefs??[],r=>`${r.id}:${r.fingerprint??""}`).map(copyRef);
  return JSON.stringify({schemaVersion:w.schemaVersion,workspaceId:w.workspaceId,areaId:a.areaId,ordinal:a.ordinal,moduleIds:[...a.moduleIds],sourceRefs:refs});
}
export function moduleContractFacet(w: PlanningWorkspace,moduleId:string){
  const m=w.modules.find(x=>x.moduleId===moduleId); if(!m) throw new Error("MODULE_NOT_FOUND");
  const dependencyIds=stable(w.dependencies.filter(x=>x.fromId===moduleId||x.toId===moduleId),x=>x.dependencyId).map(x=>x.dependencyId);
  return Object.freeze({moduleId:m.moduleId,areaId:m.areaId,classificationRef:m.classificationRef,sessionIds:Object.freeze([...m.sessionIds]),dependencyIds:Object.freeze(dependencyIds),sourceRefs:Object.freeze(stable(m.sourceRefs??[],r=>`${r.id}:${r.fingerprint??""}`).map(copyRef))});
}
export function sessionCapsule(w:PlanningWorkspace,sessionId:string){
  const s=w.sessions.find(x=>x.sessionId===sessionId); if(!s) throw new Error("SESSION_NOT_FOUND");
  return Object.freeze({sessionId:s.sessionId,moduleId:s.moduleId,objective:s.objective,status:s.status,sourceRefs:Object.freeze(stable(s.sourceRefs,r=>`${r.id}:${r.fingerprint??""}`).map(copyRef)),dependencyIds:Object.freeze([...s.dependencyIds].sort()),decisionSummary:s.decisionSummary??"",stopCondition:s.stopCondition});
}
export function freezeFingerprintInput(w:PlanningWorkspace,sessionId:string){return JSON.stringify(sessionCapsule(w,sessionId));}

function orderingAdjacency(w:PlanningWorkspace){const a=new Map<string,string[]>(); for(const id of [...w.modules.map(x=>x.moduleId),...w.sessions.map(x=>x.sessionId)])a.set(id,[]); for(const d of w.dependencies)if(d.kind==="REQUIRES_BEFORE"){const xs=a.get(d.fromId);if(xs)xs.push(d.toId);} for(const xs of a.values())xs.sort();return a;}
export function topologicalPlanningOrder(w:PlanningWorkspace,opts:TraversalOptions={}){
  const max=opts.maxNodes??10000; const a=orderingAdjacency(w); if(a.size>max) return {ok:false as const,code:"BUDGET_EXCEEDED",order:Object.freeze([] as string[])};
  const indegree=new Map<string,number>(); for(const id of a.keys())indegree.set(id,0); for(const xs of a.values())for(const to of xs)if(indegree.has(to))indegree.set(to,(indegree.get(to)??0)+1);
  const q=[...indegree].filter(([,n])=>n===0).map(([id])=>id).sort(); const out:string[]=[];
  while(q.length){if(opts.isCancelled?.())return {ok:false as const,code:"CANCELLED",order:Object.freeze(out)};const id=q.shift()!;out.push(id);for(const to of a.get(id)??[]){const n=(indegree.get(to)??1)-1;indegree.set(to,n);if(n===0){q.push(to);q.sort();}}}
  if(out.length!==indegree.size){const cycle=[...indegree].filter(([id,n])=>n>0&&!out.includes(id)).map(([id])=>id).sort();return {ok:false as const,code:"ORDERING_CYCLE",order:Object.freeze(out),cycle:Object.freeze(cycle)};}
  return {ok:true as const,code:"OK",order:Object.freeze(out)};
}
export function dependencyCutSet(w:PlanningWorkspace,changedId:string,opts:TraversalOptions={}){
  if(w.dependencyCoverage==="INCOMPLETE")return Object.freeze({status:"CONSERVATIVE_WIDENING_REQUIRED" as const,affected:Object.freeze([...new Set([...w.modules.map(x=>x.moduleId),...w.sessions.map(x=>x.sessionId)])].sort())});
  const max=opts.maxNodes??10000;const a=new Map<string,string[]>();for(const d of w.dependencies){if(d.kind==="INFORMATIONAL")continue;const xs=a.get(d.fromId)??[];xs.push(d.toId);a.set(d.fromId,xs);}const seen=new Set<string>();const q=[changedId];
  while(q.length){if(opts.isCancelled?.())return Object.freeze({status:"CANCELLED" as const,affected:Object.freeze([...seen].sort())});if(seen.size>=max)return Object.freeze({status:"BUDGET_EXCEEDED" as const,affected:Object.freeze([...seen].sort())});const id=q.shift()!;for(const to of (a.get(id)??[]).sort())if(!seen.has(to)){seen.add(to);q.push(to);}}
  return Object.freeze({status:"EXACT" as const,affected:Object.freeze([...seen].sort())});
}
export function criticalPlanningPathDepth(w:PlanningWorkspace){const topo=topologicalPlanningOrder(w);if(!topo.ok)return topo;const incoming=new Map<string,string[]>();for(const d of w.dependencies)if(d.kind==="REQUIRES_BEFORE"){const xs=incoming.get(d.toId)??[];xs.push(d.fromId);incoming.set(d.toId,xs);}const depth=new Map<string,number>();for(const id of topo.order)depth.set(id,Math.max(0,...(incoming.get(id)??[]).map(x=>(depth.get(x)??0)+1)));return {ok:true as const,depth:Object.freeze(Object.fromEntries([...depth].sort(([a],[b])=>a.localeCompare(b,"en"))))};}

const transitions:Record<PlanningStatus,readonly PlanningStatus[]>={PLANNED:["ACTIVE","BLOCKED","SUPERSEDED"],ACTIVE:["FROZEN","BLOCKED","STALE","SUPERSEDED"],FROZEN:["REVIEWED","STALE","SUPERSEDED"],REVIEWED:["PROMOTED","STALE","SUPERSEDED"],PROMOTED:["STALE","SUPERSEDED"],BLOCKED:["ACTIVE","SUPERSEDED"],STALE:["ACTIVE","SUPERSEDED"],SUPERSEDED:[]};
export function canTransitionPlanningStatus(from:PlanningStatus,to:PlanningStatus){return transitions[from].includes(to);}
export function sessionFreezeCandidate(w:PlanningWorkspace,sessionId:string){const s=w.sessions.find(x=>x.sessionId===sessionId);if(!s)return {ready:false,diagnostics:Object.freeze(["SESSION_NOT_FOUND"])};const ds:string[]=[];if(s.openQuestionCount!==0)ds.push("OPEN_QUESTIONS");if(!s.stopCondition)ds.push("MISSING_STOP_CONDITION");const knownPlanningIds=new Set<string>([...w.modules.map(x=>x.moduleId),...w.sessions.map(x=>x.sessionId)]);for(const id of s.dependencyIds)if(!w.dependencies.some(d=>d.dependencyId===id)&&!knownPlanningIds.has(id))ds.push("UNKNOWN_DEPENDENCY");if(s.status==="STALE"||s.status==="BLOCKED"||s.status==="SUPERSEDED")ds.push("NON_FREEZABLE_STATUS");return {ready:ds.length===0,diagnostics:Object.freeze(ds)};}
export function moduleFreezeCandidate(w:PlanningWorkspace,moduleId:string){const m=w.modules.find(x=>x.moduleId===moduleId);if(!m)return {ready:false,diagnostics:Object.freeze(["MODULE_NOT_FOUND"])};const ds:string[]=[];for(const sid of m.sessionIds){const s=w.sessions.find(x=>x.sessionId===sid);if(!s)ds.push(`MISSING_SESSION:${sid}`);else if(!["FROZEN","REVIEWED","PROMOTED"].includes(s.status))ds.push(`SESSION_NOT_FROZEN:${sid}`);}const topo=topologicalPlanningOrder(w);if(!topo.ok)ds.push(topo.code);return {ready:ds.length===0,diagnostics:Object.freeze(ds)};}
export function planningFreezeReceiptSeed(w:PlanningWorkspace,moduleId:string){const m=moduleFreezeCandidate(w,moduleId);return Object.freeze({schemaVersion:w.schemaVersion,workspaceId:w.workspaceId,moduleId,readiness:m.ready?"READY_CANDIDATE":"NOT_READY",diagnostics:m.diagnostics,facet:moduleContractFacet(w,moduleId),sessions:Object.freeze(w.modules.find(x=>x.moduleId===moduleId)?.sessionIds.map(id=>sessionCapsule(w,id))??[]),authorityNotice:"PLANNING_ONLY_NO_COMPLETION_AUTHORITY" as const});}

export function assertValidPlanningWorkspace(input:unknown):PlanningWorkspace{const r=validatePlanningWorkspace(input);if(!r.ok)throw new Error(`INVALID_PLANNING_WORKSPACE:${r.diagnostics.map(x=>x.code).join(",")}`);const w=input as PlanningWorkspace;return Object.freeze({...w,areas:Object.freeze(w.areas.map(a=>Object.freeze({...a,moduleIds:Object.freeze([...a.moduleIds]),sourceRefs:Object.freeze((a.sourceRefs??[]).map(copyRef))}))),modules:Object.freeze(w.modules.map(m=>Object.freeze({...m,sessionIds:Object.freeze([...m.sessionIds]),sourceRefs:Object.freeze((m.sourceRefs??[]).map(copyRef))}))),sessions:Object.freeze(w.sessions.map(s=>Object.freeze({...s,sourceRefs:Object.freeze(s.sourceRefs.map(copyRef)),dependencyIds:Object.freeze([...s.dependencyIds])}))),dependencies:Object.freeze(w.dependencies.map(d=>Object.freeze({...d,...(d.sourceRef?{sourceRef:copyRef(d.sourceRef)}:{})})))});}
