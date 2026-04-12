import { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import {
  useFloating,
  useDismiss,
  useInteractions,
  flip,
  offset,
  shift,
  FloatingPortal,
} from '@floating-ui/react';
import WindMap from './WindMap';
import { useLayoutStorage } from './hooks/useLayoutStorage';
import { buildLayoutCsv, parseLayoutCsv } from './utils/layoutCsv';
import Popover from './components/Popover';
import SpecField from './components/SpecField';
import TurbineEditorPanel from './components/TurbineEditorPanel';
import './App.css';

// Returns true when the viewport is wide enough for the desktop layout (≥640 px).
// Defaults to false (mobile) in JSDOM where matchMedia is unavailable.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 640px)')?.matches
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 640px)');
    if (!mq) return;
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

// Desktop-only turbine popover: anchored to a screen-space {x, y} point
// (the turbine marker's position).  Uses a floating-ui VirtualElement so the
// popover tracks the marker as the map pans/zooms.
function TurbinePopover({ anchor, open, onClose, children }) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (v) => { if (!v) onClose(); },
    placement: 'top-start',
    middleware: [offset(12), flip({ padding: 12 }), shift({ padding: 12 })],
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  useLayoutEffect(() => {
    refs.setReference(anchor ? {
      getBoundingClientRect: () => ({
        x: anchor.x, y: anchor.y,
        top: anchor.y, left: anchor.x,
        bottom: anchor.y, right: anchor.x,
        width: 0, height: 0,
      }),
    } : null);
  }, [anchor, refs]);

  if (!open) return null;

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} style={floatingStyles} className="popover turbine-popover" {...getFloatingProps()}>
        {children}
      </div>
    </FloatingPortal>
  );
}

export default function App() {
  const isDesktop = useIsDesktop();
  const { turbines, setTurbines, fleet, setFleet, mapView, setMapView } = useLayoutStorage();
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('view');
  const [showSpacingRing, setShowSpacingRing] = useState(false);
  const [showRingPopover, setShowRingPopover] = useState(false);
  const [spacingRingDiameters, setSpacingRingDiameters] = useState(2);
  const [showClearPopover, setShowClearPopover] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCsv, setExportCsv] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importError, setImportError] = useState('');
  // Screen-space position of the selected turbine marker — drives the desktop popover.
  const [selectedTurbineAnchor, setSelectedTurbineAnchor] = useState(null);
  const ringWrapRef = useRef(null);
  const clearWrapRef = useRef(null);
  const settingsWrapRef = useRef(null);
  const exportRef = useRef(null);
  const importConfirmRef = useRef(null);
  // Derive the starting counter from any loaded turbines so new IDs never collide.
  const idCounter = useRef(
    turbines.length
      ? Math.max(...turbines.map(t => parseInt(t.id.slice(1), 10))) + 1
      : 1
  );

  const selected = turbines.find(t => t.id === selectedId) ?? null;
  const selectedSpec = selected ? selected.custom ?? fleet : null;
  const selectedIndex = selected ? turbines.findIndex(t => t.id === selectedId) + 1 : null;
  const isCustom = selected?.custom != null;
  const displayName = selected?.name || (selectedIndex ? `Turbine ${selectedIndex}` : null);

  const renameTurbine = (name) => {
    setTurbines(ts => ts.map(t => t.id === selectedId ? { ...t, name } : t));
  };

  const handleMapClick = useCallback((lat, lng, pos) => {
    setMode(prev => {
      if (prev === 'add') {
        const id = `t${idCounter.current++}`;
        setTurbines(ts => [...ts, { id, lat, lng, custom: null, name: '' }]);
        setSelectedId(id);
        if (pos) setSelectedTurbineAnchor(pos);
        return 'add';
      }
      if (prev === 'move') {
        setTurbines(ts => ts.map(t => t.id === selectedId ? { ...t, lat, lng } : t));
        if (pos) setSelectedTurbineAnchor(pos);
        return 'view';
      }
      setSelectedId(null);
      return 'view';
    });
  }, [selectedId, setTurbines]);

  const handleTurbineClick = useCallback((id, pos) => {
    setSelectedId(id);
    setMode('view');
    if (pos) setSelectedTurbineAnchor(pos);
  }, []);

  // Escape key exits add or move mode without discarding placed turbines.
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setMode('view'); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
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
    setShowSettingsPopover(false);
    setShowExportModal(false);
    setExportCsv('');
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setShowImportConfirm(false);
    setImportCsvText('');
    setImportError('');
  };

  const handleImportSubmit = () => {
    try {
      parseLayoutCsv(importCsvText);
      setImportError('');
      setShowImportConfirm(true);
    } catch (e) {
      setImportError(e.message);
      setShowImportConfirm(false);
    }
  };

  const executeImport = () => {
    try {
      const rows = parseLayoutCsv(importCsvText);
      setTurbines(rows.map(row => ({ id: `t${idCounter.current++}`, ...row })));
      setSelectedId(null);
      setMode('view');
      closeImportModal();
    } catch (e) {
      setImportError(e.message);
      setShowImportConfirm(false);
    }
  };

  useLayoutEffect(() => {
    if (!showExportModal || !exportRef.current) return;
    exportRef.current.focus();
    exportRef.current.select();
  }, [showExportModal, exportCsv]);

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
          PadSketch
        </div>
        <div className="header-right">
          <button
            className="btn-text btn-export"
            onClick={() => {
              setExportCsv(buildLayoutCsv(turbines, fleet));
              setShowExportModal(true);
            }}
            disabled={turbines.length === 0}
            aria-label="Export CSV"
            title={turbines.length === 0 ? 'Add turbines to export CSV' : 'Export layout as CSV'}
          >
            Export
          </button>
          <button
            className="btn-text btn-import"
            onClick={() => setShowImportModal(true)}
            aria-label="Import CSV"
            title="Import layout from CSV"
          >
            Import
          </button>
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
          {/* Settings gear — desktop only: fleet defaults + clear layout */}
          {isDesktop && (
            <div ref={settingsWrapRef} className="settings-wrap">
              <button
                className={`btn-icon btn-settings${showSettingsPopover ? ' btn-settings--on' : ''}`}
                onClick={() => setShowSettingsPopover(p => !p)}
                aria-label="Fleet settings"
                title="Fleet defaults and layout tools"
              >
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 0 1 .947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 0 1-2.287-.947zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
                </svg>
              </button>
              <Popover anchorRef={settingsWrapRef} open={showSettingsPopover} onClose={() => setShowSettingsPopover(false)} className="settings-popover">
                <p className="popover-title">Fleet defaults</p>
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
              </Popover>
            </div>
          )}
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

      <div className="map-area">
        {mode !== 'view' && (
          <div className="mode-banner">
            {mode === 'add'
              ? (isDesktop ? 'Click the map to place a turbine' : 'Tap or drag to place a turbine')
              : (isDesktop ? `Click the map to move ${displayName}` : `Drag or tap to move ${displayName}`)}
          </div>
        )}
        <WindMap
          turbines={turbines}
          selectedId={selectedId}
          mode={mode}
          onMapClick={handleMapClick}
          onTurbineClick={handleTurbineClick}
          fleet={fleet}
          showSpacingRing={showSpacingRing}
          spacingRingDiameters={spacingRingDiameters}
          center={mapView.center}
          zoom={mapView.zoom}
          onViewChange={(center, zoom) => setMapView({ center, zoom })}
          onSelectedTurbineMove={pos => setSelectedTurbineAnchor(pos)}
        />
      </div>

      {/* The selected-turbine editor is the same component in both layouts —
          only its wrapper (floating popover vs. fixed bottom panel) differs.
          Keying by id resets any locally-held state (e.g. delete popover)
          whenever the user selects a different turbine. */}

      {/* ── Desktop: turbine popover near the marker ── */}
      {/* Hidden in move mode so the user can click the map freely to confirm. */}
      {isDesktop && selected && mode !== 'move' && (
        <TurbinePopover
          anchor={selectedTurbineAnchor}
          open={true}
          onClose={() => setSelectedId(null)}
        >
          <TurbineEditorPanel
            key={selected.id}
            selected={selected}
            selectedIndex={selectedIndex}
            selectedSpec={selectedSpec}
            isCustom={isCustom}
            displayName={displayName}
            turbineCount={turbines.length}
            onRename={renameTurbine}
            onStartMove={() => setMode('move')}
            onDeselect={() => setSelectedId(null)}
            onUpdateSpec={updateSelectedSpec}
            onResetToFleet={resetToFleet}
            onApplyToAll={applyToAll}
            onDelete={deleteTurbine}
          />
        </TurbinePopover>
      )}

      {/* ── Mobile: bottom panel ── */}
      {/* Hidden in move mode (matching desktop behaviour) so the user can drag
          the map freely to choose the new turbine position. */}
      {!isDesktop && mode !== 'move' && (
        <div className="bottom-panel">
          {selected ? (
            <TurbineEditorPanel
              key={selected.id}
              selected={selected}
              selectedIndex={selectedIndex}
              selectedSpec={selectedSpec}
              isCustom={isCustom}
              displayName={displayName}
              turbineCount={turbines.length}
              onRename={renameTurbine}
              onStartMove={() => setMode('move')}
              onDeselect={() => setSelectedId(null)}
              onUpdateSpec={updateSelectedSpec}
              onResetToFleet={resetToFleet}
              onApplyToAll={applyToAll}
              onDelete={deleteTurbine}
            />
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
      )}

      {showExportModal && (
        <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="CSV export modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="panel-row">
              <p className="popover-title export-modal-title">Layout CSV export</p>
              <button
                className="btn-icon btn-close"
                onClick={() => setShowExportModal(false)}
                aria-label="Close CSV export"
              >
                ×
              </button>
            </div>
            <textarea
              ref={exportRef}
              className="export-textarea"
              value={exportCsv}
              readOnly
              aria-label="Layout CSV export"
            />
          </div>
        </div>
      )}
      {showImportModal && (
        <div className="modal-backdrop" onClick={closeImportModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="CSV import modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="panel-row">
              <p className="popover-title export-modal-title">Import layout CSV</p>
              <button
                className="btn-icon btn-close"
                onClick={closeImportModal}
                aria-label="Close CSV import"
              >
                ×
              </button>
            </div>
            {importError && (
              <p className="import-error" role="alert">{importError}</p>
            )}
            <textarea
              className="export-textarea"
              value={importCsvText}
              onChange={e => { setImportCsvText(e.target.value); setImportError(''); }}
              placeholder={'Latitude,Longitude,Name,Description\n55.1,7.9,Turbine 1,150 5000 120'}
              aria-label="CSV to import"
            />
            <div ref={importConfirmRef} className="import-confirm-wrap">
              <button
                className="btn-popover-confirm"
                disabled={!importCsvText.trim()}
                onClick={handleImportSubmit}
                aria-label="Import layout"
              >
                Import
              </button>
              <Popover anchorRef={importConfirmRef} open={showImportConfirm} onClose={() => setShowImportConfirm(false)}>
                <p className="popover-title">
                  {turbines.length > 0
                    ? `Replace ${turbines.length} turbine${turbines.length !== 1 ? 's' : ''}?`
                    : 'Import layout?'}
                </p>
                <button
                  className="btn-popover-confirm btn-popover-confirm--danger"
                  onClick={executeImport}
                  aria-label="Replace layout"
                >
                  Replace layout
                </button>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
