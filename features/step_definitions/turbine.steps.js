// Steps for turbine placement, selection, deletion, naming, and movement.

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

// ── Placement ─────────────────────────────────────────────────────────────

Given('I have placed a turbine', function () {
  this.farm.addTurbine();
});

Given('I have placed {int} turbines', function (n) {
  for (let i = 0; i < n; i++) this.farm.addTurbine();
});

When('I place a turbine on the map', function () {
  this.farm.addTurbine();
});

// ── Selection / deselection ───────────────────────────────────────────────

When('I select turbine {int}', function (n) {
  this.farm.selectTurbine(n);
});

When('I deselect the current turbine', function () {
  this.farm.deselect();
});

Then('turbine {int} is selected', function (n) {
  assert.equal(this.farm.selectedTurbineNumber(), n);
});

Then('the turbine editor panel is showing', function () {
  assert.equal(this.farm.panelView(), 'turbine');
});

Then('the fleet defaults panel is showing', function () {
  assert.equal(this.farm.panelView(), 'fleet');
});

// ── Counts ────────────────────────────────────────────────────────────────

Then('there is {int} turbine on the map', function (n) {
  assert.equal(this.farm.turbineCount(), n);
});

Then('there are {int} turbines on the map', function (n) {
  assert.equal(this.farm.turbineCount(), n);
});

Then('there is at least {int} turbine on the map', function (n) {
  assert.ok(
    this.farm.turbineCount() >= n,
    `Expected at least ${n} turbine(s), got ${this.farm.turbineCount()}`
  );
});

// ── Mode ──────────────────────────────────────────────────────────────────

Then('the current mode is {string}', function (mode) {
  assert.equal(this.farm.currentMode(), mode);
});

When('I press Escape', function () {
  this.farm.exitAddMode();
});

When('I click Cancel', function () {
  this.farm.cancelAction();
});

// ── Deletion ──────────────────────────────────────────────────────────────

When('I delete the selected turbine', function () {
  this.farm.deleteSelectedTurbine();
});

When('I confirm the deletion', function () {
  this.farm.confirmDeleteTurbine();
});

Then('the delete confirmation popover is visible', function () {
  assert.ok(this.farm.isDeletePopoverVisible(), 'delete popover should be visible');
});

Then('the delete confirmation popover is not visible', function () {
  assert.ok(!this.farm.isDeletePopoverVisible(), 'delete popover should not be visible');
});

// ── Move mode ─────────────────────────────────────────────────────────────

When('I click Move on the selected turbine', function () {
  this.farm.startMovingSelectedTurbine();
});

When('I tap the map to confirm the move', function () {
  this.farm.confirmMove();
});

Then('the editor Move button is visible', function () {
  assert.ok(this.farm.hasMoveButton(), 'editor Move button should be visible');
});

Then('the editor Move button is not visible', function () {
  assert.ok(!this.farm.hasMoveButton(), 'editor Move button should not be visible');
});

Then('the editor Delete button is visible', function () {
  assert.ok(this.farm.hasDeleteButton(), 'editor Delete button should be visible');
});

Then('the editor Delete button is not visible', function () {
  assert.ok(!this.farm.hasDeleteButton(), 'editor Delete button should not be visible');
});

Then('the move banner is visible', function () {
  assert.ok(this.farm.isMoveBannerVisible(), 'drag-to-move banner should be visible');
});

// ── Renaming ──────────────────────────────────────────────────────────────

When('I rename the selected turbine to {string}', function (name) {
  this.farm.renameTurbine(name);
});

Then('the turbine name input shows {string}', function (expected) {
  assert.equal(this.farm.turbineNameInputValue(), expected);
});

Then(
  'the turbine name input is empty with placeholder {string}',
  function (placeholder) {
    assert.equal(this.farm.turbineNameInputValue(), '');
    assert.equal(this.farm.turbineNameInputPlaceholder(), placeholder);
  }
);

Then("turbine {int}'s marker is labelled {string}", function (n, expected) {
  assert.equal(this.farm.turbineMarkerLabel(n), expected);
});

Then('the turbine name input is visible', function () {
  assert.ok(this.farm.hasTurbineNameInput());
});

Then('the turbine name input is not visible', function () {
  assert.ok(!this.farm.hasTurbineNameInput());
});
