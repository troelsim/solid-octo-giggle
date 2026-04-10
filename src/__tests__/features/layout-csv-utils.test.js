import { buildLayoutCsv, parseLayoutCsv } from '../../utils/layoutCsv';

describe('layoutCsv utilities', () => {
  describe('buildLayoutCsv', () => {
    it('escapes names that contain commas, quotes, and newlines', () => {
      const csv = buildLayoutCsv(
        [{ lat: 55.1, lng: 7.9, name: 'A, "B"\nC', custom: null }],
        { rotorDiameter: 150, ratedPower: 5, hubHeight: 120 }
      );

      expect(csv).toContain('"A, ""B""\nC"');
    });

    it('falls back to an indexed turbine name when name is blank', () => {
      const csv = buildLayoutCsv(
        [{ lat: 55.1, lng: 7.9, name: '', custom: null }],
        { rotorDiameter: 150, ratedPower: 5, hubHeight: 120 }
      );

      expect(csv).toContain('Turbine 1');
    });
  });

  describe('parseLayoutCsv', () => {
    it('parses quoted names with embedded commas and newlines', () => {
      const rows = parseLayoutCsv([
        'Latitude,Longitude,Name,Description',
        '55.1,7.9,"Alpha, Beta',
        'Gamma",V80-2.0MW',
      ].join('\n'));

      expect(rows).toEqual([
        { lat: 55.1, lng: 7.9, name: 'Alpha, Beta\nGamma', custom: null },
      ]);
    });

    it('supports CRLF and extra spaces in spec description values', () => {
      const rows = parseLayoutCsv([
        'Latitude,Longitude,Name,Description',
        '55.1,7.9,Alpha," 150   5000   120 "',
      ].join('\r\n'));

      expect(rows[0].custom).toEqual({ rotorDiameter: 150, ratedPower: 5, hubHeight: 120 });
    });

    it('throws a clear error for unterminated quoted fields', () => {
      expect(() => parseLayoutCsv([
        'Latitude,Longitude,Name,Description',
        '55.1,7.9,"Alpha,V80-2.0MW',
      ].join('\n'))).toThrow('CSV has an unterminated quoted field');
    });
  });
});
