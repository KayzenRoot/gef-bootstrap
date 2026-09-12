import test from "node:test";
import assert from "node:assert/strict";
import { CommandRegistry, KernelRuntime, projectExitCode } from "../packages/kernel/dist/index.js";

class FakeClock { constructor(now=1000){this.value=now;} nowMs(){return this.value;} }
class FakeIds { constructor(){this.count=0;} nextId(prefix){this.count+=1;return `${prefix}-${this.count}`;} }
const validateString=input=>typeof input==="string"?{ok:true,value:input}:{ok:false,reason:"expected string"};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test("mutation serialization spans handler verification and receipt",async()=>{
  const order=[];
  let activeEnvelope=0;
  let peakEnvelope=0;
  const registration={
    commandId:"gef.test.serial",
    contractVersion:"1",
    owner:"GBS-M01",
    mutation:true,
    validateInput:validateString,
    handler:async input=>{activeEnvelope+=1;peakEnvelope=Math.max(peakEnvelope,activeEnvelope);order.push(`handler:${input}`);await delay(5);return{ok:true,value:input,effectStatus:"CONFIRMED"};}
  };
  const runtime=new KernelRuntime(new CommandRegistry([registration]),{
    clock:new FakeClock(),
    ids:new FakeIds(),
    verification:{verify:async request=>{order.push(`verify:${request.value}`);await delay(10);return{ok:true};}},
    receipts:{write:async request=>{order.push(`receipt:${request.value}`);await delay(5);activeEnvelope-=1;return{ok:true,receiptRef:`receipt-${request.value}`};}}
  });
  const [a,b]=await Promise.all([
    runtime.execute({commandId:"gef.test.serial",contractVersion:"1",input:"a"}),
    runtime.execute({commandId:"gef.test.serial",contractVersion:"1",input:"b"})
  ]);
  assert.equal(a.ok&&b.ok,true);
  assert.equal(peakEnvelope,1);
  assert.deepEqual(order,["handler:a","verify:a","receipt:a","handler:b","verify:b","receipt:b"]);
});

test("cancellation after confirmed mutation effect requires recovery",async()=>{
  const controller=new AbortController();
  const registration={
    commandId:"gef.test.cancel-after-effect",
    contractVersion:"1",
    owner:"GBS-M01",
    mutation:true,
    validateInput:validateString,
    handler:input=>{controller.abort();return{ok:true,value:input,effectStatus:"CONFIRMED"};}
  };
  const runtime=new KernelRuntime(new CommandRegistry([registration]),{
    clock:new FakeClock(),
    ids:new FakeIds(),
    verification:{verify:()=>({ok:true})},
    receipts:{write:()=>({ok:true,receiptRef:"never"})}
  });
  const result=await runtime.execute({commandId:"gef.test.cancel-after-effect",contractVersion:"1",input:"x",signal:controller.signal});
  assert.equal(result.ok,false);
  assert.equal(result.lifecycle.terminal,"RECOVERY_REQUIRED");
  assert.equal(result.lifecycle.effectStatus,"CONFIRMED");
  assert.equal(projectExitCode(result),70);
});
