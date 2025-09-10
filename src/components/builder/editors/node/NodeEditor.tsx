'use client';

import { IconDots, IconFocus2, IconPlaystationSquare, IconTrashX, IconWand, IconX } from '@tabler/icons-react';
import MDEditor from '@uiw/react-md-editor';
import { getCommands, getExtraCommands, ICommand } from '@uiw/react-md-editor/commands';
import classNames from 'classnames';
import { ChangeEvent, memo, useCallback, useRef, useState } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import rehypeSanitize from 'rehype-sanitize';

import { Space } from '@/components/common/Space/Space';
import { ToggleSwitch } from '@/components/common/ToggleSwitch/ToggleSwitch';
import { AllowedIconsTypes, BytesInKb, MindmapIconsFolderName, NEW_QUESTION_LABEL } from '@/constants/app';
import { MAX_NODE_ICON_FILE_SIZE_KB } from '@/constants/settings';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { BuilderActions } from '@/store/builder/builder/builder.reducers';
import { CompletionActions } from '@/store/builder/completion/completion.reducers';
import { FilesActions } from '@/store/builder/files/files.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { EdgeDirectionType } from '@/types/graph';
import { constructPath, prepareFileName } from '@/utils/app/file';
import { getDecodedFolderPath } from '@/utils/app/folders';
import { isNodeStatus } from '@/utils/app/graph/typeGuards';

import ContextMenu from '../../common/ContextMenu';
import { sanitizeAndReportFiles } from '../sources/utils/files';
import { ConnectionsSelector } from './components/ConnectionsSelector';
import { StatusSelector } from './components/StatusSelector';
import { statusOptions } from './data/constants';
import { FormValues, QuestionItem, useNodeEditorForm } from './hooks/useNodeEditorForm';

const NodeEditor = () => {
  const dispatch = useBuilderDispatch();
  const mdEditorRef = useRef<HTMLDivElement>(null);

  const { control, register, errors, handleBlur, focusNode, isMessageStreaming, getValues } = useNodeEditorForm();
  const questions: QuestionItem[] = useWatch({ control, name: 'questions' }) || [];
  const [newQuestionText, setNewQuestionText] = useState('');
  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
    update: updateQuestion,
  } = useFieldArray<FormValues, 'questions'>({
    control,
    name: 'questions',
  });
  const [questionsErrors, setQuestionsErrors] = useState<{ [key: string]: string }>({});

  const handleNewQuestionBlur = () => {
    const trimmed = newQuestionText.trim();
    if (!trimmed) return;
    setQuestionsErrors(e => {
      const copy = { ...e };
      delete copy.new;
      return copy;
    });
    appendQuestion({ text: trimmed });
    setNewQuestionText('');
    handleBlur('questions', [...(questions ?? []), { text: trimmed }]);
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestionsErrors(e => {
      const copy = { ...e };
      delete copy[idx];
      return copy;
    });

    const current = getValues('questions') || [];
    const updated = current.filter((_, i) => i !== idx);

    removeQuestion(idx);

    handleBlur('questions', updated);
  };

  const mindmapFolder = useBuilderSelector(ApplicationSelectors.selectMindmapFolder);
  const folderPath = getDecodedFolderPath(mindmapFolder ?? '', constructPath(MindmapIconsFolderName, focusNode.id));

  const handleSelectIconFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const filteredFiles = sanitizeAndReportFiles(
        files,
        dispatch,
        AllowedIconsTypes,
        MAX_NODE_ICON_FILE_SIZE_KB * BytesInKb,
      );

      filteredFiles.forEach(file => {
        const fileName = prepareFileName(file.name);
        const fileId = constructPath(folderPath, fileName);
        const iconPath = constructPath(MindmapIconsFolderName, focusNode.id, fileName) + `?ts=${Date.now()}`;

        let iconNameToReplace;
        let iconFileIdToReplace;
        if (focusNode.icon) {
          const prevName = focusNode.icon.split('?')[0];
          const prevId = constructPath(getDecodedFolderPath(mindmapFolder ?? ''), prevName);
          if (prevId !== fileId) {
            iconNameToReplace = prevName;
            iconFileIdToReplace = prevId;
          }
        }

        dispatch(
          FilesActions.replaceIcon({
            fileContent: file,
            id: fileId,
            relativePath: folderPath,
            name: fileName,
            nodeId: focusNode.id,
            iconPath,
            iconNameToReplace,
            iconFileIdToReplace,
          }),
        );
        handleBlur('icon', iconPath);
      });
      e.target.value = '';
    },
    [dispatch, focusNode, folderPath, handleBlur, mindmapFolder],
  );

  const handleDeleteIcon = useCallback(
    (name: string) => {
      const fileName = name.split('?')[0];
      const fileId = constructPath(getDecodedFolderPath(mindmapFolder ?? ''), fileName);
      dispatch(FilesActions.deleteIcon({ fileId, fileName }));
      handleBlur('icon', '');
    },
    [dispatch, handleBlur, mindmapFolder],
  );

  const handleRegenerateAnswer = useCallback(() => {
    dispatch(
      CompletionActions.sendCompletionRequest({
        userMessage: focusNode.questions?.at(0) ?? '',
        nodeId: focusNode.id,
        customFields: {
          configuration: {
            force_answer_generation: true,
            target_node_id: focusNode.id,
          },
        },
        updatedField: 'details',
      }),
    );
    dispatch(CompletionActions.setSteamingContent({ content: '' }));
    if (mdEditorRef.current) {
      const textarea = mdEditorRef.current?.querySelector<HTMLTextAreaElement>('.w-md-editor-text-input');
      if (textarea?.focus) {
        textarea.focus();
      }
    }
  }, [dispatch, focusNode.id, focusNode.questions]);

  const handleQuestionBlur = (val: string, idx: number) => {
    const trimmed = val.trim();

    if (!trimmed) {
      setQuestionsErrors(err => ({ ...err, [idx]: 'Question cannot be empty' }));
      return;
    }

    setQuestionsErrors(err => {
      const copy = { ...err };
      delete copy[idx];
      return copy;
    });

    updateQuestion(idx, { text: trimmed });

    const updated = questions.map((q, i) => (i === idx ? { text: trimmed } : q));
    handleBlur('questions', updated);
  };

  const regenerateCommand: ICommand = {
    name: 'regenerate',
    keyCommand: 'regenerate',
    buttonProps: {
      'aria-label': 'Regenerate details',
      title: 'Regenerate details',
      style: { position: 'absolute', right: 3, top: 3 },
    },
    icon: <IconWand size={14} />,
    execute: () => {
      handleRegenerateAnswer();
    },
  };

  return (
    <div className="absolute flex size-full flex-1 flex-col gap-4 rounded bg-layer-3 text-left shadow-mindmap">
      <div className="px-5 pt-5 text-base font-semibold">{isMessageStreaming ? 'Generating node...' : 'Details'}</div>
      <div className="absolute right-2 top-2 flex gap-2">
        <div className="text-secondary hover:cursor-pointer hover:text-primary">
          <ContextMenu
            TriggerIcon={IconDots}
            triggerIconHighlight
            menuItems={[
              {
                dataQa: 'set-root-node',
                name: 'Set as root node',
                Icon: IconFocus2,
                className: 'text-sm',
                onClick: () => dispatch(BuilderActions.setNodeAsRoot(focusNode.id)),
              },
              {
                dataQa: 'delete-node',
                name: 'Delete node',
                Icon: IconTrashX,
                className: 'text-sm',
                onClick: () => dispatch(BuilderActions.deleteNodeWithConnectedEdges(focusNode.id)),
              },
            ]}
          />
        </div>
        <div
          className="text-secondary hover:cursor-pointer hover:text-primary"
          onClick={() => dispatch(UIActions.setIsNodeEditorOpen(false))}
        >
          <IconX />
        </div>
      </div>
      <form className="flex h-full flex-col gap-4 overflow-y-auto pb-5">
        <Space size="middle" className="px-5">
          <label htmlFor="node-label" className="mb-1 flex min-w-20 items-center border-t border-transparent text-sm">
            Label
          </label>
          <div className="flex grow flex-col gap-px">
            <input
              className="input-form input-invalid peer mx-0 border-transparent px-2 text-sm hover:border-primary focus:border-accent-primary"
              {...register('label')}
              id="node-label"
              placeholder="Label"
              onBlur={e => handleBlur('label', e.target.value)}
            />
            {errors.label && (
              <span className="text-xxs text-error peer-invalid:peer-[.submitted]:mb-1">{errors.label.message}</span>
            )}
          </div>
        </Space>
        <Space size="middle" className="px-5" align="start">
          <label
            htmlFor="node-questions"
            className="mb-1 mt-2 flex min-w-20 items-start border-t border-transparent text-sm"
          >
            Questions
          </label>
          <div className="flex w-full flex-col gap-2">
            {questionFields.map((field, index) => (
              <div key={field.id} className="group relative">
                <Controller
                  control={control}
                  name={`questions.${index}.text`}
                  render={({ field: { value, onChange } }) => (
                    <input
                      className={classNames(
                        'input-form w-full pr-8 text-sm',
                        'border',
                        'hover:border-primary focus:border-accent-primary',
                        questionsErrors[index] && 'border-error',
                        !questionsErrors[index] && 'border-transparent',
                      )}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      onBlur={e => handleQuestionBlur(e.target.value, index)}
                    />
                  )}
                />
                {questionFields.length > 1 && (
                  <IconTrashX
                    size={16}
                    className={classNames(
                      'absolute right-2 top-3 cursor-pointer transition-opacity',
                      'opacity-0 group-hover:opacity-100',
                      'hover:text-accent-primary',
                    )}
                    onClick={() => handleDeleteQuestion(index)}
                  />
                )}

                {questionsErrors[index] && <span className="text-xxs text-error">{questionsErrors[index]}</span>}
              </div>
            ))}
            <div className="relative">
              <input
                className={classNames(
                  'input-form w-full text-sm',
                  'border border-transparent',
                  'focus:border-accent-primary hover:border-primary',
                  newQuestionText && 'text-primary',
                  questionsErrors.new && 'border-error',
                )}
                placeholder={questionFields.length ? 'Enter an alternative question' : 'Enter a question'}
                value={newQuestionText}
                onChange={e => {
                  setQuestionsErrors(e => {
                    const copy = { ...e };
                    delete copy.new;
                    return copy;
                  });
                  setNewQuestionText(e.target.value);
                }}
                onBlur={handleNewQuestionBlur}
              />
              {questionsErrors.new && <span className="block text-xxs text-error">{questionsErrors.new}</span>}
            </div>
          </div>
        </Space>
        <div className="flex flex-col px-5">
          <Controller
            name="details"
            control={control}
            disabled={isMessageStreaming}
            render={({ field }) => (
              <div ref={mdEditorRef}>
                <MDEditor
                  {...field}
                  preview="edit"
                  height={380}
                  previewOptions={{
                    rehypePlugins: [[rehypeSanitize]],
                  }}
                  className="details-markdowm"
                  onBlur={() => handleBlur('details', field.value)}
                  textareaProps={{
                    placeholder: isMessageStreaming ? NEW_QUESTION_LABEL : 'Add an answer...',
                    disabled: isMessageStreaming,
                  }}
                  commands={getCommands()}
                  extraCommands={[...getExtraCommands(), regenerateCommand]}
                />
              </div>
            )}
          />
          {errors.details && (
            <span className="text-xxs text-error peer-invalid:peer-[.submitted]:mb-1">{errors.details.message}</span>
          )}
        </div>
        <Space size="middle" className="px-5">
          <label htmlFor="node-status" className="mb-1 flex min-w-20 items-center text-sm">
            Status
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field: { value } }) => {
              const selectedOption = statusOptions.find(option => option.value === value) || statusOptions[0];

              return (
                <StatusSelector
                  className="text-xs"
                  options={statusOptions}
                  value={selectedOption}
                  onChange={option => {
                    if (value !== option.value && isNodeStatus(option.value)) {
                      handleBlur('status', option.value);
                    }
                  }}
                />
              );
            }}
          />
          {errors.status && (
            <span className="text-xxs text-error peer-invalid:peer-[.submitted]:mb-1">{errors.status.message}</span>
          )}
        </Space>
        <Space size="middle" className="px-5">
          <label htmlFor="node-status" className="mb-1 flex min-w-20 items-center text-sm">
            Icon
          </label>
          <Controller
            name="icon"
            control={control}
            render={({ field: { value } }) => {
              const fileName = value?.split('/').at(-1)?.split('?')[0];

              return (
                <label className="input-form input-invalid peer mx-0 border-transparent px-2 text-sm hover:border-primary focus:border-accent-primary">
                  <div className={classNames(['flex justify-between', !value && 'text-secondary'])}>
                    {fileName || 'No icon'}
                    <div className="flex items-center gap-2">
                      <span className="text-accent-primary">{value ? 'Change' : 'Add'}</span>
                      {fileName && (
                        <div
                          onClick={event => {
                            event.preventDefault();
                            handleDeleteIcon(value);
                          }}
                        >
                          <IconX className="cursor-pointer text-secondary hover:text-accent-primary" size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleSelectIconFile}
                    accept={AllowedIconsTypes.join(',')}
                  />
                </label>
              );
            }}
          />
          {errors.status && (
            <span className="text-xxs text-error peer-invalid:peer-[.submitted]:mb-1">{errors.status.message}</span>
          )}
        </Space>
        <Space size="middle" className="px-5">
          <label htmlFor="node-highlight" className="mb-1 flex min-w-20 items-center text-sm">
            Neon
          </label>
          <Controller
            name="neon"
            control={control}
            render={({ field: { onChange, value } }) => (
              <ToggleSwitch
                isOn={!!value}
                switchOnText="ON"
                switchOFFText="OFF"
                handleSwitch={(e: React.ChangeEvent<HTMLInputElement>) => {
                  onChange(e.target.checked);
                  handleBlur('neon', e.target.checked);
                }}
              />
            )}
          />
          <span>Highlight node with neon</span>
        </Space>
        <Space className="border-t border-t-tertiary px-5 pt-2" direction="vertical" align="start">
          <span className="text-xs uppercase text-secondary">Connections</span>
          <Space size="middle" align="start">
            <label htmlFor="node-inbound-connections" className="mb-1 mt-[10px] flex min-w-20 items-start text-sm">
              Inbound
            </label>
            <ConnectionsSelector type={EdgeDirectionType.Inbound} />
          </Space>
          <Space size="middle" align="start">
            <label htmlFor="node-outbound-connections" className="mb-1 mt-[10px] flex min-w-20 items-start text-sm">
              Outbound
            </label>
            <ConnectionsSelector type={EdgeDirectionType.Outbound} />
          </Space>
        </Space>
      </form>
      {isMessageStreaming && (
        <div className="flex justify-end border-t border-t-tertiary bg-layer-3 px-5 py-4">
          <button
            type="button"
            onClick={() => dispatch(CompletionActions.cancelStreaming())}
            className="button button-secondary flex h-[38px] items-center justify-center gap-2"
          >
            <IconPlaystationSquare height={18} width={18} />
            Stop generation
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(NodeEditor);
