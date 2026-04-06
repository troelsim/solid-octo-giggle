// Feature: Turbine management
//
// Covers the lifecycle of individual turbines: adding, selecting, and deleting.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Adding turbines', () => {
  it('places a new turbine on the map', () => {
    const farm = createWindFarm();

    farm.addTurbine();

    expect(farm.turbineCount()).toBe(1);
  });

  it('automatically selects the newly placed turbine', () => {
    const farm = createWindFarm();

    farm.addTurbine();

    expect(farm.selectedTurbineNumber()).toBe(1);
  });

  it('returns to view mode after placing a turbine', () => {
    const farm = createWindFarm();

    farm.addTurbine();

    expect(farm.currentMode()).toBe('view');
  });

  it('numbers each additional turbine sequentially', () => {
    const farm = createWindFarm();

    farm.addTurbine();
    farm.addTurbine();
    farm.addTurbine();

    expect(farm.turbineCount()).toBe(3);
  });
});

describe('Selecting a turbine', () => {
  it('shows the turbine panel when a turbine marker is clicked', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.addTurbine();

    farm.selectTurbine(2);

    expect(farm.selectedTurbineNumber()).toBe(2);
    expect(farm.panelView()).toBe('turbine');
  });

  it('shows the fleet panel when a turbine is deselected', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.deselect();

    expect(farm.panelView()).toBe('fleet');
  });
});

describe('Deleting a turbine', () => {
  it('removes the turbine from the map', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.deleteSelectedTurbine();

    expect(farm.turbineCount()).toBe(0);
  });

  it('dismisses the turbine panel after deletion', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.deleteSelectedTurbine();

    expect(farm.panelView()).toBe('fleet');
  });

  it('preserves the remaining turbines when one is deleted', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.addTurbine();
    farm.addTurbine();
    farm.selectTurbine(2);

    farm.deleteSelectedTurbine();

    expect(farm.turbineCount()).toBe(2);
  });
});
