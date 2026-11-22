// Script Workshop Component for Estudio Audiovisual Inteligente
import React, { useState } from 'react';
import { Project, Scene } from '../types';
import { getMediaAssetBlob } from '../services/storage/db';
import {
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
} from 'lucide-react';
import { ConfirmDialog } from '../components/Modal';

interface ScriptWorkshopProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
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

  const handleUpdateActiveScene = (updatedFields: Partial<Scene>) => {
    if (!selectedSceneId) return;
    const updatedScenes = scenes.map((s) =>
      s.id === selectedSceneId ? { ...s, ...updatedFields } : s
    );
    setScenes(updatedScenes);
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: updatedScenes,
      },
    });
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `Escena ${scenes.length + 1}: Nueva Escena`,
      narrationText: 'Escribe aquí la narración explicativa...',
      visualIntent: 'Detalla el concepto visual deseado para la escena',
      cameraMotion: 'Static',
      transition: 'Fade',
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

  // Critical feedback analyzer
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
                    onChange={(e) => handleUpdateActiveScene({ title: e.target.value })}
                    className="block text-xl font-bold text-slate-100 bg-transparent focus:outline-none focus:border-b focus:border-indigo-500 w-full mt-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-mono">Duración (seg)</label>
                    <input
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
                  rows={4}
                  value={activeScene.narrationText}
                  onChange={(e) => handleUpdateActiveScene({ narrationText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500"
                  placeholder="Escribe la narración que leerá la voz..."
                />
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
                    Esta escena no muestra subtítulos. Añade los que quieras: se reparten en partes iguales
                    de la duración de la escena y se dibujan en el video exportado.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(activeScene.subtitles ?? []).map((subtitle, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500 w-6 text-right shrink-0">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={subtitle}
                          aria-label={`Subtítulo ${index + 1}`}
                          onChange={(e) => {
                            const next = [...(activeScene.subtitles ?? [])];
                            next[index] = e.target.value;
                            handleUpdateActiveScene({ subtitles: next });
                          }}
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
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-sm text-slate-500">
                  Los subtítulos son independientes de la narración: editarlos no cambia el texto de
                  locución ni al revés.
                </p>
              </div>

              {/* Visual Intent & Camera Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Intención visual
                  </label>
                  <textarea
                    rows={3}
                    value={activeScene.visualIntent}
                    onChange={(e) => handleUpdateActiveScene({ visualIntent: e.target.value })}
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

                {imageAssets.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No hay imágenes en la biblioteca. Súbelas desde la sección Biblioteca.
                  </p>
                )}
                {assigningImage && <p className="text-sm text-slate-400">Cargando imagen...</p>}
                {imageError && <p className="text-sm text-rose-300">{imageError}</p>}
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
