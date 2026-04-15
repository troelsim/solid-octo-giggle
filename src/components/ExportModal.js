export default function ExportModal({ csv, exportRef, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
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
            onClick={onClose}
            aria-label="Close CSV export"
          >
            ×
          </button>
        </div>
        <textarea
          ref={exportRef}
          className="export-textarea"
          value={csv}
          readOnly
          aria-label="Layout CSV export"
        />
      </div>
    </div>
  );
}
