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
//   storage    — pre-seeded layout ({ turbines, fleet }) to load from storage.
//                If omitted the storage key is cleared so each test starts clean.
//   rawStorage — raw string written directly to the storage key, bypassing
//                JSON.stringify. Use to test corrupt or schema-invalid data.
// ---------------------------------------------------------------------------
export function createWindFarm({ storage, rawStorage } = {}) {
  // Always start from a known-clean storage state so tests don't bleed into
  // each other.  Callers that need pre-loaded data pass it via `storage`.
  clearStorage();
  if (storage) seedStorage(storage);
  else if (rawStorage !== undefined) localStorage.setItem(STORAGE_KEY, rawStorage);

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

  // Tap the map surface at a specific lat/lng.  The mock reads these from
  // the host's dataset before firing onMapClick, so vertices and turbines
  // can be placed at distinct coordinates within a single test.
  function clickMapAt(lat, lng) {
    const host = screen.getByTestId('wind-map');
    host.dataset.clickLat = String(lat);
    host.dataset.clickLng = String(lng);
    userEvent.click(screen.getByTestId('map-surface'));
  }

  // On mobile the Export/Import buttons live behind a "⋯" overflow menu.
  // Desktop renders them inline, so this is a no-op there.
  function openOverflowMenuIfNeeded() {
    const trigger = screen.queryByRole('button', { name: /more actions/i });
    if (trigger) userEvent.click(trigger);
  }

  return {
    /** Enter add-turbine mode (if not already in it), then tap the map to place a turbine. */
    addTurbine(location) {
      if (screen.getByTestId('wind-map').dataset.mode !== 'add') {
        userEvent.click(screen.getByRole('button', { name: /add turbine/i }));
      }
      if (location) clickMapAt(location.lat, location.lng);
      else userEvent.click(screen.getByTestId('map-surface'));
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

    /** Press Escape to exit add or move mode. */
    exitAddMode() {
      fireEvent.keyDown(document, { key: 'Escape' });
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

    /** Open the fleet-settings popover (desktop layout, gear icon in header). */
    openSettings() {
      userEvent.click(screen.getByRole('button', { name: /fleet settings/i }));
    },

    /** True when the fleet-settings popover is visible. */
    isSettingsPopoverVisible() {
      return !!screen.queryByRole('button', { name: /fleet settings/i }) &&
        !!screen.queryByText('Fleet defaults');
    },

    /** Close the fleet-settings popover by clicking the gear button again. */
    closeSettings() {
      userEvent.click(screen.getByRole('button', { name: /fleet settings/i }));
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

    /** Build a CSV export for the current layout. */
    exportLayoutCsv() {
      openOverflowMenuIfNeeded();
      userEvent.click(screen.getByRole('button', { name: /export csv/i }));
    },

    /** Click the Import CSV button in the header to open the import modal. */
    openImportModal() {
      openOverflowMenuIfNeeded();
      userEvent.click(screen.getByRole('button', { name: /^import csv$/i }));
    },

    /** Open the mobile header's overflow ("⋯") menu. */
    openOverflowMenu() {
      userEvent.click(screen.getByRole('button', { name: /more actions/i }));
    },

    /** Whether the mobile overflow ("⋯") trigger is rendered. */
    hasOverflowMenuTrigger() {
      return screen.queryByRole('button', { name: /more actions/i }) !== null;
    },

    /** Paste CSV text into the import textarea. */
    pasteImportCsv(text) {
      fireEvent.change(
        screen.getByRole('textbox', { name: /csv to import/i }),
        { target: { value: text } }
      );
    },

    /** Click the Import button inside the modal to validate and show the confirmation. */
    submitImport() {
      userEvent.click(screen.getByRole('button', { name: /^import layout$/i }));
    },

    /** Click Replace layout in the confirmation popover to execute the import. */
    confirmImport() {
      userEvent.click(screen.getByRole('button', { name: /replace layout/i }));
    },

    /** Dismiss the import confirmation popover via Escape. */
    dismissImportConfirm() {
      fireEvent.keyDown(document, { key: 'Escape' });
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

    /** True when the header "Clear layout" button is rendered. */
    hasClearLayoutButton() {
      return !!screen.queryByRole('button', { name: /clear layout/i });
    },

    /** Visible title of the clear-layout confirmation popover, or null. */
    clearPopoverTitle() {
      const el = screen.queryByText(/clear all \d+ turbines\?/i);
      return el ? el.textContent : null;
    },

    /** True when the fleet-settings gear button is rendered (desktop only). */
    hasFleetSettingsGear() {
      return !!screen.queryByRole('button', { name: /fleet settings/i });
    },

    /** True when the "Fleet defaults" heading is in the DOM. */
    isFleetDefaultsHeadingVisible() {
      return !!screen.queryByText('Fleet defaults');
    },

    /** True when a spec field label is currently visible. */
    hasSpecLabel(label) {
      return !!screen.queryByText(label);
    },

    /** True when the "Apply to all turbines" button is rendered. */
    hasApplyToAllButton() {
      return !!screen.queryByRole('button', { name: /apply to all turbines/i });
    },

    /** True when the turbine editor's Move button is rendered. */
    hasMoveButton() {
      return !!screen.queryByRole('button', { name: /^move$/i });
    },

    /** True when the turbine editor's Delete button is rendered. */
    hasDeleteButton() {
      return !!screen.queryByRole('button', { name: /^delete$/i });
    },

    /** True when the turbine name input is rendered (i.e. turbine editor is open). */
    hasTurbineNameInput() {
      return !!screen.queryByRole('textbox', { name: /turbine name/i });
    },

    /** True when the mobile bottom panel is rendered. */
    hasBottomPanel() {
      return !!document.querySelector('.bottom-panel');
    },

    /** True when the "outline an area" draw banner is visible. */
    isDrawBannerVisible() {
      return !!screen.queryByText(/outline an area/i);
    },

    /** True when the "drag or tap to move" banner is visible. */
    isMoveBannerVisible() {
      return !!screen.queryByText(/drag or tap to move/i);
    },

    /** True when the header Export CSV button is rendered. */
    hasExportButton() {
      return !!screen.queryByRole('button', { name: /export csv/i });
    },

    /** True when the Export CSV button is enabled. */
    isExportButtonEnabled() {
      const btn = screen.queryByRole('button', { name: /export csv/i });
      return !!btn && !btn.disabled;
    },

    /** True when the header Import CSV button is rendered. */
    hasImportButton() {
      return !!screen.queryByRole('button', { name: /^import csv$/i });
    },

    /** Current value of the turbine-name input on the selected turbine. */
    turbineNameInputValue() {
      return screen.getByRole('textbox', { name: /turbine name/i }).value;
    },

    /** Placeholder of the turbine-name input on the selected turbine. */
    turbineNameInputPlaceholder() {
      return screen.getByRole('textbox', { name: /turbine name/i }).placeholder;
    },

    /** Aria-label of the n-th turbine marker (1-based). */
    turbineMarkerLabel(n) {
      const markers = screen.queryAllByTestId('turbine-marker');
      return markers[n - 1]?.getAttribute('aria-label') ?? null;
    },

    /** The rotor-diameter multiplier currently passed to the WindMap. */
    spacingRingDiameters() {
      return parseFloat(screen.getByTestId('wind-map').dataset.spacingRingDiameters);
    },

    /** Simulate a middle-mouse-button drag to pan the map. */
    middleMouseDragMap() {
      fireEvent.mouseDown(screen.getByTestId('wind-map'), { button: 1 });
    },

    /** Simulate a user panning/zooming the map to [56.0, 8.5] at zoom 12. */
    changeMapView() {
      userEvent.click(screen.getByTestId('map-view-change'));
    },

    // ── Polygon-packing actions ────────────────────────────────────────────

    /** Enter polygon-draw mode by clicking the Pack-area button. */
    startPackArea() {
      userEvent.click(screen.getByRole('button', { name: /pack area with turbines/i }));
    },

    /** Add a polygon vertex at (lat, lng) by tapping the map. */
    addPolygonVertex(lat, lng) {
      clickMapAt(lat, lng);
    },

    /** Add multiple vertices in sequence — shorthand for tests. */
    addPolygonVertices(points) {
      for (const p of points) clickMapAt(p.lat, p.lng);
    },

    /** Click Fill in the banner to pack the drawn polygon with turbines. */
    confirmPackArea() {
      userEvent.click(screen.getByRole('button', { name: /fill area with turbines/i }));
    },

    /** Current vertex count in the polygon draft (0 when not drawing). */
    polygonVertexCount() {
      return parseInt(screen.getByTestId('wind-map').dataset.polygonVertexCount, 10);
    },

    /** True when the Fill button is enabled (≥ 3 vertices). */
    isFillEnabled() {
      return !screen.getByRole('button', { name: /fill area with turbines/i }).disabled;
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

    /** CSV text currently shown in the export textarea, or null if hidden. */
    exportedCsvText() {
      const field = screen.queryByRole('textbox', { name: /layout csv export/i });
      return field ? field.value : null;
    },

    /** Current text selection bounds inside the export textarea, or null if hidden. */
    exportedCsvSelection() {
      const field = screen.queryByRole('textbox', { name: /layout csv export/i });
      if (!field) return null;
      return { start: field.selectionStart, end: field.selectionEnd };
    },

    /** True when the CSV import modal dialog is visible. */
    isImportModalVisible() {
      return !!screen.queryByRole('dialog', { name: /csv import modal/i });
    },

    /** True when the import confirmation popover is visible. */
    isImportConfirmVisible() {
      return !!screen.queryByRole('button', { name: /replace layout/i });
    },

    /** Error message from the import modal, or null if none shown. */
    importErrorText() {
      const el = screen.queryByRole('alert');
      return el ? el.textContent : null;
    },

    /** True when the Import button inside the modal is disabled (textarea empty). */
    isImportSubmitDisabled() {
      return screen.getByRole('button', { name: /^import layout$/i }).disabled;
    },

    /**
     * Simulate a browser page reload: unmounts the App, then mounts it fresh.
     * localStorage is preserved, so persisted state is restored.
     */
    reload,
  };
}
