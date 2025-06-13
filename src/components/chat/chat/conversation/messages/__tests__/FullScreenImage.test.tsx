import { fireEvent, render, screen } from '@testing-library/react';

import { FullScreenImage } from '../FullScreenImage';

describe('FullScreenImage', () => {
  const mockOnClose = jest.fn();
  const imageSrc = 'https://example.com/image.jpg';

  test('renders image with correct src', () => {
    render(<FullScreenImage src={imageSrc} onClose={mockOnClose} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', imageSrc);
  });

  test('calls onClose when clicked', () => {
    render(<FullScreenImage src={imageSrc} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId('fullscreen-image-container'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
