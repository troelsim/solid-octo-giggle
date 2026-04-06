// Application Driver — the "how" lives here so tests only express "what".
//
// This is the Application Driver pattern (Freeman & Pryce, GOOS):
// a domain-language facade over React Testing Library.  It translates
// business-level intents ("add a turbine", "set hub height to 140") into
// the RTL calls that make those things happen.
//
// Tests never touch `screen` or `userEvent` directly; if the DOM structure
// changes, only this file needs updating.
//
// Usage:
//   const farm = createWindFarm();
//   farm.addTurbine();
//   expect(farm.turbineCount()).toBe(1);
//
// Note: call jest.mock('../../WindMap') in each test file before importing
// this driver so that Leaflet is replaced by the testable stub.

import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { STORAGE_KEY } from '../hooks/useLayoutStorage';

// ---------------------------------------------------------------------------
// Storage helpers — call these BEFORE createWindFarm() to seed state, or
// AFTER actions to assert on what was saved.
// ---------------------------------------------------------------------------

/** Pre-populate localStorage so the next App mount loads that data. */
export function seedStorage(layout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

/** Wipe the layout key. Useful in beforeEach to isolate tests. */
export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Read the currently-saved layout (or null if nothing saved). */
export function readStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ---------------------------------------------------------------------------
// Factory — returns the driver object bound to a freshly-rendered App
//
// Options:
//   storage — pre-seeded layout ({ turbines, fleet }) to load from storage.
//             If omitted the storage key is cleared so each test starts clean.
// ---------------------------------------------------------------------------
export function createWindFarm({ storage } = {}) {
  // Always start from a known-clean storage state so tests don't bleed into
  // each other.  Callers that need pre-loaded data pass it via `storage`.
  clearStorage();
  if (storage) seedStorage(storage);

  render(<App />);

  /** Re-mount the App as if the browser were reloaded (localStorage survives). */
  function reload() {
    cleanup();
    render(<App />);
  }

  // ── private helpers ──────────────────────────────────────────────────────

  // Finds a number input by the visible label text next to it.
  // Works because each SpecField renders: .spec-field > .spec-label + .spec-input-wrap > input
  function specInput(labelText) {
    const labelEl = screen.getByText(labelText);
    return within(labelEl.closest('.spec-field')).getByRole('spinbutton');
  }

  // Sets a numeric input value via a synthetic change event.
  // fireEvent.change is preferred over userEvent.type for controlled number
  // inputs because it avoids intermediate partial values that the validation
  // guard (v > 0) could reject.
  function changeSpec(labelText, value) {
    fireEvent.change(specInput(labelText), { target: { value: String(value) } });
  }

  // ── actions (return void; they mutate app state) ─────────────────────────

  return {
    /** Enter add-turbine mode, then tap the map to place a turbine. */
    addTurbine(location = { lat: 55.5, lng: 7.9 }) {
      userEvent.click(screen.getByRole('button', { name: /add turbine/i }));
      userEvent.click(screen.getByTestId('map-surface'));
    },

    /** Click a turbine marker on the map by its 1-based display number. */
    selectTurbine(number) {
      userEvent.click(screen.getByRole('button', { name: `Turbine ${number}` }));
    },

    /** Click Delete in the selected-turbine panel to open the confirmation popover. */
    deleteSelectedTurbine() {
      // Only one Delete button exists while the popover is closed.
      userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    },

    /** Click the confirm Delete button inside the delete confirmation popover. */
    confirmDeleteTurbine() {
      // When the popover is open there are two Delete buttons; the confirm
      // button is rendered via FloatingPortal at the end of <body>, so it
      // is last in DOM order.
      const btns = screen.getAllByRole('button', { name: /^delete$/i });
      userEvent.click(btns[btns.length - 1]);
    },

    /** True when the delete confirmation popover is visible. */
    isDeletePopoverVisible() {
      // Two Delete buttons means the popover is open (trigger + confirm).
      return screen.queryAllByRole('button', { name: /^delete$/i }).length > 1;
    },

    /** Click Move to enter move mode for the selected turbine. */
    startMovingSelectedTurbine() {
      userEvent.click(screen.getByRole('button', { name: /^move$/i }));
    },

    /** Tap the map to confirm a pending move. */
    confirmMove() {
      userEvent.click(screen.getByTestId('map-surface'));
    },

    /** Click Cancel to abort add or move mode. */
    cancelAction() {
      userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    },

    /** Click × to deselect the current turbine. */
    deselect() {
      userEvent.click(screen.getByRole('button', { name: /deselect/i }));
    },

    /**
     * Update a spec field on the currently-selected turbine.
     * @param {'Hub height'|'Rotor dia.'|'Power'} field  visible label text
     * @param {number} value
     */
    setSpec(field, value) {
      changeSpec(field, value);
    },

    /**
     * Update a fleet-default spec field (visible when no turbine is selected).
     * Same mechanics as setSpec; named separately for readability in tests.
     */
    setFleetSpec(field, value) {
      changeSpec(field, value);
    },

    /** Click "Reset to fleet" to remove the selected turbine's custom override. */
    resetToFleetDefaults() {
      userEvent.click(screen.getByRole('button', { name: /reset to fleet/i }));
    },

    /**
     * Click "Set as fleet defaults" (custom turbine) or "Apply to all turbines"
     * (non-custom turbine / fleet panel).  Both propagate specs fleet-wide.
     */
    applySpecsToAllTurbines() {
      userEvent.click(
        screen.getByRole('button', { name: /set as fleet defaults|apply to all/i })
      );
    },

    // ── queries (return values; they do not change state) ──────────────────

    /** Number of turbine markers currently on the map. */
    turbineCount() {
      return screen.queryAllByTestId('turbine-marker').length;
    },

    /**
     * 1-based number shown in the panel title when a turbine is selected,
     * or null when the fleet defaults panel is showing.
     * Reads from the editable name input's value or placeholder.
     */
    selectedTurbineNumber() {
      const input = screen.queryByRole('textbox', { name: /turbine name/i });
      if (!input) return null;
      const text = input.value || input.placeholder;
      const match = text.match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
    },

    /** Effective spec values shown in the panel for the selected turbine. */
    selectedSpec() {
      return {
        hubHeight: parseFloat(specInput('Hub height').value),
        rotorDiameter: parseFloat(specInput('Rotor dia.').value),
        ratedPower: parseFloat(specInput('Power').value),
      };
    },

    /** Fleet default values (call when no turbine is selected). */
    fleetSpec() {
      return {
        hubHeight: parseFloat(specInput('Hub height').value),
        rotorDiameter: parseFloat(specInput('Rotor dia.').value),
        ratedPower: parseFloat(specInput('Power').value),
      };
    },

    /** True when the "custom" badge is visible in the turbine panel. */
    isShowingCustomBadge() {
      return !!screen.queryByText('custom');
    },

    /** Current interaction mode as seen by the map: 'view' | 'add' | 'move'. */
    currentMode() {
      return screen.getByTestId('wind-map').dataset.mode;
    },

    /** Rename the currently selected turbine. */
    renameTurbine(name) {
      const input = screen.getByRole('textbox', { name: /turbine name/i });
      fireEvent.change(input, { target: { value: name } });
    },

    /** Which panel is visible: 'turbine' (selection) or 'fleet' (defaults). */
    panelView() {
      return screen.queryByRole('textbox', { name: /turbine name/i }) ? 'turbine' : 'fleet';
    },

    /** Click the spacing ring toggle button. */
    clickRingToggle() {
      userEvent.click(screen.getByRole('button', { name: /spacing ring/i }));
    },

    /** True when the ring-configuration popover is visible. */
    isRingPopoverVisible() {
      return !!screen.queryByText('Spacing ring');
    },

    /** The current value of the rotor-diameters input in the popover. */
    ringDiametersValue() {
      return parseFloat(screen.getByRole('spinbutton', { name: /rotor diameters/i }).value);
    },

    /** Change the rotor-diameters input in the popover. */
    setRingDiameters(value) {
      fireEvent.change(
        screen.getByRole('spinbutton', { name: /rotor diameters/i }),
        { target: { value: String(value) } }
      );
    },

    /** Click "Show ring" to confirm and enable the spacing ring. */
    confirmRingPopover() {
      userEvent.click(screen.getByRole('button', { name: /show ring/i }));
    },

    /** Click "Clear layout" to open the confirmation popover. */
    clearLayout() {
      userEvent.click(screen.getByRole('button', { name: /clear layout/i }));
    },

    /** Click "Clear all" in the confirmation popover to confirm clearing. */
    confirmClearLayout() {
      userEvent.click(screen.getByRole('button', { name: /clear all/i }));
    },

    /** True when the clear-layout confirmation popover is visible. */
    isClearPopoverVisible() {
      return !!screen.queryByRole('button', { name: /clear all/i });
    },

    /** True when the WindMap has spacing ring rendering enabled. */
    isSpacingRingEnabled() {
      return screen.getByTestId('wind-map').dataset.showSpacingRing === 'true';
    },

    /** The rotor-diameter multiplier currently passed to the WindMap. */
    spacingRingDiameters() {
      return parseFloat(screen.getByTestId('wind-map').dataset.spacingRingDiameters);
    },

    /** Simulate a user panning/zooming the map to [56.0, 8.5] at zoom 12. */
    changeMapView() {
      userEvent.click(screen.getByTestId('map-view-change'));
    },

    /** Current center [lat, lng] that the WindMap is receiving. */
    mapCenter() {
      return JSON.parse(screen.getByTestId('wind-map').dataset.center);
    },

    /** Current zoom level that the WindMap is receiving. */
    mapZoom() {
      return parseInt(screen.getByTestId('wind-map').dataset.zoom, 10);
    },

    /** The layout currently saved in localStorage, or null if nothing saved. */
    storedLayout() {
      return readStorage();
    },

    /**
     * Simulate a browser page reload: unmounts the App, then mounts it fresh.
     * localStorage is preserved, so persisted state is restored.
     */
    reload,
  };
}
