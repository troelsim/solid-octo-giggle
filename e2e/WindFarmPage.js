// @ts-check
// e2e Page Object — the "how" lives here so scenarios only express "what".
//
// Mirrors the Application Driver pattern used in unit tests
// (src/test-support/WindFarmDriver.js) but targets the live Playwright page
// rather than JSDOM + RTL.
//
// Usage:
//   const farm = new WindFarmPage(page);
//   await farm.placeTurbine();
//   await farm.expectTurbineEditorVisible();

const { expect } = require('@playwright/test');

class WindFarmPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ── setup ──────────────────────────────────────────────────────────────────

  /** Navigate to the app and start from a clean localStorage slate. */
  async goto() {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.reload();
    await this.page.waitForSelector('.wind-map');
    await this.page.waitForSelector('.app-header');
    await expect(this.page.getByRole('button', { name: 'Add turbine' })).toBeVisible();
  }

  // ── actions ────────────────────────────────────────────────────────────────

  /** Click the Add turbine header button to enter add mode. */
  async enterAddMode() {
    await this.page.getByRole('button', { name: 'Add turbine' }).click();
    await expect(this.page.getByText(/tap or drag to place|click the map to place/i)).toBeVisible();
  }

  /**
   * Place a turbine by clicking the map at the given coordinates.
   * Waits for the turbine editor panel (Move button) to confirm placement.
   * @param {{ x: number, y: number }} [pos]
   */
  async placeTurbine(pos = { x: 195, y: 300 }) {
    await this.page.locator('.wind-map').click(pos);
    await expect(this.page.getByRole('button', { name: 'Move' })).toBeVisible();
  }

  /**
   * Place a turbine using page.mouse (pure mouse events, no touch synthesis).
   * Required in hasTouch contexts to avoid Leaflet's tap module firing a
   * second synthetic click that lands on the newly-placed marker.
   * @param {{ x: number, y: number }} pos
   */
  async placeTurbineMouse(pos) {
    const box = await this.page.locator('.wind-map').boundingBox();
    await this.page.mouse.click(box.x + pos.x, box.y + pos.y);
  }

  /** Click the Deselect button to return to the fleet panel. */
  async deselect() {
    await this.page.getByRole('button', { name: 'Deselect' }).click();
    await expect(this.page.getByText('Fleet defaults')).toBeVisible();
  }

  /** Click Move to enter move mode for the currently-selected turbine. */
  async enterMoveMode() {
    await this.page.getByRole('button', { name: 'Move' }).click();
    await expect(this.page.getByText(/drag or tap to move|click the map to move/i)).toBeVisible();
  }

  /** Click Delete to open the delete confirmation popover. */
  async openDeletePopover() {
    await this.page.getByRole('button', { name: 'Delete' }).click();
    await expect(this.page.getByText(/delete turbine \d+\?/i)).toBeVisible();
  }

  /** Click Clear layout to open the clear confirmation popover. */
  async openClearPopover() {
    await this.page.getByRole('button', { name: 'Clear layout' }).click();
    await expect(this.page.getByText(/clear all \d+ turbines\?/i)).toBeVisible();
  }

  /**
   * Open the mobile header's overflow ("⋯") menu if present.
   * On desktop the trigger isn't rendered and this is a no-op.
   */
  async openOverflowMenuIfPresent() {
    const trigger = this.page.getByRole('button', { name: 'More actions' });
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click();
    }
  }

  /** Click Export CSV to open the export panel. */
  async openExport() {
    await this.openOverflowMenuIfPresent();
    await this.page.getByRole('button', { name: 'Export CSV' }).click();
    await expect(this.page.getByRole('textbox', { name: 'Layout CSV export' })).toBeVisible();
  }

  /**
   * Open the import modal, fill in CSV text, and click Import layout.
   * Waits for the confirmation popover.
   * @param {string} csv
   */
  async importAndConfirm(csv) {
    await this.openOverflowMenuIfPresent();
    await this.page.getByRole('button', { name: 'Import CSV' }).click();
    await this.page.getByRole('textbox', { name: 'CSV to import' }).fill(csv);
    await this.page.getByRole('button', { name: 'Import layout' }).click();
    await expect(this.page.getByRole('button', { name: 'Replace layout' })).toBeVisible();
  }

  // ── pack-area (polygon drawing) ────────────────────────────────────────────

  /** Click the Pack-area header button to enter polygon-draw mode. */
  async enterPackAreaMode() {
    await this.page.getByRole('button', { name: 'Pack area with turbines' }).click();
    await expect(this.page.getByText(/outline an area/i)).toBeVisible();
  }

  /**
   * Place polygon vertices at the given on-map pixel coordinates.
   * Uses page.mouse.click() so Leaflet's tap module doesn't double-fire in
   * hasTouch contexts.
   * @param {Array<{x:number, y:number}>} positions
   */
  async addPolygonVertices(positions) {
    const box = await this.page.locator('.wind-map').boundingBox();
    for (const p of positions) {
      await this.page.mouse.click(box.x + p.x, box.y + p.y);
    }
  }

  /** Click Fill in the banner to pack the drawn polygon with turbines. */
  async confirmFill() {
    await this.page.getByRole('button', { name: 'Fill area with turbines' }).click();
  }

  // ── queries ────────────────────────────────────────────────────────────────

  /** Assert that the turbine count badge shows exactly `n` turbines. */
  async expectTurbineCount(n) {
    const label = n === 1 ? '1 turbine' : `${n} turbines`;
    await expect(this.page.getByText(label)).toBeVisible();
  }

  /** Assert that the turbine editor panel is visible (turbine selected). */
  async expectTurbineEditorVisible() {
    await expect(this.page.getByRole('button', { name: 'Move' })).toBeVisible();
  }

  /** Assert that the fleet defaults panel is visible (nothing selected). */
  async expectFleetPanelVisible() {
    await expect(this.page.getByText('Fleet defaults')).toBeVisible();
  }
}

module.exports = { WindFarmPage };
