# GBS-M15-S03 — Guardrails, Validation & Rollback Compilation
Status: `FROZEN_CANDIDATE`

## Objective
Compile pre/postconditions and rollback obligations into executable instructions without owning policy semantics.

## Technologies
- **Guardrail Binding Table (GBT)**: binds M16 policy IDs to graph nodes.
- **Validation Closure Matrix (VCM)**: new NECESSARY technology maps each mutation to minimum required checks and evidence outputs.
- **Rollback Readiness Proof (RRP)**: new NECESSARY technology blocks destructive steps lacking an admissible rollback path.
- **Failure Containment Cell (FCC)**: new NECESSARY technology defines which downstream nodes are invalidated by a failed node.
- **Postcondition Evidence Slot (PES)**: new NECESSARY technology reserves typed proof outputs before execution.

M15 compiles rules, M16 owns policy decisions, M24+ owns evidence semantics, M36 owns recovery execution.

STOP CONDITION: `M15_S03_FROZEN_CANDIDATE`.