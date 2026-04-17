// Mobile layout tests.
//
// These tests exercise the mobile-specific layout: the FAB add button positioned
// at the bottom-right of the map area instead of inside the header.
//
// window.matchMedia is left at the JSDOM default (no matchMedia → mobile),
// so useIsDesktop() returns false in all tests here.

jest.mock('../../WindMap');

import { screen } from '@testing-library/react';
import { createWindFarm, clearStorage } from '../../test-support/WindFarmDriver';

beforeEach(() => {
  clearStorage();
});

test('add-turbine button is inside the map FAB on mobile', () => {
  createWindFarm();
  const btn = screen.getByRole('button', { name: /add turbine/i });
  expect(btn.closest('.map-fab')).not.toBeNull();
  expect(btn.closest('.map-area')).not.toBeNull();
});

test('add-turbine button is not in the header on mobile', () => {
  createWindFarm();
  const btn = screen.getByRole('button', { name: /add turbine/i });
  expect(btn.closest('.app-header')).toBeNull();
});

test('exit button appears in the map FAB when in add mode', () => {
  const farm = createWindFarm();
  farm.addTurbine();

  const exitBtn = screen.getByRole('button', { name: /exit mode/i });
  expect(exitBtn.closest('.map-fab')).not.toBeNull();
  expect(exitBtn.closest('.map-area')).not.toBeNull();
});
