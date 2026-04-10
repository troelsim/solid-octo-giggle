import { useRef, useState } from 'react';
import Popover from './Popover';
import SpecField from './SpecField';

// Shared selected-turbine editor. Rendered in two contexts:
//   • inside the desktop floating popover anchored to the marker, and
//   • inside the mobile bottom panel.
//
// Before this component existed, both paths duplicated identical markup for
// the title input, Move/Delete buttons, delete-confirmation popover, spec row,
// and secondary actions. The panel owns its own delete-popover state so that
// selecting a different turbine (via React `key={selected.id}`) naturally
// resets the popover — no parent-side reset plumbing required.
export default function TurbineEditorPanel({
  selected,
  selectedIndex,
  selectedSpec,
  isCustom,
  displayName,
  turbineCount,
  onRename,
  onStartMove,
  onDeselect,
  onUpdateSpec,
  onResetToFleet,
  onApplyToAll,
  onDelete,
}) {
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const deleteWrapRef = useRef(null);

  return (
    <>
      <div className="panel-row panel-header">
        <div className="panel-title">
          <input
            className="panel-title-input"
            value={selected.name}
            placeholder={`Turbine ${selectedIndex}`}
            onChange={e => onRename(e.target.value)}
            aria-label="Turbine name"
          />
          {isCustom && <span className="badge">custom</span>}
        </div>
        <div className="header-btns">
          <button className="btn-sm" onClick={onStartMove}>Move</button>
          <div ref={deleteWrapRef} className="delete-wrap">
            <button className="btn-sm btn-sm-danger" onClick={() => setShowDeletePopover(true)}>Delete</button>
            <Popover anchorRef={deleteWrapRef} open={showDeletePopover} onClose={() => setShowDeletePopover(false)}>
              <p className="popover-title">Delete {displayName}?</p>
              <button className="btn-popover-confirm btn-popover-confirm--danger" onClick={onDelete}>
                Delete
              </button>
            </Popover>
          </div>
          <button className="btn-icon btn-close" onClick={onDeselect} aria-label="Deselect">×</button>
        </div>
      </div>
      <div className="spec-row">
        <SpecField label="Hub height" unit="m"  value={selectedSpec.hubHeight}     onChange={v => onUpdateSpec('hubHeight', v)} />
        <SpecField label="Rotor dia." unit="m"  value={selectedSpec.rotorDiameter} onChange={v => onUpdateSpec('rotorDiameter', v)} />
        <SpecField label="Power"      unit="MW" value={selectedSpec.ratedPower}    onChange={v => onUpdateSpec('ratedPower', v)} />
      </div>
      {isCustom && (
        <div className="panel-secondary">
          <button className="btn-text-action" onClick={onResetToFleet}>Reset to fleet</button>
          <button className="btn-text-action" onClick={onApplyToAll}>Set as fleet defaults</button>
        </div>
      )}
      {!isCustom && turbineCount > 1 && (
        <div className="panel-secondary">
          <button className="btn-text-action" onClick={onApplyToAll}>Apply to all turbines</button>
        </div>
      )}
    </>
  );
}
