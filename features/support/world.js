// Cucumber World — one fresh App + driver per Scenario.
//
// The driver is the same Application Driver (src/test-support/WindFarmDriver.js)
// the test suite has always used. Steps translate Gherkin sentences into driver
// calls plus assertions; they never reach into the DOM directly.

import { setWorldConstructor, World, Before, After } from '@cucumber/cucumber';
import { cleanup } from '@testing-library/react';
// Loading the package's index registers the BeforeAll hook that wires the
// Allure runtime to Cucumber's `world.attach`.
import 'allure-cucumberjs';
import { createWindFarm, clearStorage } from '../../src/test-support/WindFarmDriver';

const MOBILE_MATCH_MEDIA = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

const DESKTOP_MATCH_MEDIA = (query) => ({
  matches: query === '(min-width: 640px)',
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

class WindFarmWorld extends World {
  /**
   * Boot a fresh App and stash the driver on the world. Tears down any
   * previously-mounted App so a single scenario can simulate a restart.
   */
  start(options = {}) {
    if (this.farm) cleanup();
    this.farm = createWindFarm(options);
  }

  /** Switch the matchMedia stub to report a desktop viewport (≥640 px). */
  useDesktopViewport() {
    window.matchMedia = DESKTOP_MATCH_MEDIA;
    global.matchMedia = DESKTOP_MATCH_MEDIA;
  }

  /** Switch the matchMedia stub back to mobile (the default). */
  useMobileViewport() {
    window.matchMedia = MOBILE_MATCH_MEDIA;
    global.matchMedia = MOBILE_MATCH_MEDIA;
  }

  /** Install a navigator.geolocation that resolves with given coords. */
  resolveGeolocationWith(latitude, longitude) {
    this.geolocationCalled = false;
    const world = this;
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success) => {
          world.geolocationCalled = true;
          success({ coords: { latitude, longitude } });
        },
      },
      writable: true,
      configurable: true,
    });
  }

  /** Install a navigator.geolocation that rejects (user denied / unavailable). */
  rejectGeolocation() {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_success, error) => error(new Error('User denied')),
      },
      writable: true,
      configurable: true,
    });
  }

  /** Remove navigator.geolocation entirely (default for JSDOM). */
  removeGeolocation() {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
}

setWorldConstructor(WindFarmWorld);

// Each scenario starts with an empty localStorage, mobile viewport, and a clean DOM.
Before(function () {
  clearStorage();
  window.matchMedia = MOBILE_MATCH_MEDIA;
  global.matchMedia = MOBILE_MATCH_MEDIA;
  this.removeGeolocation();
});

After(function () {
  cleanup();
  clearStorage();
});
