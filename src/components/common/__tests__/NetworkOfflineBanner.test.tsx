import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { NetworkOfflineBanner } from '../NetworkOfflineBanner';

describe('NetworkOfflineBanner', () => {
  let originalLocation: Location;
  let reloadMock: jest.Mock;

  beforeAll(() => {
    // Save the original window.location
    originalLocation = window.location;
  });

  beforeEach(() => {
    // Reset modules and mocks
    jest.resetModules();
    // Create a mock for reload and redefine window.location
    reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadMock } as Location,
    });
  });

  afterAll(() => {
    // Restore the original window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders the offline message, alert icon, and refresh button', () => {
    render(<NetworkOfflineBanner />);

    // Alert icon with role="alert"
    const alertIcon = screen.getByRole('alert');
    expect(alertIcon).toBeInTheDocument();

    // Informational text
    expect(screen.getByText(/you’re offline/i)).toBeInTheDocument();
    expect(screen.getByText(/Please check your internet connection and refresh\./i)).toBeInTheDocument();

    // Refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('calls window.location.reload when the refresh button is clicked', () => {
    render(<NetworkOfflineBanner />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(reloadMock).toHaveBeenCalled();
  });
});
