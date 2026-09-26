# Test Executor Guidance

Applies beneath `tests/` in addition to root `AGENTS.md`.

Tests are proof nodes. Preserve independent green proofs when their bound inputs remain unchanged. Add focused deterministic tests for the changed contract, including adversarial and fail-closed cases. Do not convert broad regression into a permanent inner-loop requirement when a narrower proof is sufficient for diagnosis, but always run the broader suites required at the Work Order acceptance boundary. Never weaken a valid test merely to make a change pass.