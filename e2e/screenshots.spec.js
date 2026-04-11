// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const SCREENSHOTS = path.join(__dirname, '..', 'screenshots');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Clear persisted layout so each scenario starts from a clean slate.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Wait for the map and header to be ready (bottom-panel absent on desktop)
  await page.waitForSelector('.wind-map');
  await page.waitForSelector('.app-header');
  await page.waitForTimeout(400);
});

test('01 empty farm — fleet defaults panel', async ({ page }) => {
  await expect(page.getByText('Fleet defaults')).toBeVisible();
  await expect(page.getByText('Tap + to add turbines')).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/01-empty-farm.png` });
});

test('02 add mode — placement banner', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await expect(page.getByText('Tap the map to place a turbine')).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/02-add-mode.png` });
});

test('03 turbine placed — spec panel', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SCREENSHOTS}/03-turbine-placed.png` });
});

test('04 custom specs — badge visible', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await page.waitForTimeout(400);

  // Edit hub height if a turbine is selected
  const hubInput = page.locator('.spec-input').first();
  await hubInput.click({ clickCount: 3 });
  await hubInput.type('130');
  await hubInput.press('Tab');
  await page.waitForTimeout(200);

  await page.screenshot({ path: `${SCREENSHOTS}/04-custom-specs.png` });
});

test('05 fleet view — turbine count', async ({ page }) => {
  // Place two turbines
  for (const pos of [{ x: 120, y: 200 }, { x: 260, y: 200 }]) {
    await page.getByRole('button', { name: 'Add turbine' }).click();
    await page.locator('.wind-map').click(pos);
    await page.waitForTimeout(200);
  }
  // Deselect to show fleet panel
  await page.getByRole('button', { name: 'Deselect' }).click();
  await expect(page.getByText('2 turbines')).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/05-fleet-view.png` });
});

test('07 delete turbine — confirmation popover', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText(/delete turbine \d+\?/i)).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/07-delete-turbine-popover.png` });
});

test('08 clear layout — confirmation popover', async ({ page }) => {
  // Place two turbines then deselect to see fleet panel
  for (const pos of [{ x: 120, y: 200 }, { x: 260, y: 200 }]) {
    await page.getByRole('button', { name: 'Add turbine' }).click();
    await page.locator('.wind-map').click(pos);
    await page.waitForTimeout(200);
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
  await page.waitForTimeout(400);

  // Verify the fleet panel shows a turbine count (any number > 0).
  await expect(page.getByText(/\d+ turbines?/)).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/09-persisted-layout.png` });
});

test('10 export layout — csv text field', async ({ page }) => {
  for (const pos of [{ x: 120, y: 200 }, { x: 260, y: 200 }]) {
    await page.getByRole('button', { name: 'Add turbine' }).click();
    await page.locator('.wind-map').click(pos);
    await page.waitForTimeout(200);
  }
  await page.getByRole('button', { name: 'Deselect' }).click();
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await expect(page.getByRole('textbox', { name: 'Layout CSV export' })).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/10-export-layout.png` });
});

test('06 move mode — move banner', async ({ page }) => {
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await page.waitForTimeout(400);
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
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS}/11-add-preview.png` });
});

test('12 move mode — cursor preview ghost while original fades', async ({ page }) => {
  // Place a turbine near centre.
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await page.waitForTimeout(400);
  // Enter move mode.
  await page.getByRole('button', { name: 'Move' }).click();
  // Hover at a different position to show the ghost while the original is faded.
  await page.locator('.wind-map').hover({ position: { x: 280, y: 200 } });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SCREENSHOTS}/12-move-preview.png` });
});

test('13 import layout — confirmation popover', async ({ page }) => {
  // Place a turbine so there is something to overwrite.
  await page.getByRole('button', { name: 'Add turbine' }).click();
  await page.locator('.wind-map').click({ x: 195, y: 300 });
  await page.waitForTimeout(200);
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

// ── Desktop layout (1280 × 800, no touch) ────────────────────────────────────

test.describe('desktop layout', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false });

  test('13 desktop — settings popover shows fleet defaults', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.wind-map');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Fleet settings' }).click();
    await expect(page.getByText('Fleet defaults')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOTS}/13-desktop-settings-popover.png` });
  });

  test('14 desktop — turbine popover on turbine selection', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.wind-map');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Add turbine' }).click();
    await page.locator('.wind-map').click({ x: 640, y: 400 });
    await page.waitForTimeout(400);
    // Turbine popover should be visible with spec fields and action buttons
    await expect(page.getByRole('textbox', { name: 'Turbine name' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Move' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOTS}/14-desktop-turbine-popover.png` });
  });

  test('15 desktop — move mode hides turbine popover', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.wind-map');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Add turbine' }).click();
    await page.locator('.wind-map').click({ x: 640, y: 400 });
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Move' }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOTS}/15-desktop-move-mode.png` });
  });
});
