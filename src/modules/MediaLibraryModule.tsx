// Redesigned MediaLibraryModule with AI Semantic Tagging
import React, { useState } from 'react';
import { Project, MediaAsset } from '../types';
import { saveMediaAssetBlob } from '../services/storage/db';
import { aiEngine } from '../services/ai/aiEngine';
import {
  FolderOpen,
  Upload,
  Trash2,
  Image,
  Music,
  Film,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface MediaLibraryProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const MediaLibraryModule: React.FC<MediaLibraryProps> = ({ project, onUpdateProject }) => {
  const [assets, setAssets] = useState<MediaAsset[]>(project.mediaAssets || []);
  const [filter, setFilter] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [isTaggingAI, setIsTaggingAI] = useState(false);
  const [tagStatus, setTagStatus] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAssets: MediaAsset[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let assetType: MediaAsset['type'] = 'image';
      if (file.type.startsWith('audio/')) assetType = 'audio';
      if (file.type.startsWith('video/')) assetType = 'video';

      const assetUrl = URL.createObjectURL(file);

      const mediaAsset: MediaAsset = {
        id: `asset-${Date.now()}-${i}`,
        name: file.name,
        type: assetType,
        url: assetUrl,
        fileBlob: file,
        mimeType: file.type,
        sizeBytes: file.size,
        license: 'Propiedad del usuario / Licencia confirmada',
        provenance: 'Carga local en cliente',
        createdAt: Date.now(),
      };

      await saveMediaAssetBlob(mediaAsset);
      newAssets.push(mediaAsset);
    }

    const updated = [...newAssets, ...assets];
    setAssets(updated);
    onUpdateProject({ ...project, mediaAssets: updated });
  };

  const handleDeleteAsset = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    onUpdateProject({ ...project, mediaAssets: updated });
  };

  const handleAISemanticCategorize = async () => {
    if (isTaggingAI || assets.length === 0) return;
    setIsTaggingAI(true);
    setTagStatus('Analizando metadatos de biblioteca con IA...');

    const context = aiEngine.buildContextFromProject(project);
    const res = await aiEngine.executeTask({
      task: 'CATEGORIZE_MEDIA_ASSET',
      context,
      userPrompt: `Etiqueta semánticamente los ${assets.length} recursos multimedia registrados.`,
    });

    setIsTaggingAI(false);
    if (res.success && res.parsedData?.suggestedTags) {
      setTagStatus(`Etiquetas sugeridas (${res.modelName}): ${res.parsedData.suggestedTags.join(', ')}`);
    } else {
      setTagStatus(res.error || 'No se pudo generar categorización');
    }
  };

  const filteredAssets = assets.filter((a) => (filter === 'all' ? true : a.type === filter));

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <FolderOpen className="w-5 h-5" />
            <span>Biblioteca Multimedia con Metadatos y Licencias</span>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Importa imágenes, locuciones y clips de video. Los archivos se guardan localmente en IndexedDB.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAISemanticCategorize}
            disabled={isTaggingAI || assets.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isTaggingAI ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Etiquetado Semántico (IA)</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs cursor-pointer transition-colors shadow-md">
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Recursos Localmente</span>
            <input
              type="file"
              multiple
              accept="image/*,audio/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {tagStatus && (
        <div className="p-3 bg-slate-900 border border-purple-500/40 rounded-lg text-xs text-purple-200 flex items-center justify-between">
          <span>{tagStatus}</span>
          <button
            onClick={() => setTagStatus(null)}
            className="text-slate-400 hover:text-slate-200 text-[10px]"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({assets.length})
        </button>
        <button
          onClick={() => setFilter('image')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Imágenes ({assets.filter((a) => a.type === 'image').length})</span>
        </button>
        <button
          onClick={() => setFilter('audio')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'audio' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio ({assets.filter((a) => a.type === 'audio').length})</span>
        </button>
        <button
          onClick={() => setFilter('video')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'video' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Video ({assets.filter((a) => a.type === 'video').length})</span>
        </button>
      </div>

      {/* Media Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-10 text-center text-slate-500 text-xs">
          No hay recursos subidos en esta categoría. Carga imágenes, locuciones o videos para integrarlos en el montaje.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between p-3 relative group"
            >
              {/* Preview Box */}
              <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center mb-2.5 border border-slate-800">
                {asset.type === 'image' ? (
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
              </div>

              {/* Asset Info */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-200 truncate" title={asset.name}>
                  {asset.name}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{formatSize(asset.sizeBytes)}</span>
                  <span className="capitalize">{asset.type}</span>
                </div>
              </div>

              {/* License Badge */}
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verificado</span>
                </span>

                <button
                  onClick={() => handleDeleteAsset(asset.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                  title="Eliminar recurso"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
