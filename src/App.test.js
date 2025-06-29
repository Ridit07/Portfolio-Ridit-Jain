/* eslint-disable import/first */
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock external analytics packages that are not required for testing
jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="analytics" />,
}), { virtual: true });

jest.mock('@vercel/speed-insights/react', () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}), { virtual: true });

import App from './App';
/* eslint-enable import/first */

test('renders the hero heading', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', { name: /hey, i’m ridit jain./i });
  expect(headingElement).toBeInTheDocument();
});
