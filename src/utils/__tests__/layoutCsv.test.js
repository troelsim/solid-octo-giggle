import { buildLayoutCsv, parseLayoutCsv } from '../layoutCsv';

const FLEET = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5 };

describe('buildLayoutCsv', () => {
  it('emits the header row followed by each turbine', () => {
    const csv = buildLayoutCsv(
      [
        { id: 't1', lat: 55.1234, lng: 7.9876, name: 'Alpha', custom: null },
        { id: 't2', lat: 56.2, lng: 8.4, name: '', custom: null },
      ],
      FLEET,
    );

    expect(csv).toBe(
      [
        'Latitude,Longitude,Name,Description',
        '55.1234,7.9876,Alpha,150 5000 120',
        '56.2,8.4,Turbine 2,150 5000 120',
      ].join('\n'),
    );
  });

  it('encodes per-turbine custom specs as "rotor powerKW hub"', () => {
    const csv = buildLayoutCsv(
      [
        {
          id: 't1',
          lat: 55,
          lng: 8,
          name: 'Custom',
          custom: { hubHeight: 140, rotorDiameter: 165, ratedPower: 6.3 },
        },
      ],
      FLEET,
    );

    expect(csv).toContain('55,8,Custom,165 6300 140');
  });

  it('falls back to "Turbine N" when the name is empty', () => {
    const csv = buildLayoutCsv(
      [{ id: 't1', lat: 1, lng: 2, name: '', custom: null }],
      FLEET,
    );

    expect(csv).toContain('1,2,Turbine 1,');
  });

  it('quotes cells containing commas, quotes, or newlines', () => {
    const csv = buildLayoutCsv(
      [
        { id: 't1', lat: 1, lng: 2, name: 'has, comma', custom: null },
        { id: 't2', lat: 3, lng: 4, name: 'has "quote"', custom: null },
        { id: 't3', lat: 5, lng: 6, name: 'has\nnewline', custom: null },
      ],
      FLEET,
    );

    const lines = csv.split('\n');
    expect(lines[1]).toContain('"has, comma"');
    expect(lines[2]).toContain('"has ""quote"""');
    // The newline-containing name is embedded verbatim inside a quoted cell.
    expect(csv).toContain('"has\nnewline"');
  });
});

describe('parseLayoutCsv', () => {
  it('parses a simple header + row CSV', () => {
    const rows = parseLayoutCsv(
      ['Latitude,Longitude,Name,Description', '55.1,7.9,Alpha,V80-2.0MW'].join('\n'),
    );

    expect(rows).toEqual([
      { lat: 55.1, lng: 7.9, name: 'Alpha', custom: null },
    ]);
  });

  it('decodes Description as custom specs when it matches the export triplet', () => {
    const rows = parseLayoutCsv(
      ['Latitude,Longitude,Name,Description', '55.1,7.9,,150 5000 120'].join('\n'),
    );

    expect(rows[0].custom).toEqual({
      rotorDiameter: 150,
      ratedPower: 5,
      hubHeight: 120,
    });
  });

  it('leaves custom null when Description is not a spec triplet', () => {
    const rows = parseLayoutCsv(
      ['Latitude,Longitude,Name,Description', '55.1,7.9,Alpha,V80-2.0MW'].join('\n'),
    );

    expect(rows[0].custom).toBeNull();
  });

  it('handles quoted fields with embedded commas and escaped quotes', () => {
    const rows = parseLayoutCsv(
      [
        'Latitude,Longitude,Name,Description',
        '37.759228,128.713727,"21455, site A","V80 ""premium"""',
      ].join('\n'),
    );

    expect(rows[0].lat).toBeCloseTo(37.759228);
    expect(rows[0].lng).toBeCloseTo(128.713727);
    expect(rows[0].name).toBe('21455, site A');
    expect(rows[0].custom).toBeNull();
  });

  it('throws when the CSV has no data rows', () => {
    expect(() => parseLayoutCsv('Latitude,Longitude,Name,Description')).toThrow(
      /header row and at least one turbine/,
    );
  });

  it('throws with a row-numbered message when coordinates are invalid', () => {
    expect(() =>
      parseLayoutCsv(
        ['Latitude,Longitude,Name,Description', 'notanumber,7.9,A,B'].join('\n'),
      ),
    ).toThrow(/Row 2: invalid coordinates/);
  });

  it('trims trailing whitespace and skips blank lines', () => {
    const rows = parseLayoutCsv(
      [
        'Latitude,Longitude,Name,Description  ',
        '55.1,7.9,Alpha,V80',
        '',
        '56.2,8.4,Beta,V80',
      ].join('\n'),
    );

    expect(rows).toHaveLength(2);
    expect(rows[1].name).toBe('Beta');
  });
});

describe('buildLayoutCsv + parseLayoutCsv round-trip', () => {
  it('restores lat/lng/name and custom specs through a full round-trip', () => {
    const turbines = [
      { id: 't1', lat: 55.1, lng: 7.9, name: 'Alpha', custom: null },
      {
        id: 't2',
        lat: 56.2,
        lng: 8.4,
        name: 'has, comma',
        custom: { hubHeight: 140, rotorDiameter: 165, ratedPower: 6.3 },
      },
    ];

    const rows = parseLayoutCsv(buildLayoutCsv(turbines, FLEET));

    // Fleet-spec turbines export the fleet triplet as Description, so on
    // re-import they come back as a custom spec matching the fleet.
    expect(rows[0]).toEqual({
      lat: 55.1,
      lng: 7.9,
      name: 'Alpha',
      custom: { rotorDiameter: 150, ratedPower: 5, hubHeight: 120 },
    });
    expect(rows[1].name).toBe('has, comma');
    expect(rows[1].custom).toEqual({
      rotorDiameter: 165,
      ratedPower: 6.3,
      hubHeight: 140,
    });
  });

  it('fills empty names with the exported "Turbine N" placeholder on re-import', () => {
    const turbines = [
      { id: 't1', lat: 1, lng: 2, name: '', custom: null },
    ];

    const rows = parseLayoutCsv(buildLayoutCsv(turbines, FLEET));

    expect(rows[0].name).toBe('Turbine 1');
  });
});
