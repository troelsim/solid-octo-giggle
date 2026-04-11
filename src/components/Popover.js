import { useLayoutEffect } from 'react';
import {
  useFloating,
  useDismiss,
  useInteractions,
  flip,
  offset,
  FloatingPortal,
} from '@floating-ui/react';

// Generic popover — renders via a portal, auto-flips when near the viewport edge.
// anchorRef: ref to the DOM element the popover should be anchored to.
export default function Popover({ anchorRef, open, onClose, children, className }) {
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
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className={className ? `popover ${className}` : 'popover'}
        {...getFloatingProps()}
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
