export const DECISION_SYSTEM_SCHEMA_VERSION = "1.0.0" as const;

export type DecisionStatus = "PROPOSED" | "FROZEN" | "SUPERSEDED" | "REJECTED" | "STALE";
export type AdrStatus = "PROPOSED" | "ACCEPTED" | "SUPERSEDED" | "REJECTED" | "STALE";
export interface SourceRef { id: string; fingerprint?: string }
export interface DecisionRecord {
  decisionId: string; domain: string; subjectKey: string; statement: string; rationale: string; owner: string;
  status: DecisionStatus; sourceRefs: readonly SourceRef[]; adrIds: readonly string[];
  supersedesDecisionIds: readonly string[]; consequences?: readonly string[];
}
export interface AdrRecord {
  adrId: string; title: string; status: AdrStatus; context: string; decision: string; consequences: readonly string[];
  decisionIds: readonly string[]; sourceRefs: readonly SourceRef[]; supersedesAdrIds: readonly string[]; supersededByAdrIds: readonly string[];
}
export interface DecisionLedger {
  schemaVersion: typeof DECISION_SYSTEM_SCHEMA_VERSION; ledgerId: string; decisions: readonly DecisionRecord[]; adrs: readonly AdrRecord[];
  lineageCoverage: "COMPLETE" | "INCOMPLETE";
}
export interface DecisionDiagnostic { code: string; message: string; ids?: readonly string[] }
export interface DecisionValidation { ok: boolean; diagnostics: readonly DecisionDiagnostic[] }
export interface TraversalOptions { maxNodes?: number; isCancelled?: () => boolean }

const decisionStatuses = new Set<DecisionStatus>(["PROPOSED","FROZEN","SUPERSEDED","REJECTED","STALE"]);
const adrStatuses = new Set<AdrStatus>(["PROPOSED","ACCEPTED","SUPERSEDED","REJECTED","STALE"]);
const badIds = new Set(["__proto__","prototype","constructor"]);
const validId = (v:unknown): v is string => typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(v) && !badIds.has(v);
const nonEmpty = (v:unknown): v is string => typeof v === "string" && v.trim().length > 0;
const stable = <T>(xs:readonly T[], key:(v:T)=>string) => [...xs].sort((a,b)=>key(a).localeCompare(key(b),"en"));
const copyRef = (r:SourceRef):SourceRef => Object.freeze({id:r.id,...(r.fingerprint?{fingerprint:r.fingerprint}:{})});
const subject = (d:DecisionRecord) => `${d.domain}\u0000${d.subjectKey}`;

export function validateDecisionLedger(input:unknown):DecisionValidation {
  const out:DecisionDiagnostic[]=[];
  if(!input||typeof input!=="object"||Array.isArray(input)) return {ok:false,diagnostics:Object.freeze([{code:"INVALID_LEDGER",message:"Ledger must be an object."}])};
  const l=input as Record<string,unknown>;
  if(l.schemaVersion!==DECISION_SYSTEM_SCHEMA_VERSION) out.push({code:"UNSUPPORTED_SCHEMA_VERSION",message:"Unsupported decision-system schema version."});
  if(!validId(l.ledgerId)) out.push({code:"INVALID_LEDGER_ID",message:"ledgerId is invalid."});
  if(!Array.isArray(l.decisions)||!Array.isArray(l.adrs)){out.push({code:"INVALID_COLLECTION",message:"decisions and adrs must be arrays."});return {ok:false,diagnostics:Object.freeze(out)};}
  const decisionIds=new Set<string>(); const adrIds=new Set<string>();
  for(const raw of l.decisions){
    if(!raw||typeof raw!=="object"||Array.isArray(raw)){out.push({code:"INVALID_DECISION",message:"Decision must be an object."});continue;}
    const d=raw as Record<string,unknown>;
    if(!validId(d.decisionId)||decisionIds.has(d.decisionId)){out.push({code:"DUPLICATE_OR_INVALID_DECISION_ID",message:"Decision ID invalid or duplicated."});} else decisionIds.add(d.decisionId);
    if(!nonEmpty(d.domain)||!nonEmpty(d.subjectKey)) out.push({code:"INVALID_DECISION_SUBJECT",message:"Decision domain and subjectKey are required."});
    if(!nonEmpty(d.statement)||!nonEmpty(d.rationale)||!nonEmpty(d.owner)) out.push({code:"INCOMPLETE_DECISION",message:"Decision statement, rationale and owner are required."});
    if(!decisionStatuses.has(d.status as DecisionStatus)) out.push({code:"INVALID_DECISION_STATUS",message:"Unknown decision status."});
    for(const k of ["sourceRefs","adrIds","supersedesDecisionIds"] as const) if(!Array.isArray(d[k])) out.push({code:"INVALID_DECISION_COLLECTION",message:`${k} must be an array.`});
  }
  for(const raw of l.adrs){
    if(!raw||typeof raw!=="object"||Array.isArray(raw)){out.push({code:"INVALID_ADR",message:"ADR must be an object."});continue;}
    const a=raw as Record<string,unknown>;
    if(!validId(a.adrId)||adrIds.has(a.adrId)){out.push({code:"DUPLICATE_OR_INVALID_ADR_ID",message:"ADR ID invalid or duplicated."});} else adrIds.add(a.adrId);
    if(!nonEmpty(a.title)||!nonEmpty(a.context)||!nonEmpty(a.decision)) out.push({code:"INCOMPLETE_ADR",message:"ADR title, context and decision are required."});
    if(!adrStatuses.has(a.status as AdrStatus)) out.push({code:"INVALID_ADR_STATUS",message:"Unknown ADR status."});
    for(const k of ["consequences","decisionIds","sourceRefs","supersedesAdrIds","supersededByAdrIds"] as const) if(!Array.isArray(a[k])) out.push({code:"INVALID_ADR_COLLECTION",message:`${k} must be an array.`});
  }
  const decisions=l.decisions as DecisionRecord[]; const adrs=l.adrs as AdrRecord[];
  for(const d of decisions){
    if(!Array.isArray(d.supersedesDecisionIds)||!Array.isArray(d.adrIds)) continue;
    for(const id of d.supersedesDecisionIds){
      const old=decisions.find(x=>x.decisionId===id); if(!old) out.push({code:"MISSING_SUPERSESSION_TARGET",message:"Decision supersession target missing.",ids:[d.decisionId,id]});
      else if(subject(old)!==subject(d)) out.push({code:"SUBJECT_MISMATCH_SUPERSESSION",message:"Decision supersession crosses subject without a governed migration bridge.",ids:[d.decisionId,id]});
    }
    for(const id of d.adrIds){const a=adrs.find(x=>x.adrId===id);if(!a)out.push({code:"MISSING_ADR",message:"Decision ADR link target missing.",ids:[d.decisionId,id]});else if(!a.decisionIds.includes(d.decisionId))out.push({code:"ADR_LINK_MISMATCH",message:"Decision↔ADR link is not bidirectional.",ids:[d.decisionId,id]});}
  }
  for(const a of adrs){
    if(!Array.isArray(a.decisionIds)||!Array.isArray(a.supersedesAdrIds)||!Array.isArray(a.supersededByAdrIds)) continue;
    for(const id of a.decisionIds){const d=decisions.find(x=>x.decisionId===id);if(!d)out.push({code:"MISSING_ADR_DECISION",message:"ADR references missing decision.",ids:[a.adrId,id]});else if(!d.adrIds.includes(a.adrId))out.push({code:"ADR_LINK_MISMATCH",message:"ADR↔decision link is not bidirectional.",ids:[a.adrId,id]});}
    for(const id of a.supersedesAdrIds){const old=adrs.find(x=>x.adrId===id);if(!old)out.push({code:"MISSING_ADR_SUPERSESSION_TARGET",message:"ADR supersession target missing.",ids:[a.adrId,id]});else if(!old.supersededByAdrIds.includes(a.adrId))out.push({code:"ADR_SUPERSESSION_ASYMMETRY",message:"ADR supersession relation must be bidirectional.",ids:[a.adrId,id]});}
  }
  return {ok:out.length===0,diagnostics:Object.freeze(out.map(x=>Object.freeze({...x,...(x.ids?{ids:Object.freeze([...x.ids])}:{})})))};
}

export function assertValidDecisionLedger(input:unknown):DecisionLedger {
  const r=validateDecisionLedger(input); if(!r.ok) throw new Error(`INVALID_DECISION_LEDGER:${r.diagnostics.map(x=>x.code).join(",")}`);
  const l=input as DecisionLedger;
  return Object.freeze({...l,
    decisions:Object.freeze(l.decisions.map(d=>Object.freeze({...d,sourceRefs:Object.freeze(d.sourceRefs.map(copyRef)),adrIds:Object.freeze([...d.adrIds]),supersedesDecisionIds:Object.freeze([...d.supersedesDecisionIds]),consequences:Object.freeze([...(d.consequences??[])])}))),
    adrs:Object.freeze(l.adrs.map(a=>Object.freeze({...a,consequences:Object.freeze([...a.consequences]),decisionIds:Object.freeze([...a.decisionIds]),sourceRefs:Object.freeze(a.sourceRefs.map(copyRef)),supersedesAdrIds:Object.freeze([...a.supersedesAdrIds]),supersededByAdrIds:Object.freeze([...a.supersededByAdrIds])})))
  });
}

export function decisionLedgerIndex(l:DecisionLedger){
  const groups=new Map<string,string[]>(); for(const d of l.decisions){const k=subject(d);const xs=groups.get(k)??[];xs.push(d.decisionId);groups.set(k,xs);}
  return Object.freeze([...groups].sort(([a],[b])=>a.localeCompare(b,"en")).map(([subjectKey,ids])=>Object.freeze({subject:subjectKey,decisionIds:Object.freeze(ids.sort())})));
}
export function decisionCapsule(l:DecisionLedger,id:string){
  const d=l.decisions.find(x=>x.decisionId===id);if(!d)throw new Error("DECISION_NOT_FOUND");
  return Object.freeze({decisionId:d.decisionId,domain:d.domain,subjectKey:d.subjectKey,status:d.status,statement:d.statement,rationale:d.rationale,owner:d.owner,sourceRefs:Object.freeze(stable(d.sourceRefs,r=>`${r.id}:${r.fingerprint??""}`).map(copyRef)),adrIds:Object.freeze([...d.adrIds].sort()),supersedesDecisionIds:Object.freeze([...d.supersedesDecisionIds].sort())});
}
export const decisionIdentitySealInput=(l:DecisionLedger,id:string)=>JSON.stringify(decisionCapsule(l,id));
export function adrIntegrityEnvelope(l:DecisionLedger,id:string){const a=l.adrs.find(x=>x.adrId===id);if(!a)throw new Error("ADR_NOT_FOUND");return Object.freeze({adrId:a.adrId,status:a.status,title:a.title,context:a.context,decision:a.decision,consequences:Object.freeze([...a.consequences]),decisionIds:Object.freeze([...a.decisionIds].sort()),sourceRefs:Object.freeze(stable(a.sourceRefs,r=>`${r.id}:${r.fingerprint??""}`).map(copyRef)),supersedesAdrIds:Object.freeze([...a.supersedesAdrIds].sort()),supersededByAdrIds:Object.freeze([...a.supersededByAdrIds].sort())});}
export function adrDeltaLens(before:AdrRecord,after:AdrRecord){return Object.freeze({decisionChanged:before.decision!==after.decision,contextChanged:before.context!==after.context,consequencesChanged:JSON.stringify([...before.consequences].sort())!==JSON.stringify([...after.consequences].sort()),representedDecisionsChanged:JSON.stringify([...before.decisionIds].sort())!==JSON.stringify([...after.decisionIds].sort()),supersessionChanged:JSON.stringify([...before.supersedesAdrIds].sort())!==JSON.stringify([...after.supersedesAdrIds].sort()),sourceBindingsChanged:JSON.stringify(stable(before.sourceRefs,r=>`${r.id}:${r.fingerprint??""}`))!==JSON.stringify(stable(after.sourceRefs,r=>`${r.id}:${r.fingerprint??""}`))});}

function lineageAdj(l:DecisionLedger){const m=new Map<string,string[]>();for(const d of l.decisions)m.set(d.decisionId,[]);for(const d of l.decisions)for(const old of d.supersedesDecisionIds){const xs=m.get(d.decisionId);if(xs)xs.push(old);}for(const xs of m.values())xs.sort();return m;}
export function validateDecisionLineage(l:DecisionLedger,opts:TraversalOptions={}){
  const max=opts.maxNodes??10000;if(l.decisions.length>max)return {ok:false as const,code:"BUDGET_EXCEEDED",cycle:Object.freeze([] as string[])};
  const adj=lineageAdj(l),state=new Map<string,number>(),stack:string[]=[];let cycle:string[]|null=null;
  const visit=(id:string):boolean=>{if(opts.isCancelled?.()){cycle=["CANCELLED"];return false;}const s=state.get(id)??0;if(s===1){const i=stack.indexOf(id);cycle=[...stack.slice(i),id];return false;}if(s===2)return true;state.set(id,1);stack.push(id);for(const n of adj.get(id)??[])if(!visit(n))return false;stack.pop();state.set(id,2);return true;};
  for(const id of [...adj.keys()].sort())if(!visit(id))return {ok:false as const,code:cycle?.[0]==="CANCELLED"?"CANCELLED":"LINEAGE_CYCLE",cycle:Object.freeze(cycle??[])};
  return {ok:true as const,code:"OK",cycle:Object.freeze([] as string[])};
}
export function supersessionClosure(l:DecisionLedger,id:string,opts:TraversalOptions={}){
  if(l.lineageCoverage==="INCOMPLETE")return Object.freeze({status:"UNKNOWN_COVERAGE" as const,decisionIds:Object.freeze([] as string[])});
  const max=opts.maxNodes??10000,adj=lineageAdj(l),seen=new Set<string>(),q=[id];while(q.length){if(opts.isCancelled?.())return Object.freeze({status:"CANCELLED" as const,decisionIds:Object.freeze([...seen].sort())});if(seen.size>=max)return Object.freeze({status:"BUDGET_EXCEEDED" as const,decisionIds:Object.freeze([...seen].sort())});const cur=q.shift()!;for(const n of adj.get(cur)??[])if(!seen.has(n)){seen.add(n);q.push(n);}}
  return Object.freeze({status:"EXACT" as const,decisionIds:Object.freeze([...seen].sort())});
}
function supersededIds(l:DecisionLedger,subjectKey:string){const set=new Set<string>();for(const d of l.decisions.filter(x=>subject(x)===subjectKey))for(const old of d.supersedesDecisionIds)set.add(old);return set;}
export function effectiveDecision(l:DecisionLedger,domain:string,subjectKey:string){
  if(l.lineageCoverage==="INCOMPLETE")return Object.freeze({status:"UNKNOWN" as const,decisionIds:Object.freeze([] as string[])});
  const key=`${domain}\u0000${subjectKey}`,lin=validateDecisionLineage(l);if(!lin.ok)return Object.freeze({status:"CONFLICT" as const,decisionIds:Object.freeze(lin.cycle)});
  const candidates=l.decisions.filter(d=>subject(d)===key&&d.status==="FROZEN"&&!supersededIds(l,key).has(d.decisionId)).map(d=>d.decisionId).sort();
  if(candidates.length===1)return Object.freeze({status:"RESOLVED" as const,decisionId:candidates[0]});
  if(candidates.length>1)return Object.freeze({status:"CONFLICT" as const,decisionIds:Object.freeze(candidates)});
  const stale=l.decisions.filter(d=>subject(d)===key&&d.status==="STALE"&&!supersededIds(l,key).has(d.decisionId)).map(d=>d.decisionId).sort();
  if(stale.length)return Object.freeze({status:"STALE" as const,decisionIds:Object.freeze(stale)});
  return Object.freeze({status:"NONE" as const,decisionIds:Object.freeze([] as string[])});
}
export function decisionConflicts(l:DecisionLedger){
  const found:{subject:string;code:string;decisionIds:readonly string[]}[]=[];for(const row of decisionLedgerIndex(l)){const [domain,subjectKey]=row.subject.split("\u0000");const r=effectiveDecision(l,domain,subjectKey);if(r.status==="CONFLICT")found.push({subject:row.subject,code:"PARALLEL_OR_INVALID_FROZEN_LINEAGE",decisionIds:Object.freeze([...(r.decisionIds??[])].sort())});}
  return Object.freeze(found.sort((a,b)=>a.subject.localeCompare(b.subject,"en")).map(x=>Object.freeze(x)));
}
export function decisionShadowSet(l:DecisionLedger,domain:string,subjectKey:string){const key=`${domain}\u0000${subjectKey}`;return Object.freeze([...supersededIds(l,key)].sort());}
export function conflictIsolation(l:DecisionLedger,domain:string,subjectKey:string){if(l.lineageCoverage==="INCOMPLETE")return Object.freeze({status:"CONSERVATIVE_WIDENING_REQUIRED" as const,usable:false});const r=effectiveDecision(l,domain,subjectKey);return Object.freeze({status:r.status,usable:r.status==="RESOLVED"});}

export function decisionFreezeCandidate(l:DecisionLedger,id:string){const d=l.decisions.find(x=>x.decisionId===id);if(!d)return {ready:false,diagnostics:Object.freeze(["DECISION_NOT_FOUND"])};const ds:string[]=[];if(!d.statement||!d.rationale||!d.owner)ds.push("INCOMPLETE_DECISION");if(d.status==="STALE"||d.status==="REJECTED"||d.status==="SUPERSEDED")ds.push("NON_FREEZABLE_STATUS");for(const a of d.adrIds){const adr=l.adrs.find(x=>x.adrId===a);if(!adr||!adr.decisionIds.includes(id))ds.push("ADR_LINK_MISMATCH");}const lin=validateDecisionLineage(l);if(!lin.ok)ds.push(lin.code);const eff=effectiveDecision(l,d.domain,d.subjectKey);if(eff.status==="CONFLICT"||eff.status==="UNKNOWN")ds.push(`SUBJECT_${eff.status}`);return {ready:ds.length===0,diagnostics:Object.freeze([...new Set(ds)].sort())};}
export function decisionStalenessVector(l:DecisionLedger,changedSourceId:string){const affected=l.decisions.filter(d=>d.sourceRefs.some(r=>r.id===changedSourceId)).map(d=>d.decisionId).sort();return Object.freeze({changedSourceId,affectedDecisionIds:Object.freeze(affected),status:l.lineageCoverage==="COMPLETE"?"EXACT":"CONSERVATIVE_WIDENING_REQUIRED" as const});}
export function frozenSnapshotGuard(before:DecisionRecord,after:DecisionRecord){if(before.status!=="FROZEN"||before.decisionId!==after.decisionId)return {valid:true,code:"NOT_SAME_FROZEN_SNAPSHOT" as const};const semantic=(d:DecisionRecord)=>JSON.stringify({decisionId:d.decisionId,domain:d.domain,subjectKey:d.subjectKey,statement:d.statement,rationale:d.rationale,owner:d.owner,sourceRefs:stable(d.sourceRefs,r=>`${r.id}:${r.fingerprint??""}`),adrIds:[...d.adrIds].sort(),supersedesDecisionIds:[...d.supersedesDecisionIds].sort(),consequences:[...(d.consequences??[])].sort()});return semantic(before)===semantic(after)?{valid:true,code:"UNCHANGED" as const}:{valid:false,code:"FROZEN_SEMANTIC_MUTATION" as const};}
export function frozenDecisionReceiptSeed(l:DecisionLedger,id:string){const c=decisionFreezeCandidate(l,id);const d=l.decisions.find(x=>x.decisionId===id);if(!d)throw new Error("DECISION_NOT_FOUND");return Object.freeze({schemaVersion:l.schemaVersion,ledgerId:l.ledgerId,decision:decisionCapsule(l,id),lineage:supersessionClosure(l,id),effective:effectiveDecision(l,d.domain,d.subjectKey),freezeReadiness:c.ready?"READY_CANDIDATE":"NOT_READY",diagnostics:c.diagnostics,authorityNotice:"DECISION_ELIGIBILITY_ONLY" as const});}
