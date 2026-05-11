// Smoke test — verifies the app mounts without crashing.
// Detailed behaviour is covered by the Cucumber suite in features/.

jest.mock('./WindMap');

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
  expect(screen.getByText('PadSketch')).toBeInTheDocument();
});
