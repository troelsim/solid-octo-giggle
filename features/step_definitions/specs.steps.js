// Steps for turbine and fleet spec editing.

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

const SPEC_LABEL = {
  'hub height': 'Hub height',
  'rotor diameter': 'Rotor dia.',
  'rated power': 'Power',
};

function specLabel(label) {
  const key = label.toLowerCase().trim();
  const target = SPEC_LABEL[key];
  if (!target) throw new Error(`Unknown spec field: ${label}`);
  return target;
}

// ── Background table: "the fleet defaults are" ────────────────────────────

Given('the fleet defaults are', function (table) {
  if (!this.farm) this.start();
  for (const [label, value] of table.raw()) {
    this.farm.setFleetSpec(specLabel(label), Number(value));
  }
});

// ── Turbine spec actions ──────────────────────────────────────────────────

function setTurbineSpec(world, n, label, value) {
  world.farm.selectTurbine(n);
  world.farm.setSpec(specLabel(label), value);
}

When("I set turbine {int}'s hub height to {int}", function (n, v) {
  setTurbineSpec(this, n, 'hub height', v);
});
When("I set turbine {int}'s rotor diameter to {int}", function (n, v) {
  setTurbineSpec(this, n, 'rotor diameter', v);
});
When("I set turbine {int}'s rated power to {float}", function (n, v) {
  setTurbineSpec(this, n, 'rated power', v);
});

When('I reset turbine {int} to the fleet defaults', function (n) {
  this.farm.selectTurbine(n);
  this.farm.resetToFleetDefaults();
});

When("I apply turbine {int}'s specs to the whole fleet", function (n) {
  this.farm.selectTurbine(n);
  this.farm.applySpecsToAllTurbines();
});

When('I apply the fleet specs to all turbines', function () {
  this.farm.applySpecsToAllTurbines();
});

// ── Fleet spec actions ────────────────────────────────────────────────────

When('the planner changes the fleet hub height to {int}', function (v) {
  this.farm.deselect();
  this.farm.setFleetSpec('Hub height', v);
});

When('I set the fleet hub height to {int}', function (v) {
  this.farm.setFleetSpec('Hub height', v);
});

// ── Per-turbine spec assertions ───────────────────────────────────────────

function readTurbineSpec(world, n, key) {
  world.farm.selectTurbine(n);
  return world.farm.selectedSpec()[key];
}

Then('turbine {int} has hub height {int} m', function (n, expected) {
  assert.equal(readTurbineSpec(this, n, 'hubHeight'), expected);
});

Then('turbine {int} still has hub height {int} m', function (n, expected) {
  assert.equal(readTurbineSpec(this, n, 'hubHeight'), expected);
});

Then('turbine {int} has rotor diameter {int} m', function (n, expected) {
  assert.equal(readTurbineSpec(this, n, 'rotorDiameter'), expected);
});

Then('turbine {int} has rated power {float}', function (n, expected) {
  assert.equal(readTurbineSpec(this, n, 'ratedPower'), expected);
});

Then(
  'turbine {int} has the specs hub height {int} m, rotor diameter {int} m, rated power {float}',
  function (n, hub, rotor, power) {
    this.farm.selectTurbine(n);
    assert.deepEqual(this.farm.selectedSpec(), {
      hubHeight: hub,
      rotorDiameter: rotor,
      ratedPower: power,
    });
  }
);

Then('turbine {int} is flagged as custom', function (n) {
  this.farm.selectTurbine(n);
  assert.ok(this.farm.isShowingCustomBadge(), `turbine ${n} should be flagged as custom`);
});

Then('turbine {int} is not flagged as custom', function (n) {
  this.farm.selectTurbine(n);
  assert.ok(!this.farm.isShowingCustomBadge(), `turbine ${n} should not be flagged as custom`);
});

Then('the selected turbine has hub height {int} m', function (expected) {
  assert.equal(this.farm.selectedSpec().hubHeight, expected);
});

// ── Fleet spec assertions ─────────────────────────────────────────────────

Then('the fleet hub height is {int} m', function (expected) {
  if (this.farm.panelView() !== 'fleet') this.farm.deselect();
  assert.equal(this.farm.fleetSpec().hubHeight, expected);
});

Then(
  'the fleet specs are hub height {int}, rotor diameter {int}, rated power {float}',
  function (hub, rotor, power) {
    if (this.farm.panelView() !== 'fleet') this.farm.deselect();
    assert.deepEqual(this.farm.fleetSpec(), {
      hubHeight: hub,
      rotorDiameter: rotor,
      ratedPower: power,
    });
  }
);

Then('the stored fleet hub height is {int}', function (expected) {
  assert.equal(this.farm.storedLayout().fleet.hubHeight, expected);
});
