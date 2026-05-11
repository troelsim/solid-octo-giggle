// Setup / lifecycle steps: starting the app, viewport, geolocation, storage.

import { Given, When, Then } from '@cucumber/cucumber';

// ── App boot ──────────────────────────────────────────────────────────────

Given('the app has been started', function () {
  if (!this.farm) this.start();
});

Given('the app is restarted', function () {
  this.start();
});

// ── Viewport ──────────────────────────────────────────────────────────────

Given('the viewport is desktop', function () {
  this.useDesktopViewport();
});

Given('the viewport is mobile', function () {
  this.useMobileViewport();
});

// ── Geolocation ───────────────────────────────────────────────────────────

Given(
  'the browser geolocation resolves to latitude {float}, longitude {float}',
  function (lat, lng) {
    this.resolveGeolocationWith(lat, lng);
  }
);

Given('the browser geolocation is denied', function () {
  this.rejectGeolocation();
});

Given('the browser has no geolocation API', function () {
  this.removeGeolocation();
});

Then('the browser geolocation was not requested', function () {
  if (this.geolocationCalled) {
    throw new Error('Expected geolocation NOT to be requested, but it was');
  }
});

// ── Storage seeding ───────────────────────────────────────────────────────

Given('the stored layout is', function (docString) {
  const layout = JSON.parse(docString);
  this.start({ storage: layout });
});

Given('the storage contains the raw string {string}', function (raw) {
  this.start({ rawStorage: raw });
});

// ── Page lifecycle ────────────────────────────────────────────────────────

When('the page is reloaded', function () {
  this.farm.reload();
});
