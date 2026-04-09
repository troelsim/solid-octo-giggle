// Desktop-layout feature tests.
//
// These tests exercise the ≥640 px layout: the turbine popover that floats near
// a selected marker and the settings gear that hides fleet defaults.
//
// window.matchMedia is overridden in beforeEach to simulate a desktop viewport
// so that useIsDesktop() returns true.  All other test files leave matchMedia at
// the default (mobile) and continue to exercise the bottom-panel layout.

jest.mock('../../WindMap');

import { screen } from '@testing-library/react';
import { createWindFarm, clearStorage } from '../../test-support/WindFarmDriver';

// ── Helpers ─────────────────────────────────────────────────────────────────

function desktopMatchMedia(query) {
  return {
    matches: query === '(min-width: 640px)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
}

beforeEach(() => {
  clearStorage();
  window.matchMedia = jest.fn().mockImplementation(desktopMatchMedia);
});

// ── Settings gear — fleet defaults ──────────────────────────────────────────

test('settings gear is visible on desktop', () => {
  createWindFarm();
  expect(screen.getByRole('button', { name: /fleet settings/i })).toBeInTheDocument();
});

test('settings popover is hidden by default', () => {
  createWindFarm();
  expect(screen.queryByText('Fleet defaults')).not.toBeInTheDocument();
});

test('settings popover opens when gear is clicked', () => {
  const farm = createWindFarm();
  farm.openSettings();
  expect(screen.getByText('Fleet defaults')).toBeInTheDocument();
});

test('settings popover shows fleet spec fields', () => {
  const farm = createWindFarm();
  farm.openSettings();
  expect(screen.getByText('Hub height')).toBeInTheDocument();
  expect(screen.getByText('Rotor dia.')).toBeInTheDocument();
  expect(screen.getByText('Power')).toBeInTheDocument();
});

test('fleet spec can be edited via settings popover', () => {
  const farm = createWindFarm();
  farm.openSettings();
  farm.setFleetSpec('Hub height', 145);
  expect(farm.fleetSpec().hubHeight).toBe(145);
});

test('settings popover closes when gear is clicked again', () => {
  const farm = createWindFarm();
  farm.openSettings();
  farm.closeSettings();
  expect(screen.queryByText('Fleet defaults')).not.toBeInTheDocument();
});

test('settings gear not visible on mobile (baseline check)', () => {
  // Reset to mobile
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  createWindFarm();
  expect(screen.queryByRole('button', { name: /fleet settings/i })).not.toBeInTheDocument();
});

// ── Settings popover — apply to all and clear ────────────────────────────────

test('apply-to-all button is shown in settings when turbines exist', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  farm.openSettings();
  expect(screen.getByRole('button', { name: /apply to all turbines/i })).toBeInTheDocument();
});

test('clear layout button is shown in settings when turbines exist', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  farm.openSettings();
  expect(screen.getByRole('button', { name: /clear layout/i })).toBeInTheDocument();
});

test('clear layout via settings popover removes all turbines', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  farm.openSettings();
  farm.clearLayout();
  farm.confirmClearLayout();
  expect(farm.turbineCount()).toBe(0);
});

// ── Turbine popover on desktop ───────────────────────────────────────────────

test('turbine popover appears when turbine is selected', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  expect(farm.panelView()).toBe('turbine');
  expect(screen.getByRole('textbox', { name: /turbine name/i })).toBeInTheDocument();
});

test('turbine popover shows spec fields', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  expect(screen.getByText('Hub height')).toBeInTheDocument();
  expect(screen.getByText('Rotor dia.')).toBeInTheDocument();
  expect(screen.getByText('Power')).toBeInTheDocument();
});

test('turbine popover has Move and Delete buttons', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  expect(screen.getByRole('button', { name: /^move$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
});

test('turbine spec can be edited via popover', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  farm.setSpec('Hub height', 130);
  expect(farm.selectedSpec().hubHeight).toBe(130);
  expect(farm.isShowingCustomBadge()).toBe(true);
});

test('deselect closes turbine popover', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  farm.deselect();
  expect(farm.panelView()).toBe('fleet');
  expect(screen.queryByRole('textbox', { name: /turbine name/i })).not.toBeInTheDocument();
});

test('delete confirmation popover works in turbine popover', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  farm.deleteSelectedTurbine();
  expect(farm.isDeletePopoverVisible()).toBe(true);
  farm.confirmDeleteTurbine();
  expect(farm.turbineCount()).toBe(0);
});

test('bottom panel is not rendered on desktop', () => {
  createWindFarm();
  expect(document.querySelector('.bottom-panel')).not.toBeInTheDocument();
});

test('turbine popover hidden during move mode', () => {
  const farm = createWindFarm();
  farm.addTurbine();
  farm.startMovingSelectedTurbine();
  // In move mode, no turbine name input visible (popover suppressed)
  expect(screen.queryByRole('textbox', { name: /turbine name/i })).not.toBeInTheDocument();
});
