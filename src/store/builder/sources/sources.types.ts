import { Source, SourcesNames } from '@/types/sources';

export interface SourcesState {
  sourcesNames: SourcesNames;
  sources: Source[];
  isSourcesLoading: boolean;
}
