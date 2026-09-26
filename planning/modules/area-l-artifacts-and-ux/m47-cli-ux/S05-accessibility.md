# M47 S05 — Accessibility
Status: FROZEN

**A11Y47 Accessibility Contract** requires keyboard/non-pointer operation where interactive, semantic labels, logical reading order, non-color status cues, reduced-motion compatibility and terminal/plain-text parity. Width/reflow must remain usable in narrow terminals and zoomed UI.

**NIM47 Non-Interactive Mode** guarantees deterministic machine output, no prompts, explicit exit/status codes and bounded logs for CI/agents. Interactive convenience must never be required for automation.

Acceptance: text-only parity, keyboard semantics, reflow, non-color cues, deterministic non-interactive mode, screen-reader-friendly labels where renderer supports them.