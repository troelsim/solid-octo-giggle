import { useRef } from 'react';
import Popover from './Popover';

export default function ImportModal({
  importCsvText,
  onImportCsvChange,
  showImportConfirm,
  onImportConfirmClose,
  importError,
  turbineCount,
  onClose,
  onSubmit,
  onExecuteImport,
}) {
  const importConfirmRef = useRef(null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
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
            onClick={onClose}
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
          onChange={e => onImportCsvChange(e.target.value)}
          placeholder={'Latitude,Longitude,Name,Description\n55.1,7.9,Turbine 1,150 5000 120'}
          aria-label="CSV to import"
        />
        <div ref={importConfirmRef} className="import-confirm-wrap">
          <button
            className="btn-popover-confirm"
            disabled={!importCsvText.trim()}
            onClick={onSubmit}
            aria-label="Import layout"
          >
            Import
          </button>
          <Popover anchorRef={importConfirmRef} open={showImportConfirm} onClose={onImportConfirmClose}>
            <p className="popover-title">
              {turbineCount > 0
                ? `Replace ${turbineCount} turbine${turbineCount !== 1 ? 's' : ''}?`
                : 'Import layout?'}
            </p>
            <button
              className="btn-popover-confirm btn-popover-confirm--danger"
              onClick={onExecuteImport}
              aria-label="Replace layout"
            >
              Replace layout
            </button>
          </Popover>
        </div>
      </div>
    </div>
  );
}
