import { useCallback, useEffect, useMemo, useState } from 'react';

import { useBuilderDispatch, useBuilderSelector } from '@/store/builder/hooks';
import { SourcesActions, SourcesSelectors } from '@/store/builder/sources/sources.reducers';
import { CreateSource, Source, SourceStatus } from '@/types/sources';

type Task =
  | { kind: 'create'; payload: CreateSource }
  | { kind: 'update'; payload: Source }
  | { kind: 'delete'; payload: Source }
  | { kind: 'rename'; payload: { sourceId: string; name: string } }
  | { kind: 'reindexSources'; payload: Source[] }
  | { kind: 'markAsApplied'; payload: { ids: string[] } };

export function useSourceQueue() {
  const dispatch = useBuilderDispatch();
  const globalSources = useBuilderSelector(SourcesSelectors.selectSources);
  const sourcesNames = useBuilderSelector(SourcesSelectors.selectSourcesNames);

  const [queue, setQueue] = useState<Task[]>([]);
  const [current, setCurrent] = useState<Task | null>(null);

  const enqueueMarkAsApplied = useCallback((ids: string[]) => {
    setQueue(q => [...q, { kind: 'markAsApplied', payload: { ids } }]);
  }, []);

  const enqueueLink = useCallback((payload: Omit<CreateSource, 'file'>) => {
    setQueue(q => [...q, { kind: 'create', payload }]);
  }, []);

  const enqueueFile = useCallback((payload: Omit<CreateSource, 'link'>) => {
    setQueue(q => [...q, { kind: 'create', payload }]);
  }, []);

  const enqueueUpdate = useCallback((src: Source) => {
    setQueue(q => [...q, { kind: 'update', payload: src }]);
  }, []);

  const enqueueDelete = useCallback((src: Source) => {
    setQueue(q => [...q, { kind: 'delete', payload: src }]);
  }, []);

  const enqueueRename = useCallback((payload: { sourceId: string; name: string }) => {
    setQueue(q => [...q, { kind: 'rename', payload }]);
  }, []);

  const enqueueReindexSources = useCallback((sourcesToReindex: Source[]) => {
    setQueue(q => [...q, { kind: 'reindexSources', payload: sourcesToReindex }]);
  }, []);

  useEffect(() => {
    if (current || queue.length === 0) return;

    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);

    switch (next.kind) {
      case 'create': {
        const payload = next.payload;
        if (payload.sourceId && payload.versionId) {
          dispatch(
            SourcesActions.recreateSourceVersion({
              ...payload,
              sourceId: payload.sourceId,
              versionId: payload.versionId,
            }),
          );
        } else if (payload.sourceId) {
          dispatch(SourcesActions.createSourceVersion({ ...payload, sourceId: payload.sourceId }));
        } else {
          const name = extractName(payload);
          dispatch(SourcesActions.createSource({ ...payload, name }));
        }
        break;
      }
      case 'update':
        dispatch(SourcesActions.updateSource(next.payload));
        break;
      case 'delete':
        dispatch(SourcesActions.deleteSource(next.payload));
        break;
      case 'rename':
        dispatch(SourcesActions.changeSourceName(next.payload));
        break;
      case 'reindexSources':
        dispatch(SourcesActions.reindexSources(next.payload));
        break;
      case 'markAsApplied':
        dispatch(SourcesActions.markAsApplied(next.payload));
        break;
    }
  }, [current, queue, dispatch]);

  useEffect(() => {
    if (!current) return;

    const { kind, payload } = current;

    if (kind === 'create' && payload.link && globalSources.some(s => s.url === payload.link)) {
      setCurrent(null);
    }

    if (kind === 'create' && payload.file && globalSources.some(s => s.name === payload.file?.name && s.active)) {
      setCurrent(null);
    }

    if (kind === 'rename' && sourcesNames[payload.sourceId] && sourcesNames[payload.sourceId] === payload.name) {
      setCurrent(null);
    }

    // TODO: handle update on file
    if (kind === 'update' && globalSources.some(s => s.url === payload.url)) {
      setCurrent(null);
    }

    if (
      kind === 'delete' &&
      (!globalSources.some(s => s.url === payload.url && s.type === payload.type) ||
        globalSources.some(s => s.url === payload.url && s.status === SourceStatus.REMOVED))
    ) {
      setCurrent(null);
    }

    if (kind === 'reindexSources') {
      const reindexedUrls = payload.map(s => s.url);
      const allReindexed = reindexedUrls.every(url =>
        globalSources.some(s => s.url === url && s.status === SourceStatus.INDEXED),
      );
      if (allReindexed) {
        setCurrent(null);
      }
    }

    if (kind === 'markAsApplied') {
      const { ids } = payload;
      if (globalSources.some(s => s.id && ids.includes(s.id) && s.in_graph)) {
        setCurrent(null);
      }
    }
  }, [globalSources, sourcesNames, current]);

  const mapPayloadToValue = (sources: Source[], payload?: CreateSource | Source) => {
    if (!payload) return null;

    if ('link' in payload) {
      return payload.link;
    }
    if ('file' in payload) {
      return payload.file?.name;
    }
    if ('url' in payload) {
      return payload.url;
    }

    if ('sourceId' in payload) {
      const source = sources.find(s => s.id === payload.sourceId && (s.active === undefined || s.active));
      if (source) {
        return source.url;
      }
    }

    return null;
  };

  const inProgressUrls = useMemo(() => {
    const queuedUrls = queue
      .filter(task => task.kind !== 'reindexSources' && task.kind !== 'rename' && task.kind !== 'markAsApplied')
      .map(task => mapPayloadToValue(globalSources, task.payload))
      .filter(Boolean) as string[];

    const reindexedUrls = queue.find(task => task.kind === 'reindexSources')?.payload.map(s => s.url) || [];
    const currentUrls =
      current?.kind === 'reindexSources'
        ? current.payload.map(source => source.url)
        : [
            mapPayloadToValue(
              globalSources,
              current?.kind === 'rename' || current?.kind === 'markAsApplied' ? undefined : current?.payload,
            ),
          ];

    return [...queuedUrls, ...reindexedUrls, ...currentUrls].filter(Boolean) as string[];
  }, [queue, current, globalSources]);

  const deletingUrls = useMemo(() => {
    const queued = queue.filter(t => t.kind === 'delete').map(t => t.payload.url);
    const curr = current?.kind === 'delete' ? [current.payload.url] : [];
    return [...queued, ...curr];
  }, [queue, current]);

  return {
    enqueueLink,
    enqueueFile,
    enqueueUpdate,
    enqueueDelete,
    enqueueRename,
    enqueueReindexSources,
    queue,
    current,
    inProgressUrls,
    deletingUrls,
    enqueueMarkAsApplied,
  };
}

function extractName(payload: { file?: { name: string }; link?: string }): string {
  if (payload.file?.name) return payload.file.name;
  if (payload.link) {
    const path = payload.link.split('?')[0]; // Remove query params
    const parts = path.split('/');
    return parts.at(-1) || parts.at(-2) || ''; // Get the last or second-to-last part of the path
  }
  return '';
}
