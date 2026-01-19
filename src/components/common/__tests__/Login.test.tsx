import '@testing-library/jest-dom';

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { Login } from '../Login';

jest.mock('@/components/common/Loader', () => {
  const MockLoader = () => <div data-testid="loader" />;
  MockLoader.displayName = 'MockLoader';
  return MockLoader;
});

describe('Login Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const advanceToVisible = () => {
    act(() => {
      jest.advanceTimersByTime(3000);
    });
  };

  it('should render the login button', () => {
    render(<Login onClick={jest.fn()} shouldLogin={false} />);

    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();

    advanceToVisible();
    expect(button).not.toBeDisabled();
  });

  it('should call onClick when the button is clicked', () => {
    const handleClick = jest.fn();

    render(<Login onClick={handleClick} shouldLogin={false} />);

    advanceToVisible();

    const button = screen.getByRole('button', { name: /login/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should disable the button when shouldLogin is true', () => {
    render(<Login onClick={jest.fn()} shouldLogin={true} />);

    advanceToVisible();

    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeDisabled();
  });

  it('should enable the button when shouldLogin is false after delay', () => {
    render(<Login onClick={jest.fn()} shouldLogin={false} />);
    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toBeDisabled();

    advanceToVisible();
    expect(button).not.toBeDisabled();
  });

  it('should have correct classes for styling', () => {
    render(<Login onClick={jest.fn()} shouldLogin={false} />);
    advanceToVisible();

    const button = screen.getByRole('button', { name: /login/i });
    expect(button).toHaveClass('button', 'button-primary');
  });
});
