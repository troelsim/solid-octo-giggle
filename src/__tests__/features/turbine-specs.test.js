// Feature: Individual turbine specifications
//
// Each turbine inherits the fleet defaults unless it has been individually
// customised.  Custom values can also be reverted back to the fleet defaults.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Inheriting fleet defaults', () => {
  it('shows fleet defaults for a freshly-placed turbine', () => {
    const farm = createWindFarm();

    farm.addTurbine();

    expect(farm.selectedSpec()).toEqual({ hubHeight: 120, rotorDiameter: 150, ratedPower: 5 });
  });

  it('does not mark an unmodified turbine as custom', () => {
    const farm = createWindFarm();

    farm.addTurbine();

    expect(farm.isShowingCustomBadge()).toBe(false);
  });
});

describe('Overriding specs on an individual turbine', () => {
  it('marks the turbine as custom after any spec is edited', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.setSpec('Hub height', 140);

    expect(farm.isShowingCustomBadge()).toBe(true);
  });

  it('stores an updated hub height', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.setSpec('Hub height', 140);

    expect(farm.selectedSpec().hubHeight).toBe(140);
  });

  it('stores an updated rotor diameter', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.setSpec('Rotor dia.', 180);

    expect(farm.selectedSpec().rotorDiameter).toBe(180);
  });

  it('stores an updated rated power', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.setSpec('Power', 6.5);

    expect(farm.selectedSpec().ratedPower).toBe(6.5);
  });

  it('keeps other turbines on their current specs when one turbine is edited', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.addTurbine();
    farm.selectTurbine(1);

    farm.setSpec('Hub height', 200);
    farm.selectTurbine(2);

    expect(farm.selectedSpec().hubHeight).toBe(120); // still fleet default
  });
});

describe('Resetting a turbine to fleet defaults', () => {
  it('removes the custom badge', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.setSpec('Hub height', 140);

    farm.resetToFleetDefaults();

    expect(farm.isShowingCustomBadge()).toBe(false);
  });

  it('reverts the displayed values to the fleet defaults', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.setSpec('Hub height', 140);
    farm.setSpec('Rotor dia.', 200);

    farm.resetToFleetDefaults();

    expect(farm.selectedSpec()).toEqual({ hubHeight: 120, rotorDiameter: 150, ratedPower: 5 });
  });
});
