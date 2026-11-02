// ExportProfilesModal Component (Phase 7B - Advanced Export Settings)
import React, { useState } from 'react';
import { Project, ExportProfile } from '../types';
import { Download, X, Film, Check, Sparkles, HardDrive, ShieldCheck } from 'lucide-react';

interface ExportProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onStartExport: (profile: ExportProfile) => void;
  isExporting: boolean;
}

export const EXPORT_PROFILES: ExportProfile[] = [
  {
    id: 'hd-1080p-16-9',
    name: 'Full HD Horizontal (1080p)',
    format: 'webm',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    bitrateBps: 5000000,
    includeAudio: true,
    description: 'Máxima nitidez para YouTube, televisión y presentaciones profesionales.',
  },
  {
    id: 'standard-720p-16-9',
    name: 'HD Estándar (720p)',
    format: 'webm',
    aspectRatio: '16:9',
    resolution: { width: 1280, height: 720 },
    fps: 30,
    bitrateBps: 2500000,
    includeAudio: true,
    description: 'Equilibrio perfecto entre velocidad de renderizado, peso ligero y calidad fluida.',
  },
  {
    id: 'vertical-1080p-9-16',
    name: 'Vertical Móvil (TikTok / Reels / Shorts)',
    format: 'webm',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920 },
    fps: 30,
    bitrateBps: 3500000,
    includeAudio: true,
    description: 'Encuadre vertical optimizado para teléfonos y plataformas de video corto.',
  },
  {
    id: 'square-720p-1-1',
    name: 'Cuadrado 1:1 (Redes Sociales)',
    format: 'webm',
    aspectRatio: '1:1',
    resolution: { width: 720, height: 720 },
    fps: 30,
    bitrateBps: 1800000,
    includeAudio: true,
    description: 'Formato compacto para feeds de redes sociales y previsualizaciones rápidas.',
  },
];

export const ExportProfilesModal: React.FC<ExportProfilesModalProps> = ({
  isOpen,
  onClose,
  project,
  onStartExport,
  isExporting,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('standard-720p-16-9');

  if (!isOpen) return null;

  const activeProfile =
    EXPORT_PROFILES.find((p) => p.id === selectedProfileId) || EXPORT_PROFILES[1];

  const totalSeconds = project.script.scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
  const estimatedMb = (
    (totalSeconds * (activeProfile.bitrateBps / 8)) /
    (1024 * 1024)
  ).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Perfiles de Exportación Audiovisual</h3>
              <p className="text-[11px] text-slate-400">Selecciona el formato y resolución de salida.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg text-xs font-mono"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profiles List */}
        <div className="space-y-2 text-xs">
          {EXPORT_PROFILES.map((prof) => {
            const isSelected = prof.id === selectedProfileId;
            return (
              <div
                key={prof.id}
                onClick={() => setSelectedProfileId(prof.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500 text-slate-100 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200 text-xs">{prof.name}</span>
                    <span className="px-1.5 py-0.2 bg-slate-900 text-slate-400 text-[10px] font-mono rounded border border-slate-800">
                      {prof.resolution.width}x{prof.resolution.height}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{prof.description}</p>
                </div>
                <div className="pt-0.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Details */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Duración a renderizar:</span>
            <span>{totalSeconds} segundos ({project.script.scenes.length} escenas)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tamaño estimado de archivo:</span>
            <span className="text-emerald-400 font-bold">~{estimatedMb} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Motor de codificación:</span>
            <span>Canvas 2D + MediaRecorder (Local Offline)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onStartExport(activeProfile)}
            disabled={isExporting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Renderizando...' : 'Iniciar Renderizado'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
