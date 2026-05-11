# Repository Code Quality Review

_Date: 2026-04-09_

## How to use this review

- Work top-down by priority tier (`P0` first).
- Each item has **impact**, **effort**, and an actionable **first step**.
- Keep PRs small: one backlog item (or one sub-item) per PR.

## Executive summary (biggest opportunities)

1. **Split the `App` monolith into feature-focused modules/components.**
   - `src/App.js` currently combines UI rendering, interaction state, CSV parsing/serialization, layout import/export flows, and selection logic in one file.
2. **Extract shared turbine panel UI used in both desktop and mobile paths.** ✅ Done
   - `TurbineEditorPanel` and `FleetDefaultsPanel` now own the desktop/mobile duplicated markup; `App.js` has shrunk from 707 → 510 lines.
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
- **Why this matters:** `App.js` started at 707 lines and has been reduced to 510 by extracting `TurbineEditorPanel`, `FleetDefaultsPanel`, `Popover`, `SpecField`, and the CSV/schema utilities; it still owns too many responsibilities (view orchestration, mutation logic, desktop/mobile layouts, import/export modal workflows).
- **Risk today:** Harder onboarding, high regression chance when modifying one concern, and more merge conflicts.
- **Effort:** High.
- **First step:** Create `features/layout-io`, `features/turbine-editor`, and `features/fleet-settings` folders; move pure helpers (`parseLayoutCsv`, `buildLayoutCsv`) out first, then UI sections.

### 2) ~~Deduplicate desktop/mobile panel markup~~ ✅ Done
- **Completed (selected-turbine panel):** `src/components/TurbineEditorPanel.js` now owns the selected-turbine editor markup (title input, Move/Delete buttons, delete confirmation popover, spec fields, secondary actions) and is rendered from both the desktop `TurbinePopover` and the mobile `.bottom-panel`.
  - The panel owns its own delete-popover state locally; `key={selected.id}` in the parent resets it naturally when switching turbines, so `App.js` no longer needs `showDeletePopover` state, `deleteWrapRef`, or the manual reset calls in `handleTurbineClick`/`deleteTurbine`.
  - `Popover` and `SpecField` were also extracted to their own files under `src/components/` so both `App.js` and the new panel can reuse them without circular imports.
- **Completed (fleet defaults panel):** `src/components/FleetDefaultsPanel.js` now owns the fleet spec editor markup (Hub height/Rotor dia./Power spec fields, "Apply to all turbines" button, Clear-layout confirmation popover) and is rendered from both the desktop settings popover and the mobile bottom panel.
  - The component owns its own `clearWrapRef` and `showClearPopover` state, removing a subtle bug where both layout paths shared the same ref — if the viewport was resized while the clear popover was open, the popover would reanchor to a stale or missing element.
  - `App.js` no longer needs `showClearPopover`, `clearWrapRef`, or the `setShowClearPopover(false)` call in `clearLayout`; the SpecField import was also removed as it is now only used inside the dedicated component.
- Both components are covered by the Cucumber acceptance suite (`features/clear-layout.feature`, `features/fleet-defaults.feature`, `features/turbine-specs.feature`, `features/delete-turbine.feature`, `features/turbine-management.feature`, `features/desktop-layout.feature`) which continues to pass unchanged.

### 3) ~~Introduce schema validation for persisted/imported layout data~~ ✅ Done
- **Completed:** `src/domain/schemas.js` added with Zod schemas for `TurbineSchema`, `FleetSpecSchema`, `MapViewSchema`, and `StoredLayoutSchema`.
- `useLayoutStorage.loadSaved()` now runs `StoredLayoutSchema.safeParse()` after `JSON.parse`; any failure (corrupt JSON, wrong types, missing/negative fields) returns `null` so callers fall back to empty defaults cleanly.
- `createWindFarm()` in the test driver gained a `rawStorage` option for seeding arbitrary raw strings in tests.
- Schema-validation behaviour is now covered by `features/schema-validation.feature` (under "Unparseable JSON falls back to empty defaults", "Schema-invalid data is rejected", and "Valid data still loads correctly" rules) — covering unparseable JSON, wrong field types, missing/negative spec values, invalid mapView shape, and valid round-trip loading.

### 4) ~~Move CSV parsing/serialization into dedicated, tested utilities~~ ✅ Done
- **Completed:** `src/utils/layoutCsv.js` extracted with `buildLayoutCsv`, `parseCsvRecords`, and `parseLayoutCsv`.
- Unit tests in `src/__tests__/features/layout-csv-utils.test.js` cover quoting, newline, CRLF, and unterminated-field edge cases.
- Acceptance scenarios in `features/import-layout.feature` and `features/export-layout.feature` cover the full round-trip.
- A library replacement (PapaParse) was evaluated and ruled out: the format is self-generated, the parser is already RFC 4180-compliant, and adding a library would increase bundle size without benefit for this constrained use case.

### ~~5) Add baseline engineering guardrails (lint/format/typecheck)~~ ✅ Done

- **Completed:** `"lint": "eslint src --ext .js --max-warnings 0"` and `"lint:fix": "eslint src --ext .js --fix"` added to `package.json` scripts. ESLint is already configured via `"eslintConfig"` in `package.json` (extends `react-app` + `react-app/jest`) so no additional config file is needed. Run `npm run lint` to enforce zero warnings; `npm run lint:fix` to auto-fix fixable issues.

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

### ~~11) Document architecture and contribution workflow~~ ✅ Done

- **Completed:** `README.md` now covers project purpose, all npm scripts (`start`, `test`, `build`, `lint`, `lint:fix`, `screenshot`, `e2e`), project directory layout, architecture (state machine, desktop/mobile layout, map component, data persistence), test strategy (all three layers + assertion priority order), and coding conventions. The legacy Codex MCP setup section is retained.

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

### ~~14) Align package metadata with product identity~~ ✅ Done

- **Completed:** `package.json` `name` updated from `my-joke-app` to `wind-farm-designer`; a `description` field added: `"PadSketch — a mobile-first wind farm layout tool built with React and Leaflet"`.

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

1. ~~**PR 1:** README + package metadata alignment + remove dead files.~~ ✅ Done
2. ~~**PR 2:** Extract CSV utils + dedicated tests.~~ ✅ Done
3. ~~**PR 3:** Add schema validation for storage/import.~~ ✅ Done
4. ~~**PR 4:** Extract shared `TurbineEditorPanel` UI.~~ ✅ Done
4a. ~~**PR 4a:** Extract shared `FleetDefaultsPanel` UI.~~ ✅ Done
5. **PR 5:** Split `App` feature modules.
6. **PR 6:** Map sync performance pass + profiling notes.

---

## Quick wins checklist

- [x] Add README with setup/test/build/contribution guidance.
- [x] Add lint/format scripts and enforce in CI.
- [x] Remove unused `Card`/`Button` and jokes data if unused.
- [x] Extract CSV functions from `App.js`.
- [x] Create shared turbine editor component for desktop/mobile reuse.
- [x] Create shared fleet defaults component for desktop/mobile reuse.
