// Resumen del proyecto antes de exportar (fase 35).
//
// Muestra duración total, escenas, palabras del guion, pistas de audio activas y
// la resolución real de exportación. Cada dato lleva su valor numérico en
// `data-value` para poder comprobarlo contra el proyecto.
import React from 'react';
import { Project } from '../types';
import { computeProjectStats } from '../engine/projectStats';
import { Clock, FileText, Film, Music4, Monitor } from 'lucide-react';

interface ProjectStatsProps {
  project: Project;
  /** Resolución y fps reales de la exportación (si se conocen). */
  format?: { width: number; height: number; fps: number };
}

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(2).replace('.', ',')} s`;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ project, format }) => {
  const stats = computeProjectStats(project, format);
  const audioValue = stats.audioTrackCount === 0 ? 'Sin audio' : `${stats.audioTrackCount} pista(s)`;

  const items = [
    {
      id: 'duration',
      label: 'Duración total',
      value: formatSeconds(stats.durationSeconds),
      raw: stats.durationSeconds,
      icon: Clock,
      detail: `${stats.totalFrames} cuadros · ${stats.fps} fps`,
    },
    {
      id: 'scenes',
      label: 'Escenas',
      value: String(stats.sceneCount),
      raw: stats.sceneCount,
      icon: Film,
      detail: stats.sceneCount === 1 ? '1 escena en el guion' : `${stats.sceneCount} escenas en el guion`,
    },
    {
      id: 'words',
      label: 'Palabras en el guion',
      value: String(stats.wordCount),
      raw: stats.wordCount,
      icon: FileText,
      detail: `${stats.narrationWordCount} de narración · ${stats.subtitleLineCount} subtítulo(s)`,
    },
    {
      id: 'audio-tracks',
      label: 'Pistas de audio activas',
      value: audioValue,
      raw: stats.audioTrackCount,
      icon: Music4,
      detail: stats.audioLabels.length > 0 ? stats.audioLabels.join(' · ') : 'No hay narración ni música',
    },
    {
      id: 'resolution',
      label: 'Resolución de exportación',
      value: `${stats.resolution.width} × ${stats.resolution.height} px`,
      raw: stats.resolution.width,
      icon: Monitor,
      detail: `${stats.fps} fps${stats.mobileLimited ? ' · limitada en móvil' : ''}`,
    },
  ];

  return (
    <div className="space-y-2" data-testid="project-stats">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              data-testid={`stat-${item.id}`}
              data-value={item.raw}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
            >
              <p className="etiqueta flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{item.label}</span>
              </p>
              <p className="text-slate-100 font-mono text-sm mt-1">{item.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 break-words">{item.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
