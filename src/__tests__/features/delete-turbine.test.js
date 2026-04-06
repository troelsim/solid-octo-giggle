import { createWindFarm } from '../../test-support/WindFarmDriver';

jest.mock('../../WindMap');

describe('Delete turbine confirmation', () => {
  it('opens a confirmation popover when Delete is clicked', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    expect(farm.isDeletePopoverVisible()).toBe(false);
    farm.deleteSelectedTurbine();
    expect(farm.isDeletePopoverVisible()).toBe(true);
  });

  it('does not remove the turbine until confirmed', () => {
    const farm = createWindFarm();
    farm.addTurbine();

    farm.deleteSelectedTurbine();

    expect(farm.turbineCount()).toBe(1);
  });

  it('closes without deleting when dismissed via Escape', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.deleteSelectedTurbine();

    const { fireEvent } = require('@testing-library/react');
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(farm.isDeletePopoverVisible()).toBe(false);
    expect(farm.turbineCount()).toBe(1);
  });

  it('closes the popover when a different turbine is selected', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.addTurbine();
    farm.selectTurbine(1);
    farm.deleteSelectedTurbine();

    farm.selectTurbine(2);

    expect(farm.isDeletePopoverVisible()).toBe(false);
  });
});
