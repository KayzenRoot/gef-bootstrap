import test from "node:test";
import assert from "node:assert/strict";
import {
  PLANNING_WORKSPACE_SCHEMA_VERSION, assertValidPlanningWorkspace, validatePlanningWorkspace,
  areaTopologyIndex, areaBoundarySealInput, moduleContractFacet, sessionCapsule, freezeFingerprintInput,
  topologicalPlanningOrder, dependencyCutSet, criticalPlanningPathDepth, canTransitionPlanningStatus,
  sessionFreezeCandidate, moduleFreezeCandidate, planningFreezeReceiptSeed
} from "../packages/planning-workspace/dist/public.js";

function workspace(overrides={}) {
  return {
    schemaVersion: PLANNING_WORKSPACE_SCHEMA_VERSION,
    workspaceId:"gef",
    areas:[{areaId:"C",name:"Source Pack & Planning",ordinal:3,moduleIds:["M10"],status:"FROZEN",sourceRefs:[{id:"scope",fingerprint:"abc"}]}],
    modules:[{moduleId:"M10",areaId:"C",name:"Planning Workspace",ordinal:10,sessionIds:["S1","S2"],classificationRef:"SCOPE:CORE_REQUIRED",status:"FROZEN",sourceRefs:[]}],
    sessions:[
      {sessionId:"S1",moduleId:"M10",title:"Areas",ordinal:1,objective:"areas",status:"FROZEN",sourceRefs:[],dependencyIds:[],openQuestionCount:0,stopCondition:"S1_DONE"},
      {sessionId:"S2",moduleId:"M10",title:"Modules",ordinal:2,objective:"modules",status:"FROZEN",sourceRefs:[],dependencyIds:["D1"],openQuestionCount:0,stopCondition:"S2_DONE"}
    ],
    dependencies:[{dependencyId:"D1",fromId:"S1",toId:"S2",kind:"REQUIRES_BEFORE"}],
    dependencyCoverage:"COMPLETE",
    ...overrides
  };
}

test("valid workspace is accepted and returned snapshots are frozen",()=>{const w=assertValidPlanningWorkspace(workspace());assert.equal(Object.isFrozen(w),true);assert.equal(validatePlanningWorkspace(w).ok,true);});
test("schema and duplicate IDs fail closed",()=>{const x=workspace();x.schemaVersion="9";x.areas.push({...x.areas[0]});const r=validatePlanningWorkspace(x);assert.equal(r.ok,false);assert.ok(r.diagnostics.some(d=>d.code==="UNSUPPORTED_SCHEMA_VERSION"));assert.ok(r.diagnostics.some(d=>d.code==="DUPLICATE_OR_INVALID_AREA"));});
test("orphan module/session and missing dependency endpoints are rejected",()=>{const x=workspace();x.modules[0].areaId="Z";x.sessions[0].moduleId="Z";x.dependencies[0].toId="NOPE";const r=validatePlanningWorkspace(x);assert.equal(r.ok,false);assert.ok(r.diagnostics.some(d=>d.code==="ORPHAN_MODULE"));assert.ok(r.diagnostics.some(d=>d.code==="ORPHAN_SESSION"));assert.ok(r.diagnostics.some(d=>d.code==="MISSING_DEPENDENCY_ENDPOINT"));});
test("area topology and boundary projection are deterministic",()=>{const w=assertValidPlanningWorkspace(workspace());assert.deepEqual(areaTopologyIndex(w),[{areaId:"C",moduleIds:["M10"]}]);assert.equal(areaBoundarySealInput(w,"C"),areaBoundarySealInput(w,"C"));});
test("module facet and session capsules preserve compact governed facts",()=>{const w=assertValidPlanningWorkspace(workspace());assert.equal(moduleContractFacet(w,"M10").classificationRef,"SCOPE:CORE_REQUIRED");assert.equal(sessionCapsule(w,"S1").stopCondition,"S1_DONE");assert.equal(freezeFingerprintInput(w,"S1"),freezeFingerprintInput(w,"S1"));});
test("ordering DAG is deterministic",()=>{const w=assertValidPlanningWorkspace(workspace());const r=topologicalPlanningOrder(w);assert.equal(r.ok,true);assert.ok(r.order.indexOf("S1")<r.order.indexOf("S2"));});
test("ordering cycle fails while informational cycle is ignored",()=>{const x=workspace();x.dependencies.push({dependencyId:"D2",fromId:"S2",toId:"S1",kind:"REQUIRES_BEFORE"});const cyc=topologicalPlanningOrder(assertValidPlanningWorkspace(x));assert.equal(cyc.ok,false);assert.equal(cyc.code,"ORDERING_CYCLE");const y=workspace();y.dependencies.push({dependencyId:"D2",fromId:"S2",toId:"S1",kind:"INFORMATIONAL"});assert.equal(topologicalPlanningOrder(assertValidPlanningWorkspace(y)).ok,true);});
test("dependency cut set is narrow when complete and widens conservatively when incomplete",()=>{const w=assertValidPlanningWorkspace(workspace());assert.deepEqual(dependencyCutSet(w,"S1").affected,["S2"]);const x=assertValidPlanningWorkspace(workspace({dependencyCoverage:"INCOMPLETE"}));const r=dependencyCutSet(x,"S1");assert.equal(r.status,"CONSERVATIVE_WIDENING_REQUIRED");assert.ok(r.affected.includes("M10"));});
test("traversal budget and cancellation are explicit",()=>{const w=assertValidPlanningWorkspace(workspace());assert.equal(topologicalPlanningOrder(w,{maxNodes:1}).code,"BUDGET_EXCEEDED");assert.equal(topologicalPlanningOrder(w,{isCancelled:()=>true}).code,"CANCELLED");});
test("critical planning path reports explanatory depth only",()=>{const w=assertValidPlanningWorkspace(workspace());const r=criticalPlanningPathDepth(w);assert.equal(r.ok,true);assert.equal(r.depth.S2,1);});
test("status monotonicity guard blocks optimistic jumps",()=>{assert.equal(canTransitionPlanningStatus("PLANNED","PROMOTED"),false);assert.equal(canTransitionPlanningStatus("FROZEN","REVIEWED"),true);assert.equal(canTransitionPlanningStatus("STALE","PROMOTED"),false);});
test("freeze candidates require closed questions and frozen module sessions",()=>{const w=assertValidPlanningWorkspace(workspace());assert.equal(sessionFreezeCandidate(w,"S1").ready,true);assert.equal(moduleFreezeCandidate(w,"M10").ready,true);const x=assertValidPlanningWorkspace(workspace({sessions:[{...workspace().sessions[0],openQuestionCount:1},workspace().sessions[1]]}));assert.equal(sessionFreezeCandidate(x,"S1").ready,false);});
test("freeze receipt explicitly has no completion authority",()=>{const w=assertValidPlanningWorkspace(workspace());const r=planningFreezeReceiptSeed(w,"M10");assert.equal(r.readiness,"READY_CANDIDATE");assert.equal(r.authorityNotice,"PLANNING_ONLY_NO_COMPLETION_AUTHORITY");assert.equal("moduleDone" in r,false);});
test("prototype-hostile IDs are rejected",()=>{const x=workspace();x.areas[0].areaId="__proto__";assert.equal(validatePlanningWorkspace(x).ok,false);});
