// Redesigned StoryboardModule with AI Recommendations
import React, { useState } from 'react';
import { Project, Scene } from '../types';
import { aiEngine } from '../services/ai/aiEngine';
import {
  Film,
  Clapperboard,
  Camera,
  ArrowRightLeft,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface StoryboardModuleProps {
  project: Project;
  onUpdateProject?: (updated: Project) => void;
}

export const StoryboardModule: React.FC<StoryboardModuleProps> = ({ project }) => {
  const scenes = project.script.scenes || [];
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<string | null>(null);

  const handleRecommendVisualsAI = async () => {
    if (isRecommending || scenes.length === 0) return;
    setIsRecommending(true);
    setRecommendationResult(null);

    const context = aiEngine.buildContextFromProject(project, scenes[0]?.id);
    const res = await aiEngine.executeTask({
      task: 'RECOMMEND_CAMERA_AND_VISUALS',
      context,
      userPrompt: 'Sugiere movimientos de cámara cinematográficos y transiciones para el ritmo general.',
    });

    setIsRecommending(false);
    if (res.success && res.parsedData) {
      setRecommendationResult(
        `Recomendación de Dirección (${res.modelName}): ${res.parsedData.visualIntent || res.rawText}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <Film className="w-5 h-5" />
            <span>Dirección Audiovisual & Storyboard Cinemático</span>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Supervisa la secuencia visual del montaje, encuadres, transiciones y movimientos de cámara programados.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <Clapperboard className="w-4 h-4 text-indigo-400" />
            <span>{scenes.length} Cuadros</span>
          </div>

          <button
            onClick={handleRecommendVisualsAI}
            disabled={isRecommending || scenes.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {isRecommending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Recomendar Planos (IA)</span>
          </button>
        </div>
      </div>

      {recommendationResult && (
        <div className="p-3 bg-slate-900 border border-purple-500/40 rounded-lg text-xs text-purple-200 flex items-center justify-between">
          <span>{recommendationResult}</span>
          <button
            onClick={() => setRecommendationResult(null)}
            className="text-slate-400 hover:text-slate-200 text-[10px]"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Storyboard Grid */}
      {scenes.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No hay escenas para generar el storyboard. Agrega escenas en el Taller de Guion.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenes.map((scene: Scene, index: number) => (
            <div
              key={scene.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-lg hover:border-slate-700 transition-all"
            >
              {/* Frame Viewport / Image Placeholder */}
              <div className="relative aspect-video bg-slate-950 border-b border-slate-800 flex items-center justify-center overflow-hidden group">
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={scene.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-4 space-y-1.5">
                    <Camera className="w-7 h-7 text-slate-700 mx-auto" />
                    <span className="block text-[11px] font-mono text-slate-500">
                      FRAME #{index + 1} ({scene.cameraMotion})
                    </span>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-400 font-semibold">
                  #0{index + 1}
                </div>

                <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                  {scene.durationSeconds}s
                </div>

                <div className="absolute bottom-2 left-2 bg-indigo-950/90 backdrop-blur border border-indigo-800 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Transición: {scene.transition}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-slate-200 text-sm">{scene.title}</h4>
                  <p className="text-xs text-indigo-300 font-medium bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    🎯 <strong className="text-slate-400 uppercase">Intención:</strong> {scene.visualIntent}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase">Narración:</span>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 italic">
                    "{scene.narrationText}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
