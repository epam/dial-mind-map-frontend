import { fireEvent, render, screen } from '@testing-library/react';

import { GraphRegenerateConfirmModal } from '../GraphRegenerateConfirmModal';

const setup = (propsOverride = {}) => {
  const handleClose = jest.fn();
  const handleRegenerate = jest.fn();
  const props = {
    isOpen: true,
    handleClose,
    handleRegenerate,
    ...propsOverride,
  };
  render(<GraphRegenerateConfirmModal {...props} />);
  return { handleClose, handleRegenerate };
};

describe('GraphRegenerateConfirmModal', () => {
  test('renders modal with correct text', () => {
    setup();
    expect(screen.getByText(/regenerate graph/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to regenerate the graph from scratch/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
  });

  test('calls handleClose when Cancel button is clicked', () => {
    const { handleClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls handleRegenerate when Regenerate button is clicked', () => {
    const { handleRegenerate } = setup();
    fireEvent.click(screen.getByRole('button', { name: /regenerate/i }));
    expect(handleRegenerate).toHaveBeenCalledTimes(1);
  });

  test('does not render modal content when isOpen is false', () => {
    setup({ isOpen: false });
    expect(screen.queryByText(/regenerate graph/i)).not.toBeInTheDocument();
  });
});
