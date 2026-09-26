# M21 Progress Engine — Ledger Sync
Status: `FROZEN`
Module: `GBS-M21 — Progress Engine`
Frozen weight: `18`
Assurance intensity: `HIGH_ASSURANCE`

## Canonical basis
M00 requires progress to derive from approved scope/DoD/backlog rather than intuition. The frozen Backlog defines production credit as evidence-bound, grants full module weight only to `MODULE_DONE`, permits partial credit only for explicit admitted allocated sub-units with proof, and requires affected earned credit to be removed when evidence is invalidated.

## Frozen M21 mechanisms
- S01 authority/baseline: PBC21, DIM21, PAB21, CEG21, WCU21, SDB21, EAB21, DMW21.
- S02 calculation/rollup: WPV21, HPG21, ADCL21, PRE21, PCA21, PPP21, CCW21, PQP21.
- S03 invalidation/drift: PIV21, CRT21, PDS21, DDG21, SCQ21, CDG21, PSW21, PRR21.
- S04 snapshot/handoff: PSC21, PIR21, PSD21, PCE21, DPMH21, EBH21, SPH21, PSS21.

Total frozen M21 mechanisms: `32`.

## Ownership constraints
M21 calculates progress from admitted projections. It does not define scope/DoD (M12), promote checkpoints (M17), format final responses (M20), estimate ETA (M22), compute project status (M23), decide evidence/proof sufficiency (M24/M25/M27), collect telemetry (M43), or own baseline benchmarking (M45).

## HIGH_ASSURANCE additions
Compared with STANDARD_PLUS modules, M21 requires property-based conservation testing, an independent calculation oracle, graph/cycle/double-count attacks, denominator epoch mix-and-match tests, invalidation/retraction/replay tests, snapshot/handoff tamper tests, and explicit proof that legitimate progress decreases are preserved.

## Innovation policy
The 32 mechanisms are implementation obligations only after the M21 Work Order passes separate admission. Mechanism count does not itself earn production credit.

STOP CONDITION: `M21_LEDGER_SYNC_FROZEN`.
