// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('@floating-ui/react', () => ({
  useFloating: ({ open, onOpenChange } = {}) => {
    const React = require('react');

    React.useEffect(() => {
      if (!open) return undefined;

      const onKeyDown = (event) => {
        if (event.key === 'Escape') onOpenChange?.(false);
      };

      globalThis.document?.addEventListener('keydown', onKeyDown);
      return () => globalThis.document?.removeEventListener('keydown', onKeyDown);
    }, [open, onOpenChange]);

    return {
      refs: { setReference: () => {}, setFloating: () => {} },
      floatingStyles: {},
      context: { onOpenChange },
    };
  },
  useDismiss: () => ({}),
  useInteractions: () => ({ getFloatingProps: (props = {}) => props }),
  flip: () => ({}),
  offset: () => ({}),
  FloatingPortal: ({ children }) => children,
}), { virtual: true });
