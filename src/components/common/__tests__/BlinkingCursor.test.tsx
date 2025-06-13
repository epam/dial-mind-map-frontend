import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import React from 'react';

import { ModelCursorSign } from '@/constants/app';

import { BlinkingCursor } from '../BlinkingCursor';

describe('BlinkingCursor', () => {
  it('should render the cursor when isShowing is true', () => {
    render(<BlinkingCursor isShowing={true} />);

    expect(screen.getByText(ModelCursorSign)).toBeInTheDocument();
  });

  it('should not render anything when isShowing is false', () => {
    render(<BlinkingCursor isShowing={false} />);

    expect(screen.queryByText(ModelCursorSign)).not.toBeInTheDocument();
  });

  it('should have correct classes when rendered', () => {
    render(<BlinkingCursor isShowing={true} />);

    const cursorElement = screen.getByText(ModelCursorSign);

    expect(cursorElement).toHaveClass('mt-1', 'animate-ping', 'cursor-default');
  });
});
