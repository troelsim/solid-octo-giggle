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

import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// ---------------------------------------------------------------------------
// Factory — returns the driver object bound to a freshly-rendered App
// ---------------------------------------------------------------------------
export function createWindFarm() {
  render(<App />);

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

    /** Click Delete in the selected-turbine panel. */
    deleteSelectedTurbine() {
      userEvent.click(screen.getByRole('button', { name: /delete/i }));
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
     */
    selectedTurbineNumber() {
      const title = screen.queryByText(/Turbine \d+/);
      if (!title) return null;
      const match = title.textContent.match(/\d+/);
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

    /** Which panel is visible: 'turbine' (selection) or 'fleet' (defaults). */
    panelView() {
      return screen.queryByText(/Turbine \d+/) ? 'turbine' : 'fleet';
    },
  };
}
