import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useHotkeys } from 'react-hotkeys-hook';

import Button from '@/components/common/Button/Button';
import { AllowedSourceFilesTypes, MindmapSourcesFolderName } from '@/constants/app';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { CreateSource, GenerationStatus, Source, SourceEditMode, SourceStatus, SourceType } from '@/types/sources';
import { generateMindmapFolderPath } from '@/utils/app/application';
import { getDecodedFolderPath } from '@/utils/app/folders';

import Tooltip from '../../common/Tooltip';
import { SourcesTable } from './components/SourcesTable';
import { SourceToGraphConfirmModal } from './components/SourceToGraphConfirmModal';
import { VersionsHistoryModal } from './components/VersionsHistoryModal';
import { FormValues } from './data';
import { useSourceFileUpload } from './hooks/useSourceFileUpload';
import { useSourceQueue } from './hooks/useSourceQueue';

export const SourceEditor: React.FC = () => {
  const listRef = useRef<HTMLDivElement>(null);
  const dispatch = useBuilderDispatch();

  const globalSources = useBuilderSelector(BuilderSelectors.selectSources);
  const application = useBuilderSelector(ApplicationSelectors.selectApplication);
  const mindmapFolder = useBuilderSelector(ApplicationSelectors.selectMindmapFolder);
  const generationStatus = useBuilderSelector(BuilderSelectors.selectGenerationStatus);
  const applicationName = useBuilderSelector(ApplicationSelectors.selectApplicationName);
  const folderPath = getDecodedFolderPath(
    mindmapFolder ?? generateMindmapFolderPath(application),
    MindmapSourcesFolderName,
  );
  const sourceIdInVersionsModal = useBuilderSelector(UISelectors.selectSourceIdInVersionsModal);

  const { enqueueLink, enqueueDelete, enqueueFile, enqueueUpdate, enqueueRename, inProgressUrls, deletingUrls } =
    useSourceQueue();

  const [editableIndex, setEditableIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<SourceEditMode>(null);

  const isAddingModeRef = useRef(false);
  const originalDataRef = useRef<string | null>(null);

  const {
    control,
    formState: { errors, isValid },
    trigger,
    setFocus,
    getValues,
    setValue,
  } = useForm<FormValues>({
    defaultValues: { sources: globalSources.filter(s => s.active === undefined || s.active) },
    mode: 'onChange',
  });

  const { fields, append, remove, update, insert } = useFieldArray({
    control,
    name: 'sources',
    keyName: '_id',
  });

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const handleSelectionReset = useCallback(() => setSelectedRows([]), [setSelectedRows]);
  const handleRowSelection = useCallback(
    (index: number) => {
      setSelectedRows(prev => (prev.includes(index) ? prev.filter(row => row !== index) : [...prev, index]));
    },
    [setSelectedRows],
  );
  const handleSourceSelection = useCallback(
    (sourceId: string) => {
      const index = fields.findIndex(f => f.id === sourceId);
      if (index >= 0) {
        handleRowSelection(index);
      }
    },
    [handleRowSelection, fields],
  );

  // keep scroll at bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [fields]);

  useLayoutEffect(() => {
    const formSources = getValues('sources');
    const lockedIndexes: number[] = [];

    globalSources.forEach(source => {
      if ((source.active !== undefined && !source.active) || deletingUrls.includes(source.url)) return;

      const formIdx = formSources.findIndex(
        f =>
          (f.type === SourceType.LINK && f.url === source.url) ||
          (f.type === SourceType.FILE && ((source.name && f.name === source.name) || f.url === source.url)),
      );
      if (formIdx === -1) {
        const prevActiveVersionIdx = formSources.findIndex(f => f.active && f.id === source.id);
        if (prevActiveVersionIdx >= 0) {
          lockedIndexes.push(prevActiveVersionIdx);
          update(prevActiveVersionIdx, { ...source });
        } else {
          append({ ...source });
        }
      } else {
        update(formIdx, { ...source });
      }
    });

    formSources.forEach((f, idx) => {
      if (!f.url) return;
      const existsInStore = globalSources.some(
        s =>
          (s.active === undefined || s.active) &&
          ((f.type === SourceType.LINK && f.url === s.url) ||
            (f.type === SourceType.FILE && s.name && f.name === s.name) ||
            f.url === s.url),
      );
      const isBusy = inProgressUrls.includes(f.url) || (f.name && inProgressUrls.includes(f.name));

      if (!existsInStore && !isBusy && !lockedIndexes.includes(idx) && idx !== editableIndex) {
        remove(idx);

        if ((editableIndex ?? -1) > 0) {
          setEditableIndex(editableIndex! - 1);
        }
      }
    });
  }, [globalSources, deletingUrls, inProgressUrls, editableIndex, append, update, remove, getValues]);

  const handleAddSource = useCallback(
    async ({ file, link, sourceId, versionId }: CreateSource) => {
      const ok = await trigger();
      if (!ok) return;

      if (file) {
        if (sourceId) {
          const targetRowIndex = fields.findIndex(f => f.id === sourceId);

          remove(targetRowIndex);
          insert(targetRowIndex, {
            name: file.name,
            url: file.name,
            type: SourceType.FILE,
          });
        } else {
          append({
            name: file.name,
            url: file.name,
            type: SourceType.FILE,
          });
        }

        enqueueFile({ file, sourceId, versionId });
        isAddingModeRef.current = true;
      }

      if (link !== undefined && link !== null) {
        append({
          url: link,
          type: SourceType.LINK,
        });
        setEditableIndex(fields.length);
        setEditMode('add');
        isAddingModeRef.current = true;
      }
    },
    [append, enqueueFile, fields, trigger],
  );

  const handleConfirmAdd = useCallback(
    (index: number) => {
      const source = getValues(`sources.${index}`);

      if (source.type === SourceType.LINK) {
        enqueueLink({ link: source.url });
      }

      setEditableIndex(null);
      setEditMode(null);
      isAddingModeRef.current = false;
    },
    [enqueueFile, enqueueLink, getValues],
  );

  const handleEdit = useCallback(
    (index: number, editMode: SourceEditMode = 'edit') => {
      setEditableIndex(index);
      setEditMode(editMode);
      setFocus(`sources.${index}.url`);
      isAddingModeRef.current = false;
      originalDataRef.current = getValues(`sources.${index}.url`);
    },
    [getValues, setFocus],
  );

  const handleDelete = useCallback(
    (index: number) => {
      const src = getValues(`sources.${index}`) as Source;
      // remove(index);
      enqueueDelete(src);
    },
    [getValues, remove, enqueueDelete],
  );

  const handleDownload = useCallback(
    (index: number) => {
      const src = getValues(`sources.${index}`);
      if (src.id && src.version) {
        dispatch(
          BuilderActions.downloadSource({ sourceId: src.id, versionId: src.version, name: src.name ?? src.url }),
        );
      }
    },
    [getValues, dispatch],
  );

  const handleConfirmEdit = useCallback(
    (index: number) => {
      const source = getValues(`sources.${index}`);
      const url = source.url.trim();

      if (editMode === 'rename') {
        enqueueRename({ sourceId: source.id!, name: url });
      } else {
        if (url && url !== originalDataRef.current) {
          if (!sourceIdToAddVersionRef.current) {
            enqueueUpdate(source);
          } else {
            remove(index);
            insert(index, {
              name: url,
              url: url,
              type: SourceType.LINK,
            });
            enqueueLink({ link: url, sourceId: sourceIdToAddVersionRef.current });
            dispatch(UIActions.setSourceIdToAddVersion());
          }
        }
      }

      setEditableIndex(null);
      setEditMode(null);
      originalDataRef.current = null;
    },
    [getValues, enqueueUpdate, enqueueLink, enqueueRename, remove, insert, update, dispatch, editMode],
  );

  const handleAddVersion = useCallback(
    ({ link, file, sourceId, versionId }: CreateSource) => {
      const index = fields.findIndex(s => s.id === sourceId);

      if (!versionId) {
        remove(index);
        if (file) {
          insert(index, {
            name: file.name,
            url: file.name,
            type: SourceType.FILE,
          });
          enqueueFile({ file, sourceId });
        } else {
          insert(index, {
            name: link,
            url: link!,
            type: SourceType.LINK,
          });
          enqueueLink({ link, sourceId });
        }
      } else {
        if (file) {
          enqueueFile({ file, sourceId, versionId });
        } else {
          enqueueLink({ link, sourceId, versionId });
        }
      }
    },
    [fields, enqueueFile, enqueueLink],
  );

  const handleRefreshLink = useCallback(
    (index: number) => {
      const source = getValues(`sources.${index}`);
      const url = source.url.trim();

      if (source.status !== SourceStatus.FAILED) {
        enqueueLink({ link: url, sourceId: source.id });
      } else {
        enqueueLink({ link: url, sourceId: source.id, versionId: source.version });
      }
    },
    [getValues, remove, insert, enqueueLink],
  );

  const handleCancel = useCallback(async () => {
    if (editableIndex !== null) {
      if (isAddingModeRef.current) {
        remove(editableIndex);
      } else if (originalDataRef.current !== null) {
        setValue(`sources.${editableIndex}.url`, originalDataRef.current);
      }
    }
    await trigger();
    setEditableIndex(null);
    setEditMode(null);
    dispatch(UIActions.setSourceIdToAddVersion());
    isAddingModeRef.current = false;
    originalDataRef.current = null;
  }, [editableIndex, isAddingModeRef, originalDataRef, remove, setValue, trigger, dispatch]);

  useHotkeys(['esc'], () => handleCancel(), [handleCancel]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (event.key === 'Enter' && isValid) {
        event.preventDefault();
        if (editableIndex === index && !isAddingModeRef.current) {
          handleConfirmEdit(index);
        } else {
          handleConfirmAdd(index);
        }
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    },
    [isValid, editableIndex, isAddingModeRef, handleConfirmEdit, handleConfirmAdd, handleCancel],
  );

  const watchedSources = useWatch({
    control,
    name: 'sources',
  }) as Source[];

  const { handleSelectFiles } = useSourceFileUpload({
    folderPath,
    watchedSources,
    handleAddSource,
  });

  const sourceIdToAddVersion = useBuilderSelector(UISelectors.selectSourceIdToAddVersion);
  const sourceIdToAddVersionRef = useRef<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (sourceIdToAddVersion) {
      sourceIdToAddVersionRef.current = sourceIdToAddVersion;
      const source = globalSources.find(s => s.id === sourceIdToAddVersion);
      if (source?.type === SourceType.FILE) {
        fileInputRef.current?.click();
        dispatch(UIActions.setSourceIdToAddVersion());
      } else if (source?.type === SourceType.LINK) {
        const sourceIndex = fields.findIndex(
          s => s.id === sourceIdToAddVersion && (s.active || s.active === undefined),
        );
        handleEdit(sourceIndex);
      }
    }
  }, [sourceIdToAddVersion, globalSources, fields]);

  const handleGenerateGraph = useCallback(() => {
    dispatch(
      BuilderActions.generateMindmap({
        sources: globalSources,
        name: applicationName,
      }),
    );
  }, [applicationName, dispatch, globalSources]);

  const handleApplySelectionToGraph = useCallback(() => {
    const selectedSources = selectedRows.map(sr => fields[sr].id!);

    dispatch(
      BuilderActions.generateMindmap({
        applySources: selectedSources,
        name: applicationName,
      }),
    );
  }, [applicationName, dispatch, globalSources, selectedRows]);

  const hasFailedSource = useMemo(() => fields.some(s => s.status !== SourceStatus.INDEXED), [fields]);

  return (
    <div className="flex size-full flex-col gap-px rounded bg-layer-3 text-primary shadow-mindmap">
      <div className="flex size-full flex-col">
        <div ref={listRef} className="max-h-[calc(100vh-158px)] grow overflow-y-auto">
          <SourcesTable
            editableIndex={editableIndex}
            editMode={editMode}
            fields={fields}
            isValid={isValid}
            errors={errors}
            selectedRows={selectedRows}
            handleRowSelection={handleRowSelection}
            handleSelectionReset={handleSelectionReset}
            handleKeyDown={handleKeyDown}
            handleConfirmEdit={handleConfirmEdit}
            handleConfirmAdd={handleConfirmAdd}
            handleCancel={handleCancel}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleDownload={handleDownload}
            control={control}
            inProgressUrls={inProgressUrls}
            isAddingModeRef={isAddingModeRef}
            generationStatus={generationStatus}
            handleAddSource={handleAddSource}
            handleSelectFiles={handleSelectFiles}
            handleRefreshLink={handleRefreshLink}
          />
          <input
            name="upload"
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => {
              const source = globalSources.find(s => s.id === sourceIdToAddVersionRef.current && s.active);
              if (source?.status === SourceStatus.FAILED) {
                handleSelectFiles(e, sourceIdToAddVersionRef.current, source.version);
              } else {
                handleSelectFiles(e, sourceIdToAddVersionRef.current);
              }
              sourceIdToAddVersionRef.current = undefined;
            }}
            disabled={!isValid}
            accept={AllowedSourceFilesTypes.join(',')}
            aria-label="upload file"
          />
        </div>

        {generationStatus === GenerationStatus.NOT_STARTED ? (
          <div className="flex justify-end border-t border-tertiary px-6 py-4">
            <Tooltip
              contentClassName="text-sm px-2 text-primary"
              tooltip={
                !isValid || fields.length === 0 || hasFailedSource
                  ? 'Cannot generate while sources are processing or have errors. Please resolve all sources first.'
                  : 'Generate graph'
              }
            >
              <Button
                disabled={!isValid || fields.length === 0 || hasFailedSource}
                variant="primary"
                label="Generate Graph"
                onClick={handleGenerateGraph}
              />
            </Tooltip>
          </div>
        ) : !!selectedRows.length ? (
          <div className="flex justify-end border-t border-tertiary px-6 py-4">
            <Tooltip contentClassName="text-sm px-2 text-primary" tooltip={'Apply to graph'}>
              <Button variant="primary" label="Apply to graph" onClick={handleApplySelectionToGraph} />
            </Tooltip>
          </div>
        ) : null}
        {sourceIdInVersionsModal !== undefined && (
          <VersionsHistoryModal
            isOpen={sourceIdInVersionsModal !== undefined}
            handleClose={() => dispatch(UIActions.setSourceIdInVersionsModal())}
            handleAddVersion={handleAddVersion}
          />
        )}
        <SourceToGraphConfirmModal handleSourceSelection={handleSourceSelection} />
      </div>
    </div>
  );
};

export default SourceEditor;
