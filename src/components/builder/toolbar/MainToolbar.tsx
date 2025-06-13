import { IconArrowsShuffle, IconColumns, IconDotsVertical, IconSitemap } from '@tabler/icons-react';
import classNames from 'classnames';
import groupBy from 'lodash-es/groupBy';
import sum from 'lodash-es/sum';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

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
import { UIActions, UISelectors } from '@/store/builder/ui/ui.reducers';
import { DisplayMenuItemProps } from '@/types/menu';
import { GenerationStatus, SourceStatus } from '@/types/sources';

import ContextMenu from '../common/ContextMenu';
import Tooltip from '../common/Tooltip';
import { GenEdgesConfirmModal } from './modals/GenEdgesConfirmModal';
import { GenEdgesDelConfirmModal } from './modals/GenEdgesDelConfirmModal';
import { GenEdgesDelLoaderModal } from './modals/GenEdgesDelLoaderModal';
import { GenEdgesLoaderModal } from './modals/GenEdgesLoaderModal';
import { GenNodeModal } from './modals/GenNodeModal';
import { GraphRegenerateConfirmModal } from './modals/GraphRegenerateConfirmModal';
import { RelayoutConfirmModal } from './modals/RelayoutConfirmModal';
import { Search } from './Search/Search';
import { UndoRedoSection } from './UndoRedoSection';

// Width of a toolbar button
const BUTTON_SIZE = 34;
// Width of the margin around group of buttons
const GROUP_MARGIN = 12;
const TOTAL_GROUP_MARGIN = GROUP_MARGIN * 2;
// Width of a gap between groups elements
const GAP_INSIDE_GROUP = 8;
// Width of tabs and views switchers. This is the width of the stable toolbar elements on the left side of the flexible part
const LEFT_TOOLBAR_BLOCK_WIDTH = 194 + 108;
// Width of search and undo/redo buttons. This is the width of the stable toolbar elements on the right side of the flexible part
const RIGHT_TOOLBAR_BLOCK_WIDTH = 150 + 100;
// Width of hidden menu button
const MENU_BUTTON_WIDTH = BUTTON_SIZE + TOTAL_GROUP_MARGIN;
const ALWAYS_VISIBLE_PARTS_WIDTH = LEFT_TOOLBAR_BLOCK_WIDTH + RIGHT_TOOLBAR_BLOCK_WIDTH + MENU_BUTTON_WIDTH;

export const MainToolbar = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const isGraphReady = useBuilderSelector(GraphSelectors.selectIsReady);
  const [isOpenRegenerateModal, setIsOpenRegenerateModal] = useState(false);

  const generationStatus = useBuilderSelector(BuilderSelectors.selectGenerationStatus);

  const selectedView = useBuilderSelector(UISelectors.selectCurrentView);
  const isGenEdgesConfirmModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesConfirmModalOpen);
  const applicationName = useBuilderSelector(ApplicationSelectors.selectApplicationName);
  const isGenEdgesDelConfirmModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesDelConfirmModalOpen);
  const areGeneretedEdgesShowen = useBuilderSelector(UISelectors.selectAreGeneretedEdgesShowen);
  const isGenEdgesLoaderModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesLoaderModalOpen);
  const isGenEdgesDelLoaderModalOpen = useBuilderSelector(UISelectors.selectIsGenEdgesDelLoaderModalOpen);
  const hasGeneratedEdges = useBuilderSelector(GraphSelectors.selectHasGeneratedEdges);
  const isGenEdgesConfirmModalSkipped = useBuilderSelector(PreferencesSelectors.selectIsGenEdgesConfirmModalSkipped);
  const isGenNodeInputOpen = useBuilderSelector(UISelectors.selectIsGenNodeInputOpen);
  const isRelayoutConfirmModalOpen = useBuilderSelector(UISelectors.selectIsRelayoutConfirmModalOpen);
  const isMessageStreaming = useBuilderSelector(CompletionSelectors.selectIsMessageStreaming);
  const searchParams = useSearchParams();
  const sources = useBuilderSelector(BuilderSelectors.selectSources);

  const getAuthProviderQuery = useCallback(() => {
    const authProvider = searchParams.get('authProvider');
    return authProvider ? `&authProvider=${authProvider}` : '';
  }, [searchParams]);

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
          {elementsGroups[groupName].map(({ dataQa, disabled, onClick, Icon, name, className }) => (
            <button key={dataQa} disabled={disabled} className={`${buttonClasses} ${className}`} onClick={onClick}>
              {Icon && (
                <Tooltip tooltip={name} contentClassName="text-sm px-2 text-primary">
                  <Icon size={24} height={24} width={24} stroke={1.5} />
                </Tooltip>
              )}
            </button>
          ))}
        </div>
      </div>
    ));
  }, [elementsGroups, elementsGroupsNames, visibleElementsCount, buttonClasses]);

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

  const handleRegenerate = useCallback(() => {
    setIsOpenRegenerateModal(false);
    dispatch(BuilderActions.regenerateMindmap());
  }, [dispatch]);

  const hasFailedSource = useMemo(() => {
    return sources.some(
      source =>
        (source.active === undefined || source.active) &&
        (source.status === SourceStatus.FAILED || source.status === SourceStatus.INPROGRESS),
    );
  }, [sources]);

  return (
    <div
      ref={containerRef}
      className="m-3 flex h-[46px] w-[calc(100%-24px)] min-w-[612px] rounded bg-layer-3 text-secondary shadow-mindmap"
    >
      <div className="relative flex items-center px-2 text-primary">
        <Link
          href={`/sources?id=${applicationName}${getAuthProviderQuery()}`}
          className={classNames([
            'flex gap-2 px-3 py-[14px] text-sm hover:text-accent-primary relative whitespace-nowrap',
            pathname === '/sources' && 'text-accent-primary',
            isMessageStreaming &&
              'text-controls-disable hover:text-controls-disable hover:cursor-default pointer-events-none',
          ])}
          tabIndex={isMessageStreaming ? -1 : undefined}
        >
          Sources list
          {pathname === '/sources' && (
            <span className="absolute bottom-px left-0 w-full border-b border-accent-primary"></span>
          )}
        </Link>
        <Link
          href={`/content?id=${applicationName}${getAuthProviderQuery()}`}
          className={classNames([
            'flex gap-2 px-3 py-[14px] text-sm hover:text-accent-primary relative whitespace-nowrap',
            pathname === '/content' && 'text-accent-primary',
            generationStatus !== GenerationStatus.FINISHED &&
              'text-controls-disable hover:text-controls-disable hover:cursor-default pointer-events-none',
            isMessageStreaming && 'pointer-events-none',
          ])}
          tabIndex={generationStatus !== GenerationStatus.FINISHED ? -1 : undefined}
          onClick={e => {
            if (generationStatus !== GenerationStatus.FINISHED) {
              e.preventDefault();
            }
          }}
        >
          Content
          {pathname === '/content' && (
            <span className="absolute bottom-px left-0 w-full border-b border-accent-primary"></span>
          )}
        </Link>
      </div>
      {isFinishedGenerationStatus && pathname === '/content' ? (
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
      ) : (
        <>
          {isFinishedGenerationStatus && (
            <div className="border-l border-l-tertiary pl-2">
              <Tooltip
                tooltip={
                  sources.length === 0 || hasFailedSource
                    ? 'Cannot regenerate while sources are processing or have errors. Please resolve all sources first.'
                    : 'Regenerate graph from scratch'
                }
                contentClassName="text-sm px-2 text-primary"
              >
                <button
                  className={buttonClasses}
                  disabled={sources.length === 0 || hasFailedSource}
                  onClick={() => setIsOpenRegenerateModal(true)}
                >
                  <RegenerateIcon role="img" height={24} width={24} />
                </button>
              </Tooltip>
            </div>
          )}
          <div className="grow" />
          <div className="border-l border-l-tertiary">
            <UndoRedoSection buttonClasses={buttonClasses} />
          </div>
        </>
      )}
      {isGenEdgesConfirmModalOpen && <GenEdgesConfirmModal />}
      {isGenEdgesDelConfirmModalOpen && <GenEdgesDelConfirmModal />}
      {isGenEdgesLoaderModalOpen && <GenEdgesLoaderModal />}
      {isGenEdgesDelLoaderModalOpen && <GenEdgesDelLoaderModal />}
      {isRelayoutConfirmModalOpen && <RelayoutConfirmModal />}
      {isGenNodeInputOpen && <GenNodeModal />}
      <GraphRegenerateConfirmModal
        isOpen={isOpenRegenerateModal}
        handleClose={() => setIsOpenRegenerateModal(false)}
        handleRegenerate={handleRegenerate}
      />
    </div>
  );
};
