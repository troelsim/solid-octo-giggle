// Feature: Mobile header overflow ("⋯") menu.
//
// On mobile the top bar doesn't have room for every action, so Export and
// Import collapse behind a single "More actions" button that opens a menu.
// Desktop keeps them inline (covered elsewhere).

jest.mock('../../WindMap');

import { screen } from '@testing-library/react';
import { createWindFarm, clearStorage } from '../../test-support/WindFarmDriver';

describe('Mobile overflow menu', () => {
  beforeEach(clearStorage);

  it('shows the More-actions trigger in the mobile header', () => {
    const farm = createWindFarm();
    expect(farm.hasOverflowMenuTrigger()).toBe(true);
  });

  it('hides Export and Import until the menu is opened', () => {
    createWindFarm();
    expect(screen.queryByRole('button', { name: /export csv/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^import csv$/i })).toBeNull();
  });

  it('reveals Export and Import menu items once opened', () => {
    const farm = createWindFarm();
    farm.openOverflowMenu();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^import csv$/i })).toBeInTheDocument();
  });

  it('disables Export when there are no turbines to export', () => {
    const farm = createWindFarm();
    farm.openOverflowMenu();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });

  it('enables Export once at least one turbine has been placed', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.exitAddMode();
    farm.openOverflowMenu();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeEnabled();
  });

  it('stays available in draw mode so Export/Import remain reachable', () => {
    const farm = createWindFarm();
    farm.startPackArea();
    expect(farm.hasOverflowMenuTrigger()).toBe(true);
  });
});

describe('Desktop header', () => {
  // Desktop keeps Export/Import inline — the overflow trigger should not appear.
  beforeEach(() => {
    clearStorage();
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(min-width: 640px)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('does not render the More-actions trigger', () => {
    const farm = createWindFarm();
    expect(farm.hasOverflowMenuTrigger()).toBe(false);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^import csv$/i })).toBeInTheDocument();
  });
});
