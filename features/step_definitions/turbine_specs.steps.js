// Step definitions for `customising-turbine-specs.feature`.
//
// All UI mechanics live in the Application Driver (WindFarmDriver.js).
// These steps only translate Gherkin sentences into driver calls plus
// assertions — they contain no `screen`, `userEvent` or DOM lookups.

import { Given, When, Then, DataTableType } from '@cucumber/cucumber';

// ── Background ────────────────────────────────────────────────────────────

const SPEC_FIELD = {
  'hub height': 'Hub height',
  'rotor diameter': 'Rotor dia.',
  'rated power': 'Power',
};

const SPEC_KEY = {
  'hub height': 'hubHeight',
  'rotor diameter': 'rotorDiameter',
  'rated power': 'ratedPower',
};

Given('the fleet defaults are', function (table) {
  // Boot the app first so we can drive the fleet panel.
  this.start();
  // The default fleet from useLayoutStorage matches the values in the
  // feature's Background table (120 / 150 / 5), so we only have to push
  // any row that explicitly differs.  We do this by reading the existing
  // values and applying overrides.
  const rows = table.raw();
  for (const [label, value] of rows) {
    const key = label.toLowerCase().trim();
    const field = SPEC_FIELD[key];
    if (!field) throw new Error(`Unknown spec field: ${label}`);
    this.farm.setFleetSpec(field, Number(value));
  }
});

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

// ── Selecting / editing a turbine ─────────────────────────────────────────

// One step bound to both Given and When (Cucumber matches by sentence,
// not by keyword, so the step reads naturally in either context).
function setHubHeight(world, n, value) {
  world.farm.selectTurbine(n);
  world.farm.setSpec('Hub height', value);
}
Given("I set turbine {int}'s hub height to {int}", function (n, value) {
  setHubHeight(this, n, value);
});

When('I reset turbine {int} to the fleet defaults', function (n) {
  this.farm.selectTurbine(n);
  this.farm.resetToFleetDefaults();
});

When("I apply turbine {int}'s specs to the whole fleet", function (n) {
  this.farm.selectTurbine(n);
  this.farm.applySpecsToAllTurbines();
});

// ── Fleet panel actions ───────────────────────────────────────────────────

When('the planner changes the fleet hub height to {int}', function (value) {
  this.farm.deselect();
  this.farm.setFleetSpec('Hub height', value);
});

// ── Assertions on a single turbine ────────────────────────────────────────

function readSelectedSpec(world, turbineNumber, key) {
  world.farm.selectTurbine(turbineNumber);
  return world.farm.selectedSpec()[key];
}

Then('turbine {int} has hub height {int} m', function (n, expected) {
  const actual = readSelectedSpec(this, n, 'hubHeight');
  if (actual !== expected) {
    throw new Error(`Expected turbine ${n} hub height ${expected} m, got ${actual} m`);
  }
});

Then('turbine {int} still has hub height {int} m', function (n, expected) {
  const actual = readSelectedSpec(this, n, 'hubHeight');
  if (actual !== expected) {
    throw new Error(`Expected turbine ${n} to still have hub height ${expected} m, got ${actual} m`);
  }
});

Then('turbine {int} has rotor diameter {int} m', function (n, expected) {
  const actual = readSelectedSpec(this, n, 'rotorDiameter');
  if (actual !== expected) {
    throw new Error(`Expected turbine ${n} rotor diameter ${expected} m, got ${actual} m`);
  }
});

Then('turbine {int} is flagged as custom', function (n) {
  this.farm.selectTurbine(n);
  if (!this.farm.isShowingCustomBadge()) {
    throw new Error(`Expected turbine ${n} to be flagged as custom, but the badge is not visible`);
  }
});

Then('turbine {int} is not flagged as custom', function (n) {
  this.farm.selectTurbine(n);
  if (this.farm.isShowingCustomBadge()) {
    throw new Error(`Expected turbine ${n} not to be flagged as custom, but the badge is visible`);
  }
});

// ── Assertions on the fleet ───────────────────────────────────────────────

Then('the fleet hub height is {int} m', function (expected) {
  this.farm.deselect();
  const actual = this.farm.fleetSpec().hubHeight;
  if (actual !== expected) {
    throw new Error(`Expected fleet hub height ${expected} m, got ${actual} m`);
  }
});
