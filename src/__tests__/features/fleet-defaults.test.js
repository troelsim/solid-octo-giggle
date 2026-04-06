// Feature: Fleet-wide defaults
//
// The fleet panel sets spec defaults for all turbines that have not been
// individually customised.  A turbine's custom specs can also be promoted
// to become the new fleet defaults, resetting all other turbines in one step.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Editing fleet defaults', () => {
  it('shows the fleet panel when no turbine is selected', () => {
    const farm = createWindFarm();

    expect(farm.panelView()).toBe('fleet');
  });

  it('applies an updated fleet hub height to turbines that use fleet defaults', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.deselect();

    farm.setFleetSpec('Hub height', 100);
    farm.addTurbine();          // new turbine should inherit the updated default

    expect(farm.selectedSpec().hubHeight).toBe(100);
  });

  it('does not affect turbines that have custom overrides', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.setSpec('Hub height', 200);   // custom override
    farm.deselect();

    farm.setFleetSpec('Hub height', 100);   // change fleet default

    farm.selectTurbine(1);
    expect(farm.selectedSpec().hubHeight).toBe(200); // custom value is preserved
  });
});

describe('Promoting turbine specs to fleet defaults', () => {
  it('sets the turbine custom specs as the new fleet defaults', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.setSpec('Hub height', 160);

    farm.applySpecsToAllTurbines();
    farm.deselect();

    expect(farm.fleetSpec().hubHeight).toBe(160);
  });

  it('removes custom overrides from all turbines after applying to fleet', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.addTurbine();
    farm.selectTurbine(1);
    farm.setSpec('Hub height', 160);

    farm.applySpecsToAllTurbines();

    // The turbine that was customised should no longer be marked custom
    expect(farm.isShowingCustomBadge()).toBe(false);
  });

  it('propagates the new fleet spec to all other turbines', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.addTurbine();
    farm.selectTurbine(1);
    farm.setSpec('Hub height', 160);
    farm.applySpecsToAllTurbines();

    farm.selectTurbine(2);

    expect(farm.selectedSpec().hubHeight).toBe(160);
  });
});

describe('Applying fleet defaults to all turbines', () => {
  it('clears all custom overrides when applied from the fleet panel', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.addTurbine();
    farm.selectTurbine(1);
    farm.setSpec('Hub height', 200);
    farm.deselect();

    farm.applySpecsToAllTurbines();   // triggered from fleet panel

    farm.selectTurbine(1);
    expect(farm.isShowingCustomBadge()).toBe(false);
  });
});
