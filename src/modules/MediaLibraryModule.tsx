// Media Library Module Component for Estudio Audiovisual Inteligente
import React, { useState } from 'react';
import { Project, MediaAsset } from '../types';
import { saveMediaAssetBlob } from '../services/storage/db';
import { FolderOpen, Upload, Trash2, Image, Music, Film, Mic } from 'lucide-react';
import { ConfirmDialog } from '../components/Modal';

interface MediaLibraryProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const MediaLibraryModule: React.FC<MediaLibraryProps> = ({ project, onUpdateProject }) => {
  const [assets, setAssets] = useState<MediaAsset[]>(project.mediaAssets || []);
  const [filter, setFilter] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [assetToDelete, setAssetToDelete] = useState<MediaAsset | null>(null);

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
        license: 'Propiedad del usuario',
        provenance: 'Carga local en cliente',
        createdAt: Date.now(),
      };

      // Save blob to IndexedDB
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

  const filteredAssets = assets.filter((a) => (filter === 'all' ? true : a.type === filter));

  // La narración es el audio asignado explícitamente o, si no hay asignación, el primer audio.
  const narrationAsset =
    assets.find((a) => a.id === project.narrationAssetId && a.type === 'audio') ??
    assets.find((a) => a.type === 'audio');

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 titulo-seccion">
            <FolderOpen className="w-5 h-5" />
            <span>Biblioteca de recursos</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Importa imágenes, locuciones y clips de video. Los archivos se guardan localmente en IndexedDB y el
            audio marcado como narración se mezcla en el video exportado.
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Narración actual: {narrationAsset ? narrationAsset.name : 'ninguna (importa un MP3 o WAV)'}
          </p>
        </div>

        <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm cursor-pointer transition-colors shadow-lg shadow-indigo-600/20">
          <Upload className="w-4 h-4" />
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

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({assets.length})
        </button>
        <button
          onClick={() => setFilter('image')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Imágenes ({assets.filter((a) => a.type === 'image').length})</span>
        </button>
        <button
          onClick={() => setFilter('audio')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'audio' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio ({assets.filter((a) => a.type === 'audio').length})</span>
        </button>
        <button
          onClick={() => setFilter('video')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'video' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Vídeos ({assets.filter((a) => a.type === 'video').length})</span>
        </button>
      </div>

      {/* Media Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
          No hay recursos subidos en esta categoría. Haz clic en "Subir Recursos Localmente" para importar archivos.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between p-3 relative group"
            >
              {/* Preview Box */}
              <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center mb-3 border border-slate-800">
                {asset.type === 'image' ? (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                ) : asset.type === 'audio' ? (
                  <div className="text-center p-2">
                    <Music className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-500 font-mono">Clip de audio</span>
                  </div>
                ) : (
                  <div className="text-center p-2">
                    <Film className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-500 font-mono">Clip de vídeo</span>
                  </div>
                )}
              </div>

              {/* Asset Info */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-200 truncate" title={asset.name}>
                  {asset.name}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{formatSize(asset.sizeBytes)}</span>
                  <span className="capitalize">{asset.type}</span>
                </div>
              </div>

              {asset.type === 'audio' && (
                <button
                  onClick={() => onUpdateProject({ ...project, narrationAssetId: asset.id })}
                  className={`mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                    narrationAsset?.id === asset.id
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-700'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Usar este audio como pista de narración del video exportado"
                >
                  <Mic className="w-3 h-3" />
                  <span>{narrationAsset?.id === asset.id ? 'Narración activa' : 'Usar como narración'}</span>
                </button>
              )}

              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 truncate" title={asset.license}>
                  {asset.license}
                </span>

                <button
                  onClick={() => setAssetToDelete(asset)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0"
                  title="Eliminar recurso"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {assetToDelete && (
        <ConfirmDialog
          title="Eliminar recurso"
          message={`Se eliminará "${assetToDelete.name}" de la biblioteca. Si estaba asignado como narración o imagen de una escena, dejará de estar disponible.`}
          confirmLabel="Eliminar recurso"
          onCancel={() => setAssetToDelete(null)}
          onConfirm={() => {
            handleDeleteAsset(assetToDelete.id);
            setAssetToDelete(null);
          }}
        />
      )}
    </div>
  );
};
