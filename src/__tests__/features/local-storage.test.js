import { createWindFarm } from '../../test-support/WindFarmDriver';

jest.mock('../../WindMap');

const FLEET_DEFAULTS = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 };

describe('Local storage persistence', () => {
  describe('saving on change', () => {
    it('persists a turbine immediately after adding', () => {
      const farm = createWindFarm();
      farm.addTurbine();

      expect(farm.storedLayout().turbines).toHaveLength(1);
    });

    it('persists turbine removal', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deleteSelectedTurbine();
      farm.confirmDeleteTurbine();

      expect(farm.storedLayout().turbines).toHaveLength(0);
    });

    it('clears turbines after clearing the layout', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();
      farm.clearLayout();
      farm.confirmClearLayout();

      expect(farm.storedLayout().turbines).toHaveLength(0);
    });

    it('persists fleet spec changes', () => {
      const farm = createWindFarm();
      farm.setFleetSpec('Hub height', 140);

      expect(farm.storedLayout().fleet.hubHeight).toBe(140);
    });
  });

  describe('loading on mount', () => {
    it('restores turbines from a previous session', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [
            { id: 't1', lat: 55.5, lng: 7.9, custom: null, name: '' },
            { id: 't2', lat: 56.0, lng: 8.0, custom: null, name: '' },
          ],
          fleet: FLEET_DEFAULTS,
        },
      });

      expect(farm.turbineCount()).toBe(2);
    });

    it('restores fleet specs from a previous session', () => {
      const farm = createWindFarm({
        storage: {
          turbines: [],
          fleet: { hubHeight: 140, rotorDiameter: 160, ratedPower: 6.0 },
        },
      });

      expect(farm.fleetSpec()).toEqual({ hubHeight: 140, rotorDiameter: 160, ratedPower: 6.0 });
    });

    it('starts with empty defaults when storage is empty', () => {
      const farm = createWindFarm();

      expect(farm.turbineCount()).toBe(0);
      expect(farm.fleetSpec()).toEqual(FLEET_DEFAULTS);
    });
  });

  describe('reload simulation', () => {
    it('turbines survive a page reload', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.addTurbine();

      farm.reload();

      expect(farm.turbineCount()).toBe(2);
    });

    it('fleet specs survive a page reload', () => {
      const farm = createWindFarm();
      farm.setFleetSpec('Hub height', 140);

      farm.reload();

      expect(farm.fleetSpec().hubHeight).toBe(140);
    });

    it('new turbine IDs do not collide after reload', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.addTurbine();
      farm.addTurbine();

      farm.reload();
      farm.addTurbine();

      const ids = farm.storedLayout().turbines.map(t => t.id);
      expect(ids).toHaveLength(4);
      expect(new Set(ids).size).toBe(4);
    });
  });
});
