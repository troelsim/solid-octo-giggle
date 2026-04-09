// Feature: Import layout from CSV
//
// A CSV file (same format as the export) can be pasted into the import modal
// to replace the current layout.  A confirmation popover guards against
// accidental overwrites.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FLEET = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5 };
const MAP_VIEW = { center: [55.5, 7.9], zoom: 10 };
const EXISTING_TURBINE = { id: 't1', lat: 55, lng: 7.9, name: 'Old', custom: null };

// A single turbine with a model-name description (not parseable as specs).
const ONE_TURBINE_CSV = [
  'Latitude,Longitude,Name,Description',
  '55.1,7.9,Alpha,V80-2.0MW',
].join('\n');

// Two turbines — used to verify a count change after import.
const TWO_TURBINE_CSV = [
  'Latitude,Longitude,Name,Description',
  '55.1,7.9,Alpha,V80-2.0MW',
  '56.2,8.4,Beta,V80-2.0MW',
].join('\n');

// One turbine whose description matches the export format "rotor power hub".
const SPEC_CSV = [
  'Latitude,Longitude,Name,Description',
  '55.1,7.9,,150 5000 120',
].join('\n');

// Quoted fields — as produced by the built-in CSV exporter for special chars.
const QUOTED_CSV = [
  'Latitude,Longitude,Name,Description',
  '37.759228,128.713727,"21455","V80-2.0MW"',
].join('\n');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Importing a layout from CSV', () => {
  describe('confirmation before overwriting', () => {
    it('shows a confirmation popover when the user triggers import', () => {
      const farm = createWindFarm({
        storage: { turbines: [EXISTING_TURBINE], fleet: FLEET, mapView: MAP_VIEW },
      });

      farm.openImportModal();
      farm.pasteImportCsv(ONE_TURBINE_CSV);
      farm.submitImport();

      expect(farm.isImportConfirmVisible()).toBe(true);
    });

    it('does not replace the layout until the user confirms', () => {
      const farm = createWindFarm({
        storage: { turbines: [EXISTING_TURBINE], fleet: FLEET, mapView: MAP_VIEW },
      });

      farm.openImportModal();
      farm.pasteImportCsv(TWO_TURBINE_CSV);
      farm.submitImport();

      expect(farm.turbineCount()).toBe(1);
    });

    it('leaves the layout unchanged when the user dismisses the confirmation', () => {
      const farm = createWindFarm({
        storage: { turbines: [EXISTING_TURBINE], fleet: FLEET, mapView: MAP_VIEW },
      });

      farm.openImportModal();
      farm.pasteImportCsv(TWO_TURBINE_CSV);
      farm.submitImport();
      farm.dismissImportConfirm();

      expect(farm.turbineCount()).toBe(1);
      expect(farm.isImportConfirmVisible()).toBe(false);
    });
  });

  describe('after confirming the import', () => {
    it('replaces the current layout with turbines from the CSV', () => {
      const farm = createWindFarm({
        storage: { turbines: [EXISTING_TURBINE], fleet: FLEET, mapView: MAP_VIEW },
      });

      farm.openImportModal();
      farm.pasteImportCsv(TWO_TURBINE_CSV);
      farm.submitImport();
      farm.confirmImport();

      expect(farm.turbineCount()).toBe(2);
    });

    it('closes the import modal', () => {
      const farm = createWindFarm();

      farm.openImportModal();
      farm.pasteImportCsv(ONE_TURBINE_CSV);
      farm.submitImport();
      farm.confirmImport();

      expect(farm.isImportModalVisible()).toBe(false);
    });

    it('preserves latitude, longitude, and name from the CSV', () => {
      const farm = createWindFarm();

      farm.openImportModal();
      farm.pasteImportCsv(QUOTED_CSV);
      farm.submitImport();
      farm.confirmImport();

      const { turbines } = farm.storedLayout();
      expect(turbines[0].lat).toBeCloseTo(37.759228);
      expect(turbines[0].lng).toBeCloseTo(128.713727);
      expect(turbines[0].name).toBe('21455');
    });

    it('applies turbine specs when description matches the export format', () => {
      const farm = createWindFarm();

      farm.openImportModal();
      farm.pasteImportCsv(SPEC_CSV); // "150 5000 120" → rotor=150, power=5, hub=120
      farm.submitImport();
      farm.confirmImport();

      const { turbines } = farm.storedLayout();
      expect(turbines[0].custom).toEqual({
        rotorDiameter: 150,
        ratedPower: 5,
        hubHeight: 120,
      });
    });

    it('leaves custom null when description is not a spec triplet', () => {
      const farm = createWindFarm();

      farm.openImportModal();
      farm.pasteImportCsv(ONE_TURBINE_CSV); // "V80-2.0MW" — not parseable as specs
      farm.submitImport();
      farm.confirmImport();

      const { turbines } = farm.storedLayout();
      expect(turbines[0].custom).toBeNull();
    });

    it('works when importing into an empty layout', () => {
      const farm = createWindFarm();

      farm.openImportModal();
      farm.pasteImportCsv(TWO_TURBINE_CSV);
      farm.submitImport();
      farm.confirmImport();

      expect(farm.turbineCount()).toBe(2);
    });

    it('returns to view mode after import', () => {
      const farm = createWindFarm();

      farm.openImportModal();
      farm.pasteImportCsv(ONE_TURBINE_CSV);
      farm.submitImport();
      farm.confirmImport();

      expect(farm.currentMode()).toBe('view');
    });
  });

  describe('validation', () => {
    it('shows an error for invalid coordinates and does not open the confirmation', () => {
      const farm = createWindFarm({
        storage: { turbines: [EXISTING_TURBINE], fleet: FLEET, mapView: MAP_VIEW },
      });

      farm.openImportModal();
      farm.pasteImportCsv([
        'Latitude,Longitude,Name,Description',
        'notanumber,7.9,A,B',
      ].join('\n'));
      farm.submitImport();

      expect(farm.isImportConfirmVisible()).toBe(false);
      expect(farm.importErrorText()).toBeTruthy();
    });

    it('preserves the existing layout when CSV is invalid', () => {
      const farm = createWindFarm({
        storage: { turbines: [EXISTING_TURBINE], fleet: FLEET, mapView: MAP_VIEW },
      });

      farm.openImportModal();
      farm.pasteImportCsv('Latitude,Longitude,Name,Description'); // header only, no data
      farm.submitImport();

      expect(farm.turbineCount()).toBe(1);
    });

    it('disables the Import button when the textarea is empty', () => {
      const farm = createWindFarm();

      farm.openImportModal();

      expect(farm.isImportSubmitDisabled()).toBe(true);
    });
  });
});
