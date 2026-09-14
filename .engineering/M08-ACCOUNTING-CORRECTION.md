# M08 Production Accounting Correction

Status: `CORRECTION_READY_FOR_AUDIT`

## Defect
The M08 completion checkpoint credited `14` production weight, but the frozen Backlog Baseline assigns `17` to `M08 Project Profiles`. Weight `14` belongs to M07.

## Canonical calculation
Completed-module weights M00-M08:

`16 + 20 + 17 + 17 + 17 + 20 + 18 + 14 + 17 = 156`

Therefore:
- denominator: `1088` unchanged;
- earned: `156`;
- remaining: `932`;
- completion: `156 / 1088 = 14.338235...%`, canonical rounded `14.34%`;
- remaining: `85.66%`;
- M08 earned: `17 / 17`;
- M09 earned: `0 / 19` during planning.

## Impact
This is an accounting correction only. M08 implementation evidence, semantic approval, merge, MODULE_DONE status and M09 planning semantics remain valid. No scope, denominator, implementation or assurance obligation changes.

## Cause classification
Checkpoint promotion copied M07's weight (`14`) into M08 accounting instead of reading M08's frozen Backlog weight (`17`). Future promotion gates must bind module weight directly to the Backlog Baseline row before calculating production progress.

STOP CONDITION: exact-head audit required before correction promotion.