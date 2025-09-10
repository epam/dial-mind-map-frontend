import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import {
  SemanticColorsCategoriesFieldNamesList,
  SemanticColorsCategoriesKeys,
  SemanticColorsCategoriesNames,
} from '../../data/constants';
import { SemanticColorsSection } from '../SemanticColorsSection';

jest.mock('@tabler/icons-react', () => ({
  IconExclamationCircle: ({ color }: any) => <svg data-testid="icon-error" color={color} />,
  IconInfoCircle: ({ color }: any) => <svg data-testid="icon-info" color={color} />,
  IconX: () => <svg data-testid="icon-close" />,
}));

jest.mock('@/components/common/ColorPickerInput', () => ({
  ColorPickerInput: ({ name, color, onCommit, mandatory }: any) => (
    <div
      data-testid={`color-picker-${name}`}
      data-color={color}
      data-mandatory={mandatory}
      onClick={() => onCommit(name, 'newColor')}
    />
  ),
}));

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: jest.fn(),
  useBuilderSelector: jest.fn(),
}));

describe('SemanticColorsSection', () => {
  const dispatchMock = jest.fn();
  const mockColors = {
    'bg-error': '#111',
    'text-error': '#222',
    'stroke-error': '#333',
    'bg-info': '#444',
    'text-info': '#555',
    'stroke-info': '#666',
    'text-primary': '#777',
  };
  const mockConfig = { colors: mockColors } as unknown as ThemeConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    (useBuilderDispatch as jest.Mock).mockReturnValue(dispatchMock);
    (useBuilderSelector as jest.Mock).mockImplementation((selector: any) => {
      if (selector === UISelectors.selectTheme) return 'light';
      if (selector === AppearanceSelectors.selectThemeConfig) return mockConfig;
      return undefined;
    });
  });

  test('renders section headers', () => {
    render(<SemanticColorsSection />);
    SemanticColorsCategoriesFieldNamesList.forEach(header => {
      if (header) expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test('renders category names', () => {
    render(<SemanticColorsSection />);
    Object.values(SemanticColorsCategoriesKeys).forEach(category => {
      expect(screen.getByText(SemanticColorsCategoriesNames[category])).toBeInTheDocument();
    });
  });

  test('renders all color pickers with correct attributes', () => {
    render(<SemanticColorsSection />);
    const pickers = screen.getAllByTestId(/^color-picker-/);
    expect(pickers).toHaveLength(6);
    pickers.forEach(picker => {
      expect(picker).toHaveAttribute('data-mandatory', 'true');
      const color = picker.getAttribute('data-color');
      expect(Object.values(mockColors)).toContain(color);
    });
  });

  test('renders error toast preview correctly', () => {
    render(<SemanticColorsSection />);
    const preview = screen.getByTestId('toast-preview-error');
    const style = preview.getAttribute('style')!;
    expect(style).toContain('background-color: rgb(17, 17, 17); width: 100%; border-color: #333;');
    const icon = screen.getByTestId('icon-error');
    expect(icon).toHaveAttribute('color', '#222');
    const message = screen.getByText('Error message');
    expect(message).toHaveStyle({ color: mockColors['text-primary'] });
  });

  test('renders info toast preview correctly', () => {
    render(<SemanticColorsSection />);
    const preview = screen.getByTestId('toast-preview-info');
    const style = preview.getAttribute('style')!;
    expect(style).toContain('background-color: rgb(68, 68, 68); width: 100%; border-color: #666;');
    const icon = screen.getByTestId('icon-info');
    expect(icon).toHaveAttribute('color', '#555');
  });

  test('commits color change and dispatches updateThemeConfig action', () => {
    render(<SemanticColorsSection />);
    const name = 'bg-error';
    const picker = screen.getByTestId(`color-picker-${name}`);
    fireEvent.click(picker);
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const expectedConfig = { colors: { ...mockColors, [name]: 'newColor' } } as unknown as ThemeConfig;
    expect(dispatchMock).toHaveBeenCalledWith(
      AppearanceActions.updateThemeConfig({ config: expectedConfig, theme: 'light' }),
    );
  });

  test('does not dispatch when config is undefined', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === UISelectors.selectTheme) return 'light';
      return undefined;
    });
    render(<SemanticColorsSection />);
    fireEvent.click(screen.getAllByTestId(/^color-picker-/)[0]);
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  test('defaults to dark theme when selectTheme returns undefined', () => {
    (useBuilderSelector as jest.Mock).mockImplementation((selector: any) => {
      if (selector === AppearanceSelectors.selectThemeConfig) return mockConfig;
      return undefined;
    });
    render(<SemanticColorsSection />);
    fireEvent.click(screen.getByTestId(`color-picker-bg-error`));
    const expectedConfig = { colors: { ...mockColors, 'bg-error': 'newColor' } } as unknown as ThemeConfig;
    expect(dispatchMock).toHaveBeenCalledWith(
      AppearanceActions.updateThemeConfig({ config: expectedConfig, theme: 'dark' }),
    );
  });
});
