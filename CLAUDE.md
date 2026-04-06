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
```

Use what you see to verify the change looks correct on a 393×852 iPhone viewport.
If something looks wrong, fix it before finishing.

## Running the unit tests

```bash
npm test -- --watchAll=false
```

## Project layout

- `src/App.js` — all state, all UI except the map
- `src/WindMap.js` — Leaflet map (mocked in unit tests)
- `src/styles/tokens.css` — every colour, spacing, and typography value; no hardcoded values elsewhere
- `src/__tests__/features/` — feature-level tests using the Application Driver pattern
- `e2e/screenshots.spec.js` — Playwright screenshot scenarios
