import test from 'node:test';import assert from 'node:assert/strict';import {helpIndex,installPlan,upgradePreview,compatibility,doctor,repairSuggestion,invariantResult,tempRepoSpec} from '../packages/m48-m54-maintenance/src/index.mjs';
test('help deterministic',()=>assert.deepEqual(helpIndex([{id:'z',summary:'Z'},{id:'a',summary:'A'}]).map(x=>x.id),['a','z']));
test('install platform fail closed and transactional',()=>{assert.equal(installPlan({platform:'x'}).state,'UNSUPPORTED');assert.deepEqual(installPlan({platform:'linux',target:'u',version:'1'}).phases,['PRECHECK','STAGE','VERIFY','COMMIT'])});
test('upgrade preview is no-op or digest bound',()=>{assert.equal(upgradePreview('1','1').state,'NOOP');assert.equal(upgradePreview('1','2',['m']).state,'READY')});
test('compatibility and doctor preserve failure unknown',()=>{assert.equal(compatibility({node:22},{node:20}).state,'UNSUPPORTED');assert.equal(doctor({git:undefined})[0].state,'UNKNOWN')});
test('repair is not automatic by default',()=>assert.equal(repairSuggestion('X').automatic,false));
test('invariant and sandbox safety',()=>{assert.equal(invariantResult('x',{a:1},{a:1}).pass,true);assert.throws(()=>tempRepoSpec('../host'),/INVALID_SANDBOX_NAME/);assert.equal(tempRepoSpec('safe').isolated,true)});
