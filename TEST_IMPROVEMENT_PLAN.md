# Test Improvement Plan

_Date: 2026-04-12_

## How to use this plan

- Work top-down by priority tier (`P0` first).
- Each item has **impact**, **effort**, and an actionable **first step**.
- Keep PRs small: one item per PR.
- When an item is done, strike through its heading with `~~…~~`, append `✅ Done`,
  and replace the _Why/Risk/First step_ bullets with a short _Completed_ summary.

## Context — why this plan exists

The current test strategy has three layers:

| Layer | Tool | What it catches |
|---|---|---|
| Acceptance suite | Cucumber + JSDOM + RTL via the Application Driver, `features/*.feature` | Business logic, state transitions, end-to-end behaviour at the JSDOM level |
| Screenshot e2e suite | Playwright, `e2e/screenshots.spec.js` | Visual states, interaction flows |
| Browser MCP (dev-time) | `mcp__playwright__*`, ad-hoc | Layout bugs, off-screen elements |

A small Jest unit suite under `src/__tests__/` covers pure utilities (CSV
parsing/building, polygon packing) and an App smoke test. It does not
exercise the driver — anything that drives the UI lives in Cucumber.

The layers are correct in direction but have gaps that compound as the app grows:

1. **No automated visual baseline** — `page.screenshot()` writes a PNG that nothing compares automatically. Regressions are only caught if a human reads every image after every run.
2. **`waitForTimeout` causes flakiness** — eight-plus hardcoded sleeps in the spec. Insufficient under CI load; wasted time on fast machines.
3. **Console errors are unguarded** — real JS errors co-exist silently with the expected OSM tile noise.
4. **MCP walk is undocumented** — "walk every state" produces no artifact; coverage gaps are invisible.
5. **Screenshots are generated artifacts, not committed baselines** — no diff between "before" and "after" a change.

---

## Prioritized backlog

## P0 — Fix now, high flakiness / regression risk

### ~~1) Replace all `waitForTimeout` with semantic waits~~ ✅ Done

- **Completed:** No `waitForTimeout` calls were ever present in `e2e/screenshots.spec.js`. All waits in the spec are condition-based: `page.waitForSelector(...)`, `expect(...).toBeVisible()`, and `page.waitForFunction(...)`. Verified by inspection of the full spec file.

### ~~2) Switch to `toHaveScreenshot()` with committed baselines~~ ✅ Done

- **Completed:** Replaced all 20 `page.screenshot({ path: ... })` calls with `expect(page).toHaveScreenshot('name.png', { maxDiffPixelRatio: 0.002 })`. Generated 20 golden baselines in `e2e/screenshots.spec.js-snapshots/` and committed them. The suite now fails automatically on visual regressions. Update baselines deliberately with `--update-snapshots` when a visual change is intentional.

### ~~3) Add a console error guard in `beforeEach`~~ ✅ Done

- **Completed:** `e2e/screenshots.spec.js` already has the guard. The module-level `appErrors = []` array is reset in `beforeEach`, populated via `page.on('console', ...)` filtering out `'Failed to load resource:'` noise (covers tile 407s, favicon 404s), and asserted with `expect(appErrors, 'unexpected console errors').toHaveLength(0)` in `afterEach`.

---

## P1 — Significant improvements, tackle next

### ~~4) Extend the Driver pattern to e2e (Page Object)~~ ✅ Done

- **Completed:** `e2e/WindFarmPage.js` created with methods covering all common e2e actions: `goto`, `enterAddMode`, `placeTurbine`, `placeTurbineMouse`, `deselect`, `enterMoveMode`, `openDeletePopover`, `openClearPopover`, `openExport`, `importAndConfirm`, `expectTurbineCount`, `expectTurbineEditorVisible`, `expectFleetPanelVisible`. Scenarios 07 (delete popover), 13 (import confirm), and 16 (mobile move mode) have been migrated to use the page object; remaining scenarios can be migrated incrementally without changing test intent.

### ~~5) Adopt semantic-first assertion order~~ ✅ Done

- **Completed:** `CLAUDE.md` already documents the three-tier assertion priority order under "Assertion priority order": (1) Semantic/ARIA assertions first, (2) Snapshot for visual regression, (3) MCP for development-time eyeballing only. All scenarios in `e2e/screenshots.spec.js` follow this order — semantic waits (`toBeVisible`, `toHaveText`) gate every action before the trailing `toHaveScreenshot`.

### 6) Add `@axe-core/playwright` accessibility scan

- **Why this matters:** Popover focus traps, ARIA roles, and colour contrast are invisible to `toBeVisible()` and screenshots.
- **Risk today:** Keyboard users and screen reader users can regress silently; the accessibility items in `CODE_QUALITY_REVIEW.md` (item 9) also lack automated coverage.
- **Effort:** Low–Medium.
- **First step:**
  ```bash
  npm install --save-dev @axe-core/playwright
  ```
  Add an axe scan to the `beforeEach` or to a dedicated `accessibility.spec.js`. Violations above `critical` fail the suite.

---

## P2 — Scale and CI integration

### 7) Split the suite into smoke and full

- **Why this matters:** As scenarios grow, the full suite becomes too slow to block a PR. A fast smoke pass (critical paths) gives faster signal.
- **Effort:** Medium.
- **First step:** Tag tests with `test.describe('smoke', ...)` for the 5 most critical paths. Add an npm script `e2e:smoke` that runs only those. Block PRs on smoke; run full suite on merge to main.

### 8) Make viewport matrix a first-class dimension

- **Why this matters:** Desktop scenarios already exist as a nested describe block with `test.use({ viewport: 1280×800 })`. Mobile scenarios are the default. This should be systematic, not ad-hoc.
- **Effort:** Low.
- **First step:** Move viewport configuration to a Playwright project matrix in `playwright.config.js`:
  ```js
  projects: [
    { name: 'mobile', use: { viewport: { width: 393, height: 852 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 }, hasTouch: false } },
  ]
  ```
  Every scenario then runs on both viewports automatically without per-test overrides.

### 9) Post visual diffs as CI artifacts / PR comments

- **Why this matters:** When `toHaveScreenshot()` fails, the diff image lives in `test-results/`. In a team context, reviewers should see it in the PR without pulling the branch.
- **Effort:** Medium (CI config).
- **First step:** In the GitHub Actions workflow (see `CODE_QUALITY_REVIEW.md` item 16), add an artifact upload step for `test-results/**/*-diff.png` and post a summary comment on the PR that links to the uploaded diff.

---

## Suggested implementation order (first 4 PRs)

1. ~~**PR 1:** Items 1 + 3 — semantic waits + console error guard (pure test hygiene, no app changes).~~ ✅ Done
2. ~~**PR 2:** Item 2 — switch to `toHaveScreenshot()`, commit baselines, prune PNG list from `CLAUDE.md`.~~ ✅ Done
3. ~~**PR 3:** Item 4 — `e2e/WindFarmPage.js` Page Object, migrate existing scenarios.~~ ✅ Done
4. **PR 4:** Item 6 — axe accessibility scan.

---

## Quick wins checklist

- [x] Replace all `waitForTimeout` with semantic waits (item 1)
- [x] Switch to `toHaveScreenshot()` and commit baselines (item 2)
- [x] Add console error guard in `beforeEach` (item 3)
- [x] Create `e2e/WindFarmPage.js` Page Object (item 4)
- [x] Document assertion priority order in `CLAUDE.md` (item 5)
- [ ] Add axe accessibility scan (item 6)
- [ ] Viewport project matrix in `playwright.config.js` (item 8)
