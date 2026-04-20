import { useState, useRef } from 'react';
import Popover from './Popover';

// Mobile header overflow menu. Collapses secondary actions (Export, Import) behind
// a single "⋯" button so primary creation actions (Pack, Add) have room to breathe.
//
// Each item's aria-label is preserved from the flat header so selectors like
// getByRole('button', { name: 'Export CSV' }) keep working once the menu is open.
export default function OverflowMenu({ onOpenExport, onOpenImport, exportDisabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const run = (fn) => () => { fn(); setOpen(false); };

  return (
    <div ref={wrapRef} className="overflow-wrap">
      <button
        className={`btn-icon btn-overflow${open ? ' btn-overflow--on' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        title="More actions"
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="currentColor">
          <circle cx="4.5" cy="10" r="1.6"/>
          <circle cx="10" cy="10" r="1.6"/>
          <circle cx="15.5" cy="10" r="1.6"/>
        </svg>
      </button>
      <Popover anchorRef={wrapRef} open={open} onClose={() => setOpen(false)} className="overflow-menu">
        <button
          className="overflow-item"
          onClick={run(onOpenExport)}
          disabled={exportDisabled}
          aria-label="Export CSV"
          title={exportDisabled ? 'Add turbines to export CSV' : 'Export layout as CSV'}
        >
          Export CSV
        </button>
        <button
          className="overflow-item"
          onClick={run(onOpenImport)}
          aria-label="Import CSV"
        >
          Import CSV
        </button>
      </Popover>
    </div>
  );
}
