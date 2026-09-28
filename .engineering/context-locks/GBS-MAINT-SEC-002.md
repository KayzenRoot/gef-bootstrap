# Context Lock — GBS-MAINT-SEC-002

Status: LOCKED at admission.

- Repository: `KayzenRoot/gef-bootstrap`.
- Base/main: `3c4455a080055fb65fee7d7021b72c3d40c5ae52`.
- Base tree: `bc5610767b6a533cc79546c211db1c6a15335034`.
- Branch: `gbs/maint/sec-002-pipeline-integrity`.
- Frozen production checkpoint remains `GBS_V1_PRODUCTION_ACCEPTED_1088_OF_1088`.
- Key source blobs at admission:
  - `.github/workflows/free-security-pilot.yml`: `9f2fb75e8302424d82e0458a9170858812f8b4d4`
  - `.github/workflows/repository-validation.yml`: `9b9fd588eb08b9556ffbfc9a7a1d13d0aa9a8ebf`
  - `.github/workflows/security-codeql.yml`: `885d14d6f19237f25c71720b2fd03e1f8ba1dd56`
  - `.github/workflows/coverage-codecov.yml`: `4ca92f88cc6108084133c87b49f27c66dc8bdc5b`
  - `.github/dependabot.yml`: `db16797379522973a282f7470c9a598572e09f14`
  - `AGENTS.md`: `722ce876e05ff8d6f24d9c60794e0aa6be3c936c`
  - `.engineering/CHECKPOINT.md`: `78677f5aac573be8d6831963b396ba64a89372f7`
  - `.engineering/CHECKPOINT.json`: `0084244aa4ebc47d0f3ff2e8a25b4d6425e68c3f`

Revalidate if `main` changes before final commit/PR. No historical acceptance record is rewritten.
