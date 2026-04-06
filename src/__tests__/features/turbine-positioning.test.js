// Feature: Turbine positioning
//
// A turbine's location on the map can be changed after it has been placed.
// The interaction is a two-step "move mode": select a turbine, tap Move,
// then tap the map to confirm the new position.

jest.mock('../../WindMap');

import { createWindFarm, readStorage } from '../../test-support/WindFarmDriver';

describe('Moving a turbine', () => {
  it('enters move mode when Move is clicked', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.startMovingSelectedTurbine();

    expect(farm.currentMode()).toBe('move');
  });

  it('returns to view mode after the new position is confirmed', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.startMovingSelectedTurbine();

    farm.confirmMove();

    expect(farm.currentMode()).toBe('view');
  });

  it('keeps the turbine on the map after a successful move', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.startMovingSelectedTurbine();

    farm.confirmMove();

    expect(farm.turbineCount()).toBe(1);
  });

  it('supports dragging the selected turbine in move mode', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.startMovingSelectedTurbine();

    farm.dragSelectedTurbine();

    expect(farm.currentMode()).toBe('view');
    expect(readStorage().turbines[0]).toMatchObject({ lat: 56.1, lng: 8.7 });
  });

  it('aborts the move and returns to view mode on Cancel', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.startMovingSelectedTurbine();

    farm.cancelAction();

    expect(farm.currentMode()).toBe('view');
    expect(farm.turbineCount()).toBe(1);
  });
});
