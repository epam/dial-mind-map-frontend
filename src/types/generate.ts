interface BaseGenerateParams {
  prompt?: string | null;
  model?: string | null;
  type?: GenerationType | null;
}

export interface GenerateParams extends BaseGenerateParams {
  chat_model?: string;
  chat_prompt?: string;
  chat_guardrails_enabled?: boolean;
  chat_guardrails_prompt?: string;
  chat_guardrails_response_prompt?: string;
}

export interface InternalGenerateParams extends BaseGenerateParams {
  chatModel?: string;
  chatPrompt?: string;
  chatGuardrailsEnabled?: boolean;
  chatGuardrailsPrompt?: string;
  chatGuardrailsResponsePrompt?: string;
}

export enum GenerationType {
  Simple = 'simple',
  Universal = 'universal',
}
