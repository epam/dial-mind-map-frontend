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
  chatModel: string | null;
  chatPrompt: string | null;
  chatGuardrailsEnabled: boolean;
  chatGuardrailsPrompt: string | null;
  chatGuardrailsResponsePrompt: string | null;
  prompt: string | null;
  isModelsLoading?: boolean;
  defaultSimpleModeModel: string;
  availableSimpleModeModels: string[];
  defaultSimpleModePrompt: string;
  defaultChatModel: string;
  availableChatModels: string[];
  defaultChatPrompt: string;
  defaultChatGuardrailsPrompt: string;
  defaultChatGuardrailsResponsePrompt: string;
  isMindmapExportInProgress: boolean;
  isMindmapImportInProgress: boolean;
}

export interface GeneratingStatus {
  title: string;
  details?: string;
  isError?: boolean;
}
