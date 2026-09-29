# V1.2 — UI/UX Design Factory and Verified Front-End Delivery

Status: proposed profile-specific extension. No Figma/Storybook/Playwright/Chromatic SaaS was installed or authorized by this planning document. Owner interview/approved visual direction and current Source Pack always override aesthetic defaults.

## Goal
A startup-standard UI flow that is fast to design, faithfully implemented, responsive, accessible, internally consistent and verifiably working before handoff. Front-end design is a first-class production requirement with evidence, not optional polishing at the end.

## Seven-stage design-to-code pipeline
D0 DISCOVERY: question set in PRODUCT-DISCOVERY-INTERVIEW.md; user roles, devices, real task journeys, existing brand and comparable designs, constraints, response/performance budgets, supported platforms and accessibility targets.
D1 INFORMATION ARCHITECTURE: sitemap, navigation hierarchy, screen inventory, user journey and behavior for normal/empty/loading/error/success/access denied/offline states. For complicated flows write scenario and acceptance map before any high-fidelity mockup.
D2 VISUAL DIRECTIONS: 1–3 deliberate, distinct draft styles only when not already governed; moodboard descriptions, typographic rhythm, density, brand semantics, iconography, spacing, surfaces and motion plan. Show mobile and desktop examples or bounded owner-approved reference screens. Approval of visual direction is a governed gate before implementation.
D3 DESIGN SYSTEM: define versioned tokens (base + semantic light/dark color roles, typography scale, 4/8 or documented spacing system, grid/breakpoints, radius, elevation, focus/hover/disabled/loading/error, icon sizes, motion/reduced-motion, language/RTL where required). Specify component inventory and ownership to avoid five inconsistent button implementations. Version as UI/UX canonical doc; changes invalidate matching visual tests, not unrelated backend proofs.
D4 VERTICAL UI SLICE: Codex implements one true user journey end-to-end and verifies design contracts, navigation, forms, validation, network state and responsive keyboard usage. Present a running localhost/preview only when actual app has been built; no mock claimed as production. Correct against owner-visible evidence, then batch similar components.
D5 VERIFICATION: test component states, interactions, end-to-end journeys, accessibility, visual regressions, image/font loading, loading/empty/error states, i18n and mobile constraints. Baseline screenshots must be approved; no auto-accept of accidental UI diff. Performance measure real user flows and thresholds specified in DoD.
D6 RELEASE: approved UI/UX source, updated components/tokens, comprehensive evidence snapshot (screens and diff, keyboard audit, a11y automated + manual findings, Playwright traces only for failures as needed, responsive build), deployed preview and rollback plan consistent with project risk.

## Default design policies for web profiles (configurable)
- Adopt WCAG 2.2 AA as target unless different approved project standard requires more; W3C reference https://www.w3.org/TR/WCAG22/. Automated checks catch only part of accessibility; require meaningful keyboard, focus, semantics and manual checks.
- Design first for the owner's stated primary device; check supported mobile/desktop widths and touch target requirements. Avoid assuming every application is mobile-first.
- Use semantic HTML, ARIA only where necessary, proper focus traps and return focus for dialogs, contrast and visible status text, reduced-motion alternatives, loading skeleton only when informative and accessible errors with recovery paths.
- No automatically added heavy motion/animations or paid component libraries. Optimize bundle, image dimensions, font strategy and layout shift within project DoD budgets.
- Design tokens and a documented UI component library are the default reuse mechanism; the project's existing framework/design library wins if already approved and healthy. Do not rebuild a proprietary design system when accessible established components fit.
- Screenshot similarity is not sufficient: interaction/functionality must be verified, and intentional visual changes must be reviewed as design changes.

## Selective open-source tooling (profile adapters)
A. Storybook (https://storybook.js.org/docs/writing-tests): opt-in component states catalog and documented interactions; official Vitest addon where supported. Strong fit for medium/large component reuse, avoid overhead for tiny static sites. Storybook visual tests may use third-party cloud services but default no-SaaS visual regression can use local Playwright snapshots.
B. Playwright (https://playwright.dev/docs/test-snapshots and https://playwright.dev/docs/accessibility-testing): real browser cross-device journey and screenshot tests, trace on retry/retain-on-failure only, @axe-core/playwright to catch machine-detectable issues. Pin browsers in lock/environment; quarantine snapshots that change across unsupported OS/font environments.
C. axe-core (https://github.com/dequelabs/axe-core): no-cost open-source accessibility engine. Combine with manual keyboard and assistive technology smoke where DoD requires; no “100% accessible” from green axe tests.
D. Design token library (project-specific): CSS custom properties + typed semantic mapping first; consider Style Dictionary (https://amzn.github.io/style-dictionary/) only when multiple platform outputs justify extra build step.
E. UI prototyping: use image-generation/wireframe tooling for isolated design options only with owner brief; visuals are artifacts for design approval, not executable specifications. External Figma connection is optional and requires explicit user installation/authorization. A third-party design SaaS is never a bootstrap hard dependency.
F. Performance: browser performance budget and Lighthouse CI can be profile-specific pilots if stable reproducibility is proven; strict minimum accessibility and usability goals should not be replaced by a single score.

## Novel first-party proposed improvements
UI01 Screen Contract Compiler: turn approved screen flow into explicit layout/interaction/accessibility/state obligations and a traceability matrix, without machine-imposing subjective visual preference.
UI02 Design Drift Sentinel: diff token/schema/component changes against approved design bible, classify intentional change vs drift vs unknown; pull request must show before/after on affected representative screen and impacted snapshot proof.
UI03 Interaction State Matrix: each stateful component declares idle/loading/success/error/empty/disabled/permission/offline as applicable; generate a focused finite set of state and transition tests, not full combinatorial explosion.
UI04 Journey Critical-Path Builder: implement complete vertical user journey first to expose integration issues early; batch later related screens only when shared components/contracts stable.
UI05 Responsive Evidence Pack: representative screenshots/test recordings for breakpoints, viewport/zoom/keyboard/touch checks with traceable candidate SHA, not dozens of screenshots with no acceptance criterion.
UI06 Visual-Proof Gate: story/component screenshots against owner-accepted reference with reviewed intentional diffs; freeze approved critical design tokens and allow governed iteration without silent style churn.

## Quality and anti-waste policies
- One global reusable component should solve common UI behavior rather than recoding every page.
- No exhaustive visual screenshot for every permutation when a representative state graph can bound visual risk; expand for high-visibility, high-traffic, admin security-sensitive and novel components.
- Keep design choice questions short and contextual. If owner says “use approved brand”, check actual brand assets/source before making new logo/colors.
- Every UI Work Order includes design references, exact component/screen targets, permission to change existing tokens, required states, design approval checkpoint, E2E/visual/a11y proof and rollback plan.
- Code/CI/test/migration writing remains Codex-only. ChatGPT may lead interview, formal design specs, review prototype screenshots and audit evidence.
- APP PREVIEW means a real user-testable build. A screenshot/mock is labelled CONCEPT only. No false statement that localhost is available through ChatGPT.

## Measurable experiments before adoption
Use two representative applications (simple dashboard with forms, complex data workflow), compare current GEF-style UI delivery vs this pipeline. Measure accepted journeys/engineering-hour, owner design revision loops, defects escaping UI regression, component reuse and load/a11y metrics; compare same Scope/DoD. Limit extra design workflow on tiny projects where overhead exceeds benefit.

## Documentation output per app
UI-UX-SPEC.md; screen inventory and flowchart; semantic design tokens and component contracts; approved owner decisions; screen/interaction state matrix; evidence links and exception log. Only create files relevant to project; don't require an external design SaaS or universal React stack.
