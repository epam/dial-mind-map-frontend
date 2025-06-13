import { autoUpdate, offset, useDismiss, useFloating, useFocus, useInteractions } from '@floating-ui/react';
import { IconSearch, IconX } from '@tabler/icons-react';
import classNames from 'classnames';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { ChangeEvent, KeyboardEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { CompletionSelectors } from '@/store/builder/completion/completion.selectors';
import { GraphActions, GraphSelectors } from '@/store/builder/graph/graph.reducers';
import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { UIActions } from '@/store/builder/ui/ui.reducers';
import { Node } from '@/types/graph';
import { isEdge } from '@/utils/app/graph/typeGuards';

import { HighlightedSearchText } from './HighlightedSearchText';

export const Search = () => {
  const dispatch = useBuilderDispatch();
  const isMessageStreaming = useBuilderSelector(CompletionSelectors.selectIsMessageStreaming);
  const elements = useBuilderSelector(GraphSelectors.selectElements);

  const [fuse, setFuse] = useState<Fuse<Node> | null>(null);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [results, setResults] = useState<FuseResult<Node>[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const resultsListRef = useRef<HTMLElement | null>(null);

  const fuseOptions: IFuseOptions<Node> = useMemo(() => {
    return {
      keys: ['label', 'questions', 'details'],
      threshold: 0.3,
      ignoreLocation: true,
      includeScore: true,
      includeMatches: true,
      findAllMatches: false,
      minMatchCharLength: 3,
    };
  }, []);

  useEffect(() => {
    const nodes = elements.filter(el => !isEdge(el.data)).map(node => node.data as Node);
    if (!fuse) {
      const fuse = new Fuse(nodes, fuseOptions);
      setFuse(fuse);
    } else {
      fuse.setCollection(nodes);
    }
  }, [elements, fuse, fuseOptions]);

  useEffect(() => {
    if (deferredQuery === query) return;

    if (query) {
      const searchResults = fuse?.search(query.trim()) ?? [];
      setResults(searchResults);
      setIsOpen(true);
      setFocusedIndex(null);
      dispatch(GraphActions.setHighlightedNodeIds(searchResults.map(e => e.item.id)));
    } else {
      setResults([]);
      setIsOpen(false);
      setFocusedIndex(null);
      dispatch(GraphActions.setHighlightedNodeIds([]));
    }
  }, [query, deferredQuery, fuse, fuseOptions, dispatch]);

  useEffect(() => {
    if (focusedIndex !== null && resultsListRef.current) {
      const focusedElement = resultsListRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'center' });
      }
    }
  }, [focusedIndex]);

  useEffect(() => {
    if (!isOpen) {
      dispatch(GraphActions.setHighlightedNodeIds([]));
    } else {
      dispatch(GraphActions.setHighlightedNodeIds((fuse?.search(query) ?? []).map(r => r.item.id)));
    }
  }, [isOpen, dispatch, fuse, query]);

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!isOpen || results.length === 0) return;

    let newIndex = focusedIndex;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prevIndex => {
          if (prevIndex === null) return 0;
          newIndex = (prevIndex + 1) % results.length;
          return newIndex;
        });
        dispatch(GraphActions.setHighlightedNodeIds(newIndex !== null ? [results[newIndex].item.id] : []));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prevIndex => {
          if (prevIndex === null) return results.length - 1;
          newIndex = (prevIndex - 1 + results.length) % results.length;
          return newIndex;
        });
        dispatch(GraphActions.setHighlightedNodeIds(newIndex !== null ? [results[newIndex].item.id] : []));
        break;
      case 'Enter':
        if (focusedIndex !== null) {
          const selectedItem = results[focusedIndex]?.item;
          if (selectedItem) {
            dispatch(GraphActions.setFocusNodeId(selectedItem.id));
            dispatch(UIActions.setIsNodeEditorOpen(true));
            dispatch(GraphActions.refresh());
            setIsOpen(false);
          }
        }
        break;
      default:
        break;
    }
  };

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(() => ({
        mainAxis: 12,
        crossAxis: 0,
      })),
    ],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, {
    outsidePress: (event: MouseEvent) => (event.target as HTMLElement).id !== 'search-input',
  });
  const focus = useFocus(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, focus]);

  return (
    <div
      className={classNames([
        'relative flex flex-col gap-2 px-3',
        isMessageStreaming && 'opacity-50 pointer-events-none',
      ])}
    >
      <div className="flex gap-2">
        <IconSearch size={24} />
        <input
          {...getReferenceProps({
            ref: refs.setReference,
            id: 'search-input',
            className:
              'w-full bg-transparent text-[14px] leading-3 outline-none text-primary placeholder:text-secondary',
            type: 'text',
            placeholder: 'Search...',
            value: query,
            onChange: (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
            onKeyDown: handleKeyDown,
          })}
        />
        <IconX
          size={24}
          className={classNames(['hover:text-primary hover:cursor-pointer invisible', query && '!visible'])}
          onClick={() => setQuery('')}
        />
      </div>
      {isOpen && (
        <ul
          {...getFloatingProps({
            ref: el => {
              refs.setFloating(el);
              resultsListRef.current = el;
            },
            className: 'w-full max-h-[50vh] overflow-y-auto bg-layer-0 shadow-mindmap z-20',
            style: floatingStyles,
            role: 'listbox',
            'aria-label': 'Search results',
          })}
          onKeyDown={handleKeyDown}
        >
          {query && <li className="border-b border-b-secondary px-3 py-2 text-xs">{results.length} results</li>}
          {results.map(({ item, matches }, index) => (
            <li
              key={item.id}
              id={`search-result-${index}`}
              className={classNames([
                'hover:bg-accent-tertiary-alpha px-3 py-2 border-b hover:cursor-pointer border-b-secondary last:border-none',
                focusedIndex === index && 'bg-accent-tertiary-alpha',
              ])}
              role="option"
              aria-selected={focusedIndex === index}
              tabIndex={-1}
              onClick={() => {
                dispatch(GraphActions.setFocusNodeId(item.id));
                dispatch(GraphActions.setHighlightedNodeIds([item.id]));
                setFocusedIndex(index);
                dispatch(UIActions.setIsNodeEditorOpen(true));
                dispatch(GraphActions.refresh());
              }}
            >
              <div className="text-primary">{item.label}</div>
              <div>{matches && <HighlightedSearchText matches={matches} query={query} />}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
