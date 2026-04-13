// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const SCREENSHOTS = path.join(__dirname, '..', 'screenshots');

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
  await page.screenshot({ path: `${SCREENSHOTS}/01-empty-farm.png` });
});

test('02 add mode — placement banner', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  // Mobile viewport (default): banner says "Tap or drag to place a turbine"
  await expect(page.getByText('Tap or drag to place a turbine')).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/02-add-mode.png` });
});

test('03 turbine placed — spec panel', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/03-turbine-placed.png` });
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

  await page.screenshot({ path: `${SCREENSHOTS}/04-custom-specs.png` });
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
  await page.screenshot({ path: `${SCREENSHOTS}/05-fleet-view.png` });
});

test('07 delete turbine — confirmation popover', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText(/delete turbine \d+\?/i)).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/07-delete-turbine-popover.png` });
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
  await page.screenshot({ path: `${SCREENSHOTS}/08-clear-layout-popover.png` });
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
  await page.screenshot({ path: `${SCREENSHOTS}/09-persisted-layout.png` });
});

test('10 export layout — csv text field', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  for (const pos of [{ x: 120, y: 200 }, { x: 260, y: 200 }]) {
    await page.locator('.wind-map').click(pos);
    await expect(page.getByRole('button', { name: 'Deselect' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Deselect' }).click();
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await expect(page.getByRole('textbox', { name: 'Layout CSV export' })).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/10-export-layout.png` });
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
  await page.screenshot({ path: `${SCREENSHOTS}/18-batch-add.png` });
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
  await page.screenshot({ path: `${SCREENSHOTS}/06-move-mode.png` });
});

test('11 add mode — cursor preview ghost at hover position', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  // Hover over the map so the ghost turbine + ring appear at that position.
  await page.locator('.wind-map').hover({ position: { x: 195, y: 300 } });
  // Wait for the ghost marker to be added to the Leaflet marker pane.
  await page.waitForSelector('.leaflet-marker-pane .leaflet-marker-icon');
  await page.screenshot({ path: `${SCREENSHOTS}/11-add-preview.png` });
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
  await page.screenshot({ path: `${SCREENSHOTS}/12-move-preview.png` });
});

test('13 import layout — confirmation popover', async ({ page }) => {
  // Place a turbine so there is something to overwrite.
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
  // Open the import modal.
  await page.getByRole('button', { name: 'Import CSV' }).click();
  // Paste a CSV.
  const csv = 'Latitude,Longitude,Name,Description\n55.1,7.9,Alpha,V80-2.0MW';
  await page.getByRole('textbox', { name: 'CSV to import' }).fill(csv);
  // Click Import to trigger the confirmation popover.
  await page.getByRole('button', { name: 'Import layout' }).click();
  await expect(page.getByRole('button', { name: 'Replace layout' })).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/13-import-confirm.png` });
});

test('16 mobile move mode — panel hidden, drag banner visible', async ({ page }) => {
  // Place a turbine.
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
  // Enter move mode.
  await page.getByRole('button', { name: 'Move' }).click();
  // The bottom panel should be hidden and the drag-move banner should appear.
  await expect(page.getByText(/drag or tap to move/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^move$/i })).not.toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/16-mobile-move-mode.png` });
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
  await page.screenshot({ path: `${SCREENSHOTS}/17-mobile-move-drag-preview.png` });
  // Release to confirm placement.
  await mapEl.dispatchEvent('touchend', {
    touches: [],
    changedTouches: [{ clientX: 280, clientY: 200, identifier: 0 }],
  });
  // The turbine editor panel should be back (move confirmed, view mode restored).
  await expect(page.getByRole('button', { name: /^move$/i })).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/17-mobile-move-drag-placed.png` });
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
    await page.screenshot({ path: `${SCREENSHOTS}/13-desktop-settings-popover.png` });
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
    await page.screenshot({ path: `${SCREENSHOTS}/14-desktop-turbine-popover.png` });
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
    await page.screenshot({ path: `${SCREENSHOTS}/15-desktop-move-mode.png` });
  });
});
