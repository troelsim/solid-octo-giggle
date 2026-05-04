// Cucumber bootstrap — runs before any step or world file is loaded.
//
// Three things have to happen, in this order, before App.js can be required:
//   1. JSDOM globals exist  (React's render targets the global document)
//   2. The CRA Babel preset is installed as a require-time transform
//      so JSX in App.js + the driver compiles on the fly
//   3. `import './WindMap'` resolves to the testable stub in __mocks__/
//      (the real one pulls in Leaflet, which can't run in JSDOM)

// ── 1. JSDOM ──────────────────────────────────────────────────────────────
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
const { window } = dom;

global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.HTMLElement = window.HTMLElement;
global.HTMLInputElement = window.HTMLInputElement;
global.HTMLButtonElement = window.HTMLButtonElement;
global.HTMLTextAreaElement = window.HTMLTextAreaElement;
global.Element = window.Element;
global.Node = window.Node;
global.Event = window.Event;
global.MouseEvent = window.MouseEvent;
global.KeyboardEvent = window.KeyboardEvent;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.localStorage = window.localStorage;
global.matchMedia = () => ({
  matches: false,
  media: '',
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});
window.matchMedia = global.matchMedia;
// React 19 reads navigator.userAgent during act() — JSDOM's UA contains
// "jsdom" by default which is fine, but make sure it exists.

// ── 2a. Stub `.css` imports — React components import their own stylesheet,
// which Node has no idea what to do with.  Register a no-op require hook.
require.extensions['.css'] = () => null;
require.extensions['.svg'] = () => null;

// ── 2b. Babel transform for JSX / ES modules ──────────────────────────────
require('@babel/register')({
  extensions: ['.js', '.jsx'],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  // Compile our own source + the driver, but leave node_modules alone.
  ignore: [/node_modules/],
});

// ── 3. Module alias: src/WindMap.js → src/__mocks__/WindMap.js ────────────
// Replicates the behaviour of `jest.mock('../../WindMap')` that the unit-test
// suite uses, but at the Node module-resolution layer so it works for any
// require()/import path that ends in `WindMap.js` inside src/.
const path = require('path');
const Module = require('module');
const realResolve = Module._resolveFilename;
const mockPath = path.resolve(__dirname, '../../src/__mocks__/WindMap.js');
const realPath = path.resolve(__dirname, '../../src/WindMap.js');

Module._resolveFilename = function patchedResolve(request, parent, ...rest) {
  const resolved = realResolve.call(this, request, parent, ...rest);
  return resolved === realPath ? mockPath : resolved;
};

// (jest-dom matchers are intentionally NOT loaded here — they require Jest's
//  global `expect`, which Cucumber doesn't provide.  Steps throw plain
//  Errors, which is enough.)
