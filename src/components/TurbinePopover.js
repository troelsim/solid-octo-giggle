import { useLayoutEffect } from 'react';
import {
  useFloating,
  useDismiss,
  useInteractions,
  flip,
  offset,
  shift,
  FloatingPortal,
} from '@floating-ui/react';

// Desktop-only turbine popover: anchored to a screen-space {x, y} point
// (the turbine marker's position). Uses a floating-ui VirtualElement so the
// popover tracks the marker as the map pans/zooms.
export default function TurbinePopover({ anchor, open, onClose, children }) {
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
