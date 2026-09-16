# GBS-M63-S02 — Repository Discovery and I/O Minimization

Status: `OWNER_DIRECTIVE_SEED_NOT_FROZEN`
Module: `GBS-M63 — Executor Performance Engine`
Source directive: `ADR-0002`

## Planning objective
Compile governed planning into a repository-local **Implementation Seed Tree** and exact **Executor Navigation Map** so heavy executors begin from known structure instead of scanning the repository broadly.

## Owner-directed technology candidates
- TECH-0045 Planning-to-Execution Seed Compiler (PESC);
- TECH-0046 Implementation Seed Tree (IST);
- TECH-0047 File Intent Capsule (FIC);
- TECH-0048 Brownfield Patch Intent Capsule (BPIC);
- TECH-0049 Executor Navigation Map (ENM);
- TECH-0051 Search Suppression Envelope (SSE);
- TECH-0054 Compilation-Safe Seed Gate (CSSG);
- TECH-0060 Seed Drift Sentinel (SDS).

## New-project behavior
When planning is sufficiently resolved, GEF should be able to materialize:
- planned directories;
- new source files with safe signatures/types/interfaces;
- test skeletons with named proof cases;
- module exports/indexes where architecture requires them;
- config/schema skeletons whose semantics are already frozen;
- compact sidecar/manifests for exact executor navigation.

Seed code must be compile-safe or explicitly inactive until an activation gate.

## Brownfield behavior
- never rewrite healthy existing files merely to create a seed;
- create new planned files only when safe;
- represent existing-file edits as BPIC with exact target fingerprint, symbols/regions, intended contract and preservation rules;
- invalidate BPIC when the current target fingerprint moves;
- preserve unrelated project architecture and naming unless a governed migration owns the change.

## Executor Navigation Map
ENM must expose at least:
- MUST_READ;
- READ_IF_TRIGGERED;
- WRITE_ALLOWED;
- WRITE_FORBIDDEN;
- symbol/dependency map;
- relevant tests;
- canonical decision/source IDs;
- known negative searches/capability gaps;
- expansion triggers.

## Search suppression
Broad search is an escalation path, not an executor ritual. Expansion is allowed only for concrete triggers such as missing symbols, stale bindings, unknown dependencies, compiler contradiction, unexpected brownfield structure or assurance requirement.

## Seed-drift behavior
Seed/navigation assumptions classify drift as `NONE`, `LOCAL_COMPATIBLE`, `SEED_RECOMPILE_REQUIRED`, `CONTEXT_EXPANSION_REQUIRED` or `CONFLICT`.

## Required future attacks
Moved/renamed file, existing brownfield file changed after planning, stale symbol target, seed compilation failure, orphan dependency, hidden generated file, platform-specific path, forbidden write attempt, broad-search request without trigger and tampered navigation map.

This file grants no M63 implementation authority.
