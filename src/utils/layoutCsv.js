function getSpec(turbine, fleet) {
  return turbine.custom ?? fleet;
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildLayoutCsv(turbines, fleet) {
  const header = ['Latitude', 'Longitude', 'Name', 'Description'];
  const rows = turbines.map((turbine, index) => {
    const spec = getSpec(turbine, fleet);
    const description = `${spec.rotorDiameter} ${spec.ratedPower * 1000} ${spec.hubHeight}`;
    return [
      turbine.lat,
      turbine.lng,
      turbine.name || `Turbine ${index + 1}`,
      description,
    ];
  });

  return [header, ...rows]
    .map(row => row.map(escapeCsvCell).join(','))
    .join('\n');
}

function parseCsvRecords(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row.map(value => value.trimEnd()));
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (inQuotes) {
    throw new Error('CSV has an unterminated quoted field');
  }

  const hasTrailingData = cell.length > 0 || row.length > 0;
  if (hasTrailingData) {
    row.push(cell);
    rows.push(row.map(value => value.trimEnd()));
  }

  return rows.filter(record => record.some(value => value.trim().length > 0));
}

export function parseLayoutCsv(text) {
  const rows = parseCsvRecords(text.trim());
  if (rows.length < 2) throw new Error('CSV needs a header row and at least one turbine');

  return rows.slice(1).map((cells, i) => {
    const lat = parseFloat(cells[0]);
    const lng = parseFloat(cells[1]);
    if (!isFinite(lat) || !isFinite(lng)) throw new Error(`Row ${i + 2}: invalid coordinates`);

    const name = cells[2] ?? '';
    const description = cells[3] ?? '';
    const parts = description
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(Number);

    const custom =
      parts.length === 3 && parts.every(v => isFinite(v) && v > 0)
        ? { rotorDiameter: parts[0], ratedPower: parts[1] / 1000, hubHeight: parts[2] }
        : null;

    return { lat, lng, name, custom };
  });
}
