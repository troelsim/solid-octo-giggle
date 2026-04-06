import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  useFloating,
  useDismiss,
  useInteractions,
  flip,
  offset,
  FloatingPortal,
} from '@floating-ui/react';
import WindMap from './WindMap';
import './App.css';

const FLEET_DEFAULTS = { hubHeight: 120, rotorDiameter: 150, ratedPower: 5.0 };

function getSpec(turbine, fleet) {
  return turbine.custom ?? fleet;
}

// Generic popover — renders via a portal, auto-flips when near the viewport edge.
// anchorRef: ref to the DOM element the popover should be anchored to.
function Popover({ anchorRef, open, onClose, children }) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (v) => { if (!v) onClose(); },
    placement: 'bottom-end',
    middleware: [offset(8), flip({ padding: 8 })],
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  useLayoutEffect(() => {
    refs.setReference(anchorRef.current);
  });

  if (!open) return null;

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} style={floatingStyles} className="popover" {...getFloatingProps()}>
        {children}
      </div>
    </FloatingPortal>
  );
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
  const [showSpacingRing, setShowSpacingRing] = useState(false);
  const [showRingPopover, setShowRingPopover] = useState(false);
  const [spacingRingDiameters, setSpacingRingDiameters] = useState(2);
  const [showClearPopover, setShowClearPopover] = useState(false);
  const ringWrapRef = useRef(null);
  const clearWrapRef = useRef(null);
  const idCounter = useRef(1);

  const selected = turbines.find(t => t.id === selectedId) ?? null;
  const selectedSpec = selected ? getSpec(selected, fleet) : null;
  const selectedIndex = selected ? turbines.findIndex(t => t.id === selectedId) + 1 : null;
  const isCustom = selected?.custom != null;
  const displayName = selected?.name || (selectedIndex ? `Turbine ${selectedIndex}` : null);

  const renameTurbine = (name) => {
    setTurbines(ts => ts.map(t => t.id === selectedId ? { ...t, name } : t));
  };

  const handleMapClick = useCallback((lat, lng) => {
    setMode(prev => {
      if (prev === 'add') {
        const id = `t${idCounter.current++}`;
        setTurbines(ts => [...ts, { id, lat, lng, custom: null, name: '' }]);
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

  const clearLayout = () => {
    setTurbines([]);
    setSelectedId(null);
    setMode('view');
    setShowClearPopover(false);
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
        <div className="header-right">
          <div ref={ringWrapRef} className="ring-toggle-wrap">
            <button
              className={`btn-icon btn-ring-toggle${showSpacingRing ? ' btn-ring-toggle--on' : ''}`}
              onClick={() => {
                if (showSpacingRing) {
                  setShowSpacingRing(false);
                  setShowRingPopover(false);
                } else {
                  setShowRingPopover(p => !p);
                }
              }}
              aria-label="Toggle spacing ring"
              title={showSpacingRing ? `Spacing ring: ${spacingRingDiameters}D — click to hide` : 'Show spacing ring'}
            >
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
                <circle cx="10" cy="10" r="2.2" fill="currentColor"/>
              </svg>
            </button>
            <Popover anchorRef={ringWrapRef} open={showRingPopover} onClose={() => setShowRingPopover(false)}>
                <p className="popover-title">Spacing ring</p>
                <div className="popover-field">
                  <input
                    className="popover-input"
                    type="number"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={spacingRingDiameters}
                    onChange={e => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v > 0) setSpacingRingDiameters(v);
                    }}
                    autoFocus
                    aria-label="Number of rotor diameters"
                  />
                  <span className="popover-unit">× rotor dia.</span>
                </div>
                <button
                  className="btn-popover-confirm"
                  onClick={() => { setShowSpacingRing(true); setShowRingPopover(false); }}
                >
                  Show ring
                </button>
            </Popover>
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
        </div>
      </header>

      {mode !== 'view' && (
        <div className="mode-banner">
          {mode === 'add'
            ? 'Tap the map to place a turbine'
            : `Tap the map to move ${displayName}`}
        </div>
      )}

      <div className="map-area">
        <WindMap
          turbines={turbines}
          selectedId={selectedId}
          mode={mode}
          onMapClick={handleMapClick}
          onTurbineClick={handleTurbineClick}
          fleet={fleet}
          showSpacingRing={showSpacingRing}
          spacingRingDiameters={spacingRingDiameters}
        />
      </div>

      <div className="bottom-panel">
        {selected ? (
          <>
            <div className="panel-row panel-header">
              <div className="panel-title">
                <input
                  className="panel-title-input"
                  value={selected.name}
                  placeholder={`Turbine ${selectedIndex}`}
                  onChange={e => renameTurbine(e.target.value)}
                  aria-label="Turbine name"
                />
                {isCustom && <span className="badge">custom</span>}
              </div>
              <div className="header-btns">
                <button className="btn-sm" onClick={() => setMode('move')}>Move</button>
                <button className="btn-sm btn-sm-danger" onClick={deleteTurbine}>Delete</button>
                <button className="btn-icon btn-close" onClick={() => setSelectedId(null)} aria-label="Deselect">×</button>
              </div>
            </div>
            <div className="spec-row">
              <SpecField label="Hub height" unit="m"  value={selectedSpec.hubHeight}     onChange={v => updateSelectedSpec('hubHeight', v)} />
              <SpecField label="Rotor dia." unit="m"  value={selectedSpec.rotorDiameter} onChange={v => updateSelectedSpec('rotorDiameter', v)} />
              <SpecField label="Power"      unit="MW" value={selectedSpec.ratedPower}    onChange={v => updateSelectedSpec('ratedPower', v)} />
            </div>
            {isCustom && (
              <div className="panel-secondary">
                <button className="btn-text-action" onClick={resetToFleet}>Reset to fleet</button>
                <button className="btn-text-action" onClick={applyToAll}>Set as fleet defaults</button>
              </div>
            )}
            {!isCustom && turbines.length > 1 && (
              <div className="panel-secondary">
                <button className="btn-text-action" onClick={applyToAll}>Apply to all turbines</button>
              </div>
            )}
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
              <div className="panel-secondary">
                <button className="btn-text-action" onClick={() => setTurbines(ts => ts.map(t => ({ ...t, custom: null })))}>
                  Apply to all turbines
                </button>
                <div ref={clearWrapRef} className="clear-wrap">
                  <button className="btn-text-action btn-text-action--danger" onClick={() => setShowClearPopover(true)}>
                    Clear layout
                  </button>
                  <Popover anchorRef={clearWrapRef} open={showClearPopover} onClose={() => setShowClearPopover(false)}>
                    <p className="popover-title">Clear all {turbines.length} turbine{turbines.length !== 1 ? 's' : ''}?</p>
                    <button className="btn-popover-confirm btn-popover-confirm--danger" onClick={clearLayout}>
                      Clear all
                    </button>
                  </Popover>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
