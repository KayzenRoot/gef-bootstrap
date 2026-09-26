# M36 S04 — Corrupted State
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **CSC36 Corruption Signal Classifier** distinguishes missing, malformed, digest mismatch, semantic conflict and unknown.
- **QST36 Quarantine State** isolates suspect state from trusted inputs.
- **RCS36 Recovery Candidate Selector** ranks only verifiable restore points, never guesses.
- **RIV36 Restore Integrity Validator** verifies restored state before activation.
- **RHR36 Recovery Handoff Receipt** immutable plan/result contract.
- **RLG36 Recovery Loop Guard** bounded attempts and cycle detection.

Corruption cannot be repaired by silently rewriting canonical truth. If no verified restore candidate exists, result is BLOCKED.