// Feature: Pack a polygon with turbines
//
// The user draws a polygon on the map and fills it with a hex-packed grid
// of turbines.  Spacing = spacingRingDiameters × fleet.rotorDiameter.

jest.mock('../../WindMap');

import { screen, cleanup } from '@testing-library/react';
import { createWindFarm } from '../../test-support/WindFarmDriver';

// A ~2 km × 2 km square near the default map centre (55.5, 7.9).
// 0.009° of latitude ≈ 1 km at mid-latitudes.
const SQUARE = [
  { lat: 55.491, lng: 7.886 },
  { lat: 55.491, lng: 7.914 },
  { lat: 55.509, lng: 7.914 },
  { lat: 55.509, lng: 7.886 },
];

describe('Entering pack-area mode', () => {
  it('switches the map into draw mode when the Pack-area button is clicked', () => {
    const farm = createWindFarm();

    farm.startPackArea();

    expect(farm.currentMode()).toBe('draw');
  });

  it('shows the draw banner prompting the user to outline an area', () => {
    const farm = createWindFarm();
    farm.startPackArea();

    // Banner text includes the "0/3" progress indicator for mobile layout.
    expect(screen.getByText(/outline an area/i)).toBeInTheDocument();
  });

  it('deselects any currently-selected turbine so the map is fully usable', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.exitAddMode();               // leave sticky add mode → view mode
    expect(farm.panelView()).toBe('turbine');

    farm.startPackArea();

    // With no selected turbine, the editor panel should be gone.
    expect(farm.panelView()).toBe('fleet');
  });
});

describe('Adding polygon vertices', () => {
  it('records a vertex for every map click while in draw mode', () => {
    const farm = createWindFarm();
    farm.startPackArea();

    farm.addPolygonVertex(SQUARE[0].lat, SQUARE[0].lng);
    farm.addPolygonVertex(SQUARE[1].lat, SQUARE[1].lng);

    expect(farm.polygonVertexCount()).toBe(2);
  });

  it('keeps the mode as draw while vertices are being added', () => {
    const farm = createWindFarm();
    farm.startPackArea();

    farm.addPolygonVertex(SQUARE[0].lat, SQUARE[0].lng);

    expect(farm.currentMode()).toBe('draw');
  });
});

describe('The Fill button', () => {
  it('is disabled until at least three vertices have been placed', () => {
    const farm = createWindFarm();
    farm.startPackArea();

    farm.addPolygonVertex(SQUARE[0].lat, SQUARE[0].lng);
    farm.addPolygonVertex(SQUARE[1].lat, SQUARE[1].lng);
    expect(farm.isFillEnabled()).toBe(false);

    farm.addPolygonVertex(SQUARE[2].lat, SQUARE[2].lng);
    expect(farm.isFillEnabled()).toBe(true);
  });
});

describe('Filling the polygon with turbines', () => {
  it('adds turbines to the layout when Fill is confirmed', () => {
    const farm = createWindFarm();
    farm.startPackArea();
    farm.addPolygonVertices(SQUARE);

    expect(farm.turbineCount()).toBe(0);

    farm.confirmPackArea();

    expect(farm.turbineCount()).toBeGreaterThan(0);
  });

  it('returns to view mode after filling', () => {
    const farm = createWindFarm();
    farm.startPackArea();
    farm.addPolygonVertices(SQUARE);

    farm.confirmPackArea();

    expect(farm.currentMode()).toBe('view');
  });

  it('clears the polygon draft after filling so nothing lingers on the map', () => {
    const farm = createWindFarm();
    farm.startPackArea();
    farm.addPolygonVertices(SQUARE);

    farm.confirmPackArea();

    expect(farm.polygonVertexCount()).toBe(0);
  });

  it('respects the spacing-ring multiplier — wider spacing places fewer turbines', () => {
    const dense = createWindFarm();
    dense.startPackArea();
    dense.addPolygonVertices(SQUARE);
    dense.confirmPackArea();
    const denseCount = dense.turbineCount();

    // Unmount the first App so the second createWindFarm doesn't render a
    // duplicate and so queries return only one match.
    cleanup();

    const sparse = createWindFarm();
    sparse.clickRingToggle();                // turn ring off → popover opens on second click
    sparse.clickRingToggle();                // open popover
    sparse.setRingDiameters(6);
    sparse.confirmRingPopover();
    sparse.startPackArea();
    sparse.addPolygonVertices(SQUARE);
    sparse.confirmPackArea();

    expect(sparse.turbineCount()).toBeLessThan(denseCount);
  });

  it('persists the packed turbines in localStorage', () => {
    const farm = createWindFarm();
    farm.startPackArea();
    farm.addPolygonVertices(SQUARE);
    farm.confirmPackArea();

    const saved = farm.storedLayout();
    expect(saved.turbines.length).toBeGreaterThan(0);
  });
});

describe('Cancelling pack-area mode', () => {
  it('returns to view mode and discards the polygon when Cancel is clicked', () => {
    const farm = createWindFarm();
    farm.startPackArea();
    farm.addPolygonVertices(SQUARE.slice(0, 2));

    farm.cancelAction();

    expect(farm.currentMode()).toBe('view');
    expect(farm.polygonVertexCount()).toBe(0);
  });

  it('returns to view mode and discards the polygon on Escape', () => {
    const farm = createWindFarm();
    farm.startPackArea();
    farm.addPolygonVertices(SQUARE.slice(0, 2));

    farm.exitAddMode(); // presses Escape

    expect(farm.currentMode()).toBe('view');
    expect(farm.polygonVertexCount()).toBe(0);
  });

  it('leaves existing turbines untouched when pack-area is cancelled', () => {
    const farm = createWindFarm();
    farm.addTurbine();
    farm.exitAddMode();
    const before = farm.turbineCount();

    farm.startPackArea();
    farm.addPolygonVertices(SQUARE);
    farm.cancelAction();

    expect(farm.turbineCount()).toBe(before);
  });
});
