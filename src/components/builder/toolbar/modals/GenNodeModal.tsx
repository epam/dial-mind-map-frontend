import {
  autoUpdate,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useInteractions,
} from '@floating-ui/react';
import { IconSend } from '@tabler/icons-react';
import { useCallback, useEffect, useRef } from 'react';

import { NEW_QUESTION_LABEL } from '@/constants/app';
import { CompletionActions } from '@/store/builder/completion/completion.reducers';
import { GraphActions } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { Node, NodeStatus, PositionedElement } from '@/types/graph';
import { uuidv4 } from '@/utils/common/uuid';

export const GenNodeModal = () => {
  const dispatch = useBuilderDispatch();
  const isGenNodeInputOpen = useBuilderSelector(UISelectors.selectIsGenNodeInputOpen);
  const inputRef = useRef<HTMLInputElement>(null);

  const openChaneHandler = useCallback(
    (value: boolean) => {
      dispatch(UIActions.setIsGenNodeInputOpen(value));
    },
    [dispatch],
  );

  const { context } = useFloating({
    open: isGenNodeInputOpen,
    onOpenChange: openChaneHandler,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(36)],
  });
  const { getFloatingProps } = useInteractions([useClick(context), useFocus(context), useDismiss(context)]);

  useEffect(() => {
    if (isGenNodeInputOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGenNodeInputOpen]);

  if (!isGenNodeInputOpen) return null;

  return (
    <FloatingPortal id="toolbar">
      <div
        style={{
          zIndex: 10,
          position: 'absolute',
          top: '90px',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        {...getFloatingProps()}
        className="shadow-mindmap"
      >
        <form
          className="relative text-primary"
          onSubmit={event => {
            event.preventDefault();
            const inputValue = inputRef.current ? inputRef.current.value : '';

            if (inputValue) {
              const nodeId = uuidv4();
              const newNode = {
                data: {
                  id: nodeId,
                  label: NEW_QUESTION_LABEL,
                  questions: [inputValue],
                  status: NodeStatus.Draft,
                  details: '',
                },
                position: {
                  x: 0,
                  y: 0,
                },
              } as PositionedElement<Node>;

              dispatch(GraphActions.addOrUpdateElements([newNode]));
              dispatch(GraphActions.setFocusNodeId(nodeId));
              dispatch(
                CompletionActions.sendCompletionRequest({
                  userMessage: inputValue,
                  nodeId: nodeId,
                }),
              );
              dispatch(UIActions.setIsNodeEditorOpen(true));
              dispatch(UIActions.setIsGenNodeInputOpen(false));
            }
          }}
        >
          <input
            ref={inputRef}
            className="input-form input-invalid peer m-0 w-[540px] bg-layer-0 pl-3 pr-[38px] text-sm"
            placeholder="Type your question to generate a node..."
            autoFocus
          />
          <button
            type="submit"
            className="group absolute right-3 top-3 transition-colors duration-200 hover:cursor-pointer hover:text-accent-primary"
          >
            <IconSend size={18} />
          </button>
        </form>
      </div>
    </FloatingPortal>
  );
};
