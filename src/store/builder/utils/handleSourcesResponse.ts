import { UnknownAction } from '@reduxjs/toolkit';
import { isEqual } from 'lodash-es';
import { EMPTY, from } from 'rxjs';

import { GenerationStatus, Source, Sources, SourceStatus } from '@/types/sources';
import { adjustSourcesStatuses } from '@/utils/app/sources';

import { BuilderActions } from '../builder/builder.reducers';
import { SourcesActions } from '../sources/sources.reducers';

export const handleSourcesResponse = (
  response: Sources,
  prevSources: Source[],
  prevGenStatus: GenerationStatus | null,
) => {
  const sources = adjustSourcesStatuses(response.sources ?? []);
  const changedSources = !isEqual(prevSources, sources);
  const changedStatus = prevGenStatus !== response.generation_status;

  if (!changedSources && !changedStatus) {
    return EMPTY;
  }

  const generationStatus = response.generation_status;

  const actions: UnknownAction[] = [
    SourcesActions.fetchSourcesSuccess({
      sources,
    }),
    SourcesActions.setSourcesNames(response.names),
    BuilderActions.setGenerationStatus(generationStatus),
    BuilderActions.setIsGenerated(response.generated),
  ];

  const sourceStatusSubscription = sources
    .filter(source => source.status === SourceStatus.INPROGRESS && source.id && source.version)
    .map(source => SourcesActions.sourceStatusSubscribe({ sourceId: source.id!, versionId: source.version! }));

  if (sourceStatusSubscription.length) {
    actions.push(...sourceStatusSubscription);
  }

  if (prevGenStatus !== GenerationStatus.IN_PROGRESS && generationStatus === GenerationStatus.IN_PROGRESS) {
    actions.push(BuilderActions.generationStatusSubscribe());
  }

  return from([...actions]);
};
