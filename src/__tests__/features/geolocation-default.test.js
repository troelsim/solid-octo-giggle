import { createWindFarm } from '../../test-support/WindFarmDriver';

jest.mock('../../WindMap');

describe('Map defaults to user location', () => {
  let originalGeolocation;

  beforeEach(() => {
    originalGeolocation = navigator.geolocation;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
      configurable: true,
    });
  });

  it('centers on user location when geolocation succeeds on first visit', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success) => {
          success({ coords: { latitude: 40.7128, longitude: -74.006 } });
        }),
      },
      writable: true,
      configurable: true,
    });

    const farm = createWindFarm();

    expect(farm.mapCenter()).toEqual([40.7128, -74.006]);
    expect(farm.mapZoom()).toBe(10);
  });

  it('falls back to Horns Rev when geolocation is denied', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((_success, error) => {
          error(new Error('User denied'));
        }),
      },
      writable: true,
      configurable: true,
    });

    const farm = createWindFarm();

    expect(farm.mapCenter()).toEqual([55.5, 7.9]);
    expect(farm.mapZoom()).toBe(10);
  });

  it('falls back to Horns Rev when geolocation API is unavailable', () => {
    // JSDOM has no navigator.geolocation by default
    const farm = createWindFarm();

    expect(farm.mapCenter()).toEqual([55.5, 7.9]);
    expect(farm.mapZoom()).toBe(10);
  });

  it('does not request geolocation when a saved layout exists', () => {
    const getCurrentPosition = jest.fn((success) => {
      success({ coords: { latitude: 40.7128, longitude: -74.006 } });
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      writable: true,
      configurable: true,
    });

    const farm = createWindFarm({
      storage: {
        turbines: [],
        fleet: { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 },
        mapView: { center: [57.1, 9.3], zoom: 8 },
      },
    });

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(farm.mapCenter()).toEqual([57.1, 9.3]);
    expect(farm.mapZoom()).toBe(8);
  });

  it('persists the geolocated position to storage', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn((success) => {
          success({ coords: { latitude: 48.8566, longitude: 2.3522 } });
        }),
      },
      writable: true,
      configurable: true,
    });

    const farm = createWindFarm();

    expect(farm.storedLayout().mapView).toEqual({
      center: [48.8566, 2.3522],
      zoom: 10,
    });
  });
});
