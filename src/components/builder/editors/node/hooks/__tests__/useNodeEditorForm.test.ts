import { act, renderHook } from '@testing-library/react';

import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import * as completionSelectors from '@/store/builder/completion/completion.selectors';
import * as graphSelectors from '@/store/builder/graph/graph.reducers';
import * as hooks from '@/store/builder/hooks';
import { NodeStatus } from '@/types/graph';

import { useNodeEditorForm } from '../useNodeEditorForm';

jest.mock('@/store/builder/hooks');

const mockDispatch = jest.fn();

const mockFocusNode = {
  label: 'Test Label',
  questions: ['What is AI?'],
  icon: '🧠',
  details: 'Some details',
  status: NodeStatus.Reviewed,
  neon: true,
  id: '123',
};

describe('useNodeEditorForm (updated)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(hooks, 'useBuilderDispatch').mockReturnValue(mockDispatch);
    jest.spyOn(hooks, 'useBuilderSelector').mockImplementation(selector => {
      if (selector === graphSelectors.GraphSelectors.selectFocusNode) return mockFocusNode;
      if (selector === completionSelectors.CompletionSelectors.selectIsMessageStreaming) return false;
      if (selector === completionSelectors.CompletionSelectors.selectStreamingContent) return '';
    });
  });

  test('initializes form with focus node values', () => {
    const { result } = renderHook(() => useNodeEditorForm());

    expect(result.current.focusNode).toEqual(mockFocusNode);
    expect(result.current.errors).toEqual({});
  });

  test('calls updateNode on handleBlur with changed value when not streaming', async () => {
    const { result } = renderHook(() => useNodeEditorForm());

    await act(async () => {
      await result.current.handleBlur('label', 'New Label');
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      BuilderActions.updateNode(expect.objectContaining({ label: 'New Label' })),
    );
  });

  test('does not call dispatch if message is streaming', async () => {
    jest.spyOn(hooks, 'useBuilderSelector').mockImplementation(selector => {
      if (selector === graphSelectors.GraphSelectors.selectFocusNode) return mockFocusNode;
      if (selector === completionSelectors.CompletionSelectors.selectIsMessageStreaming) return true;
      if (selector === completionSelectors.CompletionSelectors.selectStreamingContent) return '';
    });

    const { result } = renderHook(() => useNodeEditorForm());

    await act(async () => {
      await result.current.handleBlur('label', 'New Label');
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
