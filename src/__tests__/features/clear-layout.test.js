import { createWindFarm } from '../../test-support/WindFarmDriver';

jest.mock('../../WindMap');

describe('Clear layout', () => {
  describe('when there are no turbines', () => {
    it('does not show a Clear layout button', () => {
      const farm = createWindFarm();
      const { queryByRole } = require('@testing-library/react').screen;
      expect(queryByRole('button', { name: /clear layout/i })).toBeNull();
    });
  });

  describe('confirmation popover', () => {
    it('opens when Clear layout is clicked', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();

      expect(farm.isClearPopoverVisible()).toBe(false);
      farm.clearLayout();
      expect(farm.isClearPopoverVisible()).toBe(true);
    });

    it('does not clear turbines until confirmed', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();

      expect(farm.turbineCount()).toBe(2);
    });

    it('closes without clearing when dismissed via Escape', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();
      farm.clearLayout();

      const { fireEvent } = require('@testing-library/react');
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(farm.isClearPopoverVisible()).toBe(false);
      expect(farm.turbineCount()).toBe(1);
    });

    it('shows the turbine count in the popover title', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.addTurbine();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();

      const { getByText } = require('@testing-library/react').screen;
      expect(getByText(/clear all 3 turbines\?/i)).toBeTruthy();
    });
  });

  describe('after confirmation', () => {
    it('removes all turbines', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.addTurbine();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();
      farm.confirmClearLayout();

      expect(farm.turbineCount()).toBe(0);
    });

    it('shows the fleet defaults panel', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();
      farm.confirmClearLayout();

      expect(farm.panelView()).toBe('fleet');
    });

    it('resets to view mode', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();
      farm.confirmClearLayout();

      expect(farm.currentMode()).toBe('view');
    });

    it('closes the popover', () => {
      const farm = createWindFarm();
      farm.addTurbine();
      farm.deselect();

      farm.clearLayout();
      farm.confirmClearLayout();

      expect(farm.isClearPopoverVisible()).toBe(false);
    });
  });
});
