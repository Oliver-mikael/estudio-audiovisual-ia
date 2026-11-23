// Video Player React Component for Canvas Timeline
//
// Además de dibujar los cuadros, reproduce en el Monitor la misma mezcla de
// audio que genera la exportación (`prepareProjectAudio`): narración, música en
// bucle con ducking y efectos por escena. El audio se detiene al pausar y se
// recoloca al hacer scrub, y el botón de silencio controla un GainNode real.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Project } from '../types';
import { CanvasRenderEngine } from '../engine/renderEngine';
import { PreparedAudio, prepareProjectAudio } from '../engine/audioTrack';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  project: Project;
}

type PreviewAudioState = 'empty' | 'loading' | 'ready' | 'error';

function describePreparedAudio(prepared: PreparedAudio | null): string {
  if (!prepared) return 'Sin audio asignado';
  const parts: string[] = [];
  if (prepared.narrationAsset) parts.push('narración');
  if (prepared.sceneNarrationAssets.length > 0) {
    parts.push(`${prepared.sceneNarrationAssets.length} voz(es) por escena`);
  }
  if (prepared.musicAsset) parts.push('música con ducking');
  if (prepared.sfxAssets.length > 0) parts.push(`${prepared.sfxAssets.length} efecto(s)`);
  return parts.length > 0 ? parts.join(' + ') : 'Sin audio asignado';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasRenderEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Audio de la vista previa: mismo buffer que la exportación.
  const preparedRef = useRef<PreparedAudio | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const mutedRef = useRef(false);
  const totalDurationRef = useRef(0);

  const [audioState, setAudioState] = useState<PreviewAudioState>('loading');
  const [audioLabel, setAudioLabel] = useState('Preparando mezcla...');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioOffset, setAudioOffset] = useState(0);

  // Total project duration
  const totalDuration = project.script.scenes.reduce(
    (sum, sc) => sum + sc.durationSeconds,
    0
  ) || 1;
  totalDurationRef.current = totalDuration;

  const projectRef = useRef(project);
  projectRef.current = project;

  // Solo se vuelve a mezclar cuando cambia algo que afecta al audio: los
  // recursos asignados, su volumen o la línea de tiempo de las escenas. Los
  // cambios de texto no redecodifican los archivos.
  const audioSignature = JSON.stringify({
    narration: project.narrationAssetId ?? null,
    music: project.musicAssetId ?? null,
    volume: project.settings.musicVolume ?? null,
    scenes: project.script.scenes.map(
      (scene) =>
        `${scene.id}:${scene.durationSeconds}:${scene.sfxAssetId ?? ''}:${scene.narrationAssetId ?? ''}`
    ),
    assets: (project.mediaAssets ?? [])
      .filter((asset) => asset.type === 'audio')
      .map((asset) => `${asset.id}:${asset.sizeBytes}`),
  });

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new CanvasRenderEngine(canvasRef.current);
      engineRef.current = engine;
      void engine.preloadImages(project.script.scenes);
      void engine.preloadVideos(project.script.scenes);
      void engine.renderFrameAt(project, currentTimeRef.current);
    }
  }, [project]);

  const stopAudio = useCallback(() => {
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
    setAudioPlaying(false);
  }, []);

  const ensureAudioGraph = useCallback((): AudioContext | null => {
    if (!audioCtxRef.current) {
      if (typeof AudioContext === 'undefined') return null;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = mutedRef.current ? 0 : 1;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainRef.current = gain;
    }
    return audioCtxRef.current;
  }, []);

  /** Arranca la mezcla desde `time` (segundos del proyecto). */
  const startAudioAt = useCallback(
    (time: number) => {
      stopAudio();
      const prepared = preparedRef.current;
      if (!prepared) {
        setAudioOffset(Math.max(0, time));
        return;
      }
      const ctx = ensureAudioGraph();
      const gain = gainRef.current;
      if (!ctx || !gain) return;

      if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

      const duration = prepared.buffer.duration;
      const offset = Math.max(0, Math.min(time, duration - 0.001));
      setAudioOffset(Math.max(0, offset));
      if (time >= duration) return;

      const source = ctx.createBufferSource();
      source.buffer = prepared.buffer;
      source.connect(gain);
      source.onended = () => {
        if (sourceRef.current === source) {
          sourceRef.current = null;
          setAudioPlaying(false);
        }
      };
      source.start(0, offset);
      sourceRef.current = source;
      setAudioPlaying(true);
    },
    [ensureAudioGraph, stopAudio]
  );

  // Mezcla de audio del proyecto (misma función que usa el exportador).
  useEffect(() => {
    let cancelled = false;
    setAudioState('loading');
    setAudioError(null);

    prepareProjectAudio(projectRef.current, totalDurationRef.current)
      .then((prepared) => {
        if (cancelled) return;
        preparedRef.current = prepared;
        setAudioState(prepared ? 'ready' : 'empty');
        setAudioLabel(describePreparedAudio(prepared));
        if (prepared && isPlayingRef.current) startAudioAt(currentTimeRef.current);
      })
      .catch((error) => {
        if (cancelled) return;
        preparedRef.current = null;
        setAudioState('error');
        setAudioError(
          error instanceof Error ? error.message : 'No se pudo preparar el audio de la vista previa.'
        );
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSignature, startAudioAt]);

  // Reproducir/pausar controla la fuente de audio; al pausar se para de verdad.
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) startAudioAt(currentTimeRef.current);
    else stopAudio();
    return () => {
      if (!isPlayingRef.current) stopAudio();
    };
  }, [isPlaying, startAudioAt, stopAudio]);

  // El mute actúa sobre la ganancia real del grafo de audio.
  useEffect(() => {
    mutedRef.current = isMuted;
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (ctx && gain) {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(isMuted ? 0 : 1, now + 0.02);
    }
  }, [isMuted]);

  // Cierre: se detiene la fuente y se libera el contexto de audio.
  useEffect(() => {
    return () => {
      stopAudio();
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      gainRef.current = null;
      if (ctx) void ctx.close().catch(() => undefined);
    };
  }, [stopAudio]);

  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (timestamp - lastTimeRef.current) / 1000;
        const next = Math.min(currentTimeRef.current + delta, totalDurationRef.current);
        currentTimeRef.current = next;
        setCurrentTime(next);
        if (next >= totalDurationRef.current) {
          setIsPlaying(false);
          stopAudio();
          return;
        }
      }
      lastTimeRef.current = timestamp;
      if (isPlayingRef.current) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    },
    [stopAudio]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, tick]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    let cancelled = false;
    const draw = async () => {
      // Los clips se buscan al instante pedido antes de dibujar el cuadro.
      await engine.preloadVideos(project.script.scenes);
      if (cancelled) return;
      await engine.renderFrameAt(project, currentTime);
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, [currentTime, project]);

  const seekTo = (time: number) => {
    const clamped = Math.max(0, Math.min(totalDurationRef.current, time));
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    setAudioOffset(clamped);
    if (isPlayingRef.current) startAudioAt(clamped);
  };

  const togglePlay = () => {
    // El contexto se crea dentro del gesto del usuario para que el navegador lo permita.
    const ctx = ensureAudioGraph();
    void ctx?.resume().catch(() => undefined);

    if (isPlaying) {
      setIsPlaying(false);
      stopAudio();
      return;
    }

    if (currentTimeRef.current >= totalDurationRef.current) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
    }
    // El efecto de `isPlaying` arranca la fuente de audio una sola vez.
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseFloat(e.target.value));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const audioStatusText =
    audioState === 'error'
      ? `Audio no disponible: ${audioError ?? 'error desconocido'}`
      : audioState === 'loading'
        ? 'Preparando la mezcla de audio...'
        : audioState === 'empty'
          ? 'Sin audio asignado: la vista previa es muda.'
          : `Audio: ${audioLabel} · ${audioPlaying ? `sonando desde ${formatTime(audioOffset)}` : isMuted ? 'silenciado' : 'en pausa'}`;

  return (
    <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 w-full">
      {/* Canvas Viewport */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
        <canvas
          ref={canvasRef}
          width={project.settings.resolution.width}
          height={project.settings.resolution.height}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Control Bar */}
      <div className="w-full mt-4 flex flex-col gap-2">
        {/* Scrubber timeline */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Posición del video"
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs text-slate-400 font-mono w-10">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              onClick={() => {
                if (isPlaying) setIsPlaying(false);
                stopAudio();
                seekTo(0);
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Reiniciar"
              aria-label="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMuted((value) => !value)}
              className={`p-2.5 rounded-lg transition-colors ${
                isMuted
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              aria-pressed={isMuted}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">
              {project.settings.resolution.width}x{project.settings.resolution.height}
            </span>
            <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">
              {project.settings.fps} FPS
            </span>
          </div>
        </div>

        {/* Estado real del audio de la vista previa */}
        <p
          data-testid="preview-audio-status"
          data-audio-state={audioState}
          data-audio-playing={audioPlaying ? 'true' : 'false'}
          data-audio-offset={audioOffset.toFixed(3)}
          data-audio-muted={isMuted ? 'true' : 'false'}
          className={`text-xs ${
            audioState === 'error' ? 'text-rose-300' : audioState === 'empty' ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {audioStatusText}
        </p>
      </div>
    </div>
  );
};
