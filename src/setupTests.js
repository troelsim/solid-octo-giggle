// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock matchMedia (not available in JSDOM — defaults to mobile/false).
// Defaults to mobile (matches: false) so existing tests run against the mobile
// layout unchanged.  Desktop-specific test files override this in their own
// beforeEach to exercise the desktop layout path.
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

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
  shift: () => ({}),
  FloatingPortal: ({ children }) => children,
}), { virtual: true });
