// Ajustes de exportación: resolución y fps, con el límite automático en móvil.
import React, { useEffect } from 'react';
import { Project } from '../types';
import {
  FPS_OPTIONS,
  MOBILE_LIMIT,
  RESOLUTION_PRESETS,
  effectiveSettings,
  isLimitedForMobile,
  isMobileLike,
} from '../engine/capabilities';
import { AlertTriangle, Settings, Sliders } from 'lucide-react';

interface SettingsModuleProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ project, onUpdateProject }) => {
  const mobile = isMobileLike();
  const limited = isLimitedForMobile(project.settings);
  const effective = effectiveSettings(project);

  // En móvil se recorta automáticamente lo que supere el límite seguro.
  useEffect(() => {
    if (limited) {
      onUpdateProject({ ...project, settings: effective });
    }
  }, [limited, effective, project, onUpdateProject]);

  const selectedPreset =
    RESOLUTION_PRESETS.find(
      (preset) =>
        preset.width === effective.resolution.width && preset.height === effective.resolution.height
    )?.label ?? '720p';

  const selectPreset = (label: string) => {
    const preset = RESOLUTION_PRESETS.find((item) => item.label === label);
    if (!preset) return;
    onUpdateProject({
      ...project,
      settings: {
        ...project.settings,
        resolution: { width: preset.width, height: preset.height },
      },
    });
  };

  const selectFps = (fps: number) => {
    onUpdateProject({ ...project, settings: { ...project.settings, fps } });
  };

  return (
    <div className="space-y-4">
      <div className="card flex items-start gap-3">
        <Settings className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="titulo-seccion">Ajustes de exportación</h2>
          <p className="text-sm text-slate-400 mt-1">
            Estos valores los usan tanto la previsualización como la exportación. Se guardan en el proyecto.
          </p>
        </div>
      </div>

      {mobile && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-300">Límite automático en móvil</p>
            <p className="text-sm text-amber-200/80">
              En Android/móvil la exportación se limita a {MOBILE_LIMIT.width} × {MOBILE_LIMIT.height} px y{' '}
              {MOBILE_LIMIT.fps} fps para evitar cierres por memoria.
            </p>
          </div>
        </div>
      )}

      <div className="card space-y-5 max-w-xl">
        <div className="space-y-2">
          <label htmlFor="resolution" className="etiqueta flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Resolución</span>
          </label>
          <select
            id="resolution"
            value={selectedPreset}
            onChange={(event) => selectPreset(event.target.value)}
            className="campo"
          >
            {RESOLUTION_PRESETS.map((preset) => {
              const exceedsMobile =
                mobile && (preset.width > MOBILE_LIMIT.width || preset.height > MOBILE_LIMIT.height);
              return (
                <option key={preset.label} value={preset.label} disabled={exceedsMobile}>
                  {preset.label} — {preset.width} × {preset.height}
                  {exceedsMobile ? ' (no disponible en móvil)' : ''}
                </option>
              );
            })}
          </select>
          <p className="text-sm text-slate-500">
            Se usa en el canvas de previsualización y en el video exportado.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="fps" className="etiqueta">
            Fotogramas por segundo
          </label>
          <select
            id="fps"
            value={effective.fps}
            onChange={(event) => selectFps(Number(event.target.value))}
            className="campo"
          >
            {FPS_OPTIONS.map((fps) => (
              <option key={fps} value={fps} disabled={mobile && fps > MOBILE_LIMIT.fps}>
                {fps} fps{mobile && fps > MOBILE_LIMIT.fps ? ' (no disponible en móvil)' : ''}
              </option>
            ))}
          </select>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-slate-800 pt-4">
          <div>
            <dt className="text-slate-400">Resolución efectiva</dt>
            <dd className="font-mono text-slate-100">
              {effective.resolution.width} × {effective.resolution.height} px
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">FPS efectivos</dt>
            <dd className="font-mono text-slate-100">{effective.fps} fps</dd>
          </div>
          <div>
            <dt className="text-slate-400">Relación de aspecto</dt>
            <dd className="font-mono text-slate-100">{project.settings.aspectRatio}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Duración</dt>
            <dd className="font-mono text-slate-100">
              {project.script.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0)} s
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
