// Redesigned ResearchModule with AI Evidence Analysis
import React, { useState } from 'react';
import { Project, SourceReference } from '../types';
import { aiEngine } from '../services/ai/aiEngine';
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface ResearchProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const ResearchModule: React.FC<ResearchProps> = ({ project, onUpdateProject }) => {
  const [sources, setSources] = useState<SourceReference[]>(project.sources || []);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [evidenceType, setEvidenceType] = useState<SourceReference['evidenceType']>('Fact');
  const [license, setLicense] = useState<SourceReference['license']>('CC-BY');

  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSource: SourceReference = {
      id: `src-${Date.now()}`,
      title,
      author: author || undefined,
      url: url || undefined,
      notes: notes || '',
      evidenceType,
      license,
      verified: evidenceType === 'Fact',
    };

    const updated = [newSource, ...sources];
    setSources(updated);
    onUpdateProject({ ...project, sources: updated });

    setTitle('');
    setAuthor('');
    setUrl('');
    setNotes('');
  };

  const handleDeleteSource = (id: string) => {
    const updated = sources.filter((s) => s.id !== id);
    setSources(updated);
    onUpdateProject({ ...project, sources: updated });
  };

  const toggleVerified = (id: string) => {
    const updated = sources.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s));
    setSources(updated);
    onUpdateProject({ ...project, sources: updated });
  };

  const handleRunAIAnalysis = async () => {
    if (isAnalyzingAI) return;
    setIsAnalyzingAI(true);
    setAiAnalysisResult(null);

    const context = aiEngine.buildContextFromProject(project);
    const res = await aiEngine.executeTask({
      task: 'ANALYZE_RESEARCH_EVIDENCE',
      context,
      userPrompt: 'Analiza el rigor de las fuentes y el balance entre hechos e hipótesis.',
    });

    setIsAnalyzingAI(false);
    if (res.success && res.parsedData) {
      setAiAnalysisResult(res.parsedData);
    }
  };

  const getEvidenceBadge = (type: SourceReference['evidenceType']) => {
    switch (type) {
      case 'Fact':
        return <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs font-mono">Dato / Hecho</span>;
      case 'Hypothesis':
        return <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded text-xs font-mono">Hipótesis</span>;
      case 'Interpretation':
        return <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded text-xs font-mono">Interpretación</span>;
      case 'Debunked':
        return <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 rounded text-xs font-mono">Refutado</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <Search className="w-5 h-5" />
            <span>Matriz de Investigación, Fuentes y Verificación</span>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Diferencia hechos comprobados de hipótesis y asegura que las afirmaciones tengan sustento documental.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <span>Fuentes: <strong>{sources.length}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Verificadas: {sources.filter((s) => s.verified).length}</span>
          </div>

          <button
            onClick={handleRunAIAnalysis}
            disabled={isAnalyzingAI}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {isAnalyzingAI ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Auditar Fuentes (IA)</span>
          </button>
        </div>
      </div>

      {/* AI Analysis Card */}
      {aiAnalysisResult && (
        <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 space-y-2 shadow-lg text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-semibold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Diagnóstico de Fuentes & Rigor de Evidencias (IA)</span>
            </h4>
            <button
              onClick={() => setAiAnalysisResult(null)}
              className="text-slate-400 hover:text-slate-200 text-[10px]"
            >
              Cerrar
            </button>
          </div>
          <p className="text-slate-200">{aiAnalysisResult.summary}</p>
          <p className="text-indigo-300 font-mono text-[11px]">{aiAnalysisResult.balance}</p>
          {aiAnalysisResult.recommendations && (
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 pt-1">
              {aiAnalysisResult.recommendations.map((rec: string, i: number) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Registrar Nueva Fuente / Evidencia
          </h3>

          <form onSubmit={handleAddSource} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-400 mb-1">Título de la Fuente / Estudio</label>
              <input
                type="text"
                placeholder="Ej. CERN Technical Report 1991"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-400 mb-1">Tipo de Evidencia</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as SourceReference['evidenceType'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Fact">Hecho / Dato</option>
                  <option value="Interpretation">Interpretación</option>
                  <option value="Hypothesis">Hipótesis</option>
                  <option value="Debunked">Refutado</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-400 mb-1">Licencia de Uso</label>
                <select
                  value={license}
                  onChange={(e) => setLicense(e.target.value as SourceReference['license'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="CC-BY">CC-BY</option>
                  <option value="CC-BY-SA">CC-BY-SA</option>
                  <option value="Public Domain">Dominio Público</option>
                  <option value="Fair Use">Uso Justo (Fair Use)</option>
                  <option value="Custom / Owned">Propio / Autorizado</option>
                  <option value="Unverified">Sin Verificar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Autor / Organización</label>
              <input
                type="text"
                placeholder="Ej. Tim Berners-Lee / CERN"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">URL / Enlace de Verificación</label>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Citas y Notas de Respaldo</label>
              <textarea
                rows={3}
                placeholder="Extracto o hallazgo clave de la investigación..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Fuente de Investigación</span>
            </button>
          </form>
        </div>

        {/* Sources List Column */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Fuentes Registradas ({sources.length})
          </h3>

          {sources.length === 0 ? (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
              No se han registrado fuentes todavía. Agrega referencias para respaldar tu guion con evidencia real.
            </div>
          ) : (
            <div className="space-y-3.5">
              {sources.map((src) => (
                <div key={src.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getEvidenceBadge(src.evidenceType)}
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono text-[11px]">
                          {src.license}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100">{src.title}</h4>
                      {src.author && <p className="text-[11px] text-slate-400">Autor: {src.author}</p>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleVerified(src.id)}
                        className={`p-1.5 rounded transition-colors ${
                          src.verified
                            ? 'text-emerald-400 hover:bg-emerald-950/50'
                            : 'text-amber-400 hover:bg-amber-950/50'
                        }`}
                        title={src.verified ? 'Verificado' : 'Sin verificar'}
                      >
                        {src.verified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Eliminar fuente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {src.notes && (
                    <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                      {src.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    {src.url ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                      >
                        <span>Ver fuente original</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="italic text-slate-500">Sin enlace externo</span>
                    )}

                    <span className="flex items-center gap-1">
                      {src.verified ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{src.verified ? 'Verificado' : 'Pendiente'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
