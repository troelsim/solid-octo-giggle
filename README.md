# Wind Farm Designer

A browser-based tool for laying out wind turbine positions on an interactive map. Place turbines by clicking or tapping, configure specs, visualise spacing requirements, and export the result as CSV.

## Features

- **Interactive placement** — click (desktop) or tap (mobile) to add turbines; drag to reposition them
- **Turbine specs** — set hub height, rotor diameter, and rated power per turbine or as fleet-wide defaults
- **Spacing rings** — overlay configurable clearance circles (multiples of rotor diameter) to check separation distances
- **Map layers** — toggle between OpenStreetMap street view and satellite imagery
- **Import / export** — save and restore layouts as CSV files; full turbine specs round-trip cleanly
- **Persistence** — layout and map view are saved to `localStorage` automatically; the map centres on your location on the first visit
- **Responsive** — desktop shows floating popovers anchored to controls; mobile shows a fixed bottom panel

## Getting started

```bash
npm install
npm start        # opens http://localhost:3000
```

## Running the tests

### Unit tests (React Testing Library + Jest)

```bash
npm test -- --watchAll=false
```

Fifteen feature-level test files in `src/__tests__/features/` cover every user-facing behaviour. Tests follow an [Application Driver](src/test-support/WindFarmDriver.js) pattern — see [CLAUDE.md](CLAUDE.md) for the full test architecture.

### Visual regression tests (Playwright)

```bash
npm run screenshot   # screenshot suite only
npm run e2e          # full Playwright suite
```

Committed baselines live in `e2e/snapshots/`. Update them deliberately when a visual change is intentional:

```bash
npx playwright test e2e/screenshots.spec.js --update-snapshots
```

## Production build

```bash
npm run build    # output goes to build/
```

## Project layout

```
src/
  App.js                      # all state and UI except the map
  WindMap.js                  # Leaflet map component
  components/                 # reusable UI (popovers, panels, inputs)
  domain/schemas.js           # Zod validation schemas
  hooks/useLayoutStorage.js   # localStorage + geolocation
  utils/layoutCsv.js          # CSV export / import
  styles/tokens.css           # design tokens (colours, spacing, typography)
  __tests__/features/         # feature-level unit tests (15 files)
  test-support/               # Application Driver and test helpers
  __mocks__/WindMap.js        # Leaflet stub for Jest (exposes state via data-*)
e2e/
  screenshots.spec.js         # Playwright visual regression scenarios
```

## Key dependencies

| Package | Purpose |
|---|---|
| React 19 | UI |
| Leaflet | Interactive map |
| @floating-ui/react | Popover / tooltip positioning |
| Zod | Runtime schema validation |
| @testing-library/react | Unit test renderer |
| @playwright/test | End-to-end / screenshot tests |

## CSV format

Exported files have one row per turbine with columns:

```
id, latitude, longitude, hubHeight, rotorDiameter, ratedPower
```

Values left blank in the export inherit the fleet default on import.
