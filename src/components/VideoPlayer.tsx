// Video Player React Component for Canvas Timeline

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Project } from '../types';
import { CanvasRenderEngine } from '../engine/renderEngine';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  project: Project;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CanvasRenderEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Total project duration
  const totalDuration = project.script.scenes.reduce(
    (sum, sc) => sum + sc.durationSeconds,
    0
  ) || 1;

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new CanvasRenderEngine(canvasRef.current);
      engineRef.current = engine;
      void engine.preloadImages(project.script.scenes);
      void engine.preloadVideos(project.script.scenes);
      void engine.renderFrameAt(project, currentTime);
    }
  }, [project]);

  const tick = useCallback((timestamp: number) => {
    if (lastTimeRef.current !== null) {
      const delta = (timestamp - lastTimeRef.current) / 1000;
      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }
    lastTimeRef.current = timestamp;
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(tick);
    }
  }, [isPlaying, totalDuration]);

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

  const togglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              onClick={() => setCurrentTime(0)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title={isMuted ? 'Activar Sonido' : 'Silenciar'}
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
      </div>
    </div>
  );
};
