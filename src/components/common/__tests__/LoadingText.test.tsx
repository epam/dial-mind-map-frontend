import { act, render, screen } from '@testing-library/react';

import { LoadingText } from '../LoadingText';

jest.useFakeTimers();

describe('LoadingText', () => {
  test('renders with initial text and no dots', () => {
    render(<LoadingText text="Loading" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toHaveTextContent('Loading');
  });

  test('dots animate over time', () => {
    render(<LoadingText text="Loading" intervalMs={300} />);

    expect(screen.getByText(/loading/i)).toHaveTextContent('Loading');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText(/loading/i)).toHaveTextContent('Loading.');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText(/loading/i)).toHaveTextContent('Loading..');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText(/loading/i)).toHaveTextContent('Loading...');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.getByText(/loading/i)).toHaveTextContent('Loading'); // reset
  });

  test('respects custom intervalMs', () => {
    render(<LoadingText text="Processing" intervalMs={100} />);

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.getByText(/processing/i)).toHaveTextContent('Processing.');
  });
});
