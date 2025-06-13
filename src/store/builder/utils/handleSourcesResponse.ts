import { UnknownAction } from '@reduxjs/toolkit';
import { isEqual } from 'lodash-es';
import { EMPTY, from } from 'rxjs';

import { GenerationStatus, Source, Sources, SourceStatus } from '@/types/sources';
import { adjustSourcesStatuses } from '@/utils/app/sources';

import { BuilderActions } from '../builder/builder.reducers';

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
    BuilderActions.fetchSourcesSuccess({
      sources,
      isMmExist: true,
    }),
    BuilderActions.setSourcesNames(response.names),
    BuilderActions.setGenerationStatus(generationStatus),
    BuilderActions.setIsGenerated(response.generated),
  ];

  const sourceStatusSubscription = sources
    .filter(s => s.status === SourceStatus.INPROGRESS && s.id && s.version)
    .map(s => BuilderActions.sourceStatusSubscribe({ sourceId: s.id!, versionId: s.version! }));

  if (sourceStatusSubscription.length) {
    actions.push(...actions);
  }

  return from([...actions]);
};
