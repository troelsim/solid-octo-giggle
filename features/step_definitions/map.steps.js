// Steps for the map: view, panning, spacing ring, and pack-area.

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';

// ── Map view ──────────────────────────────────────────────────────────────

When('the map view changes', function () {
  this.farm.changeMapView();
});

Then(
  'the map is centred on {float}, {float} at zoom {int}',
  function (lat, lng, zoom) {
    assert.deepEqual(this.farm.mapCenter(), [lat, lng]);
    assert.equal(this.farm.mapZoom(), zoom);
  }
);

Then(
  'the stored map view is centred on {float}, {float} at zoom {int}',
  function (lat, lng, zoom) {
    assert.deepEqual(this.farm.storedLayout().mapView, {
      center: [lat, lng],
      zoom,
    });
  }
);

When('I middle-mouse drag the map', function () {
  this.mapCenterBeforeDrag = this.farm.mapCenter();
  this.farm.middleMouseDragMap();
});

Then('the map view has changed', function () {
  assert.notDeepEqual(this.farm.mapCenter(), this.mapCenterBeforeDrag);
});

// ── Spacing ring ──────────────────────────────────────────────────────────

When('I click the spacing ring toggle', function () {
  this.farm.clickRingToggle();
});

Given('I have clicked the spacing ring toggle', function () {
  this.farm.clickRingToggle();
});

When('I set the ring diameters to {int}', function (v) {
  this.farm.setRingDiameters(v);
});

When('I click Show ring', function () {
  this.farm.confirmRingPopover();
});

Then('the spacing ring is enabled', function () {
  assert.ok(this.farm.isSpacingRingEnabled());
});

Then('the spacing ring is not enabled', function () {
  assert.ok(!this.farm.isSpacingRingEnabled());
});

Then('the spacing ring uses {int} rotor diameters', function (n) {
  assert.equal(this.farm.spacingRingDiameters(), n);
});

Then('the spacing ring popover is visible', function () {
  assert.ok(this.farm.isRingPopoverVisible());
});

Then('the spacing ring popover is not visible', function () {
  assert.ok(!this.farm.isRingPopoverVisible());
});

// ── Pack area ─────────────────────────────────────────────────────────────

When('I click Pack area', function () {
  this.farm.startPackArea();
});

When('I add polygon vertices', function (table) {
  const points = table.raw().map(([lat, lng]) => ({ lat: Number(lat), lng: Number(lng) }));
  this.farm.addPolygonVertices(points);
});

When('I click Fill', function () {
  this.farm.confirmPackArea();
});

Then('the polygon has {int} vertices', function (n) {
  assert.equal(this.farm.polygonVertexCount(), n);
});

Then('the Fill button is enabled', function () {
  assert.ok(this.farm.isFillEnabled());
});

Then('the Fill button is disabled', function () {
  assert.ok(!this.farm.isFillEnabled());
});

Then('the draw banner is visible', function () {
  assert.ok(this.farm.isDrawBannerVisible());
});

// ── Counting + remembered value ───────────────────────────────────────────

When('I remember the current turbine count as {string}', function (label) {
  this.rememberedCounts ??= {};
  this.rememberedCounts[label] = this.farm.turbineCount();
});

Then('the turbine count is less than the {string} count', function (label) {
  const ref = this.rememberedCounts?.[label];
  if (typeof ref !== 'number') {
    throw new Error(`No remembered count for "${label}"`);
  }
  const current = this.farm.turbineCount();
  assert.ok(current < ref, `expected ${current} < ${ref}`);
});
