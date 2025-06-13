import classNames from 'classnames';
import { Resizable, ResizableProps } from 're-resizable';
import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { NodeEditorDefaultWidth, NodeEditorMaxWidth, NodeEditorMinWidth } from '@/constants/app';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';

export const NodeEditorResizeWrapper = ({ children }: { children: ReactNode }) => {
  const dispatch = useBuilderDispatch();
  const [isResizing, setIsResizing] = useState(false);
  const nodeEditorWidth = useBuilderSelector(UISelectors.selectNodeEditorWidth);
  const nodeEditorRef = useRef<Resizable>(null);

  const onResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const resizeTriggerClassName = classNames(
    'invisible h-full w-0.5 group-hover:visible md:visible xl:bg-accent-primary xl:text-accent-primary',
    isResizing ? 'bg-accent-primary text-accent-primary xl:visible' : 'bg-layer-3 text-secondary xl:invisible',
  );

  const onResizeStop = useCallback(() => {
    setIsResizing(false);
    const resizableWidth =
      nodeEditorRef.current?.resizable?.getClientRects()[0].width &&
      Math.round(nodeEditorRef.current?.resizable?.getClientRects()[0].width);

    const width = resizableWidth ?? NodeEditorMinWidth;

    dispatch(UIActions.setNodeEditorWidth(width));
  }, [dispatch]);

  const resizeSettings: ResizableProps = useMemo(() => {
    return {
      defaultSize: {
        width: nodeEditorWidth ?? NodeEditorDefaultWidth,
      },
      minWidth: NodeEditorMinWidth,
      maxWidth: NodeEditorMaxWidth,

      size: {
        width: nodeEditorWidth ?? NodeEditorDefaultWidth,
        height: '100%',
      },
      enable: {
        top: false,
        right: true,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      },
      handleClasses: {
        right: 'group invisible md:visible opacity-0',
        left: 'group invisible md:visible opacity-0',
      },
      handleStyles: { right: { right: '-11px' }, left: { left: '-3px' } },
      handleComponent: {
        right: <div className={resizeTriggerClassName} />,
      },
      onResizeStart: onResizeStart,
      onResizeStop: onResizeStop,
    };
  }, [nodeEditorWidth, resizeTriggerClassName, onResizeStart, onResizeStop]);

  return (
    <Resizable ref={nodeEditorRef} {...resizeSettings} className="h-full">
      {children}
    </Resizable>
  );
};
