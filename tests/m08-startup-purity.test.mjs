import assert from "node:assert/strict";
import test from "node:test";

test("project-profiles import is startup-pure", async()=>{const before={cwd:process.cwd(),env:Object.keys(process.env).length};const mod=await import("../packages/project-profiles/dist/index.js");assert.equal(typeof mod.validateProfile,"function");assert.equal(process.cwd(),before.cwd);assert.equal(Object.keys(process.env).length,before.env);});
