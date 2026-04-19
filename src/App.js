import { useState, useCallback, useEffect, useRef } from 'react';
import WindMap from './WindMap';
import { useLayoutStorage } from './hooks/useLayoutStorage';
import { useIsDesktop } from './hooks/useIsDesktop';
import { useImportExport } from './hooks/useImportExport';
import Popover from './components/Popover';
import TurbinePopover from './components/TurbinePopover';
import TurbineEditorPanel from './components/TurbineEditorPanel';
import FleetDefaultsPanel from './components/FleetDefaultsPanel';
import SpacingRingButton from './components/SpacingRingButton';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import { packPolygon } from './domain/packing';
import './App.css';

export default function App() {
  const isDesktop = useIsDesktop();
  const { turbines, setTurbines, fleet, setFleet, mapView, setMapView } = useLayoutStorage();
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('view');
  const [showSpacingRing, setShowSpacingRing] = useState(true);
  const [spacingRingDiameters, setSpacingRingDiameters] = useState(2);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  // Polygon vertices captured during 'draw' mode.  Cleared when leaving
  // the mode (either by confirming Fill or by cancelling).
  const [polygonDraft, setPolygonDraft] = useState([]);
  // Screen-space position of the selected turbine marker — drives the desktop popover.
  const [selectedTurbineAnchor, setSelectedTurbineAnchor] = useState(null);
  const settingsWrapRef = useRef(null);
  // Derive the starting counter from any loaded turbines so new IDs never collide.
  const idCounter = useRef(
    turbines.length
      ? Math.max(...turbines.map(t => parseInt(t.id.slice(1), 10))) + 1
      : 1
  );

  const {
    showExportModal, exportCsv, exportRef, openExport, closeExport,
    showImportModal, importCsvText, showImportConfirm, setShowImportConfirm,
    importError, openImport, closeImport, handleImportCsvChange,
    handleImportSubmit, executeImport,
  } = useImportExport({
    turbines,
    fleet,
    setTurbines,
    idCounter,
    onImportSuccess: () => { setSelectedId(null); setMode('view'); },
  });

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
      if (prev === 'draw') {
        setPolygonDraft(vs => [...vs, { lat, lng }]);
        return 'draw';
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

  // Escape key exits add, move, or draw mode without discarding placed turbines.
  // Leaving draw mode always discards the in-progress polygon.
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      setMode('view');
      setPolygonDraft([]);
    };
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
    setPolygonDraft([]);
    setShowSettingsPopover(false);
    closeExport();
  };

  const startPackArea = () => {
    setSelectedId(null);
    setPolygonDraft([]);
    setMode('draw');
  };

  const cancelPackArea = () => {
    setPolygonDraft([]);
    setMode('view');
  };

  // Fill the drawn polygon with hex-packed turbines at
  // spacingRingDiameters × rotorDiameter center-to-center.
  const fillPackedArea = () => {
    if (polygonDraft.length < 3) return;
    const spacing = spacingRingDiameters * fleet.rotorDiameter;
    const points = packPolygon(polygonDraft, spacing);
    if (points.length > 0) {
      const additions = points.map(p => ({
        id: `t${idCounter.current++}`,
        lat: p.lat,
        lng: p.lng,
        custom: null,
        name: '',
      }));
      setTurbines(ts => [...ts, ...additions]);
    }
    setPolygonDraft([]);
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
          PadSketch
        </div>
        <div className="header-right">
          <button
            className="btn-text btn-export"
            onClick={openExport}
            disabled={turbines.length === 0}
            aria-label="Export CSV"
            title={turbines.length === 0 ? 'Add turbines to export CSV' : 'Export layout as CSV'}
          >
            Export
          </button>
          <button
            className="btn-text btn-import"
            onClick={openImport}
            aria-label="Import CSV"
            title="Import layout from CSV"
          >
            Import
          </button>
          <SpacingRingButton
            showSpacingRing={showSpacingRing}
            spacingRingDiameters={spacingRingDiameters}
            onDiametersChange={setSpacingRingDiameters}
            onHide={() => setShowSpacingRing(false)}
            onShow={() => setShowSpacingRing(true)}
          />
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
                <FleetDefaultsPanel
                  fleet={fleet}
                  onFleetChange={(key, value) => setFleet(f => ({ ...f, [key]: value }))}
                  turbineCount={turbines.length}
                  onApplyToAll={() => setTurbines(ts => ts.map(t => ({ ...t, custom: null })))}
                  onClearLayout={clearLayout}
                />
              </Popover>
            </div>
          )}
          {mode === 'view' ? (
            <>
              <button
                className="btn-icon btn-pack"
                onClick={startPackArea}
                aria-label="Pack area with turbines"
                title="Draw a polygon to fill with turbines"
              >
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                  <polygon points="4,6 10,2.5 16,6 16,14 10,17.5 4,14" />
                  <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none" />
                  <circle cx="7" cy="8" r="1"   fill="currentColor" stroke="none" />
                  <circle cx="13" cy="8" r="1"  fill="currentColor" stroke="none" />
                  <circle cx="7" cy="12" r="1"  fill="currentColor" stroke="none" />
                  <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
                </svg>
              </button>
              <button className="btn-icon btn-add" onClick={() => { setSelectedId(null); setMode('add'); }} aria-label="Add turbine">
                +
              </button>
            </>
          ) : (
            <button
              className="btn-text btn-cancel"
              onClick={() => { setMode('view'); setPolygonDraft([]); }}
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      <div className="map-area">
        {mode !== 'view' && (
          <div className="mode-banner">
            {mode === 'add' && (isDesktop ? 'Click the map to place a turbine' : 'Tap or drag to place a turbine')}
            {mode === 'move' && (isDesktop ? `Click the map to move ${displayName}` : `Drag or tap to move ${displayName}`)}
            {mode === 'draw' && (
              <span className="banner-draw">
                <span className="banner-draw-text">
                  {polygonDraft.length < 3
                    ? `${isDesktop ? 'Click' : 'Tap'} the map to outline an area (${polygonDraft.length}/3)`
                    : `${polygonDraft.length} vertices — ${spacingRingDiameters}D spacing`}
                </span>
                <button
                  className="btn-banner btn-banner-fill"
                  onClick={fillPackedArea}
                  disabled={polygonDraft.length < 3}
                  aria-label="Fill area with turbines"
                >
                  Fill
                </button>
              </span>
            )}
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
          polygonDraft={polygonDraft}
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
      {/* Hidden in add and move modes so the user can click the map freely. */}
      {isDesktop && selected && mode === 'view' && (
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
              <FleetDefaultsPanel
                fleet={fleet}
                onFleetChange={(key, value) => setFleet(f => ({ ...f, [key]: value }))}
                turbineCount={turbines.length}
                onApplyToAll={() => setTurbines(ts => ts.map(t => ({ ...t, custom: null })))}
                onClearLayout={clearLayout}
              />
            </>
          )}
        </div>
      )}

      {showExportModal && (
        <ExportModal csv={exportCsv} exportRef={exportRef} onClose={closeExport} />
      )}
      {showImportModal && (
        <ImportModal
          importCsvText={importCsvText}
          onImportCsvChange={handleImportCsvChange}
          showImportConfirm={showImportConfirm}
          onImportConfirmClose={() => setShowImportConfirm(false)}
          importError={importError}
          turbineCount={turbines.length}
          onClose={closeImport}
          onSubmit={handleImportSubmit}
          onExecuteImport={executeImport}
        />
      )}
    </div>
  );
}
