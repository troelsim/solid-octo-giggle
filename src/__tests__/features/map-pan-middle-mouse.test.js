// Feature: Middle-mouse-button map panning
//
// In add or move mode, left-click is reserved for turbine placement.  Desktop
// users can still pan the map by middle-mouse-button dragging.  This must not
// accidentally place a turbine or exit the current mode.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Middle-mouse-button map panning', () => {
  it('pans the map while in add mode without placing a turbine', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    // After placing one turbine, sticky add mode keeps us in 'add'.
    expect(farm.currentMode()).toBe('add');
    expect(farm.turbineCount()).toBe(1);

    const centerBefore = farm.mapCenter();
    farm.middleMouseDragMap();

    // The map panned (view changed) …
    expect(farm.mapCenter()).not.toEqual(centerBefore);
    // … without leaving add mode …
    expect(farm.currentMode()).toBe('add');
    // … and without placing an extra turbine.
    expect(farm.turbineCount()).toBe(1);
  });

  it('pans the map while in move mode without confirming the move', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.startMovingSelectedTurbine();
    expect(farm.currentMode()).toBe('move');

    const centerBefore = farm.mapCenter();
    farm.middleMouseDragMap();

    // The map panned …
    expect(farm.mapCenter()).not.toEqual(centerBefore);
    // … without leaving move mode …
    expect(farm.currentMode()).toBe('move');
    // … and the turbine is still there.
    expect(farm.turbineCount()).toBe(1);
  });
});
