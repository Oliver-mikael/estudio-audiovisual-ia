// Previsualización antes de exportar (fase 31).
//
// Muestra un cuadro por escena durante un segundo, con el audio real del
// proyecto (la misma mezcla de `prepareProjectAudio`) sincronizado con cada
// escena. No codifica ni descarga ningún WebM: es solo el storyboard animado.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from '../types';
import { CanvasRenderEngine } from '../engine/renderEngine';
import { PreparedAudio, prepareProjectAudio } from '../engine/audioTrack';
import { Download, Pause, Play, RotateCcw } from 'lucide-react';

interface StoryboardPreviewProps {
  project: Project;
  onExport: () => void;
}

/** Segundos que se muestra cada cuadro clave. */
export const STORYBOARD_SECONDS_PER_FRAME = 1;

type PreviewStatus = 'idle' | 'loading' | 'playing' | 'done' | 'error';

export const StoryboardPreview: React.FC<StoryboardPreviewProps> = ({ project, onExport }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasRenderEngine | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const preparedRef = useRef<PreparedAudio | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const runRef = useRef(0);

  const scenes = project.script.scenes;
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLabel, setAudioLabel] = useState('Preparando audio...');

  /** Inicio absoluto de una escena en la línea de tiempo del proyecto. */
  const sceneStart = useCallback(
    (index: number) => {
      let start = 0;
      for (let i = 0; i < index; i++) start += scenes[i].durationSeconds;
      return start;
    },
    [scenes]
  );

  /** Instante que se dibuja de cada escena: su punto medio. */
  const frameTime = useCallback(
    (index: number) => sceneStart(index) + scenes[index].durationSeconds / 2,
    [sceneStart, scenes]
  );

  const stopSlice = useCallback(() => {
    const source = sourceRef.current;
    sourceRef.current = null;
    if (source) {
      try {
        source.stop();
      } catch {
        // La fuente ya estaba parada.
      }
      source.disconnect();
    }
  }, []);

  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof AudioContext === 'undefined') return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playSlice = useCallback(
    (start: number, duration: number) => {
      stopSlice();
      const prepared = preparedRef.current;
      const ctx = ensureContext();
      if (!prepared || !ctx) return;

      const bufferDuration = prepared.buffer.duration;
      const offset = Math.max(0, Math.min(start, bufferDuration));
      const length = Math.max(0, Math.min(duration, bufferDuration - offset));
      if (length <= 0) return;

      const source = ctx.createBufferSource();
      source.buffer = prepared.buffer;
      source.connect(ctx.destination);
      source.start(0, offset, length);
      sourceRef.current = source;
    },
    [ensureContext, stopSlice]
  );

  const stop = useCallback(() => {
    runRef.current += 1;
    stopSlice();
    setStatus('idle');
  }, [stopSlice]);

  const play = useCallback(async () => {
    if (scenes.length === 0) return;

    runRef.current += 1;
    const run = runRef.current;
    stopSlice();
    setError(null);
    setStatus('loading');
    setSceneIndex(0);

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!engineRef.current) engineRef.current = new CanvasRenderEngine(canvas);
      const engine = engineRef.current;

      const ctx = ensureContext();
      void ctx?.resume().catch(() => undefined);

      await engine.preloadImages(scenes);
      await engine.preloadVideos(scenes);
      if (run !== runRef.current) return;

      const prepared = await prepareProjectAudio(project, totalDuration).catch(() => null);
      if (run !== runRef.current) return;
      preparedRef.current = prepared;
      setAudioLabel(prepared ? 'Audio del proyecto listo' : 'Sin audio asignado');

      setStatus('playing');
      for (let index = 0; index < scenes.length; index++) {
        if (run !== runRef.current) return;
        setSceneIndex(index);
        await engine.renderFrameAt(project, frameTime(index));
        if (run !== runRef.current) return;

        playSlice(sceneStart(index), STORYBOARD_SECONDS_PER_FRAME);
        await new Promise<void>((resolve) => setTimeout(resolve, STORYBOARD_SECONDS_PER_FRAME * 1000));
      }

      if (run !== runRef.current) return;
      stopSlice();
      setStatus('done');
    } catch (caught) {
      if (run !== runRef.current) return;
      stopSlice();
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'No se pudo reproducir la previsualización.');
    }
  }, [ensureContext, frameTime, playSlice, project, scenes, sceneStart, stopSlice, totalDuration]);

  // Primer cuadro visible sin necesidad de pulsar reproducir.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || scenes.length === 0) return;
    if (!engineRef.current) engineRef.current = new CanvasRenderEngine(canvas);
    const engine = engineRef.current;
    void (async () => {
      await engine.preloadImages(scenes);
      await engine.renderFrameAt(project, frameTime(0));
    })();
  }, [frameTime, project, scenes]);

  // Al desmontar se detiene el audio y se cierra el contexto.
  useEffect(() => {
    return () => {
      runRef.current += 1;
      const source = sourceRef.current;
      if (source) {
        try {
          source.stop();
        } catch {
          // Ya estaba detenida.
        }
      }
      void audioCtxRef.current?.close().catch(() => undefined);
      audioCtxRef.current = null;
    };
  }, []);

  const isPlaying = status === 'loading' || status === 'playing';
  const visibleScene = scenes[Math.min(sceneIndex, Math.max(0, scenes.length - 1))];

  return (
    <div className="space-y-3" data-testid="storyboard-preview">
      <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
        <canvas
          ref={canvasRef}
          width={project.settings.resolution.width}
          height={project.settings.resolution.height}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 left-2 bg-slate-950/85 border border-slate-700 px-2 py-1 rounded text-[11px] font-mono text-indigo-300">
          {scenes.length > 0
            ? `CUADRO ${Math.min(sceneIndex + 1, scenes.length)} DE ${scenes.length}`
            : 'SIN ESCENAS'}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <p
          data-testid="storyboard-preview-status"
          data-status={status}
          data-scene-index={scenes.length > 0 ? Math.min(sceneIndex + 1, scenes.length) : 0}
          data-total-scenes={scenes.length}
          className={status === 'error' ? 'text-rose-300' : 'text-slate-400'}
        >
          {status === 'playing' && visibleScene
            ? `Escena ${sceneIndex + 1} de ${scenes.length}: ${visibleScene.title} · 1 s por cuadro`
            : status === 'loading'
              ? 'Preparando cuadros y audio...'
              : status === 'done'
                ? `Storyboard completado: ${scenes.length} escena(s) en ${scenes.length} s.`
                : status === 'error'
                  ? `Error: ${error}`
                  : `${scenes.length} escena(s) · ${scenes.length} s · ${audioLabel}`}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (isPlaying) stop();
              else void play();
            }}
            disabled={scenes.length === 0}
            data-testid="storyboard-preview-play"
            className="btn-secondary text-xs disabled:opacity-40"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Detener' : status === 'done' ? 'Repetir' : 'Reproducir'}</span>
          </button>
          <button
            onClick={() => {
              stop();
              setSceneIndex(0);
              const engine = engineRef.current;
              if (engine && scenes.length > 0) void engine.renderFrameAt(project, frameTime(0));
            }}
            disabled={isPlaying || scenes.length === 0}
            className="btn-secondary text-xs disabled:opacity-40"
            title="Volver al primer cuadro"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
        <div
          className="bg-indigo-500 h-full transition-all"
          style={{
            width:
              scenes.length > 0
                ? `${status === 'done' ? 100 : (Math.min(sceneIndex + 1, scenes.length) / scenes.length) * 100}%`
                : '0%',
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-slate-500">
          Un cuadro por escena · 1 s cada uno · {audioLabel} · no genera el WebM.
        </p>
        <button
          onClick={onExport}
          disabled={scenes.length === 0 || totalDuration <= 0}
          data-testid="storyboard-preview-export"
          className="btn-primary disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          <span>Exportar video</span>
        </button>
      </div>
    </div>
  );
};
