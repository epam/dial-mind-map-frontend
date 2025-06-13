import { GenerationStatus, Source, SourcesNames } from '@/types/sources';

export interface BuilderState {
  sources: Source[];
  sourcesNames: SourcesNames;
  generatingStatus: GeneratingStatus;
  inProgressRequestsCounter: number;
  etag: string | null;
  generationComplete: boolean;
  isSourcesLoading: boolean;
  isGraphLoading: boolean;
  generationStatus: GenerationStatus | null;
  isMindmapSubscribeActive: boolean;
  isGenerated: boolean;
}

export interface GeneratingStatus {
  title: string;
  details?: string;
  isError?: boolean;
}
