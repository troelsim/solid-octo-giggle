import { useState, useRef } from 'react';
import Popover from './Popover';

/**
 * Header button that toggles the map spacing ring on/off.
 * When the ring is off, clicking opens a popover to configure the diameter
 * multiplier before re-enabling it.
 *
 * Props:
 *   showSpacingRing      - whether the ring is currently visible
 *   spacingRingDiameters - current rotor-diameter multiplier
 *   onDiametersChange    - called with the new multiplier when the input changes
 *   onHide               - called when the user clicks to hide the ring
 *   onShow               - called when the user confirms "Show ring" in the popover
 */
export default function SpacingRingButton({
  showSpacingRing,
  spacingRingDiameters,
  onDiametersChange,
  onHide,
  onShow,
}) {
  const [showRingPopover, setShowRingPopover] = useState(false);
  const ringWrapRef = useRef(null);

  const handleToggle = () => {
    if (showSpacingRing) {
      onHide();
      setShowRingPopover(false);
    } else {
      setShowRingPopover(p => !p);
    }
  };

  return (
    <div ref={ringWrapRef} className="ring-toggle-wrap">
      <button
        className={`btn-icon btn-ring-toggle${showSpacingRing ? ' btn-ring-toggle--on' : ''}`}
        onClick={handleToggle}
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
              if (!isNaN(v) && v > 0) onDiametersChange(v);
            }}
            autoFocus
            aria-label="Number of rotor diameters"
          />
          <span className="popover-unit">× rotor dia.</span>
        </div>
        <button
          className="btn-popover-confirm"
          onClick={() => { onShow(); setShowRingPopover(false); }}
        >
          Show ring
        </button>
      </Popover>
    </div>
  );
}
