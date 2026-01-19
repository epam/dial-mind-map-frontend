import {
  IconArrowsShuffle,
  IconCodeDots,
  IconColumns,
  IconDotsVertical,
  IconFileArrowLeft,
  IconFileArrowRight,
  IconListDetails,
  IconRefresh,
  IconSitemap,
} from '@tabler/icons-react';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';
import groupBy from 'lodash-es/groupBy';
import sum from 'lodash-es/sum';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Space } from '@/components/common/Space/Space';
import { ToggleSwitch } from '@/components/common/ToggleSwitch/ToggleSwitch';
import DeleteGeneratedEdgesIcon from '@/icons/delete-generated-edges.svg';
import GenerateEdgesIcon from '@/icons/generate-edges.svg';
import GenerateNodeIcon from '@/icons/generate-node.svg';
import HideGeneratedEdgesIcon from '@/icons/hide-generated-edges.svg';
import RegenerateIcon from '@/icons/regenerate.svg';
import { ApplicationSelectors } from '@/store/builder/application/application.reducer';
import { BuilderActions, BuilderSelectors } from '@/store/builder/builder/builder.reducers';
import { CompletionSelectors } from '@/store/builder/completion/completion.selectors';
import { GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderSelector } from '@/store/builder/hooks';
import { PreferencesSelectors } from '@/store/builder/preferences/preferences.reducers';
import { SettingsSelectors } from '@/store/builder/settings/settings.reducers';
import { SourcesSelectors } from '@/store/builder/sources/sources.selectors';
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { GenerationType } from '@/types/generate';
import { DisplayMenuItemProps } from '@/types/menu';
import { GenerationStatus, SourceStatus } from '@/types/sources';
import { getTotalActiveSourcesTokens } from '@/utils/app/sources';

import ContextMenu from '../common/ContextMenu';
import Tooltip from '../common/Tooltip';
import IconButton from './components/IconButton';
import { LinkPathname, NavigationTabs } from './components/NavigationTabs';
import { ALWAYS_VISIBLE_PARTS_WIDTH, BUTTON_SIZE, GAP_INSIDE_GROUP, TOTAL_GROUP_MARGIN } from './data/toolbarConstants';
import { useExportAppearance } from './hooks/useExportApperance';
import { useExportMindmap } from './hooks/useExportMindmap';
import { useImportAppearance } from './hooks/useImportApperance';
import { useImportMindmap } from './hooks/useImportMindmap';
import { useToolbarRouting } from './hooks/useToolbarRouting';
import { GenEdgesConfirmModal } from './modals/GenEdgesConfirmModal';
import { GenEdgesDelConfirmModal } from './modals/GenEdgesDelConfirmModal';
import { GenEdgesDelLoaderModal } from './modals/GenEdgesDelLoaderModal';
import { GenEdgesLoaderModal } from './modals/GenEdgesLoaderModal';
import { GenNodeModal } from './modals/GenNodeModal';
import { GraphRegenerateConfirmModal } from './modals/GraphRegenerateConfirmModal';
import { ImportMindMapConfirmModal } from './modals/ImportMindmapConfirmModal';
import { RelayoutConfirmModal } from './modals/RelayoutConfirmModal';
import { ResetThemeConfirmModal } from './modals/ResetThemeConfirmModal';
import { Search } from './Search/Search';
import { UndoRedoSection } from './UndoRedoSection';

export const MainToolbar = () => {
  const dispatch = useDispatch();
  const { pathname } = useToolbarRouting();

  const isGraphReady = useBuilderSelector(GraphSelectors.selectIsReady);
  const [isOpenRegenerateModal, setIsOpenRegenerateModal] = useState(false);

  const generationStatus = useBuilderSelector(BuilderSelectors.selectGenerationStatus);

  const selectedView = useBuilderSelector(UISelectors.selectCurrentView);
  const selectedCustomizeView = useBuilderSelector(UISelectors.selectCurrentCustomizeView);

  const isGenEdgesConfirmModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesConfirmModalOpen);
  const isGenEdgesDelConfirmModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesDelConfirmModalOpen);
  const areGeneretedEdgesShowen = useBuilderSelector(UISelectors.selectAreGeneretedEdgesShowen);
  const isGenEdgesLoaderModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesLoaderModalOpen);
  const isGenEdgesDelLoaderModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesDelLoaderModalOpen);
  const hasGeneratedEdges = useBuilderSelector(GraphSelectors.selectHasGeneratedEdges);
  const isGenEdgesConfirmModalSkipped = useBuilderSelector(PreferencesSelectors.selectIsGenEdgesConfirmModalSkipped);
  const isGenNodeInputOpen = useBuilderSelector(UISelectors.selectIsGenNodeInputOpen);
  const isRelayoutConfirmModalOpen = useBuilderSelector(UISelectors.selectIsRelayoutConfirmModalOpen);
  const isResetThemeConfirmModalOpen = useBuilderSelector(UISelectors.selectIsResetThemeConfirmModalOpen);
  const generationType = useBuilderSelector(BuilderSelectors.selectGenerationType);
  const isSimpleGenerationModeAvailable = useBuilderSelector(UISelectors.selectIsSimpleGenerationModeAvailable);

  const currentParams = useBuilderSelector(BuilderSelectors.selectGenerateParams);

  const onSetGenerationType = (checked: boolean) => {
    dispatch(
      BuilderActions.updateGenerateParams({
        ...currentParams,
        type: checked ? GenerationType.Simple : GenerationType.Universal,
      }),
    );
  };

  const { onExportClick } = useExportAppearance();
  const { fileInputRef, onFileChange, onImportClick } = useImportAppearance();

  const { onExportMindmapClick } = useExportMindmap();
  const {
    onImportMindmapClick,
    fileMindmapInputRef,
    onFileMindmapChange,
    isImportMindmapConfirmModalOpen,
    setIsImportMindmapConfirmModalOpen,
  } = useImportMindmap();

  const isMessageStreaming = useBuilderSelector(CompletionSelectors.selectIsMessageStreaming);
  const sources = useBuilderSelector(SourcesSelectors.selectSources);
  const totalActiveSourcesTokens = useMemo(() => getTotalActiveSourcesTokens(sources), [sources]);
  const tokensLimit = useBuilderSelector(SettingsSelectors.selectGenerationSourcesTokensLimit);
  const isRegenerationDisabled =
    generationType === GenerationType.Simple && !!tokensLimit && totalActiveSourcesTokens > tokensLimit;

  const buttonClasses =
    'h-[34px] w-[34px] flex justify-center items-center rounded hover:bg-accent-primary-alpha hover:text-accent-primary disabled:cursor-default disabled:text-controls-disable disabled:bg-layer-3';

  const containerRef = useRef<HTMLDivElement>(null);

  const elements: DisplayMenuItemProps[] = useMemo(
    () => [
      {
        dataQa: 'generate-edges',
        name: 'Generate complement edges',
        groupId: 'minor-edges',
        className: 'text-sm',
        Icon: GenerateEdgesIcon,
        disabled: isMessageStreaming || !isGraphReady,
        onClick: () => {
          if (!isGenEdgesConfirmModalSkipped) {
            dispatch(UIActions.setIsGenEdgesConfirmModalOpen(true));
          } else {
            dispatch(BuilderActions.generateEdges());
          }
        },
      },
      {
        dataQa: 'show-edges',
        name: areGeneretedEdgesShowen ? 'Hide complement edges' : 'Show complement edges',
        groupId: 'minor-edges',
        className: `text-sm ${areGeneretedEdgesShowen ? 'text-accent-primary' : ''}`,
        Icon: HideGeneratedEdgesIcon,
        disabled: !hasGeneratedEdges || isMessageStreaming || !isGraphReady,
        onClick: () => dispatch(UIActions.setAreGeneretedEdgesShowen({ value: !areGeneretedEdgesShowen })),
      },
      {
        dataQa: 'delete-edges',
        name: 'Delete complement edges',
        groupId: 'minor-edges',
        className: 'text-sm',
        Icon: DeleteGeneratedEdgesIcon,
        disabled: !hasGeneratedEdges || isMessageStreaming || !isGraphReady,
        onClick: () => dispatch(UIActions.setIsGenEdgesDelConfirmModalOpen(true)),
      },
      {
        dataQa: 'generate-node',
        name: 'Generate node',
        groupId: 'node-actions',
        className: 'text-sm',
        Icon: GenerateNodeIcon,
        disabled: isMessageStreaming || !isGraphReady,
        onClick: () => dispatch(UIActions.setIsGenNodeInputOpen(true)),
      },
      {
        dataQa: 'relayout',
        name: 'Shuffle graph',
        groupId: 'relayout',
        className: 'text-sm',
        Icon: IconArrowsShuffle,
        disabled: isMessageStreaming || !isGraphReady,
        onClick: () => dispatch(UIActions.setIsRelayoutConfirmModalOpen(true)),
      },
    ],
    [
      isGraphReady,
      isMessageStreaming,
      hasGeneratedEdges,
      isGenEdgesConfirmModalSkipped,
      areGeneretedEdgesShowen,
      dispatch,
    ],
  );

  const [elementsGroups, elementsGroupsNames, elementsGroupsWidths] = useMemo(() => {
    const groups = groupBy(elements, 'groupId');
    const groupsNames = Object.keys(groups);
    const groupsWidths = groupsNames.map(groupName => {
      const groupMembersLength = groups[groupName].length;
      if (groupMembersLength === 1) return TOTAL_GROUP_MARGIN + BUTTON_SIZE;
      return TOTAL_GROUP_MARGIN + groupMembersLength * BUTTON_SIZE + (groupMembersLength - 1) * GAP_INSIDE_GROUP;
    });

    return [groups, groupsNames, groupsWidths];
  }, [elements]);

  const [visibleElementsCount, setVisibleElementsCount] = useState<number>(elementsGroupsNames.length);

  const isFinishedGenerationStatus = useMemo(() => {
    return generationStatus && generationStatus === GenerationStatus.FINISHED;
  }, [generationStatus]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const toolbarWidth = entry.contentRect.width;
          let count = 0;

          while (
            toolbarWidth >= sum(elementsGroupsWidths.slice(0, count + 1)) + ALWAYS_VISIBLE_PARTS_WIDTH &&
            count < elementsGroupsWidths.length
          ) {
            count++;
          }

          setVisibleElementsCount(count);
        }
      }
    });

    const containerElement = containerRef.current;
    if (containerElement) {
      resizeObserver.observe(containerElement);
    }

    return () => {
      if (containerElement) {
        resizeObserver.unobserve(containerElement);
      }
    };
  }, [elementsGroupsWidths]);

  const renderVisibleElements = useCallback(() => {
    const groupsToDisplay = elementsGroupsNames.slice(0, visibleElementsCount);

    return groupsToDisplay.map(groupName => (
      <div key={groupName} className="border-l border-l-tertiary">
        <div className="mx-3 my-[6px] flex gap-2">
          {elementsGroups[groupName].map(
            ({ dataQa, disabled, onClick, Icon, name, className }) =>
              Icon && (
                <IconButton
                  key={dataQa}
                  dataQa={dataQa}
                  Icon={Icon}
                  tooltip={name}
                  disabled={disabled}
                  onClick={onClick}
                  className={className}
                />
              ),
          )}
        </div>
      </div>
    ));
  }, [elementsGroups, elementsGroupsNames, visibleElementsCount]);

  const customizeButtons: DisplayMenuItemProps[] = useMemo(
    () => [
      {
        dataQa: 'reset-theme',
        name: 'Reset theme',
        Icon: IconRefresh,
        disabled: false,
        onClick: () => dispatch(UIActions.setIsResetThemeConfirmModalOpen(true)),
      },
      {
        dataQa: 'export-theme',
        name: 'Export theme (.zip)',
        Icon: IconFileArrowRight,
        onClick: onExportClick,
      },
      {
        dataQa: 'import-theme',
        name: 'Import theme (.zip)',
        Icon: IconFileArrowLeft,
        onClick: onImportClick,
      },
    ],
    [dispatch, onExportClick, onImportClick],
  );

  const sourcesButtons: DisplayMenuItemProps[] = useMemo(
    () => [
      {
        dataQa: 'export-mindmap',
        name: 'Export mindmap (.zip)',
        Icon: IconFileArrowRight,
        onClick: onExportMindmapClick,
      },
      {
        dataQa: 'import-mindmap',
        name: 'Import mindmap (.zip)',
        Icon: IconFileArrowLeft,
        onClick: () => setIsImportMindmapConfirmModalOpen(true),
      },
    ],
    [onExportMindmapClick, setIsImportMindmapConfirmModalOpen],
  );

  const renderMenuWithHiddenElements = useCallback(() => {
    const groupsToHide = elementsGroupsNames.slice(visibleElementsCount);

    if (groupsToHide.length === 0) return null;

    return (
      <div className="flex items-center border-l border-l-tertiary">
        <ContextMenu
          TriggerIcon={IconDotsVertical}
          triggerIconClassName="flex min-w-[58px] cursor-pointer items-center"
          className="hover:text-accent-primary"
          triggerIconHighlight
          menuItems={elements.filter(el => groupsToHide.includes(el.groupId!))}
        />
      </div>
    );
  }, [elements, elementsGroupsNames, visibleElementsCount]);

  const applicationReference = useBuilderSelector(ApplicationSelectors.selectApplication)?.reference;
  const [generationErrorSeen, setGenerationErrorSeen] = useLocalStorageState(`generation-error-seen`, {
    defaultValue: {},
  });

  const setNotSeenError = useCallback(() => {
    if (applicationReference) {
      setGenerationErrorSeen({
        ...generationErrorSeen,
        [applicationReference]: false,
      });
    }
  }, [applicationReference, generationErrorSeen, setGenerationErrorSeen]);

  const handleRegenerate = useCallback(() => {
    setIsOpenRegenerateModal(false);
    setNotSeenError();
    dispatch(BuilderActions.regenerateMindmap());
  }, [dispatch, setNotSeenError]);

  const hasFailedSource = useMemo(() => {
    return sources.some(
      source =>
        (source.active === undefined || source.active) &&
        (source.status === SourceStatus.FAILED || source.status === SourceStatus.INPROGRESS),
    );
  }, [sources]);

  const getRegenerationButtonTooltip = () => {
    if (isRegenerationDisabled) {
      return `Token limit of ${new Intl.NumberFormat().format(tokensLimit)} exceeded. Adjust your sources.`;
    }

    return sources.length === 0 || hasFailedSource
      ? 'Cannot regenerate while sources are processing or have errors. Please resolve all sources first.'
      : 'Regenerate graph from scratch';
  };

  const renderActions = () => {
    if (isFinishedGenerationStatus && pathname === LinkPathname.Content) {
      return (
        <>
          <div className="border-l border-l-tertiary">
            <div className="flex h-full px-2">
              <button
                disabled={selectedView !== 'graph' && isMessageStreaming}
                className={classNames([
                  'relative w-[46px] flex justify-center items-center hover:text-accent-primary',
                  selectedView === 'graph' && 'text-accent-primary',
                ])}
                onClick={() => dispatch(UIActions.setCurrentView('graph'))}
              >
                <Tooltip tooltip="Graph view" contentClassName="text-sm px-2 text-primary">
                  <IconSitemap height={24} width={24} stroke={1.5} />
                </Tooltip>
                {selectedView === 'graph' && (
                  <span className="absolute bottom-px left-0 w-full border-b border-accent-primary"></span>
                )}
              </button>
              <button
                disabled={selectedView !== 'table' && isMessageStreaming}
                className={classNames([
                  'relative w-[46px] flex justify-center items-center hover:text-accent-primary',
                  selectedView === 'table' && 'text-accent-primary',
                ])}
                onClick={() => dispatch(UIActions.setCurrentView('table'))}
              >
                <Tooltip tooltip="Table view" contentClassName="text-sm px-2 text-primary">
                  <IconColumns height={24} width={24} stroke={1.5} />
                </Tooltip>
                {selectedView === 'table' && (
                  <span className="absolute bottom-px left-0 w-full border-b border-accent-primary"></span>
                )}
              </button>
            </div>
          </div>
          <div className="flex">
            {renderVisibleElements()}
            {renderMenuWithHiddenElements()}
          </div>
          <div className="grow"></div>
          <div className="min-w-[150px] content-center border-l border-l-tertiary">
            <Search />
          </div>
          <div className="border-l border-l-tertiary">
            <UndoRedoSection buttonClasses={buttonClasses} />
          </div>
        </>
      );
    }

    if (pathname === LinkPathname.Sources) {
      return (
        <>
          {isFinishedGenerationStatus && (
            <div className="border-l border-l-tertiary px-2">
              <IconButton
                Icon={RegenerateIcon}
                tooltip={getRegenerationButtonTooltip()}
                disabled={sources.length === 0 || hasFailedSource || isRegenerationDisabled}
                onClick={() => setIsOpenRegenerateModal(true)}
                dataQa="regenerate-graph"
              />
            </div>
          )}
          <div className="border-l border-l-tertiary ">
            <div className="mx-3 my-[6px] flex gap-2">
              {sourcesButtons.map(({ dataQa, name, Icon, disabled, onClick, className }) =>
                Icon ? (
                  <IconButton
                    key={dataQa}
                    dataQa={dataQa}
                    tooltip={name}
                    Icon={Icon}
                    disabled={disabled}
                    onClick={onClick}
                    className={className}
                  />
                ) : null,
              )}
            </div>

            <input
              ref={fileMindmapInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={onFileMindmapChange}
            />
          </div>
          <div className="grow" />
          {isSimpleGenerationModeAvailable && (
            <Space size="small" align="center">
              <Tooltip
                tooltip={
                  generationStatus !== GenerationStatus.NOT_STARTED
                    ? 'Mode switching is only available before generation'
                    : 'Switch graph generation mode'
                }
                contentClassName="text-sm px-2 text-primary"
              >
                <ToggleSwitch
                  isOn={generationType === GenerationType.Simple}
                  disabled={generationStatus !== GenerationStatus.NOT_STARTED}
                  switchOnText="ON"
                  switchOFFText="OFF"
                  handleSwitch={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onSetGenerationType(e.target.checked);
                  }}
                />
              </Tooltip>
              <label className="flex min-w-20 text-sm text-primary">Lite mode</label>
            </Space>
          )}
          <div className="border-l border-l-tertiary">
            <UndoRedoSection buttonClasses={buttonClasses} />
          </div>
        </>
      );
    }

    if (pathname === LinkPathname.Customize) {
      return (
        <>
          <div className="border-l border-l-tertiary">
            <div className="flex h-full px-2">
              <button
                disabled={selectedCustomizeView === 'form'}
                className={classNames([
                  'relative w-[46px] flex justify-center items-center hover:text-accent-primary',
                  selectedCustomizeView === 'form' && 'text-accent-primary',
                ])}
                onClick={() => dispatch(UIActions.setCurrentCustomizeView('form'))}
              >
                <Tooltip tooltip="Form view" contentClassName="text-sm px-2 text-primary">
                  <IconListDetails height={24} width={24} stroke={1.5} />
                </Tooltip>
                {selectedCustomizeView === 'form' && (
                  <span className="absolute bottom-px left-0 w-full border-b border-accent-primary"></span>
                )}
              </button>
              <button
                disabled={selectedCustomizeView === 'json'}
                className={classNames([
                  'relative w-[46px] flex justify-center items-center hover:text-accent-primary',
                  selectedCustomizeView === 'json' && 'text-accent-primary',
                ])}
                onClick={() => dispatch(UIActions.setCurrentCustomizeView('json'))}
              >
                <Tooltip tooltip="JSON editor" contentClassName="text-sm px-2 text-primary">
                  <IconCodeDots height={24} width={24} stroke={1.5} />
                </Tooltip>
                {selectedCustomizeView === 'json' && (
                  <span className="absolute bottom-px left-0 w-full border-b border-accent-primary"></span>
                )}
              </button>
            </div>
          </div>
          <div className="flex h-full border-l border-l-tertiary px-2">
            {customizeButtons.map(({ dataQa, name, Icon, disabled, onClick, className }) =>
              Icon ? (
                <IconButton
                  key={dataQa}
                  dataQa={dataQa}
                  tooltip={name}
                  Icon={Icon}
                  disabled={disabled}
                  onClick={onClick}
                  className={className}
                />
              ) : null,
            )}
            <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={onFileChange} />
          </div>
          <div className="grow" />
          <div className="border-l border-l-tertiary">
            <UndoRedoSection buttonClasses={buttonClasses} />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      className={classNames(
        'z-20 m-3 flex h-[46px] w-[calc(100%-24px)] rounded bg-layer-3 text-secondary shadow-mindmap',
        pathname === LinkPathname.Content && `min-w-[654px]`,
      )}
    >
      <NavigationTabs isMessageStreaming={isMessageStreaming} generationStatus={generationStatus} />
      {renderActions()}
      {isGenEdgesConfirmModalOpen && <GenEdgesConfirmModal />}
      {isGenEdgesDelConfirmModalOpen && <GenEdgesDelConfirmModal />}
      {isGenEdgesLoaderModalOpen && <GenEdgesLoaderModal />}
      {isGenEdgesDelLoaderModalOpen && <GenEdgesDelLoaderModal />}
      {isRelayoutConfirmModalOpen && <RelayoutConfirmModal />}
      {isImportMindmapConfirmModalOpen && (
        <ImportMindMapConfirmModal
          isOpen={isImportMindmapConfirmModalOpen}
          handleClose={() => setIsImportMindmapConfirmModalOpen(false)}
          handleImport={onImportMindmapClick}
        />
      )}
      {isGenNodeInputOpen && <GenNodeModal />}
      {isResetThemeConfirmModalOpen && <ResetThemeConfirmModal />}
      <GraphRegenerateConfirmModal
        isOpen={isOpenRegenerateModal}
        handleClose={() => setIsOpenRegenerateModal(false)}
        handleRegenerate={handleRegenerate}
      />
    </div>
  );
};
