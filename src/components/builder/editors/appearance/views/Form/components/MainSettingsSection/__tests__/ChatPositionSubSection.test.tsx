import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AppearanceActions, AppearanceSelectors } from '@/store/builder/appearance/appearance.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { ThemeConfig } from '@/types/customization';

import { ChatSide, sidesConfigs } from '../../../data/constants';
import { ChatPositionSubSection } from '../ChatPositionSubSection';
import { ChatPreview } from '../ChatPreview';

jest.mock('@/store/builder/hooks');
jest.mock('@/store/builder/ui/ui.reducers');
jest.mock('@/store/builder/appearance/appearance.reducers');
jest.mock('../ChatPreview', () => ({
  ChatPreview: jest.fn(() => <div data-testid="chat-preview" />),
}));

describe('ChatPositionSubSection', () => {
  const mockDispatch = jest.fn();
  const baseConfig = {
    colors: {
      'bg-layer-1': '#AAA',
      'stroke-primary': '#BBB',
      'bg-layer-3': '#CCC',
      'text-primary': '#DDD',
    },
    graph: {
      paletteSettings: {
        focusedNodeColors: { bgColor: '#EEE' },
        branchesColors: [
          { bgColor: '#F11', edgeColor: '#F12' },
          { bgColor: '#F21', edgeColor: '#F22' },
        ],
      },
    },
    chat: { chatSide: ChatSide.RIGHT },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (useBuilderDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useBuilderSelector as jest.Mock).mockImplementation(selector => {
      if (selector === UISelectors.selectTheme) return 'my-theme';
      if (selector === AppearanceSelectors.selectThemeConfig) return baseConfig;
      return undefined;
    });
  });

  it('renders both side options with correct labels and radios', () => {
    render(<ChatPositionSubSection />);
    sidesConfigs.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      const radio = screen.getByRole('radio', { name: label });
      if (value === baseConfig.chat.chatSide) {
        expect(radio).toBeChecked();
      } else {
        expect(radio).not.toBeChecked();
      }
    });
  });

  it('passes correct previewProps to ChatPreview based on config', () => {
    render(<ChatPositionSubSection />);
    expect(ChatPreview).toHaveBeenCalledTimes(sidesConfigs.length);

    const activeCall = (ChatPreview as jest.Mock).mock.calls.find(
      ([props]) => props.panelPosition === baseConfig.chat.chatSide,
    )![0];

    expect(activeCall.bgColor).toBe(baseConfig.colors['bg-layer-1']);
    expect(activeCall.borderColor).toBe(baseConfig.colors['stroke-primary']);
    expect(activeCall.inputColor).toBe(baseConfig.colors['bg-layer-3']);
    expect(activeCall.textColor).toBe(baseConfig.colors['text-primary']);
    expect(activeCall.nodeColor).toBe(baseConfig.graph.paletteSettings.focusedNodeColors.bgColor);
    expect(activeCall.pillColors).toEqual(baseConfig.graph.paletteSettings.branchesColors.map(c => c.bgColor));
    expect(activeCall.lineColors).toEqual(baseConfig.graph.paletteSettings.branchesColors.map(c => c.edgeColor));
    expect(activeCall.width).toBe(340);
    expect(activeCall.height).toBe(190);
  });

  it('dispatches updateThemeConfig with the new side on click', () => {
    render(<ChatPositionSubSection />);
    const otherSide = sidesConfigs.find(c => c.value !== baseConfig.chat.chatSide)!.value;
    const container = screen.getByText(sidesConfigs.find(c => c.value === otherSide)!.label);
    fireEvent.click(container.closest('div')!);

    expect(mockDispatch).toHaveBeenCalledTimes(1);

    const expectedConfig = {
      ...baseConfig,
      chat: { ...baseConfig.chat, chatSide: otherSide },
    };
    expect(mockDispatch).toHaveBeenCalledWith(
      AppearanceActions.updateThemeConfig({
        theme: 'my-theme',
        config: expectedConfig as unknown as ThemeConfig,
      }),
    );
  });

  it('does nothing if config is null', () => {
    (useBuilderSelector as jest.Mock).mockImplementation(selector =>
      selector === UISelectors.selectTheme ? 'theme' : null,
    );
    render(<ChatPositionSubSection />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
