// Feature: Turbine spacing ring
//
// The spacing ring overlay visualises a configurable exclusion radius around
// each turbine.  When the user enables it for the first time a popover lets
// them choose the number of rotor diameters before the ring appears.
// Clicking the toggle again while the ring is visible turns it off immediately.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Enabling the spacing ring', () => {
  it('shows a popover when the ring toggle is clicked while the ring is off', () => {
    const farm = createWindFarm();

    farm.clickRingToggle();

    expect(farm.isRingPopoverVisible()).toBe(true);
  });

  it('does not enable the ring until the user confirms in the popover', () => {
    const farm = createWindFarm();

    farm.clickRingToggle();

    expect(farm.isSpacingRingEnabled()).toBe(false);
  });

  it('defaults to 2 rotor diameters', () => {
    const farm = createWindFarm();

    farm.clickRingToggle();

    expect(farm.ringDiametersValue()).toBe(2);
  });

  it('enables the ring and closes the popover when the user clicks Show ring', () => {
    const farm = createWindFarm();
    farm.clickRingToggle();

    farm.confirmRingPopover();

    expect(farm.isSpacingRingEnabled()).toBe(true);
    expect(farm.isRingPopoverVisible()).toBe(false);
  });

  it('passes the chosen diameter multiplier to the map', () => {
    const farm = createWindFarm();
    farm.clickRingToggle();
    farm.setRingDiameters(5);

    farm.confirmRingPopover();

    expect(farm.spacingRingDiameters()).toBe(5);
  });
});

describe('Disabling the spacing ring', () => {
  it('hides the ring immediately when the toggle is clicked while the ring is on', () => {
    const farm = createWindFarm();
    farm.clickRingToggle();
    farm.confirmRingPopover();

    farm.clickRingToggle();

    expect(farm.isSpacingRingEnabled()).toBe(false);
  });

  it('does not show the popover when turning the ring off', () => {
    const farm = createWindFarm();
    farm.clickRingToggle();
    farm.confirmRingPopover();

    farm.clickRingToggle();

    expect(farm.isRingPopoverVisible()).toBe(false);
  });
});

describe('Popover dismissal', () => {
  it('closes the popover when the toggle is clicked a second time without confirming', () => {
    const farm = createWindFarm();
    farm.clickRingToggle();

    farm.clickRingToggle();

    expect(farm.isRingPopoverVisible()).toBe(false);
  });

  it('leaves the ring disabled when the popover is dismissed without confirming', () => {
    const farm = createWindFarm();
    farm.clickRingToggle();

    farm.clickRingToggle(); // dismiss

    expect(farm.isSpacingRingEnabled()).toBe(false);
  });
});
