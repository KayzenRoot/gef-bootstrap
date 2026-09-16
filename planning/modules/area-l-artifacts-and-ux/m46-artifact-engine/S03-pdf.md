# M46 S03 — PDF
Status: FROZEN

**PAC46 PDF Artifact Contract** treats PDF as a derived presentation artifact from a canonical structured source. Generation must be deterministic where tooling permits, embed document metadata/provenance, preserve selectable text, page structure and accessibility-friendly reading order.

The canonical JSON/Markdown source digest is bound into the PDF receipt so binary rendering never becomes the sole source of truth. Renderer/toolchain version is recorded; binary digest changes from renderer drift are explainable.

Acceptance: source binding, renderer provenance, readable/selectable text, pagination sanity, no sole-source binary authority.