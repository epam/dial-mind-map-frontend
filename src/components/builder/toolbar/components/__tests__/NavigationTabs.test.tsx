import { render, screen } from '@testing-library/react';
import React from 'react';

import { GenerationStatus } from '@/types/sources';

import { useToolbarRouting } from '../../hooks/useToolbarRouting';
import { LinkPathname, NavigationTabs } from '../NavigationTabs';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('../../hooks/useToolbarRouting', () => ({
  useToolbarRouting: jest.fn(),
}));

describe('NavigationTabs', () => {
  const mockQuery = 'id=app&theme=dark';
  const setup = (pathname: LinkPathname) => {
    (useToolbarRouting as jest.Mock).mockReturnValue({
      pathname,
      getRouteQuery: () => mockQuery,
    });
    render(<NavigationTabs isMessageStreaming={false} generationStatus={GenerationStatus.FINISHED} />);
  };

  test('renders all tabs with correct hrefs and active styling', () => {
    setup(LinkPathname.Content);

    const sourcesLink = screen.getByRole('link', { name: 'Sources' });
    const contentLink = screen.getByRole('link', { name: 'Content' });
    const customizeLink = screen.getByRole('link', { name: 'Customize' });

    expect(sourcesLink).toHaveAttribute('href', `${LinkPathname.Sources}?${mockQuery}`);
    expect(contentLink).toHaveAttribute('href', `${LinkPathname.Content}?${mockQuery}`);
    expect(customizeLink).toHaveAttribute('href', `${LinkPathname.Customize}?${mockQuery}`);

    expect(contentLink).toHaveClass('text-accent-primary');
    expect(contentLink.querySelector('span')).toBeInTheDocument();

    expect(sourcesLink).not.toHaveClass('text-accent-primary');
    expect(customizeLink).not.toHaveClass('text-accent-primary');
  });

  test('disables all tabs when streaming', () => {
    (useToolbarRouting as jest.Mock).mockReturnValue({
      pathname: LinkPathname.Sources,
      getRouteQuery: () => mockQuery,
    });
    render(<NavigationTabs isMessageStreaming={true} generationStatus={GenerationStatus.FINISHED} />);

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('text-controls-disable');
      expect(link).toHaveAttribute('tabindex', '-1');
    });
  });

  test('disables content and customize when generation not finished', () => {
    (useToolbarRouting as jest.Mock).mockReturnValue({
      pathname: LinkPathname.Sources,
      getRouteQuery: () => mockQuery,
    });
    render(<NavigationTabs isMessageStreaming={false} generationStatus={GenerationStatus.IN_PROGRESS} />);

    const sourcesLink = screen.getByRole('link', { name: 'Sources' });
    const contentLink = screen.getByRole('link', { name: 'Content' });
    const customizeLink = screen.getByRole('link', { name: 'Customize' });

    expect(sourcesLink).not.toHaveClass('text-controls-disable');
    expect(sourcesLink).not.toHaveAttribute('tabindex', '-1');

    [contentLink, customizeLink].forEach(link => {
      expect(link).toHaveClass('text-controls-disable');
      expect(link).toHaveAttribute('tabindex', '-1');
    });
  });
});
