// Feature: Exporting layout CSV
//
// Verifies that the fleet panel can generate a copyable CSV export of turbine layout data.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Exporting the layout as CSV', () => {
  it('shows turbine name, position, and effective specs in CSV format', () => {
    const farm = createWindFarm({
      storage: {
        turbines: [
          {
            id: 't1',
            lat: 55.1234,
            lng: 7.9876,
            name: 'Alpha',
            custom: null,
          },
          {
            id: 't2',
            lat: 56.2,
            lng: 8.4,
            name: '',
            custom: {
              hubHeight: 140,
              rotorDiameter: 165,
              ratedPower: 6.3,
            },
          },
        ],
        fleet: {
          hubHeight: 120,
          rotorDiameter: 150,
          ratedPower: 5,
        },
        mapView: {
          center: [55.5, 7.9],
          zoom: 10,
        },
      },
    });

    farm.exportLayoutCsv();

    expect(farm.exportedCsvText()).toBe(
      [
        'turbine name,lat,lon,rotor dia,power,hub height',
        'Alpha,55.1234,7.9876,150,5,120',
        'Turbine 2,56.2,8.4,165,6.3,140',
      ].join('\n')
    );
  });
});
