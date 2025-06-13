import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { Login } from '../Login';

describe('Login Component', () => {
  it('should render the login button', () => {
    render(<Login onClick={jest.fn()} shouldLogin={false} />);

    const button = screen.getByRole('button', { name: /login/i });

    expect(button).toBeInTheDocument();
  });

  it('should call onClick when the button is clicked', () => {
    const handleClick = jest.fn();
    render(<Login onClick={handleClick} shouldLogin={false} />);

    const button = screen.getByRole('button', { name: /login/i });

    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should disable the button when shouldLogin is true', () => {
    render(<Login onClick={jest.fn()} shouldLogin={true} />);

    const button = screen.getByRole('button', { name: /login/i });

    expect(button).toBeDisabled();
  });

  it('should enable the button when shouldLogin is false', () => {
    render(<Login onClick={jest.fn()} shouldLogin={false} />);

    const button = screen.getByRole('button', { name: /login/i });

    expect(button).not.toBeDisabled();
  });

  it('should have correct classes for styling', () => {
    render(<Login onClick={jest.fn()} shouldLogin={false} />);

    const button = screen.getByRole('button', { name: /login/i });

    expect(button).toHaveClass('button', 'button-primary');
  });
});
