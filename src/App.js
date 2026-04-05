import { useState, useCallback, useRef } from 'react';
import WindMap from './WindMap';
import './App.css';

const FLEET_DEFAULTS = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 };

function getSpec(turbine, fleet) {
  return turbine.custom ?? fleet;
}

function SpecField({ label, unit, value, onChange }) {
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

export default function App() {
  const [turbines, setTurbines] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('view');
  const [fleet, setFleet] = useState(FLEET_DEFAULTS);
  const idCounter = useRef(1);

  const selected = turbines.find(t => t.id === selectedId) ?? null;
  const selectedSpec = selected ? getSpec(selected, fleet) : null;
  const selectedIndex = selected ? turbines.findIndex(t => t.id === selectedId) + 1 : null;
  const isCustom = selected?.custom != null;

  const handleMapClick = useCallback((lat, lng) => {
    setMode(prev => {
      if (prev === 'add') {
        const id = `t${idCounter.current++}`;
        setTurbines(ts => [...ts, { id, lat, lng, custom: null }]);
        setSelectedId(id);
        return 'view';
      }
      if (prev === 'move') {
        setTurbines(ts => ts.map(t => t.id === selectedId ? { ...t, lat, lng } : t));
        return 'view';
      }
      setSelectedId(null);
      return 'view';
    });
  }, [selectedId]);

  const handleTurbineClick = useCallback((id) => {
    setSelectedId(id);
    setMode('view');
  }, []);

  const updateSelectedSpec = (key, value) => {
    setTurbines(ts => ts.map(t =>
      t.id === selectedId
        ? { ...t, custom: { ...(t.custom ?? fleet), [key]: value } }
        : t
    ));
  };

  const resetToFleet = () => setTurbines(ts => ts.map(t => t.id === selectedId ? { ...t, custom: null } : t));

  const applyToAll = () => {
    setFleet(selectedSpec);
    setTurbines(ts => ts.map(t => ({ ...t, custom: null })));
  };

  const deleteTurbine = () => {
    setTurbines(ts => ts.filter(t => t.id !== selectedId));
    setSelectedId(null);
    setMode('view');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <svg className="app-icon" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            <circle cx="10" cy="10" r="2.2" fill="currentColor"/>
            <line x1="10" y1="10" x2="10" y2="1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="10" x2="17.3" y2="14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="10" x2="2.7" y2="14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Wind Farm Designer
        </div>
        {mode === 'view' ? (
          <button className="btn-icon btn-add" onClick={() => { setSelectedId(null); setMode('add'); }} aria-label="Add turbine">
            +
          </button>
        ) : (
          <button className="btn-text btn-cancel" onClick={() => setMode('view')}>
            Cancel
          </button>
        )}
      </header>

      {mode !== 'view' && (
        <div className="mode-banner">
          {mode === 'add'
            ? 'Tap the map to place a turbine'
            : `Tap the map to move Turbine ${selectedIndex}`}
        </div>
      )}

      <div className="map-area">
        <WindMap
          turbines={turbines}
          selectedId={selectedId}
          mode={mode}
          onMapClick={handleMapClick}
          onTurbineClick={handleTurbineClick}
        />
      </div>

      <div className="bottom-panel">
        {selected ? (
          <>
            <div className="panel-row panel-header">
              <span className="panel-title">
                Turbine {selectedIndex}
                {isCustom && <span className="badge">custom</span>}
              </span>
              <button className="btn-icon btn-close" onClick={() => setSelectedId(null)} aria-label="Deselect">×</button>
            </div>
            <div className="spec-row">
              <SpecField label="Hub height" unit="m"  value={selectedSpec.hubHeight}     onChange={v => updateSelectedSpec('hubHeight', v)} />
              <SpecField label="Rotor dia." unit="m"  value={selectedSpec.rotorDiameter} onChange={v => updateSelectedSpec('rotorDiameter', v)} />
              <SpecField label="Power"      unit="MW" value={selectedSpec.ratedPower}    onChange={v => updateSelectedSpec('ratedPower', v)} />
            </div>
            <div className="action-row">
              <button className="btn-action" onClick={() => setMode('move')}>Move</button>
              {isCustom && <button className="btn-action" onClick={resetToFleet}>Reset</button>}
              {isCustom
                ? <button className="btn-action" onClick={applyToAll}>Set as fleet</button>
                : turbines.length > 1 && <button className="btn-action" onClick={applyToAll}>Apply to all</button>
              }
              <button className="btn-action btn-danger" onClick={deleteTurbine}>Delete</button>
            </div>
          </>
        ) : (
          <>
            <div className="panel-row panel-header">
              <span className="panel-title">Fleet defaults</span>
              <span className="fleet-count">
                {turbines.length === 0 ? 'Tap + to add turbines' : `${turbines.length} turbine${turbines.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="spec-row">
              <SpecField label="Hub height" unit="m"  value={fleet.hubHeight}     onChange={v => setFleet(f => ({ ...f, hubHeight: v }))} />
              <SpecField label="Rotor dia." unit="m"  value={fleet.rotorDiameter} onChange={v => setFleet(f => ({ ...f, rotorDiameter: v }))} />
              <SpecField label="Power"      unit="MW" value={fleet.ratedPower}    onChange={v => setFleet(f => ({ ...f, ratedPower: v }))} />
            </div>
            {turbines.length > 0 && (
              <div className="action-row">
                <button className="btn-action" onClick={() => setTurbines(ts => ts.map(t => ({ ...t, custom: null })))}>
                  Apply to all turbines
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
