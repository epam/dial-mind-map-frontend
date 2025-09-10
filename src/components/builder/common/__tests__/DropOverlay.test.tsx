import { render, screen } from '@testing-library/react';
import React from 'react';

import DropOverlay from '../DropOverlay';

describe('DropOverlay', () => {
  it('does not render when visible is false', () => {
    const { container } = render(<DropOverlay visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders default message and icon when visible is true', () => {
    const { container } = render(<DropOverlay visible={true} />);
    expect(screen.getByText('Drop files here to attach them to Mind Map')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders custom message when provided', () => {
    const customMessage = 'Release the files!';
    render(<DropOverlay visible={true} message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders supportedFormats when provided', () => {
    const formats = ['PDF', 'HTML', 'PPTX'];
    render(<DropOverlay visible={true} supportedFormats={formats} />);
    expect(screen.getByText('Supported formats: PDF, HTML and PPTX')).toBeInTheDocument();
  });
});
