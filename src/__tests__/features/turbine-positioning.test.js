// Feature: Turbine positioning
//
// A turbine's location on the map can be changed after it has been placed.
// The interaction is a two-step "move mode": select a turbine, tap Move,
// then tap (or drag on mobile) the map to confirm the new position.

jest.mock('../../WindMap');

import { screen } from '@testing-library/react';
import { createWindFarm } from '../../test-support/WindFarmDriver';

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

  it('aborts the move and returns to view mode on Cancel', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.startMovingSelectedTurbine();

    farm.cancelAction();

    expect(farm.currentMode()).toBe('view');
    expect(farm.turbineCount()).toBe(1);
  });

  // Mobile layout — tests run in mobile mode by default (matchMedia → false).
  describe('mobile layout', () => {
    it('hides the turbine editor panel during move mode', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      // Before move: editor panel is visible (Move and Delete buttons present).
      expect(screen.getByRole('button', { name: /^move$/i })).toBeInTheDocument();

      farm.startMovingSelectedTurbine();

      // During move: editor panel must be hidden so the map is fully accessible
      // for the drag-to-place gesture.
      expect(screen.queryByRole('button', { name: /^move$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    });

    it('shows the drag-to-move banner during move mode', () => {
      const farm = createWindFarm();
      farm.addTurbine();

      farm.startMovingSelectedTurbine();

      expect(screen.getByText(/drag to move/i)).toBeInTheDocument();
    });

    it('restores the editor panel after a move is confirmed', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.startMovingSelectedTurbine();

      farm.confirmMove();

      // Editor panel should be back with the turbine still selected.
      expect(screen.getByRole('button', { name: /^move$/i })).toBeInTheDocument();
    });

    it('restores the editor panel after move is cancelled', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.startMovingSelectedTurbine();

      farm.cancelAction();

      expect(screen.getByRole('button', { name: /^move$/i })).toBeInTheDocument();
    });
  });
});
