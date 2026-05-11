// Steps for the fleet-settings popover, overflow menu, and miscellaneous
// panel-level assertions.

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

// ── Fleet settings popover (desktop) ──────────────────────────────────────

When('I open the fleet settings', function () {
  this.farm.openSettings();
});

When('I close the fleet settings', function () {
  this.farm.closeSettings();
});

Then('the fleet settings gear is visible', function () {
  assert.ok(this.farm.hasFleetSettingsGear());
});

Then('the fleet settings gear is not visible', function () {
  assert.ok(!this.farm.hasFleetSettingsGear());
});

Then('the fleet defaults popover is visible', function () {
  assert.ok(this.farm.isFleetDefaultsHeadingVisible());
});

Then('the fleet defaults popover is not visible', function () {
  assert.ok(!this.farm.isFleetDefaultsHeadingVisible());
});

Then('the {string} label is visible', function (label) {
  assert.ok(this.farm.hasSpecLabel(label), `expected label "${label}" to be visible`);
});

Then('the Apply-to-all button is visible', function () {
  assert.ok(this.farm.hasApplyToAllButton());
});

// ── Mobile bottom panel ───────────────────────────────────────────────────

Then('the mobile bottom panel is not rendered', function () {
  assert.ok(!this.farm.hasBottomPanel());
});

// ── Overflow menu ─────────────────────────────────────────────────────────

When('I open the overflow menu', function () {
  this.farm.openOverflowMenu();
});

Then('the More-actions trigger is visible', function () {
  assert.ok(this.farm.hasOverflowMenuTrigger());
});

Then('the More-actions trigger is not visible', function () {
  assert.ok(!this.farm.hasOverflowMenuTrigger());
});

Then('the Export CSV button is visible', function () {
  assert.ok(this.farm.hasExportButton());
});

Then('the Export CSV button is not visible', function () {
  assert.ok(!this.farm.hasExportButton());
});

Then('the Export CSV button is enabled', function () {
  assert.ok(this.farm.isExportButtonEnabled());
});

Then('the Export CSV button is disabled', function () {
  assert.ok(!this.farm.isExportButtonEnabled());
});

Then('the Import CSV button is visible', function () {
  assert.ok(this.farm.hasImportButton());
});

Then('the Import CSV button is not visible', function () {
  assert.ok(!this.farm.hasImportButton());
});
