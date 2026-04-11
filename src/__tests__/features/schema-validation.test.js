/**
 * Schema validation for persisted layout data.
 *
 * Verifies that corrupt or schema-invalid data in localStorage is silently
 * discarded and the app falls back to empty defaults, rather than crashing
 * or loading inconsistent state.
 */
import { createWindFarm } from '../../test-support/WindFarmDriver';

jest.mock('../../WindMap');

const FLEET_DEFAULTS = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 };

describe('Schema validation for persisted layout', () => {
  describe('corrupt JSON in localStorage', () => {
    it('falls back to empty defaults when JSON is unparseable', () => {
      const farm = createWindFarm({ rawStorage: '{not valid json' });

      expect(farm.turbineCount()).toBe(0);
      expect(farm.fleetSpec()).toEqual(FLEET_DEFAULTS);
    });

    it('falls back to empty defaults when storage contains a plain string', () => {
      const farm = createWindFarm({ rawStorage: 'hello' });

      expect(farm.turbineCount()).toBe(0);
      expect(farm.fleetSpec()).toEqual(FLEET_DEFAULTS);
    });
  });

  describe('schema-invalid data (valid JSON, wrong shape)', () => {
    it('falls back when turbines is a string instead of an array', () => {
      const farm = createWindFarm({
        storage: { turbines: 'not-an-array', fleet: FLEET_DEFAULTS },
      });

      expect(farm.turbineCount()).toBe(0);
      expect(farm.fleetSpec()).toEqual(FLEET_DEFAULTS);
    });

    it('falls back when a turbine has a non-numeric lat', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [{ id: 't1', lat: 'bad', lng: 7.9, name: '', custom: null }],
          fleet: FLEET_DEFAULTS,
        },
      });

      expect(farm.turbineCount()).toBe(0);
    });

    it('falls back when a turbine has a non-numeric lng', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [{ id: 't1', lat: 55.5, lng: null, name: '', custom: null }],
          fleet: FLEET_DEFAULTS,
        },
      });

      expect(farm.turbineCount()).toBe(0);
    });

    it('falls back when a turbine is missing its id', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [{ lat: 55.5, lng: 7.9, name: '', custom: null }],
          fleet: FLEET_DEFAULTS,
        },
      });

      expect(farm.turbineCount()).toBe(0);
    });

    it('falls back to default fleet when fleet is missing a required field', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [],
          fleet: { hubHeight: 120, rotorDiameter: 150 }, // ratedPower missing
        },
      });

      expect(farm.fleetSpec()).toEqual(FLEET_DEFAULTS);
    });

    it('falls back to default fleet when a fleet value is zero', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [],
          fleet: { hubHeight: 0, rotorDiameter: 150, ratedPower: 5.0 },
        },
      });

      expect(farm.fleetSpec()).toEqual(FLEET_DEFAULTS);
    });

    it('falls back to default fleet when a fleet value is negative', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [],
          fleet: { hubHeight: -10, rotorDiameter: 150, ratedPower: 5.0 },
        },
      });

      expect(farm.fleetSpec()).toEqual(FLEET_DEFAULTS);
    });

    it('falls back when a custom turbine spec has a negative value', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [
            {
              id: 't1',
              lat: 55.5,
              lng: 7.9,
              name: 'T1',
              custom: { hubHeight: -5, rotorDiameter: 150, ratedPower: 5.0 },
            },
          ],
          fleet: FLEET_DEFAULTS,
        },
      });

      // The whole stored layout is rejected because the turbine custom spec is invalid.
      expect(farm.turbineCount()).toBe(0);
    });

    it('falls back when mapView center is not a pair of numbers', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [],
          fleet: FLEET_DEFAULTS,
          mapView: { center: 'not-an-array', zoom: 10 },
        },
      });

      expect(farm.mapCenter()).toEqual([55.5, 7.9]);
      expect(farm.mapZoom()).toBe(10);
    });
  });

  describe('valid data still loads correctly after schema guard is added', () => {
    it('loads turbines from a valid stored layout', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [
            { id: 't1', lat: 55.5, lng: 7.9, custom: null, name: 'Alpha' },
            { id: 't2', lat: 56.0, lng: 8.0, custom: null, name: 'Beta' },
          ],
          fleet: FLEET_DEFAULTS,
        },
      });

      expect(farm.turbineCount()).toBe(2);
    });

    it('loads a custom fleet spec from valid stored data', () => {
      const customFleet = { hubHeight: 140, rotorDiameter: 160, ratedPower: 6.0 };
      const farm = createWindFarm({
        storage: { turbines: [], fleet: customFleet },
      });

      expect(farm.fleetSpec()).toEqual(customFleet);
    });

    it('loads a mapView from valid stored data', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [],
          fleet: FLEET_DEFAULTS,
          mapView: { center: [57.1, 9.3], zoom: 8 },
        },
      });

      expect(farm.mapCenter()).toEqual([57.1, 9.3]);
      expect(farm.mapZoom()).toBe(8);
    });

    it('accepts mapView being absent (backwards compat with old saves)', () => {
      const farm = createWindFarm({
        storage: { turbines: [], fleet: FLEET_DEFAULTS },
      });

      // Falls back to the default Horns Rev location when mapView is absent.
      expect(farm.mapCenter()).toEqual([55.5, 7.9]);
      expect(farm.mapZoom()).toBe(10);
    });
  });
});
