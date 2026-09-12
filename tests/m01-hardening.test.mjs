import test from "node:test";
import assert from "node:assert/strict";
import { CommandRegistry, KernelRuntime } from "../packages/kernel/dist/index.js";

class FakeClock { constructor(now=1000){this.value=now;} nowMs(){return this.value;} }
class FakeIds { constructor(){this.count=0;} nextId(prefix){this.count+=1;return `${prefix}-${this.count}`;} }
const validateString=input=>typeof input==="string"?{ok:true,value:input}:{ok:false,reason:"expected string"};
const registration=(overrides={})=>({commandId:"gef.test.hardening",contractVersion:"1",owner:"GBS-M01",validateInput:validateString,handler:input=>({ok:true,value:input}),...overrides});
const ports=overrides=>({clock:new FakeClock(),ids:new FakeIds(),...(overrides??{})});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test("runtime exposes injected identity and delegated ports to handler",async()=>{
  const delegated={environment:{values:{MODE:"test"}},filesystem:{kind:"filesystem"},git:{kind:"git"},provider:{kind:"provider"},derivedState:{kind:"derived-state"}};
  let seen;
  const runtime=new KernelRuntime(new CommandRegistry([registration({handler:(_input,context)=>{seen=context;return{ok:true,value:"ok"};}})]),ports(delegated),{
    identity:{productVersion:"1.2.3",nodeVersion:"v24-test",platform:"test-os",architecture:"test-arch",buildIdentity:"build-1"}
  });
  const result=await runtime.execute({commandId:"gef.test.hardening",contractVersion:"1",input:"x"});
  assert.equal(result.ok,true);
  assert.equal(seen.identity.productVersion,"1.2.3");
  assert.equal(seen.ports.environment.values.MODE,"test");
  assert.equal(seen.ports.git.kind,"git");
  assert.deepEqual(runtime.runtimeIdentity(),seen.identity);
});

test("read handlers obey maxConcurrentReads",async()=>{
  let active=0;
  let peak=0;
  const runtime=new KernelRuntime(new CommandRegistry([registration({handler:async input=>{active+=1;peak=Math.max(peak,active);await delay(20);active-=1;return{ok:true,value:input};}})]),ports(),{maxConcurrentReads:2});
  const results=await Promise.all(Array.from({length:6},(_,i)=>runtime.execute({commandId:"gef.test.hardening",contractVersion:"1",input:String(i)})));
  assert.equal(results.every(result=>result.ok),true);
  assert.equal(peak,2);
});

test("mutation handlers are serialized conservatively",async()=>{
  let active=0;
  let peak=0;
  const runtime=new KernelRuntime(new CommandRegistry([registration({mutation:true,handler:async input=>{active+=1;peak=Math.max(peak,active);await delay(15);active-=1;return{ok:true,value:input,effectStatus:"CONFIRMED"};}})]),ports({
    verification:{verify:()=>({ok:true})},
    receipts:{write:request=>({ok:true,receiptRef:`receipt-${request.runId}`})}
  }),{maxConcurrentReads:8});
  const results=await Promise.all(Array.from({length:4},(_,i)=>runtime.execute({commandId:"gef.test.hardening",contractVersion:"1",input:String(i)})));
  assert.equal(results.every(result=>result.ok),true);
  assert.equal(peak,1);
});

test("verification and receipt receive cancellation and deadline contracts",async()=>{
  const controller=new AbortController();
  let verifyRequest;
  let receiptRequest;
  const runtime=new KernelRuntime(new CommandRegistry([registration({mutation:true,handler:input=>({ok:true,value:input,effectStatus:"CONFIRMED"})})]),ports({
    verification:{verify:request=>{verifyRequest=request;return{ok:true};}},
    receipts:{write:request=>{receiptRequest=request;return{ok:true,receiptRef:"receipt-1"};}}
  }));
  const result=await runtime.execute({commandId:"gef.test.hardening",contractVersion:"1",input:"x",signal:controller.signal,deadlineMs:5000});
  assert.equal(result.ok,true);
  assert.equal(verifyRequest.signal,controller.signal);
  assert.equal(receiptRequest.signal,controller.signal);
  assert.equal(verifyRequest.deadlineMs,5000);
  assert.equal(receiptRequest.deadlineMs,5000);
});
