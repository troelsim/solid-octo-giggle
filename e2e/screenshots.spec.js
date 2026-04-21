// @ts-check
const { test, expect } = require('@playwright/test');
const { WindFarmPage } = require('./WindFarmPage');

// Captures unexpected application-level console errors.
// Reset in beforeEach; asserted in afterEach.
// Tile 407s and other "Failed to load resource:" network noise are filtered out.
let appErrors = [];

test.beforeEach(async ({ page }) => {
  appErrors = [];
  page.on('console', msg => {
    // "Failed to load resource:" covers tile 407s, favicon 404s, and other
    // network noise that are expected in the local dev environment.
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource:'))
      appErrors.push(msg.text());
  });

  await page.goto('/');
  // Clear persisted layout so each scenario starts from a clean slate.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Wait for the map and header to be ready (bottom-panel absent on desktop)
  await page.waitForSelector('.wind-map');
  await page.waitForSelector('.app-header');
  // Add turbine button is always present in the header on both layouts.
  await expect(page.getByRole('button', { name: 'Add turbine' })).toBeVisible();
});

test.afterEach(async () => {
  expect(appErrors, 'unexpected console errors').toHaveLength(0);
});

test('01 empty farm — fleet defaults panel', async ({ page }) => {
  await expect(page.getByText('Fleet defaults')).toBeVisible();
  await expect(page.getByText('Tap + to add turbines')).toBeVisible();
  await expect(page).toHaveScreenshot('01-empty-farm.png', { maxDiffPixelRatio: 0.002 });
});

test('02 add mode — placement banner', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  // Mobile viewport (default): banner says "Tap or drag to place a turbine"
  await expect(page.getByText('Tap or drag to place a turbine')).toBeVisible();
  await expect(page).toHaveScreenshot('02-add-mode.png', { maxDiffPixelRatio: 0.002 });
});

test('03 turbine placed — spec panel', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
  await expect(page).toHaveScreenshot('03-turbine-placed.png', { maxDiffPixelRatio: 0.002 });
});

test('04 custom specs — badge visible', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();

  // Edit hub height if a turbine is selected
  const hubInput = page.locator('.spec-input').first();
  await hubInput.click({ clickCount: 3 });
  await hubInput.type('130');
  await hubInput.press('Tab');
  await expect(page.getByText('custom')).toBeVisible();

  await expect(page).toHaveScreenshot('04-custom-specs.png', { maxDiffPixelRatio: 0.002 });
});

test('05 fleet view — turbine count', async ({ page }) => {
  // Enter add mode once; sticky add mode keeps it active for subsequent placements.
  await page.getByRole('button', { name: 'Add turbine' }).click();
  for (const pos of [{ x: 120, y: 200 }, { x: 260, y: 200 }]) {
    await page.locator('.wind-map').click(pos);
    await expect(page.getByRole('button', { name: 'Deselect' })).toBeVisible();
  }
  // Deselect to show fleet panel
  await page.getByRole('button', { name: 'Deselect' }).click();
  await expect(page.getByText('2 turbines')).toBeVisible();
  await expect(page).toHaveScreenshot('05-fleet-view.png', { maxDiffPixelRatio: 0.002 });
});

test('07 delete turbine — confirmation popover', async ({ page }) => {
  const farm = new WindFarmPage(page);
  await farm.enterAddMode();
  await farm.placeTurbine();
  await farm.openDeletePopover();
  await expect(page).toHaveScreenshot('07-delete-turbine-popover.png', { maxDiffPixelRatio: 0.002 });
});

test('08 clear layout — confirmation popover', async ({ page }) => {
  // Place two turbines then deselect to see fleet panel
  await page.getByRole('button', { name: 'Add turbine' }).click();
  for (const pos of [{ x: 120, y: 200 }, { x: 260, y: 200 }]) {
    await page.locator('.wind-map').click(pos);
    await expect(page.getByRole('button', { name: 'Deselect' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Deselect' }).click();
  // Open the confirmation popover
  await page.getByRole('button', { name: 'Clear layout' }).click();
  await expect(page.getByText(/clear all 2 turbines\?/i)).toBeVisible();
  await expect(page).toHaveScreenshot('08-clear-layout-popover.png', { maxDiffPixelRatio: 0.002 });
});

test('09 persisted layout — survives reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });

  // Wait for the React useEffect to flush the save before reloading.
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('wind-farm-layout');
    return raw ? JSON.parse(raw).turbines?.length > 0 : false;
  });

  await page.reload();
  await page.waitForSelector('.wind-map');
  await page.waitForSelector('.app-header');

  // Verify the fleet panel shows a turbine count (any number > 0).
  await expect(page.getByText(/\d+ turbines?/)).toBeVisible();
  await expect(page).toHaveScreenshot('09-persisted-layout.png', { maxDiffPixelRatio: 0.002 });
});

test('10 export layout — csv text field', async ({ page }) => {
  const farm = new WindFarmPage(page);
  await page.getByRole('button', { name: 'Add turbine' }).click();
  for (const pos of [{ x: 120, y: 200 }, { x: 260, y: 200 }]) {
    await page.locator('.wind-map').click(pos);
    await expect(page.getByRole('button', { name: 'Deselect' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Deselect' }).click();
  await farm.openExport();
  await expect(page).toHaveScreenshot('10-export-layout.png', { maxDiffPixelRatio: 0.002 });
});

test('18 batch add — multiple turbines placed without leaving add mode', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await expect(page.getByText(/tap or drag to place/i)).toBeVisible();

  // Use page.mouse.click() rather than locator.click() here.
  // On a hasTouch device, locator.click() fires touch events AND a synthetic
  // mouse click.  Leaflet's tap module fires its own synthetic click on touchend,
  // placing the turbine; Playwright's subsequent click can land on the freshly-
  // placed marker and call handleTurbineClick, reverting mode to 'view'.
  // page.mouse.click() dispatches only mouse events, so exactly one click
  // reaches handleMapClick and the mode stays 'add' after each placement.
  const mapBox = await page.locator('.wind-map').boundingBox();
  for (const pos of [{ x: 120, y: 200 }, { x: 195, y: 300 }, { x: 270, y: 200 }]) {
    await page.mouse.click(mapBox.x + pos.x, mapBox.y + pos.y);
    // Banner must remain visible — confirms sticky add mode kept us in 'add' state.
    await expect(page.getByText(/tap or drag to place/i)).toBeVisible();
  }
  await expect(page).toHaveScreenshot('18-batch-add.png', { maxDiffPixelRatio: 0.002 });
});

test('06 move mode — move banner', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
  // Click Move if a turbine is selected, otherwise just screenshot current state
  const moveBtn = page.getByRole('button', { name: 'Move' });
  if (await moveBtn.isVisible()) {
    await moveBtn.click();
  }
  await expect(page).toHaveScreenshot('06-move-mode.png', { maxDiffPixelRatio: 0.002 });
});

test('11 add mode — cursor preview ghost at hover position', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  // Hover over the map so the ghost turbine + ring appear at that position.
  await page.locator('.wind-map').hover({ position: { x: 195, y: 300 } });
  // Wait for the ghost marker to be added to the Leaflet marker pane.
  await page.waitForSelector('.leaflet-marker-pane .leaflet-marker-icon');
  await expect(page).toHaveScreenshot('11-add-preview.png', { maxDiffPixelRatio: 0.002 });
});

test('12 move mode — cursor preview ghost while original fades', async ({ page }) => {
  // Place a turbine near centre.
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
  // Enter move mode.
  await page.getByRole('button', { name: 'Move' }).click();
  // Hover at a different position to show the ghost while the original is faded.
  await page.locator('.wind-map').hover({ position: { x: 280, y: 200 } });
  // Wait for the ghost (2nd marker: original + ghost) to appear in the marker pane.
  await page.waitForFunction(
    () => document.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon').length >= 2
  );
  await expect(page).toHaveScreenshot('12-move-preview.png', { maxDiffPixelRatio: 0.002 });
});

test('13 import layout — confirmation popover', async ({ page }) => {
  const farm = new WindFarmPage(page);
  await farm.enterAddMode();
  await farm.placeTurbine();
  const csv = 'Latitude,Longitude,Name,Description\n55.1,7.9,Alpha,V80-2.0MW';
  await farm.importAndConfirm(csv);
  await expect(page).toHaveScreenshot('13-import-confirm.png', { maxDiffPixelRatio: 0.002 });
});

test('16 mobile move mode — panel hidden, drag banner visible', async ({ page }) => {
  const farm = new WindFarmPage(page);
  await farm.enterAddMode();
  await farm.placeTurbine();
  await farm.enterMoveMode();
  // The bottom panel should be hidden and the drag-move banner should appear.
  await expect(page.getByRole('button', { name: /^move$/i })).not.toBeVisible();
  await expect(page).toHaveScreenshot('16-mobile-move-mode.png', { maxDiffPixelRatio: 0.002 });
});

test('17 mobile move mode — drag places turbine at new position', async ({ page }) => {
  // Place a turbine near centre.
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
  // Enter move mode.
  await page.getByRole('button', { name: 'Move' }).click();
  await expect(page.getByText(/drag or tap to move/i)).toBeVisible();
  // Simulate a touch drag across the map (start far enough from the turbine so
  // the drag exceeds the 15 px tap-tolerance and triggers the ghost preview).
  const mapEl = page.locator('.wind-map');
  await mapEl.dispatchEvent('touchstart', {
    touches: [{ clientX: 195, clientY: 300, identifier: 0 }],
    changedTouches: [{ clientX: 195, clientY: 300, identifier: 0 }],
  });
  await mapEl.dispatchEvent('touchmove', {
    touches: [{ clientX: 280, clientY: 200, identifier: 0 }],
    changedTouches: [{ clientX: 280, clientY: 200, identifier: 0 }],
  });
  // Wait for the ghost marker to appear alongside the original (2 markers total).
  await page.waitForFunction(
    () => document.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon').length >= 2
  );
  // Screenshot the ghost-preview mid-drag.
  await expect(page).toHaveScreenshot('17-mobile-move-drag-preview.png', { maxDiffPixelRatio: 0.002 });
  // Release to confirm placement.
  await mapEl.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: 280, clientY: 200, identifier: 0 }],
  });
  // The turbine editor panel should be back (move confirmed, view mode restored).
  await expect(page.getByRole('button', { name: /^move$/i })).toBeVisible();
  await expect(page).toHaveScreenshot('17-mobile-move-drag-placed.png', { maxDiffPixelRatio: 0.002 });
});

test('19 pack area — empty draw-mode banner', async ({ page }) => {
  const farm = new WindFarmPage(page);
  await farm.enterPackAreaMode();
  await expect(page.getByText(/outline an area.*0\/3/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fill area with turbines' })).toBeDisabled();
  await expect(page).toHaveScreenshot('19-pack-empty.png', { maxDiffPixelRatio: 0.002 });
});

test('20 pack area — polygon drawn with 4 vertices, Fill enabled', async ({ page }) => {
  // Zoom in so the polygon covers a small-enough area that Fill places only
  // a handful of turbines (avoiding a huge marker count at default zoom).
  await page.evaluate(() => localStorage.setItem(
    'wind-farm-layout',
    JSON.stringify({
      turbines: [],
      fleet: { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 },
      mapView: { center: [55.5, 7.9], zoom: 15 },
    })
  ));
  await page.reload();
  await page.waitForSelector('.wind-map');

  const farm = new WindFarmPage(page);
  await farm.enterPackAreaMode();
  await farm.addPolygonVertices([
    { x: 120, y: 260 },
    { x: 280, y: 260 },
    { x: 280, y: 520 },
    { x: 120, y: 520 },
  ]);
  await expect(page.getByText(/\d+ vertices/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fill area with turbines' })).toBeEnabled();
  // Wait for the closing polygon edge + vertex dots to render.
  await page.waitForSelector('.leaflet-overlay-pane path');
  await expect(page).toHaveScreenshot('20-pack-polygon.png', { maxDiffPixelRatio: 0.002 });
});

test('21 pack area — turbines placed after Fill', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem(
    'wind-farm-layout',
    JSON.stringify({
      turbines: [],
      fleet: { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 },
      mapView: { center: [55.5, 7.9], zoom: 15 },
    })
  ));
  await page.reload();
  await page.waitForSelector('.wind-map');

  const farm = new WindFarmPage(page);
  await farm.enterPackAreaMode();
  await farm.addPolygonVertices([
    { x: 120, y: 260 },
    { x: 280, y: 260 },
    { x: 280, y: 520 },
    { x: 120, y: 520 },
  ]);
  await farm.confirmFill();
  // After fill: fleet-defaults panel shows the turbine count.
  await expect(page.getByText(/\d+ turbines?$/)).toBeVisible();
  await expect(page).toHaveScreenshot('21-pack-filled.png', { maxDiffPixelRatio: 0.002 });
});

test('22 mobile overflow menu — Export and Import revealed', async ({ page }) => {
  await page.getByRole('button', { name: 'More actions' }).click();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import CSV' })).toBeVisible();
  await expect(page).toHaveScreenshot('22-overflow-menu.png', { maxDiffPixelRatio: 0.002 });
});

// Spacing-ring skins — regression net for the step-3 migration of
// .btn-ring-toggle (shape + skin) and its --on modifier. The ring is on by
// default, so .btn-ring-toggle--on is already captured in every baseline
// screenshot — these scenarios cover the off skin and the popover, which
// exercises the non-danger .btn-popover-confirm (different colour family from
// the --danger variant in 07/08/13).
test('23 spacing ring — off skin after toggling ring off', async ({ page }) => {
  // First click hides the ring; the button reverts to the default (off) skin.
  await page.getByRole('button', { name: 'Toggle spacing ring' }).click();
  await expect(page.getByRole('button', { name: 'Toggle spacing ring' }))
    .toHaveAttribute('title', /show spacing ring/i);
  await expect(page).toHaveScreenshot('23-ring-off.png', { maxDiffPixelRatio: 0.002 });
});

test('24 spacing ring — popover open with non-danger confirm', async ({ page }) => {
  // Two clicks: first hides the ring, second opens the configure popover.
  await page.getByRole('button', { name: 'Toggle spacing ring' }).click();
  await page.getByRole('button', { name: 'Toggle spacing ring' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Number of rotor diameters' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show ring' })).toBeVisible();
  await expect(page).toHaveScreenshot('24-ring-popover.png', { maxDiffPixelRatio: 0.002 });
});

// ── Desktop layout (1280 × 800, no touch) ────────────────────────────────────

test.describe('desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false });

  test('13 desktop — settings popover shows fleet defaults', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.wind-map');
    await expect(page.getByRole('button', { name: 'Fleet settings' })).toBeVisible();
    await page.getByRole('button', { name: 'Fleet settings' }).click();
    await expect(page.getByText('Fleet defaults')).toBeVisible();
    await expect(page).toHaveScreenshot('13-desktop-settings-popover.png', { maxDiffPixelRatio: 0.002 });
  });

  test('14 desktop — turbine popover on turbine selection', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.wind-map');
    await expect(page.getByRole('button', { name: 'Add turbine' })).toBeVisible();
    await page.getByRole('button', { name: 'Add turbine' }).click();
    await page.locator('.wind-map').click({ x: 640, y: 400 });
    // Exit add mode so the popover appears
    await page.keyboard.press('Escape');
    await expect(page.getByRole('textbox', { name: 'Turbine name' })).toBeVisible();
    // Turbine popover should be visible with spec fields and action buttons
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page).toHaveScreenshot('14-desktop-turbine-popover.png', { maxDiffPixelRatio: 0.002 });
  });

  test('15 desktop — move mode hides turbine popover', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.wind-map');
    await expect(page.getByRole('button', { name: 'Add turbine' })).toBeVisible();
    await page.getByRole('button', { name: 'Add turbine' }).click();
    await page.locator('.wind-map').click({ x: 640, y: 400 });
    // Exit add mode so the popover appears, then enter move mode
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
    await page.getByRole('button', { name: 'Move' }).click();
    await expect(page.getByText(/click the map to move/i)).toBeVisible();
    await expect(page).toHaveScreenshot('15-desktop-move-mode.png', { maxDiffPixelRatio: 0.002 });
  });
});
