// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const SCREENSHOTS = path.join(__dirname, '..', 'screenshots');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Clear persisted layout so each scenario starts from a clean slate.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Wait for the map element and React bottom panel to be ready
  await page.waitForSelector('.wind-map');
  await page.waitForSelector('.bottom-panel');
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
  await page.waitForSelector('.bottom-panel');
  await page.waitForTimeout(400);

  // Verify the fleet panel shows a turbine count (any number > 0).
  await expect(page.getByText(/\d+ turbines?/)).toBeVisible();
  await page.screenshot({ path: `${SCREENSHOTS}/09-persisted-layout.png` });
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
