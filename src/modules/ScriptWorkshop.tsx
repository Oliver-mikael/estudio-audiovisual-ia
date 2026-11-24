// Taller de guion de Estudio Audiovisual Inteligente
import React, { useEffect, useState } from 'react';
import { Project, Scene, SubtitleAnimation, SubtitleEntry, MediaAsset } from '../types';
import { getMediaAssetBlob, saveMediaAssetBlob } from '../services/storage/db';
import { subtitleSlotDefaults, subtitleText } from '../engine/renderEngine';
import { SUBTITLE_ANIMATIONS, normalizeSubtitleAnimation } from '../engine/textAnimation';
import {
  COLOR_GRADE_MAX,
  COLOR_GRADE_MIN,
  normalizeColorGrade,
  isNeutralColorGrade,
} from '../engine/colorGrade';
import { createPexelsImageAsset } from '../engine/pexels';
import {
  DEFAULT_TTS_VOICE,
  ELEVENLABS_VOICE_ID,
  ELEVENLABS_VOICE_NAME,
  TTS_VOICES,
  buildSpeechFileName,
  speakTextPreview,
  stopSpeechPreview,
  synthesizeSpeech,
  voiceById,
} from '../engine/tts';
import {
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  AlertCircle,
  Sparkles,
  GripVertical,
  ImagePlus,
  Film,
  AudioLines,
  Captions,
  PlusCircle,
  Mic,
  Loader2,
  Volume2,
  Search as SearchIcon,
  Scissors,
  Palette,
} from 'lucide-react';
import { ConfirmDialog } from '../components/Modal';

interface ScriptWorkshopProps {
  project: Project;
  /** `coalesceKey` agrupa las pulsaciones seguidas en un solo paso de deshacer. */
  onUpdateProject: (updated: Project, options?: { coalesceKey?: string }) => void;
}

export const ScriptWorkshop: React.FC<ScriptWorkshopProps> = ({ project, onUpdateProject }) => {
  const [scenes, setScenes] = useState<Scene[]>(project.script.scenes || []);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    project.script.scenes.length > 0 ? project.script.scenes[0].id : ''
  );
  const [sceneToDelete, setSceneToDelete] = useState<Scene | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [assigningImage, setAssigningImage] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [assigningVideo, setAssigningVideo] = useState(false);

  // Voz generada con Google Cloud TTS.
  const [ttsBusy, setTtsBusy] = useState(false);
  const [ttsMessage, setTtsMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [pendingVoiceOverwrite, setPendingVoiceOverwrite] = useState(false);

  // Búsqueda automática de imagen en Pexels.
  const [assigningSecondaryImage, setAssigningSecondaryImage] = useState(false);
  const [imageSearchBusy, setImageSearchBusy] = useState(false);
  const [imageSearchMessage, setImageSearchMessage] = useState<string | null>(null);
  const [pendingImageSearch, setPendingImageSearch] = useState(false);

  // Deshacer/rehacer puede restaurar otra versión del proyecto: la lista local se
  // sincroniza y la selección se mantiene solo si la escena sigue existiendo.
  useEffect(() => {
    const list = project.script.scenes || [];
    setScenes(list);
    setSelectedSceneId((current) => {
      if (list.some((scene) => scene.id === current)) return current;
      return list.length > 0 ? list[0].id : '';
    });
  }, [project.script.scenes]);

  const activeScene = scenes.find((s) => s.id === selectedSceneId);

  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
  const imageAssets = (project.mediaAssets || []).filter((asset) => asset.type === 'image');
  const videoAssets = (project.mediaAssets || []).filter((asset) => asset.type === 'video');
  const audioAssets = (project.mediaAssets || []).filter((asset) => asset.type === 'audio');
  const activeImageAssetId =
    activeScene?.imageAssetId ??
    imageAssets.find((asset) => asset.url === activeScene?.imageUrl)?.id ??
    '';
  const activeVideoAssetId =
    activeScene?.videoAssetId ??
    videoAssets.find((asset) => asset.url === activeScene?.videoUrl)?.id ??
    '';
  const activeSecondaryImageAssetId =
    activeScene?.secondaryImageAssetId ??
    imageAssets.find((asset) => asset.url === activeScene?.secondaryImageUrl)?.id ??
    '';
  const subtitleDefaults = activeScene ? subtitleSlotDefaults(activeScene) : [];
  const colorGrade = activeScene ? normalizeColorGrade(activeScene.colorGrade) : null;

  const handleUpdateActiveScene = (
    updatedFields: Partial<Scene>,
    options?: { coalesceKey?: string }
  ) => {
    if (!selectedSceneId) return;
    const updatedScenes = scenes.map((s) =>
      s.id === selectedSceneId ? { ...s, ...updatedFields } : s
    );
    setScenes(updatedScenes);
    onUpdateProject(
      {
        ...project,
        script: {
          ...project.script,
          scenes: updatedScenes,
        },
      },
      options
    );
  };

  /** Cambia el texto de un subtítulo conservando sus tiempos si ya eran explícitos. */
  const handleSubtitleTextChange = (index: number, value: string) => {
    if (!activeScene) return;
    const entries = [...(activeScene.subtitles ?? [])];
    const current = entries[index];
    entries[index] = typeof current === 'string' ? value : { ...current, text: value };
    handleUpdateActiveScene(
      { subtitles: entries },
      { coalesceKey: `scene:${activeScene.id}:subtitle:${index}` }
    );
  };

  /** Fija el inicio o la duración de una línea; el resto se conserva. */
  const handleSubtitleTimingChange = (
    index: number,
    patch: { startSeconds?: number; durationSeconds?: number }
  ) => {
    if (!activeScene) return;
    const entries = [...(activeScene.subtitles ?? [])];
    const current = entries[index];
    const defaults = subtitleSlotDefaults(activeScene)[index] ?? { start: 0, duration: 0 };
    const base =
      typeof current === 'string'
        ? { text: current, startSeconds: defaults.start, durationSeconds: defaults.duration }
        : {
            ...current,
            startSeconds: current.startSeconds ?? defaults.start,
            durationSeconds: current.durationSeconds ?? defaults.duration,
          };
    entries[index] = { ...base, ...patch };
    handleUpdateActiveScene(
      { subtitles: entries },
      { coalesceKey: `scene:${activeScene.id}:subtitle-time:${index}` }
    );
  };

  /** Cambia la animación de una línea conservando su texto y sus tiempos. */
  const handleSubtitleAnimationChange = (index: number, animation: SubtitleAnimation) => {
    if (!activeScene) return;
    const entries = [...(activeScene.subtitles ?? [])];
    const current = entries[index];
    const defaults = subtitleSlotDefaults(activeScene)[index] ?? { start: 0, duration: 0 };
    const base =
      typeof current === 'string'
        ? { text: current, startSeconds: defaults.start, durationSeconds: defaults.duration }
        : {
            ...current,
            startSeconds: current.startSeconds ?? defaults.start,
            durationSeconds: current.durationSeconds ?? defaults.duration,
          };
    entries[index] = { ...base, animation };
    handleUpdateActiveScene({ subtitles: entries });
  };

  /** Vuelve al reparto automático en partes iguales. */
  const handleSubtitleAuto = (index: number) => {
    if (!activeScene) return;
    const entries = [...(activeScene.subtitles ?? [])];
    const current = entries[index];
    if (typeof current === 'string') return;
    entries[index] = current.text;
    handleUpdateActiveScene({ subtitles: entries });
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Escena ${scenes.length + 1}: Nueva Escena`,
      narrationText: 'Escribe aquí la narración explicativa...',
      visualIntent: 'Detalla el concepto visual deseado para la escena',
      cameraMotion: 'Static',
      transition: project.settings.defaultTransition ?? 'Fade',
      durationSeconds: 10,
      subtitles: [],
    };

    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    setSelectedSceneId(newScene.id);
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: updatedScenes,
      },
    });
  };

  /** Reordena las escenas al soltar la tarjeta arrastrada. */
  const handleDropScene = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...scenes];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setScenes(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
    onUpdateProject({
      ...project,
      script: { ...project.script, scenes: reordered },
    });
  };

  /** Asigna a la escena activa una imagen de la biblioteca (campo imageUrl del renderer). */
  const handleAssignImage = async (assetId: string) => {
    setImageError(null);
    if (!assetId) {
      handleUpdateActiveScene({ imageUrl: undefined, imageAssetId: undefined });
      return;
    }

    const asset = (project.mediaAssets || []).find((item) => item.id === assetId);
    if (!asset) {
      setImageError('No se encontró la imagen en la biblioteca del proyecto.');
      return;
    }

    try {
      setAssigningImage(true);
      let blob = asset.fileBlob ?? null;
      if (!blob) {
        const stored = await getMediaAssetBlob(asset.id);
        blob = stored?.fileBlob ?? null;
      }
      if (!blob) throw new Error('La imagen no está guardada en el almacenamiento local.');

      const imageUrl = URL.createObjectURL(blob);
      handleUpdateActiveScene({ imageUrl, imageAssetId: assetId });
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'No se pudo asignar la imagen.');
    } finally {
      setAssigningImage(false);
    }
  };

  /** Asigna la imagen secundaria que se alterna en los cortes automáticos. */
  const handleAssignSecondaryImage = async (assetId: string) => {
    setImageError(null);
    if (!assetId) {
      handleUpdateActiveScene({ secondaryImageUrl: undefined, secondaryImageAssetId: undefined });
      return;
    }

    const asset = (project.mediaAssets || []).find((item) => item.id === assetId);
    if (!asset) {
      setImageError('No se encontró la imagen secundaria en la biblioteca del proyecto.');
      return;
    }

    try {
      setAssigningSecondaryImage(true);
      let blob = asset.fileBlob ?? null;
      if (!blob) {
        const stored = await getMediaAssetBlob(asset.id);
        blob = stored?.fileBlob ?? null;
      }
      if (!blob) throw new Error('La imagen secundaria no está guardada en el almacenamiento local.');

      const secondaryImageUrl = URL.createObjectURL(blob);
      handleUpdateActiveScene({ secondaryImageUrl, secondaryImageAssetId: assetId });
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : 'No se pudo asignar la imagen secundaria.'
      );
    } finally {
      setAssigningSecondaryImage(false);
    }
  };

  /** Asigna a la escena activa un clip de video de la biblioteca. */
  const handleAssignVideo = async (assetId: string) => {
    setVideoError(null);
    if (!assetId) {
      handleUpdateActiveScene({ videoUrl: undefined, videoAssetId: undefined });
      return;
    }

    const asset = (project.mediaAssets || []).find((item) => item.id === assetId);
    if (!asset) {
      setVideoError('No se encontró el clip en la biblioteca del proyecto.');
      return;
    }

    try {
      setAssigningVideo(true);
      let blob = asset.fileBlob ?? null;
      if (!blob) {
        const stored = await getMediaAssetBlob(asset.id);
        blob = stored?.fileBlob ?? null;
      }
      if (!blob) throw new Error('El clip no está guardado en el almacenamiento local.');

      const videoUrl = URL.createObjectURL(blob);
      handleUpdateActiveScene({ videoUrl, videoAssetId: assetId });
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : 'No se pudo asignar el clip.');
    } finally {
      setAssigningVideo(false);
    }
  };

  /** Busca en Pexels una imagen para la intención visual de la escena activa. */
  const handleSearchImage = async (force = false) => {
    if (!activeScene) return;
    const apiKey = (project.settings.pexelsApiKey ?? '').trim();
    if (!apiKey) {
      setImageError('Falta la clave de Pexels. Configúrala en Ajustes del proyecto.');
      return;
    }
    if (activeScene.imageAssetId && !force) {
      setPendingImageSearch(true);
      return;
    }

    setImageSearchBusy(true);
    setImageError(null);
    setImageSearchMessage(null);
    try {
      const { asset } = await createPexelsImageAsset(
        activeScene.visualIntent || activeScene.title,
        { apiKey, sceneTitle: activeScene.title }
      );
      const updatedScenes = scenes.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, imageUrl: asset.url, imageAssetId: asset.id }
          : scene
      );
      setScenes(updatedScenes);
      onUpdateProject({
        ...project,
        mediaAssets: [asset, ...(project.mediaAssets ?? []).filter((item) => item.id !== asset.id)],
        script: { ...project.script, scenes: updatedScenes },
      });
      setImageSearchMessage(`Imagen encontrada y guardada en la Biblioteca: ${asset.name}`);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'No se pudo buscar la imagen.');
    } finally {
      setImageSearchBusy(false);
      setPendingImageSearch(false);
    }
  };

  const ttsVoice = project.settings.ttsVoice ?? DEFAULT_TTS_VOICE;
  const sceneVoiceAsset: MediaAsset | null =
    (project.mediaAssets ?? []).find((asset) => asset.id === activeScene?.narrationAssetId) ?? null;

  /**
   * Convierte la narración de la escena activa en un MP3 y lo guarda en la
   * Biblioteca como narración de esa escena. Usa ElevenLabs (voz Rachel) si hay
   * clave configurada y, si no, Google Cloud TTS con la voz elegida.
   */
  const handleGenerateVoice = async (force = false) => {
    if (!activeScene) return;
    const text = activeScene.narrationText.trim();
    if (!text) {
      setTtsMessage({ kind: 'error', text: 'La escena no tiene texto de narración.' });
      return;
    }

    const googleApiKey = (project.settings.ttsApiKey ?? '').trim();
    const elevenlabsApiKey = (project.settings.elevenlabsApiKey ?? '').trim();
    if (!googleApiKey && !elevenlabsApiKey) {
      setTtsMessage({
        kind: 'error',
        text: 'Falta una clave de voz. Configura ElevenLabs o Google Cloud TTS en Ajustes del proyecto (o usa «Escuchar» para oír la voz del navegador).',
      });
      return;
    }

    if (activeScene.narrationAssetId && !force) {
      setPendingVoiceOverwrite(true);
      return;
    }

    setTtsBusy(true);
    setTtsMessage(null);
    try {
      const result = await synthesizeSpeech(text, {
        googleApiKey,
        elevenlabsApiKey,
        googleVoiceId: ttsVoice,
      });
      const index = scenes.findIndex((scene) => scene.id === activeScene.id);
      const providerLabel =
        result.provider === 'elevenlabs'
          ? `ElevenLabs · ${ELEVENLABS_VOICE_NAME} (${ELEVENLABS_VOICE_ID})`
          : `Google Cloud TTS · ${voiceById(ttsVoice).label}`;
      const asset: MediaAsset = {
        id: `asset-tts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: buildSpeechFileName(activeScene.title, ttsVoice, index, result.provider),
        type: 'audio',
        url: URL.createObjectURL(result.blob),
        fileBlob: result.blob,
        mimeType: result.mimeType,
        sizeBytes: result.blob.size,
        license: 'Voz sintética generada',
        provenance: providerLabel,
        createdAt: Date.now(),
      };

      await saveMediaAssetBlob(asset);

      const updatedScenes = scenes.map((scene) =>
        scene.id === activeScene.id
          ? { ...scene, narrationAssetId: asset.id, audioUrl: asset.url }
          : scene
      );
      setScenes(updatedScenes);
      onUpdateProject({
        ...project,
        mediaAssets: [asset, ...(project.mediaAssets ?? [])],
        script: { ...project.script, scenes: updatedScenes },
      });

      const duration =
        result.durationSeconds > 0 ? ` · ${result.durationSeconds.toFixed(2)} s` : '';
      setTtsMessage({
        kind: 'ok',
        text: `Voz generada con ${result.provider === 'elevenlabs' ? 'ElevenLabs' : 'Google Cloud TTS'} y guardada en la Biblioteca como «${asset.name}»${duration}. Se asigna a esta escena.`,
      });
    } catch (error) {
      setTtsMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'No se pudo generar la voz.',
      });
    } finally {
      setTtsBusy(false);
      setPendingVoiceOverwrite(false);
    }
  };

  const handleDeleteScene = (id: string) => {
    const updatedScenes = scenes.filter((s) => s.id !== id);
    setScenes(updatedScenes);
    if (selectedSceneId === id) {
      setSelectedSceneId(updatedScenes.length > 0 ? updatedScenes[0].id : '');
    }
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: updatedScenes,
      },
    });
  };

  // Análisis heurístico del guion
  const getCriticalFeedback = () => {
    const feedback: string[] = [];
    if (scenes.length === 0) {
      feedback.push('El guion no tiene escenas creadas.');
      return feedback;
    }

    const shortScenes = scenes.filter((s) => s.narrationText.length < 20);
    if (shortScenes.length > 0) {
      feedback.push(`Hay ${shortScenes.length} escena(s) con narración demasiado breve o vacía.`);
    }

    const genericIntro = scenes[0]?.narrationText.toLowerCase().includes('hola a todos');
    if (genericIntro) {
      feedback.push('La introducción usa una fórmula clónica ("Hola a todos"). Prueba un gancho directo.');
    }

    if (totalDuration < 15) {
      feedback.push('La duración total es menor a 15s. Es recomendable profundizar en los conceptos.');
    }

    return feedback;
  };

  const criticalFeedback = getCriticalFeedback();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 titulo-seccion">
            <FileText className="w-5 h-5" />
            <span>Taller de guion y desglose de escenas</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Construye la estructura narrativa, ajusta el ritmo de la locución y recibe críticas automáticas de tono y duración.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-4 py-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="block text-xs text-slate-400">Duración Est.</span>
              <span className="text-lg font-bold text-slate-200">{totalDuration}s</span>
            </div>
          </div>

          <button
            onClick={handleAddScene}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Escena</span>
          </button>
        </div>
      </div>

      {/* Critical Feedback Panel if issues found */}
      {criticalFeedback.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-amber-300">Crítica de guion</h4>
            <ul className="text-xs text-amber-200/80 list-disc list-inside space-y-0.5">
              {criticalFeedback.map((fb, idx) => (
                <li key={idx}>{fb}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Grid: Scene List Sidebar + Active Scene Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Scene List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 px-2 flex items-center justify-between">
            <span>Escenas del Guion</span>
            <span className="text-xs text-slate-500 font-mono">{scenes.length} Escenas</span>
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {scenes.map((sc, index) => {
              const isSelected = sc.id === selectedSceneId;
              return (
                <div
                  key={sc.id}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverIndex(index);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDropScene(index);
                  }}
                  onClick={() => setSelectedSceneId(sc.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 text-slate-100 shadow-md'
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  } ${draggedIndex === index ? 'opacity-50' : ''} ${
                    dragOverIndex === index && draggedIndex !== index ? 'border-indigo-400' : ''
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-slate-600 shrink-0 mt-0.5 cursor-grab" aria-hidden />
                  <div className="space-y-1 overflow-hidden flex-1">
                    <span className="text-xs font-mono text-indigo-400 font-semibold">
                      #0{index + 1} ({sc.durationSeconds}s)
                    </span>
                    <h4 className="text-sm font-medium truncate">{sc.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{sc.narrationText}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSceneToDelete(sc);
                    }}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Eliminar escena"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Active Scene Editor */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          {activeScene ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                    Editando Escena
                  </span>
                  <input
                    type="text"
                    value={activeScene.title}
                    onChange={(e) =>
                      handleUpdateActiveScene(
                        { title: e.target.value },
                        { coalesceKey: `scene:${activeScene.id}:title` }
                      )
                    }
                    className="block text-xl font-bold text-slate-100 bg-transparent focus:outline-none focus:border-b focus:border-indigo-500 w-full mt-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-mono">Duración (seg)</label>
                    <input
                      data-testid="scene-duration"
                      aria-label="Duración de la escena en segundos"
                      type="number"
                      min="2"
                      max="60"
                      value={activeScene.durationSeconds}
                      onChange={(e) =>
                        handleUpdateActiveScene({ durationSeconds: Math.max(1, parseInt(e.target.value) || 5) })
                      }
                      className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono text-indigo-300 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Narration Text Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <span>Texto de Narración / Locución</span>
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    ~{activeScene.narrationText.split(' ').length} palabras
                  </span>
                </label>
                <textarea
                  data-testid="scene-narration"
                  rows={4}
                  value={activeScene.narrationText}
                  onChange={(e) =>
                    handleUpdateActiveScene(
                      { narrationText: e.target.value },
                      { coalesceKey: `scene:${activeScene.id}:narration` }
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
                  placeholder="Escribe la narración que leerá la voz..."
                />
              </div>

              {/* Voz generada para esta escena (Google Cloud TTS) */}
              <div
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                data-testid="scene-voice-panel"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="etiqueta flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-indigo-400" />
                    <span>Voz de esta escena</span>
                  </span>
                  <select
                    data-testid="scene-voice-select"
                    aria-label="Voz para generar la narración"
                    value={ttsVoice}
                    onChange={(event) =>
                      onUpdateProject({
                        ...project,
                        settings: { ...project.settings, ttsVoice: event.target.value },
                      })
                    }
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {TTS_VOICES.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      void handleGenerateVoice();
                    }}
                    disabled={ttsBusy}
                    data-testid="scene-generate-voice"
                    className="btn-primary text-xs disabled:opacity-50"
                  >
                    {ttsBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                    <span>{ttsBusy ? 'Generando voz...' : 'Generar voz'}</span>
                  </button>
                  <button
                    onClick={() => speakTextPreview(activeScene.narrationText)}
                    className="btn-secondary text-xs"
                    title="Escuchar con la voz del navegador (no genera un archivo)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Escuchar</span>
                  </button>
                  {ttsBusy && (
                    <button
                      onClick={stopSpeechPreview}
                      className="btn-secondary text-xs"
                      title="Detener la escucha del navegador"
                    >
                      Detener
                    </button>
                  )}
                  {sceneVoiceAsset && (
                    <button
                      onClick={() => {
                        setTtsMessage(null);
                        handleUpdateActiveScene({
                          narrationAssetId: undefined,
                          audioUrl: undefined,
                        });
                      }}
                      className="btn-secondary text-xs text-rose-300"
                      data-testid="scene-voice-remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar voz</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  La voz generada se guarda en la Biblioteca y suena al inicio de esta escena, recortada a
                  sus {activeScene.durationSeconds} s. «Escuchar» usa la voz del navegador y no crea archivo;
                  para exportar audio hace falta una clave en Ajustes: con ElevenLabs se usa la voz Rachel y,
                  si no hay clave de ElevenLabs, Google Cloud TTS con la voz elegida arriba.
                </p>

                {sceneVoiceAsset && (
                  <p
                    data-testid="scene-voice-assigned"
                    className="text-xs text-emerald-300/90 flex items-start gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Voz asignada: {sceneVoiceAsset.name}</span>
                  </p>
                )}

                {ttsMessage && (
                  <p
                    data-testid="scene-voice-status"
                    data-tts-status={ttsMessage.kind}
                    className={`text-xs ${
                      ttsMessage.kind === 'error' ? 'text-rose-300' : 'text-emerald-300'
                    }`}
                  >
                    {ttsMessage.text}
                  </p>
                )}
              </div>

              {/* Subtítulos editables, independientes del texto de narración */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="etiqueta flex items-center gap-1.5">
                    <Captions className="w-4 h-4 text-indigo-400" />
                    <span>Subtítulos del video</span>
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateActiveScene({
                        subtitles: [...(activeScene.subtitles ?? []), ''],
                      })
                    }
                    className="btn-secondary text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Añadir subtítulo</span>
                  </button>
                </div>

                {(activeScene.subtitles ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Esta escena no muestra subtítulos. Añade los que quieras: puedes dejar los tiempos
                    automáticos (reparto igual) o fijar el inicio y la duración de cada línea.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {(activeScene.subtitles ?? []).map((subtitle, index) => {
                      const entry = subtitle as SubtitleEntry;
                      const fallback = subtitleDefaults[index] ?? { start: 0, duration: 0 };
                      const isAuto = typeof entry === 'string';
                      const startValue = isAuto ? fallback.start : entry.startSeconds ?? fallback.start;
                      const durationValue = isAuto
                        ? fallback.duration
                        : entry.durationSeconds ?? fallback.duration;

                      return (
                        <li
                          key={index}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500 w-6 text-right shrink-0">
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              value={subtitleText(entry)}
                              aria-label={`Texto del subtítulo ${index + 1}`}
                              onChange={(e) => handleSubtitleTextChange(index, e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                              placeholder="Texto del subtítulo"
                            />
                            <button
                              onClick={() => {
                                const next = (activeScene.subtitles ?? []).filter((_, i) => i !== index);
                                handleUpdateActiveScene({ subtitles: next });
                              }}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0"
                              title="Eliminar subtítulo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pl-8">
                            <label
                              htmlFor={`subtitle-start-${index}`}
                              className="text-[11px] text-slate-400"
                            >
                              Inicio (s)
                            </label>
                            <input
                              id={`subtitle-start-${index}`}
                              type="number"
                              min="0"
                              max={activeScene.durationSeconds}
                              step="0.1"
                              value={Number(startValue.toFixed(2))}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                handleSubtitleTimingChange(index, {
                                  startSeconds: Number.isFinite(parsed)
                                    ? Math.min(activeScene.durationSeconds, Math.max(0, parsed))
                                    : 0,
                                });
                              }}
                              className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-indigo-300 text-center"
                            />
                            <label
                              htmlFor={`subtitle-duration-${index}`}
                              className="text-[11px] text-slate-400"
                            >
                              Duración (s)
                            </label>
                            <input
                              id={`subtitle-duration-${index}`}
                              type="number"
                              min="0"
                              max={activeScene.durationSeconds}
                              step="0.1"
                              value={Number(durationValue.toFixed(2))}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                handleSubtitleTimingChange(index, {
                                  durationSeconds: Number.isFinite(parsed)
                                    ? Math.max(0, Math.min(activeScene.durationSeconds, parsed))
                                    : 0,
                                });
                              }}
                              className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-indigo-300 text-center"
                            />
                            <span className="text-[11px] text-slate-500 font-mono">
                              {startValue.toFixed(1)}–{Math.min(activeScene.durationSeconds, startValue + durationValue).toFixed(1)} s
                            </span>
                            {!isAuto && (
                              <button
                                onClick={() => handleSubtitleAuto(index)}
                                className="text-[11px] text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                                title="Volver al reparto automático"
                              >
                                Automático
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pl-8">
                            <label
                              htmlFor={`subtitle-animation-${index}`}
                              className="text-[11px] text-slate-400"
                            >
                              Animación
                            </label>
                            <select
                              id={`subtitle-animation-${index}`}
                              data-testid={`subtitle-animation-${index}`}
                              value={
                                isAuto ? 'Fade' : normalizeSubtitleAnimation(entry.animation)
                              }
                              onChange={(e) =>
                                handleSubtitleAnimationChange(
                                  index,
                                  e.target.value as SubtitleAnimation
                                )
                              }
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                              {SUBTITLE_ANIMATIONS.map((animation) => (
                                <option key={animation.id} value={animation.id}>
                                  {animation.label}
                                </option>
                              ))}
                            </select>
                            <span className="text-[11px] text-slate-500">
                              Entrada y salida de 0,3 s; la máquina de escribir revela letra a letra.
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <p className="text-sm text-slate-500">
                  Cada subtítulo se dibuja solo en su ventana de tiempo. Sin tiempos fijos se reparten en
                  partes iguales de la duración de la escena. Son independientes de la narración: editarlos
                  no cambia el texto de locución ni al revés.
                </p>
              </div>

              {/* Gancho visual superpuesto en los primeros 3 s (solo primera escena) */}
              {project.script.scenes[0]?.id === activeScene.id && (
                <div
                  className="space-y-2 border-t border-slate-800 pt-4"
                  data-testid="intro-hook-panel"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="etiqueta flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Gancho visual de la intro</span>
                    </span>
                    <label
                      htmlFor="intro-hook-enabled"
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <input
                        id="intro-hook-enabled"
                        data-testid="intro-hook-enabled"
                        type="checkbox"
                        checked={project.settings.introHookEnabled !== false}
                        onChange={(event) =>
                          onUpdateProject({
                            ...project,
                            settings: {
                              ...project.settings,
                              introHookEnabled: event.target.checked,
                            },
                          })
                        }
                        className="accent-indigo-500"
                      />
                      <span>Mostrar en los primeros 3 s</span>
                    </label>
                  </div>

                  <input
                    id="intro-hook-text"
                    data-testid="intro-hook-text"
                    type="text"
                    value={project.settings.introHookText ?? ''}
                    placeholder={activeScene.title}
                    onChange={(event) =>
                      onUpdateProject({
                        ...project,
                        settings: { ...project.settings, introHookText: event.target.value },
                      })
                    }
                    className="campo"
                    aria-label="Texto del gancho visual"
                  />

                  <p className="text-sm text-slate-500">
                    Se superpone en grande sobre la primera escena, con zoom de entrada de 110 % a 100 % y
                    fondo oscurecido. Si dejas el texto vacío se usa el título: «{activeScene.title}».
                  </p>
                </div>
              )}

              {/* Visual Intent & Camera Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Intención visual
                  </label>
                  <textarea
                    rows={3}
                    value={activeScene.visualIntent}
                    onChange={(e) =>
                      handleUpdateActiveScene(
                        { visualIntent: e.target.value },
                        { coalesceKey: `scene:${activeScene.id}:intent` }
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    placeholder="E.g. Gráfico explicativo con animación cinética..."
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Movimiento de Cámara
                    </label>
                    <select
                      value={activeScene.cameraMotion}
                      onChange={(e) =>
                        handleUpdateActiveScene({
                          cameraMotion: e.target.value as Scene['cameraMotion'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Static">Estático</option>
                      <option value="Zoom In">Acercar</option>
                      <option value="Zoom Out">Alejar</option>
                      <option value="Pan Left">Panorámica izquierda</option>
                      <option value="Pan Right">Panorámica derecha</option>
                      <option value="Kinetic Text">Texto cinético</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Transición de Entrada
                    </label>
                    <select
                      value={activeScene.transition}
                      onChange={(e) =>
                        handleUpdateActiveScene({
                          transition: e.target.value as Scene['transition'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Cut">Corte</option>
                      <option value="Fade">Fundido</option>
                      <option value="Slide">Deslizamiento</option>
                      <option value="Zoom">Zoom</option>
                    </select>

                    <div className="mt-3">
                      <label
                        htmlFor="scene-transition-duration"
                        className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
                      >
                        Duración de la transición (s)
                      </label>
                      <input
                        id="scene-transition-duration"
                        type="number"
                        min="0.1"
                        max="3"
                        step="0.1"
                        disabled={activeScene.transition === 'Cut'}
                        value={activeScene.transitionDurationSeconds ?? 0.5}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          handleUpdateActiveScene({
                            transitionDurationSeconds: Math.min(3, Math.max(0.1, Number.isFinite(parsed) ? parsed : 0.5)),
                          });
                        }}
                        className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono text-indigo-300 text-center disabled:opacity-50"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {activeScene.transition === 'Cut'
                          ? 'Corte no usa transición.'
                          : 'Por defecto 0,5 s. Se aplica al entrar en esta escena.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Corrección de color por escena (fase 29) */}
              <div
                className="space-y-3 border-t border-slate-800 pt-4"
                data-testid="scene-color-grade"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="etiqueta flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-indigo-400" />
                    <span>Corrección de color</span>
                  </label>
                  <button
                    onClick={() => handleUpdateActiveScene({ colorGrade: undefined })}
                    disabled={!colorGrade || isNeutralColorGrade(activeScene.colorGrade)}
                    className="btn-secondary text-xs disabled:opacity-40"
                    title="Volver a los valores neutros (1.0)"
                  >
                    Restablecer
                  </button>
                </div>

                {colorGrade &&
                  (
                    [
                      { key: 'brightness', label: 'Brillo' },
                      { key: 'contrast', label: 'Contraste' },
                      { key: 'saturation', label: 'Saturación' },
                    ] as const
                  ).map((control) => (
                    <div key={control.key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <label
                          htmlFor={`scene-color-${control.key}`}
                          className="text-slate-300"
                        >
                          {control.label}
                        </label>
                        <span className="font-mono text-xs text-indigo-300">
                          {colorGrade[control.key].toFixed(2)}
                        </span>
                      </div>
                      <input
                        id={`scene-color-${control.key}`}
                        data-testid={`scene-color-${control.key}`}
                        type="range"
                        min={COLOR_GRADE_MIN}
                        max={COLOR_GRADE_MAX}
                        step="0.05"
                        value={colorGrade[control.key]}
                        onChange={(event) =>
                          handleUpdateActiveScene(
                            {
                              colorGrade: {
                                ...colorGrade,
                                [control.key]: Number(event.target.value),
                              },
                            },
                            { coalesceKey: `scene:${activeScene.id}:color` }
                          )
                        }
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  ))}

                <p className="text-sm text-slate-500">
                  Se aplica en el canvas antes de exportar con{' '}
                  <code className="text-slate-400">brightness()</code>,{' '}
                  <code className="text-slate-400">contrast()</code> y{' '}
                  <code className="text-slate-400">saturate()</code>. 1.00 es neutro: la escena se ve
                  como antes de esta opción.
                </p>
              </div>

              {/* Imagen de escena tomada de la biblioteca */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <label htmlFor="scene-image" className="etiqueta flex items-center gap-1.5">
                  <ImagePlus className="w-4 h-4 text-indigo-400" />
                  <span>Imagen de la escena</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="scene-image"
                    value={activeImageAssetId}
                    disabled={assigningImage}
                    onChange={(event) => {
                      void handleAssignImage(event.target.value);
                    }}
                    className="campo"
                  >
                    <option value="">Sin imagen (fondo generado)</option>
                    {imageAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>

                  {activeScene.imageUrl && (
                    <button
                      onClick={() =>
                        handleUpdateActiveScene({ imageUrl: undefined, imageAssetId: undefined })
                      }
                      className="btn-secondary shrink-0"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      void handleSearchImage();
                    }}
                    disabled={imageSearchBusy}
                    data-testid="scene-search-image"
                    className="btn-secondary text-xs disabled:opacity-50"
                    title="Buscar en Pexels una imagen para la intención visual de esta escena"
                  >
                    {imageSearchBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <SearchIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{imageSearchBusy ? 'Buscando imagen...' : 'Buscar imagen'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono truncate">
                    {activeScene.visualIntent || 'Sin intención visual'}
                  </span>
                </div>

                {imageSearchMessage && (
                  <p data-testid="scene-image-status" className="text-sm text-emerald-300">
                    {imageSearchMessage}
                  </p>
                )}

                {imageAssets.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No hay imágenes en la biblioteca. Súbelas desde la sección Biblioteca.
                  </p>
                )}
                {assigningImage && <p className="text-sm text-slate-400">Cargando imagen...</p>}
                {imageError && <p className="text-sm text-rose-300">{imageError}</p>}
              </div>

              {/* Ritmo visual: imagen secundaria y cortes automáticos */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <label htmlFor="scene-secondary-image" className="etiqueta flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-indigo-400" />
                  <span>Ritmo visual (B-roll)</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="scene-secondary-image"
                    data-testid="scene-secondary-image"
                    value={activeSecondaryImageAssetId}
                    disabled={assigningSecondaryImage}
                    onChange={(event) => {
                      void handleAssignSecondaryImage(event.target.value);
                    }}
                    className="campo"
                  >
                    <option value="">Sin imagen secundaria</option>
                    {imageAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>

                  <label
                    htmlFor="scene-auto-cuts"
                    className="flex items-center gap-2 text-sm text-slate-300 shrink-0"
                  >
                    <input
                      id="scene-auto-cuts"
                      data-testid="scene-auto-cuts"
                      type="checkbox"
                      checked={activeScene.autoCuts !== false}
                      onChange={(event) =>
                        handleUpdateActiveScene({ autoCuts: event.target.checked })
                      }
                      className="accent-indigo-500"
                    />
                    <span>Cortes automáticos cada 3 s</span>
                  </label>
                </div>

                <p className="text-sm text-slate-500">
                  {activeScene.durationSeconds > 4
                    ? `La escena dura ${activeScene.durationSeconds} s: con imagen secundaria, el video alterna principal → secundaria cada 3 s.`
                    : 'La escena dura 4 s o menos: los cortes automáticos empiezan a partir de 4 s.'}
                  {!activeScene.secondaryImageUrl &&
                    ' Elige una segunda imagen de la Biblioteca para activar el B-roll.'}
                </p>
                {assigningSecondaryImage && (
                  <p className="text-sm text-slate-400">Cargando imagen secundaria...</p>
                )}
              </div>

              {/* Clip de video tomado de la biblioteca */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <label htmlFor="scene-video" className="etiqueta flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span>Clip de video de la escena</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="scene-video"
                    value={activeVideoAssetId}
                    disabled={assigningVideo}
                    onChange={(event) => {
                      void handleAssignVideo(event.target.value);
                    }}
                    className="campo"
                  >
                    <option value="">Sin clip de video</option>
                    {videoAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>

                  {activeScene.videoUrl && (
                    <button
                      onClick={() =>
                        handleUpdateActiveScene({ videoUrl: undefined, videoAssetId: undefined })
                      }
                      className="btn-secondary shrink-0"
                    >
                      Quitar clip
                    </button>
                  )}
                </div>

                {videoAssets.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No hay clips en la biblioteca. Sube un MP4 o WebM desde la sección Biblioteca.
                  </p>
                )}
                <p className="text-sm text-slate-500">
                  El clip tiene prioridad sobre la imagen. Si dura menos que la escena se repite en bucle; si dura
                  más, se recorta al final de la escena.
                </p>
                {assigningVideo && <p className="text-sm text-slate-400">Cargando clip...</p>}
                {videoError && <p className="text-sm text-rose-300">{videoError}</p>}
              </div>

              {/* Efecto de sonido al inicio de la escena */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <label htmlFor="scene-sfx" className="etiqueta flex items-center gap-1.5">
                  <AudioLines className="w-4 h-4 text-indigo-400" />
                  <span>Efecto de sonido (SFX) de la escena</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="scene-sfx"
                    value={activeScene.sfxAssetId ?? ''}
                    onChange={(event) =>
                      handleUpdateActiveScene({ sfxAssetId: event.target.value || undefined })
                    }
                    className="campo"
                  >
                    <option value="">Sin efecto de sonido</option>
                    {audioAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>

                  {activeScene.sfxAssetId && (
                    <button
                      onClick={() => handleUpdateActiveScene({ sfxAssetId: undefined })}
                      className="btn-secondary shrink-0"
                    >
                      Quitar efecto
                    </button>
                  )}
                </div>

                {audioAssets.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No hay audios en la biblioteca. Súbelos desde la sección Biblioteca.
                  </p>
                )}
                <p className="text-sm text-slate-500">
                  El efecto suena una sola vez al inicio de esta escena, mezclado con la narración y la música
                  de fondo.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Selecciona una escena o crea una nueva para comenzar a editar.</p>
            </div>
          )}
        </div>
      </div>

      {pendingImageSearch && activeScene && (
        <ConfirmDialog
          title="Reemplazar la imagen de la escena"
          message={`Esta escena ya tiene una imagen asignada. Si buscas otra en Pexels, se usará la nueva y la anterior seguirá en la Biblioteca.`}
          confirmLabel="Buscar y reemplazar"
          onCancel={() => setPendingImageSearch(false)}
          onConfirm={() => {
            void handleSearchImage(true);
          }}
        />
      )}

      {pendingVoiceOverwrite && activeScene && (
        <ConfirmDialog
          title="Reemplazar la voz de la escena"
          message={`Esta escena ya tiene una narración («${sceneVoiceAsset?.name ?? activeScene.narrationAssetId}»). Si generas otra voz, la nueva se asignará a la escena y la anterior seguirá en la Biblioteca.`}
          confirmLabel="Generar y reemplazar"
          onCancel={() => setPendingVoiceOverwrite(false)}
          onConfirm={() => {
            void handleGenerateVoice(true);
          }}
        />
      )}

      {sceneToDelete && (
        <ConfirmDialog
          title="Eliminar escena"
          message={`Se eliminará "${sceneToDelete.title}" del guion. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar escena"
          onCancel={() => setSceneToDelete(null)}
          onConfirm={() => {
            handleDeleteScene(sceneToDelete.id);
            setSceneToDelete(null);
          }}
        />
      )}
    </div>
  );
};
