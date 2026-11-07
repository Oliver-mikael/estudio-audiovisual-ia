// Professional Media Library Module (Phase 7E)
// Supports Real Multi-file Import, Folders, Dual Views (Grid/List), Safe Deletion, Relinking and Timeline Insertion
import React, { useState } from 'react';
import { Project, MediaAsset } from '../types';
import { MediaImporter } from '../services/media/mediaImporter';
import { MediaStore, MediaSortOption } from '../services/media/mediaStore';
import { MissingMediaManager } from '../services/media/missingMediaManager';
import { TimelineEngine } from '../services/timeline/timelineEngine';
import { aiEngine } from '../services/ai/aiEngine';
import {
  FolderOpen,
  Upload,
  Trash2,
  Image as ImageIcon,
  Music,
  Film,
  Sparkles,
  Loader2,
  Grid,
  List,
  Search,
  Plus,
  Play,
  X,
  AlertTriangle,
  FolderPlus,
  Edit2,
  Check,
  RefreshCw,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';

interface MediaLibraryProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onNavigateToProduction?: () => void;
}

export const MediaLibraryModule: React.FC<MediaLibraryProps> = ({
  project,
  onUpdateProject,
  onNavigateToProduction,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'voice'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MediaSortOption>('date-desc');

  // Multi-selection
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Import states
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // AI Semantic tagging state
  const [isTaggingAI, setIsTaggingAI] = useState(false);
  const [tagStatus, setTagStatus] = useState<string | null>(null);

  // Preview Modal
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  // Safe Delete Modal
  const [deleteCandidate, setDeleteCandidate] = useState<{ asset: MediaAsset; usageCount: number } | null>(null);

  // New Folder Modal
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Inline Rename state
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Reconnection state
  const [relinkTargetAssetId, setRelinkTargetAssetId] = useState<string | null>(null);

  // Detect missing media references
  const missingMediaRefs = MissingMediaManager.detectMissingMedia(project);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setImportNotice(null);

    const targetFolder = selectedFolderId !== 'all' ? selectedFolderId : undefined;
    const { imported, duplicatesCount, errors } = await MediaImporter.importMultipleFiles(
      files,
      project.mediaAssets || [],
      (current, total, filename) => {
        setImportProgress(`Importando (${current}/${total}): ${filename}`);
      },
      targetFolder
    );

    setIsImporting(false);
    setImportProgress(null);

    let notice = `Se importaron ${imported.length} archivo(s) correctamente.`;
    if (duplicatesCount > 0) {
      notice += ` Se omitieron ${duplicatesCount} archivo(s) duplicados idénticos por SHA-256.`;
    }
    if (errors.length > 0) {
      notice += ` Hubo ${errors.length} error(es): ${errors.slice(0, 2).join(', ')}`;
    }
    setImportNotice(notice);

    if (imported.length > 0) {
      onUpdateProject({
        ...project,
        mediaAssets: [...imported, ...(project.mediaAssets || [])],
        updatedAt: Date.now(),
      });
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const { project: updated } = MediaStore.createFolder(project, newFolderName);
    onUpdateProject(updated);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleInitiateDelete = (asset: MediaAsset) => {
    const usageCount = MediaStore.getAssetUsageCount(project, asset.id);
    setDeleteCandidate({ asset, usageCount });
  };

  const handleConfirmDelete = (force: boolean) => {
    if (!deleteCandidate) return;
    const { updatedProject } = MediaStore.deleteAssetSafely(project, deleteCandidate.asset.id, force);
    if (updatedProject) {
      onUpdateProject(updatedProject);
      setSelectedAssetIds((prev) => prev.filter((id) => id !== deleteCandidate.asset.id));
    }
    setDeleteCandidate(null);
  };

  const handleSaveRename = (assetId: string) => {
    if (editingName.trim()) {
      const updated = MediaStore.renameAsset(project, assetId, editingName);
      onUpdateProject(updated);
    }
    setEditingAssetId(null);
  };

  const handleInsertIntoTimeline = (asset: MediaAsset) => {
    const updated = TimelineEngine.ensureTimeline(project);
    const targetTrackId = asset.type === 'audio' ? 'track-a1' : 'track-v1';
    const targetTrack = updated.timeline!.tracks.find((t) => t.id === targetTrackId);

    const startMs = targetTrack?.clips.reduce((max, c) => Math.max(max, c.startMs + c.durationMs), 0) || 0;
    const durationMs = asset.durationSeconds ? Math.round(asset.durationSeconds * 1000) : 5000;

    const newClip = {
      id: `clip-${asset.id}-${Date.now()}`,
      name: asset.name,
      trackId: targetTrackId,
      assetId: asset.id,
      type: asset.type === 'audio' ? ('audio' as const) : asset.type === 'video' ? ('video' as const) : ('image' as const),
      startMs,
      durationMs,
      offsetMs: 0,
      volume: 1.0,
      speed: 1.0,
      opacity: 1.0,
    };

    const updatedTracks = updated.timeline!.tracks.map((t) =>
      t.id === targetTrackId ? { ...t, clips: [...t.clips, newClip] } : t
    );

    onUpdateProject({
      ...updated,
      timeline: { ...updated.timeline!, tracks: updatedTracks },
      updatedAt: Date.now(),
    });

    if (onNavigateToProduction) {
      onNavigateToProduction();
    }
  };

  const handleRelinkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !relinkTargetAssetId) return;

    const res = await MissingMediaManager.reconnectAsset(project, relinkTargetAssetId, file);
    if (res.success) {
      onUpdateProject(res.updatedProject);
      setImportNotice(`Archivo '${file.name}' reconectado exitosamente con la referencia original.`);
    } else {
      alert(res.error || 'No se pudo reconectar el archivo');
    }
    setRelinkTargetAssetId(null);
  };

  const handleAISemanticCategorize = async () => {
    if (isTaggingAI || (project.mediaAssets || []).length === 0) return;
    setIsTaggingAI(true);
    setTagStatus('Analizando metadatos de biblioteca con IA...');

    const context = aiEngine.buildContextFromProject(project);
    const res = await aiEngine.executeTask({
      task: 'CATEGORIZE_MEDIA_ASSET',
      context,
      userPrompt: `Etiqueta semánticamente los ${project.mediaAssets.length} recursos multimedia registrados.`,
    });

    setIsTaggingAI(false);
    if (res.success && res.parsedData?.suggestedTags) {
      setTagStatus(`Etiquetas sugeridas (${res.modelName}): ${res.parsedData.suggestedTags.join(', ')}`);
    } else {
      setTagStatus(res.error || 'No se pudo generar categorización');
    }
  };

  const filteredAssets = MediaStore.filterAndSortAssets(
    project.mediaAssets || [],
    filterType,
    searchQuery,
    sortBy,
    selectedFolderId
  );

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner and Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-base md:text-lg">
            <FolderOpen className="w-5 h-5" />
            <span>Biblioteca Multimedia Profesional</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded">
              Fase 7E
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Administración avanzada de recursos: importación múltiple, metadatos reales, desduplicación SHA-256 e inserción a timeline.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nueva Carpeta</span>
          </button>

          <button
            onClick={handleAISemanticCategorize}
            disabled={isTaggingAI || (project.mediaAssets || []).length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isTaggingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Etiquetado IA</span>
          </button>

          <label className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors shadow-md min-h-[44px]">
            <Upload className="w-4 h-4" />
            <span>Importar Archivos</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Missing Media Alert Banner */}
      {missingMediaRefs.length > 0 && (
        <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-rose-200 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="font-semibold block">Se han detectado {missingMediaRefs.length} recurso(s) ausente(s) en la timeline:</span>
              <span className="text-[11px] text-rose-300 font-mono">
                {missingMediaRefs.map((m) => `${m.expectedName} (${m.affectedClipsCount} clips)`).join(', ')}
              </span>
            </div>
          </div>
          <label className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-semibold rounded-lg cursor-pointer text-xs transition-colors shrink-0 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconectar Archivo</span>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={(e) => {
                if (missingMediaRefs[0]) {
                  setRelinkTargetAssetId(missingMediaRefs[0].assetId);
                  handleRelinkFile(e);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Import Notice */}
      {importNotice && (
        <div className="p-3 bg-slate-900 border border-indigo-500/40 rounded-lg text-xs text-slate-200 flex items-center justify-between">
          <span>{importNotice}</span>
          <button onClick={() => setImportNotice(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Import Progress Bar */}
      {isImporting && (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1.5 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>{importProgress || 'Procesando recursos...'}</span>
          </div>
        </div>
      )}

      {tagStatus && (
        <div className="p-3 bg-slate-900 border border-purple-500/40 rounded-lg text-xs text-purple-200 flex items-center justify-between">
          <span>{tagStatus}</span>
          <button onClick={() => setTagStatus(null)} className="text-slate-400 hover:text-white text-[10px]">
            Cerrar
          </button>
        </div>
      )}

      {/* Organization Filters & Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
        {/* Upper Row: Search & Folders */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, etiquetas o procedencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Folder Filter Pill Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                selectedFolderId === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Todas las Carpetas
            </button>
            {(project.folders || []).map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                  selectedFolderId === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <FolderOpen className="w-3 h-3 text-indigo-400" />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lower Row: Category Filters, Sort, and View Modes */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({(project.mediaAssets || []).length})
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterType === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Videos</span>
            </button>
            <button
              onClick={() => setFilterType('image')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterType === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Imágenes</span>
            </button>
            <button
              onClick={() => setFilterType('audio')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterType === 'audio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>Audio</span>
            </button>
            <button
              onClick={() => setFilterType('voice')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filterType === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3 h-3 text-rose-400" />
              <span>Locuciones</span>
            </button>
          </div>

          {/* Sort and View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as MediaSortOption)}
                className="bg-transparent text-[11px] text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="date-desc">Más recientes primero</option>
                <option value="date-asc">Más antiguos primero</option>
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="size-desc">Mayor tamaño</option>
                <option value="duration-desc">Mayor duración</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vista en cuadrícula"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vista en lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Asset Presentation (Grid or List) */}
      {filteredAssets.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
          No se encontraron recursos que coincidan con la búsqueda o filtro seleccionado.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAssetIds.includes(asset.id);
            const usageCount = MediaStore.getAssetUsageCount(project, asset.id);

            return (
              <div
                key={asset.id}
                className={`bg-slate-900 border rounded-xl overflow-hidden flex flex-col justify-between p-3 relative transition-all group ${
                  isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Thumbnail / Preview Area */}
                <div
                  onClick={() => setPreviewAsset(asset)}
                  className="aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center mb-2 border border-slate-800/80 cursor-pointer relative group-hover:brightness-105"
                >
                  {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                  ) : asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : asset.type === 'audio' ? (
                    <div className="text-center p-2">
                      <Music className="w-7 h-7 text-indigo-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500 font-mono">Audio Clip</span>
                    </div>
                  ) : (
                    <div className="text-center p-2">
                      <Film className="w-7 h-7 text-indigo-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-500 font-mono">Video Clip</span>
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-6 h-6 text-white drop-shadow" />
                  </div>

                  {/* Duration Badge */}
                  {asset.durationSeconds !== undefined && asset.durationSeconds > 0 && (
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-white font-mono text-[9px] rounded">
                      {asset.durationSeconds.toFixed(1)}s
                    </span>
                  )}
                </div>

                {/* Metadata & Inline Name */}
                <div className="space-y-1">
                  {editingAssetId === asset.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white"
                        autoFocus
                      />
                      <button onClick={() => handleSaveRename(asset.id)} className="p-0.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h4
                        className="text-xs font-semibold text-slate-200 truncate cursor-pointer hover:text-indigo-400"
                        title={asset.name}
                        onClick={() => {
                          setEditingAssetId(asset.id);
                          setEditingName(asset.name);
                        }}
                      >
                        {asset.name}
                      </h4>
                      <button
                        onClick={() => {
                          setEditingAssetId(asset.id);
                          setEditingName(asset.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-slate-300"
                        title="Renombrar"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{formatSize(asset.sizeBytes)}</span>
                    {asset.width && asset.height && <span>{asset.width}x{asset.height}</span>}
                  </div>
                </div>

                {/* Bottom Card Actions: Usage Indicator & Timeline Insertion */}
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    {usageCount > 0 ? (
                      <span className="text-emerald-400 font-semibold" title={`Usado en ${usageCount} clips`}>
                        {usageCount} clip(s)
                      </span>
                    ) : (
                      <span className="text-slate-600">Sin uso</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleInsertIntoTimeline(asset)}
                      className="px-2 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors min-h-[32px]"
                      title="Insertar clip al timeline"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Timeline</span>
                    </button>

                    <button
                      onClick={() => handleInitiateDelete(asset)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded"
                      title="Eliminar recurso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed List View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
              <tr>
                <th className="p-3">Recurso</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Dimensiones / Duración</th>
                <th className="p-3">Tamaño</th>
                <th className="p-3">Uso en Timeline</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAssets.map((asset) => {
                const usageCount = MediaStore.getAssetUsageCount(project, asset.id);

                return (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          onClick={() => setPreviewAsset(asset)}
                          className="w-9 h-9 rounded bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          {asset.thumbnailUrl ? (
                            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                          ) : asset.type === 'image' ? (
                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                          ) : asset.type === 'audio' ? (
                            <Music className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Film className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={asset.name}>
                          {asset.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 capitalize text-slate-400">{asset.type}</td>
                    <td className="p-3 text-slate-400">
                      {asset.width && asset.height
                        ? `${asset.width}x${asset.height} (${asset.aspectRatio || '16:9'})`
                        : asset.durationSeconds
                        ? `${asset.durationSeconds.toFixed(1)} segundos`
                        : '—'}
                    </td>
                    <td className="p-3 text-slate-400">{formatSize(asset.sizeBytes)}</td>
                    <td className="p-3">
                      {usageCount > 0 ? (
                        <span className="text-emerald-400 font-bold">{usageCount} clips activos</span>
                      ) : (
                        <span className="text-slate-600">0 clips</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleInsertIntoTimeline(asset)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-semibold transition-colors min-h-[36px]"
                        >
                          + Timeline
                        </button>
                        <button
                          onClick={() => handleInitiateDelete(asset)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-200 truncate max-w-md">{previewAsset.name}</h3>
              <button onClick={() => setPreviewAsset(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Player Container */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
              {previewAsset.type === 'image' && (
                <img src={previewAsset.url} alt={previewAsset.name} className="max-h-full object-contain" />
              )}
              {previewAsset.type === 'video' && (
                <video src={previewAsset.url} controls autoPlay className="max-h-full max-w-full" />
              )}
              {previewAsset.type === 'audio' && (
                <div className="p-6 text-center space-y-3">
                  <Music className="w-12 h-12 text-indigo-400 mx-auto" />
                  <audio src={previewAsset.url} controls autoPlay className="w-full" />
                </div>
              )}
            </div>

            {/* Technical Metadata Inspection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Tipo:</span>
                <span className="text-slate-200 capitalize">{previewAsset.type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tamaño:</span>
                <span className="text-slate-200">{formatSize(previewAsset.sizeBytes)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dimensiones:</span>
                <span className="text-slate-200">
                  {previewAsset.width && previewAsset.height ? `${previewAsset.width}x${previewAsset.height}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Duración:</span>
                <span className="text-slate-200">
                  {previewAsset.durationSeconds ? `${previewAsset.durationSeconds.toFixed(1)}s` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewAsset(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  handleInsertIntoTimeline(previewAsset);
                  setPreviewAsset(null);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir a Timeline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Deletion Warning Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirmación de Eliminación</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente{' '}
              <strong className="text-white">"{deleteCandidate.asset.name}"</strong>?
            </p>

            {deleteCandidate.usageCount > 0 && (
              <div className="bg-rose-950/60 border border-rose-800 p-3 rounded-xl text-[11px] text-rose-300 space-y-1">
                <span className="font-bold block">¡Atención: Recurso en uso activo!</span>
                <p>
                  Este medio está siendo utilizado actualmente por{' '}
                  <strong>{deleteCandidate.usageCount} clip(s)</strong> en la timeline o guion. Si lo eliminas, los clips quedarán sin referencia visual o de audio.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDelete(true)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                {deleteCandidate.usageCount > 0 ? 'Eliminar de todos modos' : 'Eliminar Recurso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Creation Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-200">Crear Nueva Carpeta</h3>
            <input
              type="text"
              placeholder="Nombre de la carpeta (ej. B-Roll, Entrevistas)..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCreatingFolder(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Crear Carpeta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
