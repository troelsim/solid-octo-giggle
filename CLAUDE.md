# Wind Farm Designer — Agent Guide

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
