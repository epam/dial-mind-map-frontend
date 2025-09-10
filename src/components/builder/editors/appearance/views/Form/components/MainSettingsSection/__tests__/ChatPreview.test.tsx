import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import React from 'react';

import { ChatSide } from '../../../data/constants';
import { ChatPreview, ChatPreviewProps } from '../ChatPreview';

describe('ChatPreview', () => {
  const defaultProps: ChatPreviewProps = {
    borderColor: '#FF0000',
  };

  it('renders an <svg> with default dimensions', () => {
    const { container } = render(<ChatPreview {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '300');
    expect(svg).toHaveAttribute('height', '130');
  });

  it('applies the provided width and height', () => {
    const props: ChatPreviewProps = {
      ...defaultProps,
      width: 400,
      height: 200,
    };
    const { container } = render(<ChatPreview {...props} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '400');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('draws lines and pills with the given colors', () => {
    const lineColors = ['#111', '#222', '#333', '#444'];
    const pillColors = ['#AAA', '#BBB', '#CCC', '#DDD'];
    const props: ChatPreviewProps = {
      ...defaultProps,
      lineColors,
      pillColors,
    };
    const { container } = render(<ChatPreview {...props} />);

    const lines = container.querySelectorAll('line');
    expect(lines).toHaveLength(4);
    lines.forEach((line, i) => {
      expect(line).toHaveAttribute('stroke', lineColors[i]);
    });

    const pills = Array.from(container.querySelectorAll('rect')).filter(
      r => r.getAttribute('width') === '36' && r.getAttribute('height') === '12',
    );
    expect(pills).toHaveLength(4);
    pills.forEach((pill, i) => {
      expect(pill).toHaveAttribute('fill', pillColors[i]);
    });
  });

  it('positions the panel on the left when panelPosition=LEFT', () => {
    const props: ChatPreviewProps = {
      ...defaultProps,
      panelPosition: ChatSide.LEFT,
    };
    const { container } = render(<ChatPreview {...props} />);
    const panelRect = container.querySelector(`rect[stroke="${defaultProps.borderColor}"]`);
    expect(panelRect).toBeInTheDocument();
    expect(panelRect).toHaveAttribute('x', '10');
  });

  it('positions the panel on the right by default (RIGHT)', () => {
    const { container } = render(<ChatPreview {...defaultProps} />);
    const panelRect = container.querySelector(`rect[stroke="${defaultProps.borderColor}"]`);
    expect(panelRect).toHaveAttribute('x', '190');
  });

  it('renders skeleton lines and bottom pills inside the panel', () => {
    const pillColors = ['#01', '#02', '#03', '#04'];
    const props: ChatPreviewProps = {
      ...defaultProps,
      pillColors,
    };
    const { container } = render(<ChatPreview {...props} />);

    const skeletons = Array.from(container.querySelectorAll('rect')).filter(
      r => r.getAttribute('opacity') === '0.2' && r.getAttribute('height') === '4',
    );
    expect(skeletons).toHaveLength(6);

    const panelPills = Array.from(container.querySelectorAll('rect')).filter(
      r => r.getAttribute('height') === '8' && r.getAttribute('width') === '40',
    );
    expect(panelPills).toHaveLength(4);
    panelPills.forEach((rp, i) => {
      expect(rp).toHaveAttribute('fill', pillColors[i]);
    });
  });
});
