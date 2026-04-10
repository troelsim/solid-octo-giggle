// Layout CSV serialization / parsing.
//
// The wire format is:
//     Latitude,Longitude,Name,Description
// where Description encodes turbine specs as three space-separated numbers:
//     "<rotorDiameter> <ratedPowerKilowatts> <hubHeight>"
// Any Description that does not match that triplet is treated as an opaque
// label and the turbine inherits the fleet defaults on re-import.

function resolveSpec(turbine, fleet) {
  return turbine.custom ?? fleet;
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

/**
 * Serializes turbines + fleet defaults into a CSV string that round-trips
 * through `parseLayoutCsv`.
 */
export function buildLayoutCsv(turbines, fleet) {
  const header = ['Latitude', 'Longitude', 'Name', 'Description'];
  const rows = turbines.map((turbine, index) => {
    const spec = resolveSpec(turbine, fleet);
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

// Splits a single CSV line into cells, honoring double-quoted fields and
// escaped (doubled) quotes inside quoted fields.
function parseCsvRow(line) {
  const cells = [];
  let pos = 0;
  while (pos < line.length) {
    if (line[pos] === '"') {
      pos++;
      let cell = '';
      while (pos < line.length) {
        if (line[pos] === '"') {
          if (line[pos + 1] === '"') { cell += '"'; pos += 2; }
          else { pos++; break; }
        } else {
          cell += line[pos++];
        }
      }
      cells.push(cell);
      if (line[pos] === ',') pos++;
    } else {
      const comma = line.indexOf(',', pos);
      if (comma === -1) { cells.push(line.slice(pos)); break; }
      cells.push(line.slice(pos, comma));
      pos = comma + 1;
    }
  }
  if (line.endsWith(',')) cells.push('');
  return cells;
}

/**
 * Parses the CSV produced by `buildLayoutCsv` back into partial turbine
 * records (without ids). Throws on missing rows or unparsable coordinates.
 * Returns an array of `{ lat, lng, name, custom }` objects; `custom` is
 * non-null only when Description matches the exported spec triplet.
 */
export function parseLayoutCsv(text) {
  const lines = text.trim().split('\n').map(l => l.trimEnd()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV needs a header row and at least one turbine');
  return lines.slice(1).map((line, i) => {
    const cells = parseCsvRow(line);
    const lat = parseFloat(cells[0]);
    const lng = parseFloat(cells[1]);
    if (!isFinite(lat) || !isFinite(lng)) throw new Error(`Row ${i + 2}: invalid coordinates`);
    const name = cells[2] ?? '';
    const description = cells[3] ?? '';
    const parts = description.split(' ').map(Number);
    const custom =
      parts.length === 3 && parts.every(v => isFinite(v) && v > 0)
        ? { rotorDiameter: parts[0], ratedPower: parts[1] / 1000, hubHeight: parts[2] }
        : null;
    return { lat, lng, name, custom };
  });
}
