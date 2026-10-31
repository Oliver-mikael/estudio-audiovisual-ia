// Redesigned ScriptWorkshop with AI Assistant and Non-destructive Versions
import React, { useState } from 'react';
import { Project, Scene } from '../types';
import { aiEngine } from '../services/ai/aiEngine';
import {
  FileText,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  MessageSquare,
  History,
  Loader2,
} from 'lucide-react';

interface ScriptWorkshopProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onRequestAIAssist?: (sceneId: string) => void;
}

interface ScriptVersion {
  timestamp: number;
  label: string;
  scenes: Scene[];
}

export const ScriptWorkshop: React.FC<ScriptWorkshopProps> = ({
  project,
  onUpdateProject,
  onRequestAIAssist,
}) => {
  const [scenes, setScenes] = useState<Scene[]>(project.script.scenes || []);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    project.script.scenes?.[0]?.id || ''
  );
  const [history, setHistory] = useState<ScriptVersion[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeScene = scenes.find((s) => s.id === selectedSceneId) || scenes[0];

  const totalDuration = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

  const saveToHistory = (label: string) => {
    const version: ScriptVersion = {
      timestamp: Date.now(),
      label,
      scenes: JSON.parse(JSON.stringify(scenes)),
    };
    setHistory([version, ...history.slice(0, 4)]);
  };

  const handleUpdateActiveScene = (partial: Partial<Scene>) => {
    const updatedScenes = scenes.map((s) => (s.id === selectedSceneId ? { ...s, ...partial } : s));
    setScenes(updatedScenes);
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: updatedScenes,
      },
    });
  };

  const handleAddScene = () => {
    saveToHistory('Antes de añadir escena');
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Escena #${scenes.length + 1}`,
      durationSeconds: 15,
      narrationText: 'Escribe aquí la locución para esta nueva escena...',
      visualIntent: 'Composición explicativa cinemática...',
      cameraMotion: 'Zoom In',
      transition: 'Fade',
    };
    const updated = [...scenes, newScene];
    setScenes(updated);
    setSelectedSceneId(newScene.id);
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: updated,
      },
    });
  };

  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    saveToHistory('Antes de eliminar escena');
    const updated = scenes.filter((s) => s.id !== id);
    setScenes(updated);
    if (selectedSceneId === id) {
      setSelectedSceneId(updated[0]?.id || '');
    }
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: updated,
      },
    });
  };

  const handleRestoreVersion = (ver: ScriptVersion) => {
    saveToHistory('Antes de restaurar versión previa');
    setScenes(ver.scenes);
    setSelectedSceneId(ver.scenes[0]?.id || '');
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: ver.scenes,
      },
    });
  };

  const handleRunAICritique = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAiSuggestions(null);

    const context = aiEngine.buildContextFromProject(project, selectedSceneId);
    const res = await aiEngine.executeTask<string[]>({
      task: 'CRITIQUE_SCRIPT',
      context,
      userPrompt: 'Analiza el ritmo y la densidad de palabras por segundo.',
    });

    setIsAnalyzing(false);
    if (res.success && res.parsedData) {
      setAiSuggestions(Array.isArray(res.parsedData) ? res.parsedData.join('\n• ') : String(res.parsedData));
    } else {
      setAiSuggestions(res.error || 'No se pudo generar la crítica.');
    }
  };

  const handleExpandNarrationAI = async () => {
    if (!activeScene || isAnalyzing) return;
    setIsAnalyzing(true);

    const context = aiEngine.buildContextFromProject(project, activeScene.id);
    const res = await aiEngine.executeTask<{ expandedNarration: string }>({
      task: 'EXPAND_SCENE_NARRATION',
      context,
      userPrompt: `Mejora la redacción de la escena "${activeScene.title}": ${activeScene.narrationText}`,
    });

    setIsAnalyzing(false);
    if (res.success && res.parsedData?.expandedNarration) {
      saveToHistory(`Antes de aplicar sugerencia IA en Escena "${activeScene.title}"`);
      handleUpdateActiveScene({ narrationText: res.parsedData.expandedNarration });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <FileText className="w-5 h-5" />
            <span>Taller de Guion, Locución y Métricas de Ritmo</span>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Redacta la narración y supervisa la cadencia de palabras (~2.5 pal/s) para evitar sobrecargar al espectador.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-mono">Duración Total</span>
              <span className="text-sm font-bold text-slate-200">{totalDuration}s</span>
            </div>
          </div>

          <button
            onClick={handleRunAICritique}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Auditar Ritmo (IA)</span>
          </button>

          <button
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Escena</span>
          </button>
        </div>
      </div>

      {/* AI Critique Output */}
      {aiSuggestions && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-purple-300">Diagnóstico de Ritmo y Cadencia (IA)</h4>
              <button
                onClick={() => setAiSuggestions(null)}
                className="text-slate-400 hover:text-slate-200 text-[10px]"
              >
                Cerrar
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">• {aiSuggestions}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Scene List Sidebar + Active Scene Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Scene List & History */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 px-1 flex items-center justify-between">
              <span>Escenas del Guion</span>
              <span className="font-mono text-slate-500">{scenes.length} Escenas</span>
            </h3>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {scenes.map((sc, index) => {
                const isSelected = sc.id === (activeScene?.id || '');
                const wordCount = sc.narrationText.trim().split(/\s+/).filter(Boolean).length;
                const cadence = (wordCount / (sc.durationSeconds || 1)).toFixed(1);

                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedSceneId(sc.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-slate-100 shadow-md'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                          #0{index + 1}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {sc.durationSeconds}s • {cadence} w/s
                        </span>
                      </div>
                      <h4 className="text-xs font-medium truncate">{sc.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{sc.narrationText}</p>
                    </div>

                    {scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(sc.id);
                        }}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1"
                        title="Eliminar escena"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-destructive History Versions */}
          {history.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Historial de Versiones Automático</span>
              </h4>
              <div className="space-y-1.5">
                {history.map((ver, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded border border-slate-800"
                  >
                    <span className="text-slate-400 truncate max-w-[170px]">{ver.label}</span>
                    <button
                      onClick={() => handleRestoreVersion(ver)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium text-[10px] border border-indigo-800 px-1.5 py-0.5 rounded"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane: Active Scene Editor */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 space-y-5">
          {activeScene ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                    Editando Escena
                  </span>
                  <input
                    type="text"
                    value={activeScene.title}
                    onChange={(e) => handleUpdateActiveScene({ title: e.target.value })}
                    className="block text-lg font-bold text-slate-100 bg-transparent focus:outline-none focus:border-b focus:border-indigo-500 w-full mt-0.5"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-mono">Duración (seg)</label>
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={activeScene.durationSeconds}
                      onChange={(e) =>
                        handleUpdateActiveScene({
                          durationSeconds: Math.max(1, parseInt(e.target.value) || 5),
                        })
                      }
                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono text-indigo-300 text-center"
                    />
                  </div>

                  {onRequestAIAssist && (
                    <button
                      onClick={() => onRequestAIAssist(activeScene.id)}
                      className="mt-3.5 px-3 py-1.5 bg-purple-950/70 border border-purple-700/60 hover:bg-purple-900 text-purple-300 rounded text-xs flex items-center gap-1 font-medium transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Abrir en Asistente</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Narration Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Texto de Narración / Locución</span>
                  </label>
                  <button
                    onClick={handleExpandNarrationAI}
                    disabled={isAnalyzing}
                    className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Expandir / Mejorar con IA</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={activeScene.narrationText}
                  onChange={(e) => {
                    const text = e.target.value;
                    handleUpdateActiveScene({
                      narrationText: text,
                      subtitles: text.split('. ').filter(Boolean),
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs md:text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
                  placeholder="Escribe la narración que leerá la voz..."
                />
              </div>

              {/* Visual Intent & Camera Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Intención Visual Narrativa
                  </label>
                  <textarea
                    rows={3}
                    value={activeScene.visualIntent}
                    onChange={(e) => handleUpdateActiveScene({ visualIntent: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    placeholder="E.g. Gráfico explicativo con animación cinética..."
                  />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Movimiento de Cámara
                    </label>
                    <select
                      value={activeScene.cameraMotion}
                      onChange={(e) =>
                        handleUpdateActiveScene({
                          cameraMotion: e.target.value as Scene['cameraMotion'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Static">Estático</option>
                      <option value="Zoom In">Zoom In (Acercamiento)</option>
                      <option value="Zoom Out">Zoom Out (Alejamiento)</option>
                      <option value="Pan Left">Panorámica Izquierda</option>
                      <option value="Pan Right">Panorámica Derecha</option>
                      <option value="Kinetic Text">Texto Cinético Dinámico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Transición de Entrada
                    </label>
                    <select
                      value={activeScene.transition}
                      onChange={(e) =>
                        handleUpdateActiveScene({
                          transition: e.target.value as Scene['transition'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Cut">Corte Directo (Cut)</option>
                      <option value="Fade">Fundido (Fade)</option>
                      <option value="Slide">Desplazamiento (Slide)</option>
                      <option value="Zoom">Enfoque Rápido (Zoom)</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Selecciona una escena para comenzar a editar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
