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
import { AlertTriangle, AudioLines, KeyRound, Mic, Settings, Sliders, Sparkles } from 'lucide-react';
import { MUSIC_DUCK_LEVEL, musicVolumeFor } from '../engine/audioTrack';
import { DEFAULT_GEMINI_MODEL } from '../engine/gemini';
import { DEFAULT_TTS_VOICE, TTS_VOICES } from '../engine/tts';

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

  const musicVolume = musicVolumeFor(project);
  const setMusicVolume = (value: number) => {
    onUpdateProject({
      ...project,
      settings: { ...project.settings, musicVolume: Math.max(0, Math.min(1, value)) },
    });
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

        <div className="space-y-2 border-t border-slate-800 pt-4">
          <label htmlFor="music-volume" className="etiqueta flex items-center gap-1.5">
            <AudioLines className="w-4 h-4 text-indigo-400" />
            <span>Volumen general de la música</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="music-volume"
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(musicVolume * 100)}
              onChange={(event) => setMusicVolume(Number(event.target.value) / 100)}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="font-mono text-sm text-slate-100 w-12 text-right">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Mientras hay narración sonando la música baja automáticamente al{' '}
            {Math.round(MUSIC_DUCK_LEVEL * 100)}% de este volumen (ducking).
          </p>
          {!project.musicAssetId && (
            <p className="text-sm text-slate-500">
              No hay música asignada: marca un audio como «Usar como música» en la Biblioteca.
            </p>
          )}
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

      {/* Claves de API: se guardan en el proyecto, nunca en el código. */}
      <div className="card space-y-5 max-w-xl" data-testid="api-settings">
        <div className="space-y-1">
          <h3 className="etiqueta flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Claves de API del proyecto</span>
          </h3>
          <p className="text-sm text-slate-500">
            Se guardan en IndexedDB junto a este proyecto y solo se envían al servicio correspondiente cuando
            pulsas «Generar guion» o «Generar voz». No están escritas en el código.
          </p>
        </div>

        <div className="space-y-2 border-t border-slate-800 pt-4">
          <label htmlFor="gemini-key" className="etiqueta flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Clave de API de Gemini</span>
          </label>
          <input
            id="gemini-key"
            data-testid="gemini-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={project.settings.geminiApiKey ?? ''}
            onChange={(event) =>
              onUpdateProject({
                ...project,
                settings: { ...project.settings, geminiApiKey: event.target.value.trim() },
              })
            }
            placeholder="AIza..."
            className="campo font-mono"
          />
          <p className="text-sm text-slate-500">
            Se obtiene gratis en{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-300 underline underline-offset-2"
            >
              Google AI Studio
            </a>
            . Sin clave, el Laboratorio de ideas sigue funcionando con los ángulos manuales.
          </p>

          <label htmlFor="gemini-model" className="etiqueta mt-3 block">
            Modelo de Gemini
          </label>
          <input
            id="gemini-model"
            data-testid="gemini-model"
            type="text"
            spellCheck={false}
            value={project.settings.geminiModel ?? ''}
            onChange={(event) =>
              onUpdateProject({
                ...project,
                settings: { ...project.settings, geminiModel: event.target.value.trim() },
              })
            }
            placeholder={DEFAULT_GEMINI_MODEL}
            className="campo font-mono"
          />
          <p className="text-sm text-slate-500">
            Por defecto {DEFAULT_GEMINI_MODEL}. Si el modelo deja de estar disponible, escribe otro nombre de
            modelo de la API de Gemini.
          </p>
        </div>

        <div className="space-y-2 border-t border-slate-800 pt-4">
          <label htmlFor="tts-key" className="etiqueta flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-indigo-400" />
            <span>Clave de Google Cloud Text-to-Speech</span>
          </label>
          <input
            id="tts-key"
            data-testid="tts-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={project.settings.ttsApiKey ?? ''}
            onChange={(event) =>
              onUpdateProject({
                ...project,
                settings: { ...project.settings, ttsApiKey: event.target.value.trim() },
              })
            }
            placeholder="AIza..."
            className="campo font-mono"
          />
          <p className="text-sm text-slate-500">
            Habilita la API «Cloud Text-to-Speech» en{' '}
            <a
              href="https://console.cloud.google.com/apis/library/texttospeech.googleapis.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-300 underline underline-offset-2"
            >
              Google Cloud Console
            </a>{' '}
            y pega aquí una clave de API. Sin clave puedes escuchar la narración con la voz del navegador,
            pero no guardarla para el video.
          </p>

          <label htmlFor="tts-voice" className="etiqueta mt-3 block">
            Voz por defecto
          </label>
          <select
            id="tts-voice"
            data-testid="tts-voice-default"
            value={project.settings.ttsVoice ?? DEFAULT_TTS_VOICE}
            onChange={(event) =>
              onUpdateProject({
                ...project,
                settings: { ...project.settings, ttsVoice: event.target.value },
              })
            }
            className="campo"
          >
            {TTS_VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
