# Repository Code Quality Review

_Date: 2026-04-09_

## How to use this review

- Work top-down by priority tier (`P0` first).
- Each item has **impact**, **effort**, and an actionable **first step**.
- Keep PRs small: one backlog item (or one sub-item) per PR.

## Executive summary (biggest opportunities)

1. **Split the `App` monolith into feature-focused modules/components.**
   - `src/App.js` currently combines UI rendering, interaction state, CSV parsing/serialization, layout import/export flows, and selection logic in one file.
2. **Extract shared turbine panel UI used in both desktop and mobile paths.**
   - There is substantial duplicated markup/logic for selected turbine actions and spec editing.
3. **Harden data boundaries (storage + CSV) with schema-based validation and central domain models.**
   - Parsing and shape assumptions are currently ad hoc.
4. **Reduce rendering churn in map synchronization.**
   - Marker icon recreation and imperative update loops happen for every turbine on many state changes.
5. **Improve project hygiene/tooling (README, lint/format/type-check scripts, remove dead code).**
   - This will prevent regressions and increase contributor velocity.

---

## Prioritized backlog

## P0 — High impact / should start now

### 1) Break up `src/App.js` (state machine + feature modules)
- **Why this matters:** `App.js` is 707 lines and owns too many responsibilities (view orchestration, mutation logic, CSV I/O, desktop/mobile layouts, popovers, and modal workflows).
- **Risk today:** Harder onboarding, high regression chance when modifying one concern, and more merge conflicts.
- **Effort:** High.
- **First step:** Create `features/layout-io`, `features/turbine-editor`, and `features/fleet-settings` folders; move pure helpers (`parseLayoutCsv`, `buildLayoutCsv`) out first, then UI sections.

### 2) Deduplicate desktop/mobile selected-turbine panel markup
- **Why this matters:** Desktop and mobile render paths repeat the same controls (`Move`, `Delete`, name input, spec fields, custom actions).
- **Risk today:** Bug fixes must be done twice, and UI drift is likely.
- **Effort:** Medium.
- **First step:** Extract a `TurbineEditorPanel` presentational component with props for context-specific wrappers (desktop popover vs mobile panel).

### 3) Introduce schema validation for persisted/imported layout data
- **Why this matters:** Storage load and CSV import rely on permissive parsing and implicit assumptions.
- **Risk today:** Corrupt localStorage or malformed CSV may lead to inconsistent app state.
- **Effort:** Medium.
- **First step:** Add a runtime schema validator (e.g., Zod) for turbine/fleet/mapView models; validate both `loadSaved()` and parsed CSV rows before state writes.

### 4) ~~Move CSV parsing/serialization into dedicated, tested utilities~~ ✅ Done
- **Completed:** `src/utils/layoutCsv.js` extracted with `buildLayoutCsv`, `parseCsvRecords`, and `parseLayoutCsv`.
- Unit tests in `src/__tests__/features/layout-csv-utils.test.js` cover quoting, newline, CRLF, and unterminated-field edge cases.
- Integration tests in `src/__tests__/features/import-layout.test.js` and `export-layout.test.js` cover the full round-trip.
- A library replacement (PapaParse) was evaluated and ruled out: the format is self-generated, the parser is already RFC 4180-compliant, and adding a library would increase bundle size without benefit for this constrained use case.

### 5) Add baseline engineering guardrails (lint/format/typecheck)
- **Why this matters:** The repo currently has no explicit scripts for linting/formatting/type-checking in CI-style workflows.
- **Risk today:** Style drift and preventable defects slip in unnoticed.
- **Effort:** Low–Medium.
- **First step:** Add scripts like `lint`, `lint:fix`, `format`, and optionally `typecheck` (via TypeScript migration or JSDoc+tsc).

## P1 — Significant improvements next

### 6) Optimize map marker/ring update strategy
- **Why this matters:** Marker icons are recreated and set on each sync loop; loops run on several dependencies.
- **Risk today:** Performance degradation as turbine count grows.
- **Effort:** Medium.
- **First step:** Memoize icon generation inputs and update only changed markers (diff by changed turbine fields + selection/mode flags).

### 7) Consolidate localStorage reads into one initialization path
- **Why this matters:** `loadSaved()` is called independently for multiple `useState` initializers.
- **Risk today:** Repeated parse work and inconsistent fallback handling.
- **Effort:** Low.
- **First step:** Parse once into a `const saved = useMemo(...)`/lazy initializer object, then derive all initial states from that shared object.

### 8) Introduce explicit domain constants/types for turbine IDs and specs
- **Why this matters:** ID generation/parsing and spec shape are spread across handlers.
- **Risk today:** Hidden coupling and fragile assumptions (e.g., `id.slice(1)` numeric parsing).
- **Effort:** Medium.
- **First step:** Add `src/domain/turbines.js` with constructors/helpers (`nextTurbineId`, `defaultTurbineName`, `resolveSpec`).

### 9) Improve accessibility coverage for popovers/modals
- **Why this matters:** The app uses custom popover/modal patterns with portals.
- **Risk today:** Keyboard/focus behavior regressions may go undetected.
- **Effort:** Medium.
- **First step:** Add focused tests for focus trap/restore, Escape behavior, and aria attributes across import/export/settings/delete flows.

### 10) Strengthen test driver reliability with async-safe user interactions
- **Why this matters:** Driver methods call `userEvent.click` without awaiting in many places.
- **Risk today:** Potential flakiness with async event processing.
- **Effort:** Low–Medium.
- **First step:** Convert driver actions to `async` and `await userEvent...`, then update tests incrementally.

### 11) Document architecture and contribution workflow
- **Why this matters:** Root README is currently empty.
- **Risk today:** New contributors lack setup, testing, and design-context guidance.
- **Effort:** Low.
- **First step:** Add README sections: project purpose, local run/test/build commands, map architecture, test strategy, and coding conventions.

## P2 — Small but meaningful cleanups

### 12) Remove or wire unused UI primitives (`Card`, `Button`)
- **Why this matters:** Unused abstractions add noise and maintenance overhead.
- **Risk today:** Confusion about intended design-system usage.
- **Effort:** Low.
- **First step:** Either delete unused component files or migrate existing buttons/cards to use them consistently.

### 13) Remove unrelated leftover sample data (`src/data/jokes.js`)
- **Why this matters:** Not aligned with current product domain.
- **Risk today:** Repository signal-to-noise declines.
- **Effort:** Low.
- **First step:** Delete file if unused; if needed for experiments, move to a clearly marked sandbox folder.

### 14) Align package metadata with product identity
- **Why this matters:** Package name is `my-joke-app` while UI branding is `PadSketch`.
- **Risk today:** Confusing release/build metadata.
- **Effort:** Low.
- **First step:** Update `name`, description, and any docs/scripts to match current app branding.

### 15) Add error telemetry hooks for import/storage failures
- **Why this matters:** Errors are currently handled locally with user-facing messages (or silently ignored for storage writes).
- **Risk today:** Hard to detect field issues in production.
- **Effort:** Low–Medium.
- **First step:** Add a lightweight logging abstraction and emit structured events for CSV parse failures and storage write failures.

### 16) Add CI workflow for tests + build + lint
- **Why this matters:** Quality checks are currently manual.
- **Risk today:** Regressions can merge without standard verification.
- **Effort:** Medium.
- **First step:** Add GitHub Actions workflow running `npm ci`, `npm test -- --watchAll=false`, `npm run build`, and lint/format checks.

---

## Suggested implementation order (first 6 PRs)

1. **PR 1:** README + package metadata alignment + remove dead files.
2. ~~**PR 2:** Extract CSV utils + dedicated tests.~~ ✅ Done
3. **PR 3:** Add schema validation for storage/import.
4. **PR 4:** Extract shared `TurbineEditorPanel` UI.
5. **PR 5:** Split `App` feature modules.
6. **PR 6:** Map sync performance pass + profiling notes.

---

## Quick wins checklist

- [ ] Add README with setup/test/build/contribution guidance.
- [ ] Add lint/format scripts and enforce in CI.
- [x] Remove unused `Card`/`Button` and jokes data if unused.
- [x] Extract CSV functions from `App.js`.
- [ ] Create shared turbine editor component for desktop/mobile reuse.
