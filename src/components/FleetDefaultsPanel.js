import { useRef, useState } from 'react';
import Popover from './Popover';
import SpecField from './SpecField';

// Fleet spec editor shared between the desktop settings popover and the
// mobile bottom panel.  Before this component existed, both paths duplicated
// identical markup for the spec fields, the "Apply to all turbines" button,
// and the Clear-layout confirmation popover.  The component owns its own
// clear-popover state so it resets naturally whenever it is unmounted.
export default function FleetDefaultsPanel({
  fleet,
  onFleetChange,
  turbineCount,
  onApplyToAll,
  onClearLayout,
}) {
  const [showClearPopover, setShowClearPopover] = useState(false);
  const clearWrapRef = useRef(null);

  return (
    <>
      <div className="spec-row">
        <SpecField label="Hub height" unit="m"  value={fleet.hubHeight}     onChange={v => onFleetChange('hubHeight', v)} />
        <SpecField label="Rotor dia." unit="m"  value={fleet.rotorDiameter} onChange={v => onFleetChange('rotorDiameter', v)} />
        <SpecField label="Power"      unit="MW" value={fleet.ratedPower}    onChange={v => onFleetChange('ratedPower', v)} />
      </div>
      {turbineCount > 0 && (
        <div className="panel-secondary">
          <button className="btn-text-action" onClick={onApplyToAll}>
            Apply to all turbines
          </button>
          <div ref={clearWrapRef} className="clear-wrap">
            <button
              className="btn-text-action btn-text-action--danger"
              onClick={() => setShowClearPopover(true)}
            >
              Clear layout
            </button>
            <Popover
              anchorRef={clearWrapRef}
              open={showClearPopover}
              onClose={() => setShowClearPopover(false)}
            >
              <p className="popover-title">
                Clear all {turbineCount} turbine{turbineCount !== 1 ? 's' : ''}?
              </p>
              <button
                className="btn-popover-confirm btn-popover-confirm--danger"
                onClick={onClearLayout}
              >
                Clear all
              </button>
            </Popover>
          </div>
        </div>
      )}
    </>
  );
}
