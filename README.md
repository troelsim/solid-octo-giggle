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

## Scripts

| Script | What it does |
|---|---|
| `npm start` | Dev server (hot reload) at http://localhost:3000 |
| `npm run bdd` | Cucumber acceptance suite (JSDOM + RTL via the Application Driver) |
| `npm test -- --watchAll=false` | Jest unit tests (utilities, App smoke test) |
| `npm run bdd:report:generate` | Build the static Allure HTML report from the last `bdd` run |
| `npm run bdd:report` | Generate the Allure report and open it locally |
| `npm run build` | Production build to `build/` |
| `npm run lint` | ESLint — fails on any warning |
| `npm run lint:fix` | ESLint — auto-fix fixable issues |
| `npm run screenshot` | Playwright visual regression suite |
| `npm run e2e` | All Playwright tests |

## Running the tests

### Acceptance suite (Cucumber + RTL via the Application Driver)

```bash
npm run bdd
```

Every user-facing behaviour is covered by a Gherkin scenario in `features/*.feature`, organised under `Rule:` blocks. Step definitions in `features/step_definitions/` translate Gherkin sentences into calls on the [Application Driver](src/test-support/WindFarmDriver.js); steps never reach into the DOM directly. See [CLAUDE.md](CLAUDE.md) for the full test architecture.

The same run also writes Allure JSON to `allure-results/`; `npm run bdd:report:generate` turns it into a static HTML report, and the [`BDD report`](.github/workflows/bdd-report.yml) workflow publishes that report to GitHub Pages on every push to `main`.

### Unit tests (Jest)

```bash
npm test -- --watchAll=false
```

A small Jest suite covers pure utilities (CSV parsing/building, polygon packing) and a smoke test that the App mounts. Anything that drives the UI lives in the Cucumber suite above.

### Visual regression tests (Playwright)

```bash
npm run screenshot   # screenshot suite only
npm run e2e          # full Playwright suite
```

Committed baselines live in `e2e/screenshots.spec.js-snapshots/`. Update them deliberately when a visual change is intentional:

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
  __tests__/                  # Jest unit tests (CSV utils, packing, App smoke)
  test-support/WindFarmDriver.js  # Application Driver — RTL facade shared by Cucumber steps
  __mocks__/WindMap.js        # Leaflet stub used by Cucumber + Jest (exposes state via data-*)
features/
  *.feature                   # Gherkin acceptance scenarios, organised under Rule:
  step_definitions/           # step glue that delegates to the Application Driver
  support/                    # JSDOM/Babel bootstrap + per-scenario world
e2e/
  screenshots.spec.js         # Playwright visual regression scenarios
  WindFarmPage.js             # Page Object — e2e test facade
  screenshots.spec.js-snapshots/  # committed visual baselines
```

## Architecture

### State and interaction modes

`App.js` owns all application state. The map has three interaction modes:

- **view** — default; clicking a turbine selects it
- **add** — sticky; each map click places a turbine and keeps add mode active
- **move** — while a turbine is selected; clicking the map moves it to the new position

### Desktop vs mobile layout

`useIsDesktop()` (a `matchMedia` hook) drives layout switching:

- **Mobile** — a fixed bottom panel shows either the fleet panel or the selected-turbine editor
- **Desktop** — fleet settings appear in a popover behind the header gear icon; selected turbine appears in a floating popover anchored near the map click

### Data persistence

`useLayoutStorage` saves the layout to `localStorage` on every state change and validates it with a Zod schema on load. Corrupt or schema-invalid data falls back to empty defaults silently.

## Key dependencies

| Package | Purpose |
|---|---|
| React 19 | UI |
| Leaflet | Interactive map |
| @floating-ui/react | Popover / tooltip positioning |
| Zod | Runtime schema validation |
| @testing-library/react | Renderer used by both Cucumber steps and Jest |
| @cucumber/cucumber | BDD acceptance runner |
| allure-cucumberjs | Allure reporter for the Cucumber suite |
| @playwright/test | End-to-end / screenshot tests |

## CSV format

Exported files have one row per turbine with columns:

```
id, latitude, longitude, hubHeight, rotorDiameter, ratedPower
```

Values left blank in the export inherit the fleet default on import.

## Coding conventions

- **No hardcoded values** — use `src/styles/tokens.css` for all colours, spacing, and typography.
- **No hand-rolled popover positioning** — use `@floating-ui/react` (`useDismiss`, `useFloating`, etc.).
- **Test every user-facing behaviour** — new features in `App.js` / `WindMap.js` need a scenario in `features/*.feature` (under a meaningful `Rule:`) before the task is done. See `CLAUDE.md` for the full checklist.
- **Keep `App.js` focused** — pure helpers and domain logic belong in `src/utils/` or `src/domain/`; shared UI belongs in `src/components/`.

## Codex MCP setup

To mirror the Claude Playwright MCP setup for Codex, register the same server in Codex CLI:

```bash
/opt/codex/bin/codex mcp add playwright -- \
  npx @playwright/mcp@latest \
  --headless \
  --executable-path /opt/pw-browsers/chromium-1194/chrome-linux/chrome
```

Then verify registration:

```bash
/opt/codex/bin/codex mcp list
```
