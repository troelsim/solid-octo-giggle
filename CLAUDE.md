# Wind Farm Designer — Agent Guide

## Testing — highest design objective

Every user-facing behaviour must be covered by a feature-level test before the
task is considered done. This is the single most important quality rule in this
codebase.

**Checklist for any change that touches `src/App.js` or `src/WindMap.js`:**

1. Does the new behaviour have a scenario in `src/__tests__/features/`?
2. If the change adds a new prop to `WindMap`, is it exposed as a `data-*`
   attribute in `src/__mocks__/WindMap.js` so tests can assert on it?
3. If the change adds a new UI interaction, is there a driver method in
   `src/test-support/WindFarmDriver.js` for it?

Run the suite before finishing:

```bash
npm test -- --watchAll=false
```

All tests must pass. A Stop hook will remind you if source files were modified
without a corresponding test file being added or changed.

### Test architecture

| Layer | File | Role |
|---|---|---|
| Tests | `src/__tests__/features/*.test.js` | What — business-language assertions |
| Driver | `src/test-support/WindFarmDriver.js` | How — RTL facade; only file tests touch |
| Mock | `src/__mocks__/WindMap.js` | Leaflet stand-in; exposes map state via `data-*` |

When adding a new feature, extend all three layers: a new test file (or section),
new driver methods, and any new `data-*` attributes on the mock.

## After making any UI change

Run the screenshot suite and read every image before considering the task done:

```bash
npm run screenshot
```

Then read each file in `screenshots/`:

```
screenshots/01-empty-farm.png
screenshots/02-add-mode.png
screenshots/03-turbine-placed.png
screenshots/04-custom-specs.png
screenshots/05-fleet-view.png
screenshots/06-move-mode.png
screenshots/07-delete-turbine-popover.png
screenshots/08-clear-layout-popover.png
screenshots/09-persisted-layout.png
screenshots/10-export-layout.png
```

Use what you see to verify the change looks correct on a 393×852 iPhone viewport.
If something looks wrong, fix it before finishing.

**Unit tests cannot catch layout bugs.** JSDOM does not do real rendering, so
a popover that opens off-screen, a panel that clips its children, or a z-index
issue will pass every unit test and only show up visually. This means:

- Every new interactive UI state (open popover, active mode, panel variant, …)
  needs its own scenario in `e2e/screenshots.spec.js` that reaches that state
  and takes a screenshot.
- Reading the screenshots is mandatory verification, not a formality. If the
  new screenshot is not in the list above, add it to the list.

## Running the unit tests

```bash
npm test -- --watchAll=false
```

## Use libraries for solved problems

Before implementing UI behaviour from scratch, check whether a library already
solves it correctly. Hand-rolling these is a common source of subtle bugs:

| Problem | Use |
|---|---|
| Popover / tooltip / dropdown positioning | `@floating-ui/react` (already installed) |
| Dismissing on outside click or Escape | `useDismiss` from `@floating-ui/react` |

`@floating-ui/react` is the right default for anything that needs to be
positioned relative to a trigger element. It handles viewport overflow, scroll,
and z-index automatically. Do not reimplement `position: absolute` + manual
`pointerdown` listeners — that approach fails whenever the popover is near a
viewport edge (e.g. a trigger in the bottom panel opening downward off-screen).

## Project layout

- `src/App.js` — all state, all UI except the map
- `src/WindMap.js` — Leaflet map (mocked in unit tests)
- `src/styles/tokens.css` — every colour, spacing, and typography value; no hardcoded values elsewhere
- `src/__tests__/features/` — feature-level tests using the Application Driver pattern
- `e2e/screenshots.spec.js` — Playwright screenshot scenarios
