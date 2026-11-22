// Storyboard Module Component
import React from 'react';
import { Project, Scene } from '../types';
import { Film, Clapperboard, Camera, ArrowRightLeft } from 'lucide-react';

interface StoryboardModuleProps {
  project: Project;
}

const CAMERA_LABELS: Record<Scene['cameraMotion'], string> = {
  Static: 'Estático',
  'Zoom In': 'Acercar',
  'Zoom Out': 'Alejar',
  'Pan Left': 'Panorámica izquierda',
  'Pan Right': 'Panorámica derecha',
  'Kinetic Text': 'Texto cinético',
};

const TRANSITION_LABELS: Record<Scene['transition'], string> = {
  Cut: 'Corte',
  Fade: 'Fundido',
  Slide: 'Deslizamiento',
  Zoom: 'Zoom',
};

export const StoryboardModule: React.FC<StoryboardModuleProps> = ({ project }) => {
  const scenes = project.script.scenes || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 titulo-seccion">
            <Film className="w-5 h-5" />
            <span>Dirección audiovisual y storyboard</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Visualiza la secuencia completa de la producción, la intención narrativa de cada encuadre y el movimiento de cámara programado.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
          <Clapperboard className="w-4 h-4 text-indigo-400" />
          <span>{scenes.length} cuadros</span>
        </div>
      </div>

      {/* Storyboard Grid */}
      {scenes.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
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
                  <div className="text-center p-4 space-y-2">
                    <Camera className="w-8 h-8 text-slate-700 mx-auto" />
                    <span className="block text-xs font-mono text-slate-600">
                      CUADRO Nº{index + 1} · {CAMERA_LABELS[scene.cameraMotion]}
                    </span>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-indigo-400 font-semibold">
Nº{index + 1}
                </div>

                <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur border border-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300">
                  {scene.durationSeconds}s
                </div>

                <div className="absolute bottom-2 left-2 bg-indigo-950/90 backdrop-blur border border-indigo-800 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Transición: {TRANSITION_LABELS[scene.transition]}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-200 text-sm">{scene.title}</h4>
                  <p className="text-xs text-indigo-300 font-medium bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    <strong className="text-slate-400 uppercase">Intención:</strong> {scene.visualIntent}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <span className="block text-[11px] font-mono text-slate-500 uppercase">Narración:</span>
                  <p className="text-xs text-slate-400 line-clamp-3 mt-0.5 italic">
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
