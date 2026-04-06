import { createWindFarm } from '../../test-support/WindFarmDriver';

jest.mock('../../WindMap');

describe('Clear layout', () => {
  describe('when there are no turbines', () => {
    it('does not show a Clear layout button', () => {
      const farm = createWindFarm();
      expect(farm.turbineCount()).toBe(0);
      // Button should not be present with an empty farm
      const { queryByRole } = require('@testing-library/react').screen;
      expect(queryByRole('button', { name: /clear layout/i })).toBeNull();
    });
  });

  describe('when turbines have been added', () => {
    it('shows a Clear layout button in the fleet panel', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();
      const { getByRole } = require('@testing-library/react').screen;
      expect(getByRole('button', { name: /clear layout/i })).toBeTruthy();
    });

    it('removes all turbines when clicked', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.addTurbine();
      farm.addTurbine();
      farm.deselect();
      expect(farm.turbineCount()).toBe(3);

      farm.clearLayout();

      expect(farm.turbineCount()).toBe(0);
    });

    it('shows the fleet defaults panel after clearing', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();

      expect(farm.panelView()).toBe('fleet');
    });

    it('deselects any selected turbine when clearing', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.selectTurbine(1);
      expect(farm.panelView()).toBe('turbine');

      // Navigate to fleet panel to access the clear button
      farm.deselect();
      farm.clearLayout();

      expect(farm.turbineCount()).toBe(0);
      expect(farm.panelView()).toBe('fleet');
    });

    it('resets to view mode after clearing', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();

      expect(farm.currentMode()).toBe('view');
    });
  });
});
