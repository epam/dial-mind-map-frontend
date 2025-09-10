import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';

import {
  FIELD_NAME_DIVIDER,
  ReferenceBadgeColorCategoriesFieldNamesList,
  ReferenceBadgeColorCategoriesFieldsList,
  ReferenceBadgeColorCategoriesKeys,
} from '../../data/constants';
import { ReferenceColors } from '../ReferenceColors';

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

const dispatchMock = jest.fn();

jest.mock('@/store/builder/hooks', () => ({
  useBuilderDispatch: () => dispatchMock,
  useBuilderSelector: jest.fn(),
}));

const mockConfig = {
  references: {
    badge: {
      backgroundColor: {
        default: 'red',
        hovered: 'blue',
        selected: 'green',
      },
      textColor: {
        default: 'yellow',
        hovered: 'pink',
        selected: 'purple',
      },
    },
  },
  graph: {
    paletteSettings: {
      branchesColors: [],
      focusedNodeColors: undefined,
    },
    cytoscapeStyles: {},
  },
};

describe('ReferenceColors Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders headers and color pickers correctly', () => {
    (useBuilderSelector as jest.Mock).mockImplementation((selector: any) => {
      if (selector === UISelectors.selectTheme) return 'light';
      if (selector === AppearanceSelectors.selectThemeConfig) return mockConfig;
      return undefined;
    });

    render(<ReferenceColors />);

    ReferenceBadgeColorCategoriesFieldNamesList.forEach(header => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

    const categoriesCount = Object.values(ReferenceBadgeColorCategoriesKeys).length;
    const fieldsCount = ReferenceBadgeColorCategoriesFieldsList.length;
    const pickers = screen.getAllByTestId(/color-picker-/);
    expect(pickers).toHaveLength(categoriesCount * fieldsCount);

    pickers.forEach(picker => {
      expect(picker).toHaveAttribute('data-mandatory', 'true');
      const colorVal = picker.getAttribute('data-color');
      expect(Object.values(mockConfig.references.badge).flatMap(Object.values)).toContain(colorVal);
    });
  });

  test('commits color change and dispatches updateThemeConfig action', () => {
    // Arrange
    (useBuilderSelector as jest.Mock).mockImplementation((selector: any) => {
      if (selector === UISelectors.selectTheme) return 'light';
      if (selector === AppearanceSelectors.selectThemeConfig) return mockConfig;
      return undefined;
    });

    render(<ReferenceColors />);

    const testName = `${ReferenceBadgeColorCategoriesKeys.BACKGROUND}${FIELD_NAME_DIVIDER}hovered`;
    const picker = screen.getByTestId(`color-picker-${testName}`);
    fireEvent.click(picker);

    expect(dispatchMock).toHaveBeenCalledTimes(1);

    const expectedBadge = {
      ...mockConfig.references.badge,
      backgroundColor: {
        ...mockConfig.references.badge.backgroundColor,
        hovered: 'newColor',
      },
    };
    const expectedConfig = {
      ...mockConfig,
      references: { badge: expectedBadge },
    };

    expect(dispatchMock).toHaveBeenCalledWith(
      AppearanceActions.updateThemeConfig({ theme: 'light', config: expectedConfig }),
    );
  });

  test('does not dispatch when config is undefined', () => {
    (useBuilderSelector as jest.Mock).mockImplementation((selector: any) => {
      if (selector === UISelectors.selectTheme) return 'light';
      if (selector === AppearanceSelectors.selectThemeConfig) return undefined;
      return undefined;
    });

    render(<ReferenceColors />);

    const pickers = screen.getAllByTestId(/color-picker-/);
    fireEvent.click(pickers[0]);

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
