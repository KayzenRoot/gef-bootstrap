# M37 S01 — Hashes
Status: FROZEN
Assurance: MAX_ASSURANCE

## Mechanisms
- **CDH37 Canonical Digest Harness** injected SHA-256 with domain separation.
- **CSE37 Canonical Serialization Engine** stable key/order/encoding rules.
- **MDR37 Merkle Digest Root** supports bounded verification of large state sets.
- **DVR37 Digest Version Registry** prevents algorithm/schema ambiguity.
- **HFG37 Hash Fail-closed Gate** rejects malformed/unsupported digests.
- **IDR37 Integrity Digest Receipt** binds namespace, schema, candidate and payload.

Hashes prove equality/integrity, not authority or trust. No ambient clock/fs/network in canonical digest generation.