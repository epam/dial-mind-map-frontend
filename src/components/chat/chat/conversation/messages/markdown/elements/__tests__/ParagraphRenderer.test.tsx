import { render, screen } from '@testing-library/react';
import React from 'react';

import { ModelCursorSign } from '@/constants/app';

import { ParagraphRenderer } from '../ParagraphRenderer';

jest.mock('@/components/common/BlinkingCursor', () => ({
  BlinkingCursor: ({ isShowing }: any) => <div data-testid="blinking-cursor" data-showing={isShowing} />,
}));

describe('ParagraphRenderer Component', () => {
  test('renders a paragraph with provided children', () => {
    render(
      <ParagraphRenderer className="test-class" isShowResponseLoader={false}>
        Hello World
      </ParagraphRenderer>,
    );

    const paragraph = screen.getByText(/hello world/i);
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveClass('test-class');
  });

  test('renders BlinkingCursor when first child is ModelCursorSign', () => {
    render(<ParagraphRenderer isShowResponseLoader={true}>{[ModelCursorSign]}</ParagraphRenderer>);

    const cursor = screen.getByTestId('blinking-cursor');
    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveAttribute('data-showing', 'true');
  });

  test('does not render BlinkingCursor when first child is not ModelCursorSign', () => {
    render(<ParagraphRenderer isShowResponseLoader={true}>{['Not a cursor']}</ParagraphRenderer>);

    expect(screen.queryByTestId('blinking-cursor')).not.toBeInTheDocument();
  });
});
