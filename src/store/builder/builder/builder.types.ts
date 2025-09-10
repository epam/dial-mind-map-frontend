import { GenerationType } from '@/types/generate';
import { Model } from '@/types/model';
import { GenerationStatus } from '@/types/sources';

export interface BuilderState {
  generatingStatus: GeneratingStatus;
  inProgressRequestsCounter: number;
  etag: string | null;
  generationComplete: boolean;
  isGraphLoading: boolean;
  generationStatus: GenerationStatus | null;
  isMindmapSubscribeActive: boolean;
  isGenerated: boolean;
  generationType: GenerationType;
  models: Model[];
  currentModelId: string | null;
  prompt: string | null;
  isModelsLoading?: boolean;
  defaultSimpleModeModel: string;
  defaultSimpleModePrompt: string;
  isMindmapExportInProgress: boolean;
  isMindmapImportInProgress: boolean;
}

export interface GeneratingStatus {
  title: string;
  details?: string;
  isError?: boolean;
}
