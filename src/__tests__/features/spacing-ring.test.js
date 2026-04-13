// Feature: Turbine spacing ring
//
// The spacing ring overlay visualises a configurable exclusion radius around
// each turbine.  It is enabled by default at 2 rotor diameters.
// Clicking the toggle turns it off immediately.  Clicking again while the ring
// is off opens a popover to configure and re-enable it.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Default spacing ring state', () => {
  it('is enabled by default', () => {
    const farm = createWindFarm();

    expect(farm.isSpacingRingEnabled()).toBe(true);
  });

  it('defaults to 2 rotor diameters', () => {
    const farm = createWindFarm();

    expect(farm.spacingRingDiameters()).toBe(2);
  });
});

describe('Disabling the spacing ring', () => {
  it('hides the ring immediately when the toggle is clicked while the ring is on', () => {
    const farm = createWindFarm();

    farm.clickRingToggle();

    expect(farm.isSpacingRingEnabled()).toBe(false);
  });

  it('does not show the popover when turning the ring off', () => {
    const farm = createWindFarm();

    farm.clickRingToggle();

    expect(farm.isRingPopoverVisible()).toBe(false);
  });
});

describe('Re-enabling the spacing ring', () => {
  it('shows a popover when the ring toggle is clicked while the ring is off', () => {
    const farm = createWindFarm();
    farm.clickRingToggle(); // turn off

    farm.clickRingToggle(); // re-open popover

    expect(farm.isRingPopoverVisible()).toBe(true);
  });

  it('does not enable the ring until the user confirms in the popover', () => {
    const farm = createWindFarm();
    farm.clickRingToggle(); // turn off

    farm.clickRingToggle(); // open popover

    expect(farm.isSpacingRingEnabled()).toBe(false);
  });

  it('enables the ring and closes the popover when the user clicks Show ring', () => {
    const farm = createWindFarm();
    farm.clickRingToggle(); // turn off
    farm.clickRingToggle(); // open popover

    farm.confirmRingPopover();

    expect(farm.isSpacingRingEnabled()).toBe(true);
    expect(farm.isRingPopoverVisible()).toBe(false);
  });

  it('passes the chosen diameter multiplier to the map', () => {
    const farm = createWindFarm();
    farm.clickRingToggle(); // turn off
    farm.clickRingToggle(); // open popover
    farm.setRingDiameters(5);

    farm.confirmRingPopover();

    expect(farm.spacingRingDiameters()).toBe(5);
  });
});

describe('Popover dismissal', () => {
  it('closes the popover when the toggle is clicked a second time without confirming', () => {
    const farm = createWindFarm();
    farm.clickRingToggle(); // turn off
    farm.clickRingToggle(); // open popover

    farm.clickRingToggle(); // dismiss

    expect(farm.isRingPopoverVisible()).toBe(false);
  });

  it('leaves the ring disabled when the popover is dismissed without confirming', () => {
    const farm = createWindFarm();
    farm.clickRingToggle(); // turn off
    farm.clickRingToggle(); // open popover

    farm.clickRingToggle(); // dismiss

    expect(farm.isSpacingRingEnabled()).toBe(false);
  });
});
