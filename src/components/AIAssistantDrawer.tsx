// AI Assistant Drawer Component - Unified Studio AI Experience
import React, { useState } from 'react';
import { Project } from '../types';
import { aiEngine, AVAILABLE_PROVIDERS } from '../services/ai/aiEngine';
import { AIProviderId, AISecureCredentials } from '../services/ai/types';
import {
  Sparkles,
  X,
  Wifi,
  WifiOff,
  Cpu,
  Key,
  KeyRound,
  ShieldAlert,
  Loader2,
  StopCircle,
} from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentSceneId?: string;
  onApplyResult?: (task: string, data: any) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  project,
  currentSceneId,
  onApplyResult,
}) => {
  const [providerId, setProviderId] = useState<AIProviderId>(aiEngine.getActiveProviderId());
  const [apiKey, setApiKey] = useState<string>('');
  const [endpointUrl, setEndpointUrl] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'prompt' | 'config' | 'history'>('prompt');

  const [promptText, setPromptText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastResult, setLastResult] = useState<any>(null);

  const activeProvider = AVAILABLE_PROVIDERS.find((p) => p.id === providerId) || AVAILABLE_PROVIDERS[0];
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const handleProviderChange = (newId: AIProviderId) => {
    setProviderId(newId);
    aiEngine.setActiveProvider(newId);
    const existing = aiEngine.getCredentials(newId);
    setApiKey(existing?.apiKey || '');
    setEndpointUrl(existing?.endpointUrl || '');
    setModelName(existing?.modelName || '');
  };

  const handleSaveCredentials = () => {
    const creds: AISecureCredentials = {
      apiKey: apiKey.trim() || undefined,
      endpointUrl: endpointUrl.trim() || undefined,
      modelName: modelName.trim() || undefined,
    };
    aiEngine.setCredentials(providerId, creds);
    setStatusMessage('Configuración guardada en memoria de sesión volátil (No se subirá a GitHub).');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleExecutePrompt = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusMessage('Procesando solicitud con contexto del proyecto...');

    const controller = new AbortController();
    setAbortController(controller);

    const context = aiEngine.buildContextFromProject(project, currentSceneId);

    const res = await aiEngine.executeTask({
      task: 'EXPAND_SCENE_NARRATION',
      context,
      userPrompt: promptText,
      abortSignal: controller.signal,
    });

    setIsProcessing(false);
    setAbortController(null);

    if (res.success) {
      setLastResult(res);
      setStatusMessage(`Respuesta recibida en ${res.latencyMs}ms con ${res.modelName}.`);
    } else {
      setStatusMessage(`Error: ${res.error}`);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setStatusMessage('Operación cancelada por el usuario.');
      setIsProcessing(false);
      setAbortController(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Asistente de Producción IA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono border border-indigo-800">
                Fase 6C
              </span>
            </h3>
            <p className="text-xs text-slate-400">Contexto: {project.title.slice(0, 28)}...</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Connection & Provider Banner */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span className="truncate max-w-[180px]">{activeProvider.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {activeProvider.isOnlineRequired && !isOnline ? (
            <span className="flex items-center gap-1 text-rose-400 text-[11px]">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <Wifi className="w-3.5 h-3.5" />
              <span>{activeProvider.isOnlineRequired ? 'Online' : '100% Local'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950 text-xs font-medium">
        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
            activeTab === 'prompt'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Consulta Asistida
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
            activeTab === 'config'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Proveedores & Keys
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'prompt' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Instrucción para el asistente
              </label>
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Ej. Mejora la tensión narrativa de la escena actual o sugiere una metáfora visual..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isProcessing}
                onClick={handleExecutePrompt}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md shadow-indigo-600/20 transition-all text-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Invocando {activeProvider.modelName}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ejecutar Consulta con Contexto</span>
                  </>
                )}
              </button>

              {isProcessing && (
                <button
                  onClick={handleCancel}
                  className="px-3 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg flex items-center gap-1 font-semibold text-xs"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>Detener</span>
                </button>
              )}
            </div>

            {statusMessage && (
              <p className="text-[11px] font-mono text-indigo-300 bg-slate-950 p-2 rounded border border-slate-800">
                {statusMessage}
              </p>
            )}

            {lastResult && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5 font-mono">
                  <span>Modelo: {lastResult.modelName}</span>
                  <span>{lastResult.latencyMs} ms</span>
                </div>
                <div className="text-slate-200 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {lastResult.rawText}
                </div>
                {onApplyResult && (
                  <button
                    onClick={() => onApplyResult('EXPAND_SCENE_NARRATION', lastResult.parsedData)}
                    className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs transition-colors"
                  >
                    Aplicar resultado al Guion
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Proveedor de Inteligencia Artificial
              </label>
              <select
                value={providerId}
                onChange={(e) => handleProviderChange(e.target.value as AIProviderId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              >
                {AVAILABLE_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">{activeProvider.description}</p>
            </div>

            {activeProvider.requiresApiKey && (
              <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Credenciales Seguras (En Memoria de Sesión)</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">API Key Personal</label>
                  <input
                    type="password"
                    placeholder="Pega tu clave (ej. AIzaSy...)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {providerId === 'openai-compatible' && (
                  <>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Endpoint URL</label>
                      <input
                        type="url"
                        placeholder="https://api.groq.com/openai/v1 ó http://localhost:11434/v1"
                        value={endpointUrl}
                        onChange={(e) => setEndpointUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nombre del Modelo</label>
                      <input
                        type="text"
                        placeholder="llama-3.3-70b-versatile, mistral, etc."
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-start gap-1.5 text-[10px] text-slate-400">
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Seguridad: Las claves se conservan en memoria durante tu sesión. Nunca se envían a repositorios ni a servidores no autorizados.
                  </span>
                </div>

                <button
                  onClick={handleSaveCredentials}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3 h-3" />
                  <span>Guardar Configuración de Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
