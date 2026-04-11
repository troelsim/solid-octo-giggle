// Numeric spec input with a label and unit suffix.  Rejects non-positive values
// so controlled inputs never fall below 1 (matches the domain: hub height,
// rotor diameter, and rated power are all strictly positive).
export default function SpecField({ label, unit, value, onChange }) {
  return (
    <div className="spec-field">
      <span className="spec-label">{label}</span>
      <div className="spec-input-wrap">
        <input
          className="spec-input"
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v > 0) onChange(v);
          }}
        />
        <span className="spec-unit">{unit}</span>
      </div>
    </div>
  );
}
