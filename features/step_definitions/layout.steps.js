// Steps for clear-layout, export/import, and persistence.

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

// ── Clear layout ──────────────────────────────────────────────────────────

When('I click Clear layout', function () {
  this.farm.clearLayout();
});

When('I confirm the clear-layout', function () {
  this.farm.confirmClearLayout();
});

Then('the Clear layout button is visible', function () {
  assert.ok(this.farm.hasClearLayoutButton());
});

Then('the Clear layout button is not visible', function () {
  assert.ok(!this.farm.hasClearLayoutButton());
});

Then('the clear-layout popover is visible', function () {
  assert.ok(this.farm.isClearPopoverVisible());
});

Then('the clear-layout popover is not visible', function () {
  assert.ok(!this.farm.isClearPopoverVisible());
});

Then('the clear-layout popover title mentions {int} turbines', function (n) {
  const title = this.farm.clearPopoverTitle();
  assert.ok(title, 'clear-layout popover title should be visible');
  assert.match(title, new RegExp(`clear all ${n} turbines\\?`, 'i'));
});

// ── Export ────────────────────────────────────────────────────────────────

When('I export the layout as CSV', function () {
  this.farm.exportLayoutCsv();
});

Then('the exported CSV is', function (expected) {
  assert.equal(this.farm.exportedCsvText(), expected);
});

Then('the exported CSV text is fully selected', function () {
  const csv = this.farm.exportedCsvText();
  assert.deepEqual(this.farm.exportedCsvSelection(), { start: 0, end: csv.length });
});

// ── Import ────────────────────────────────────────────────────────────────

When('I open the import modal', function () {
  this.farm.openImportModal();
});

When('I paste the following CSV', function (csv) {
  this.farm.pasteImportCsv(csv);
});

When('I submit the import', function () {
  this.farm.submitImport();
});

When('I confirm the import', function () {
  this.farm.confirmImport();
});

When('I dismiss the import confirmation', function () {
  this.farm.dismissImportConfirm();
});

Then('the import confirmation popover is visible', function () {
  assert.ok(this.farm.isImportConfirmVisible());
});

Then('the import confirmation popover is not visible', function () {
  assert.ok(!this.farm.isImportConfirmVisible());
});

Then('the import modal is not visible', function () {
  assert.ok(!this.farm.isImportModalVisible());
});

Then('the import submit button is disabled', function () {
  assert.ok(this.farm.isImportSubmitDisabled());
});

Then('an import error is shown', function () {
  assert.ok(this.farm.importErrorText(), 'expected an import error to be shown');
});

Then('the import error contains {string}', function (fragment) {
  const err = this.farm.importErrorText();
  assert.ok(err, 'expected an import error');
  assert.ok(
    err.includes(fragment),
    `expected import error to contain "${fragment}", got "${err}"`
  );
});

// ── Stored layout assertions ──────────────────────────────────────────────

Then('the stored layout has {int} turbine', function (n) {
  assert.equal(this.farm.storedLayout().turbines.length, n);
});

Then('the stored layout has {int} turbines', function (n) {
  assert.equal(this.farm.storedLayout().turbines.length, n);
});

Then('the stored layout has at least {int} turbine', function (n) {
  assert.ok(this.farm.storedLayout().turbines.length >= n);
});

Then(
  'the first stored turbine has lat {float}, lng {float}, name {string}',
  function (lat, lng, name) {
    const t = this.farm.storedLayout().turbines[0];
    assert.ok(Math.abs(t.lat - lat) < 1e-6, `lat ${t.lat} ≠ ${lat}`);
    assert.ok(Math.abs(t.lng - lng) < 1e-6, `lng ${t.lng} ≠ ${lng}`);
    assert.equal(t.name, name);
  }
);

Then(
  'the first stored turbine has custom specs rotor diameter {int}, rated power {float}, hub height {int}',
  function (rotor, power, hub) {
    const t = this.farm.storedLayout().turbines[0];
    assert.deepEqual(t.custom, {
      rotorDiameter: rotor,
      ratedPower: power,
      hubHeight: hub,
    });
  }
);

Then('the first stored turbine has no custom specs', function () {
  assert.equal(this.farm.storedLayout().turbines[0].custom, null);
});

// Names in feature files use \n to denote newlines; unescape here.
Then('the first stored turbine has name {string}', function (raw) {
  const expected = raw.replace(/\\n/g, '\n');
  assert.equal(this.farm.storedLayout().turbines[0].name, expected);
});

Then(
  'the stored turbine IDs are all unique and number {int}',
  function (count) {
    const ids = this.farm.storedLayout().turbines.map((t) => t.id);
    assert.equal(ids.length, count);
    assert.equal(new Set(ids).size, count);
  }
);
