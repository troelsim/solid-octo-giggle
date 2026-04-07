// Feature: Exporting layout CSV
//
// Verifies that the fleet panel can generate a copyable CSV export of turbine layout data.

jest.mock('../../WindMap');

import { createWindFarm } from '../../test-support/WindFarmDriver';

describe('Exporting the layout as CSV', () => {
  it('exports in Latitude,Longitude,Name,Description order with specs as description', () => {
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

    const csv = [
      'Latitude,Longitude,Name,Description',
      '55.1234,7.9876,Alpha,150 5000 120',
      '56.2,8.4,Turbine 2,165 6300 140',
    ].join('\n');

    expect(farm.exportedCsvText()).toBe(
      csv
    );
    expect(farm.exportedCsvSelection()).toEqual({
      start: 0,
      end: csv.length,
    });
  });
});
