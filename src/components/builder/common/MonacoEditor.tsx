import { Editor, EditorProps } from '@monaco-editor/react';
import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react';
import classNames from 'classnames';
import omit from 'lodash-es/omit';
import { memo, useMemo, useState } from 'react';

import { useBuilderSelector } from '@/store/builder/hooks';
import { UISelectors } from '@/store/builder/ui/ui.reducers';
import { dispatchMouseLeaveEvent } from '@/utils/app/common';

import Tooltip from './Tooltip';

const editorOptions: EditorProps['options'] = {
  minimap: {
    enabled: false,
  },
  padding: {
    top: 12,
    bottom: 12,
  },
  scrollBeyondLastLine: false,
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
  automaticLayout: true,
};

interface MonacoEditorProps extends EditorProps {
  allowFullScreen?: boolean;
}

export const MonacoEditor = memo(function MonacoEditor(props: MonacoEditorProps) {
  const theme = useBuilderSelector(UISelectors.selectTheme);

  const [isFullScreen, setIsFullScreen] = useState(false);

  const wrapperStyles = useMemo(
    () =>
      isFullScreen
        ? undefined
        : {
            width: props.width ?? '100%',
            height: props.height ?? '100%',
          },
    [isFullScreen, props.width, props.height],
  );

  const FullScreenIcon = useMemo(() => (isFullScreen ? IconArrowsMinimize : IconArrowsMaximize), [isFullScreen]);

  return (
    <div
      style={wrapperStyles}
      className={classNames('flex flex-col', {
        ['!fixed left-0 top-0 z-40 h-[100vh] w-[100vw]']: isFullScreen,
        ['rounded border border-secondary bg-layer-1']: props.allowFullScreen,
      })}
    >
      {props.allowFullScreen && (
        <div className="flex justify-end divide-y border-b border-secondary">
          <Tooltip tooltip={isFullScreen ? 'Minimize' : 'Full screen'} contentClassName="text-xs px-2 text-primary">
            <button
              type="button"
              className="p-2 text-secondary hover:text-accent-primary"
              onClick={e => {
                setIsFullScreen(!isFullScreen);
                dispatchMouseLeaveEvent(e.currentTarget);
              }}
            >
              <FullScreenIcon size={18} />
            </button>
          </Tooltip>
        </div>
      )}

      <div
        className={classNames('min-h-0 min-w-0 max-w-full shrink grow', {
          ['p-2']: props.allowFullScreen,
        })}
      >
        <Editor
          options={{ ...editorOptions, ...props.options }}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          {...omit(props, ['options', 'width', 'height'])}
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
});
