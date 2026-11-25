// Types for Modular AI Engine in Estudio Audiovisual Inteligente
import { Scene, NarrativeAngle, SourceReference } from '../../types';

export type AIProviderId = 'offline-heuristic' | 'gemini-free' | 'openai-compatible';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  description: string;
  isOnlineRequired: boolean;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  endpointUrl?: string;
  modelName: string;
}

export interface AISecureCredentials {
  apiKey?: string;
  endpointUrl?: string;
  modelName?: string;
}

export interface AIContextPayload {
  projectTitle: string;
  projectDescription: string;
  projectCategory?: string;
  currentScene?: Scene;
  existingScenes?: Scene[];
  narrativeAngles?: NarrativeAngle[];
  sources?: SourceReference[];
  customInstructions?: string;
}

export type AITaskType =
  | 'SUGGEST_NARRATIVE_ANGLES'
  | 'CRITIQUE_SCRIPT'
  | 'EXPAND_SCENE_NARRATION'
  | 'RECOMMEND_CAMERA_AND_VISUALS'
  | 'ANALYZE_RESEARCH_EVIDENCE'
  | 'CATEGORIZE_MEDIA_ASSET';

export interface AIRequestOptions {
  task: AITaskType;
  context: AIContextPayload;
  userPrompt?: string;
  temperature?: number;
  abortSignal?: AbortSignal;
  onProgress?: (partialText: string) => void;
}

export interface AIExecutionResult<T = any> {
  success: boolean;
  providerId: AIProviderId;
  modelName: string;
  rawText: string;
  parsedData?: T;
  latencyMs: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  error?: string;
}
