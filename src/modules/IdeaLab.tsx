// Redesigned IdeaLab with Real AI Integration
import React, { useState } from 'react';
import { Project, NarrativeAngle } from '../types';
import { aiEngine } from '../services/ai/aiEngine';
import {
  Lightbulb,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  StopCircle,
} from 'lucide-react';

interface IdeaLabProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onNavigateToScript?: () => void;
}

export const IdeaLab: React.FC<IdeaLabProps> = ({
  project,
  onUpdateProject,
  onNavigateToScript,
}) => {
  const [angles, setAngles] = useState<NarrativeAngle[]>(project.angles || []);

  // Generación del guion completo con Gemini.
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<ScriptTone>('Educativo');
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [pendingScript, setPendingScript] = useState<GeneratedScript | null>(null);
  const [imageProgress, setImageProgress] = useState<string | null>(null);
  const geminiKey = (project.settings.geminiApiKey ?? '').trim();
  const pexelsKey = (project.settings.pexelsApiKey ?? '').trim();

  const applyGeneratedScript = async (script: GeneratedScript) => {
    const scenes = generatedScriptToScenes(script);
    let working: Project = {
      ...project,
      script: {
        ...project.script,
        title: script.title || project.script.title,
        summary: script.hook,
        tone: TONE_TO_SCRIPT[tone],
        scenes,
      },
    };
    onUpdateProject(working);
    setGeneratedScript(script);
    setPendingScript(null);
    setGenerationError(null);
    setGenerationNotice(`Guion cargado en el Taller: ${scenes.length} escenas editables.`);

    // Si hay clave de Pexels, se busca una imagen por escena (secuencialmente
    // para no saturar la API) y se asignan al guion generado.
    if (!pexelsKey) {
      setGenerationNotice(
        `Guion cargado en el Taller: ${scenes.length} escenas editables. Configura la clave de Pexels en Ajustes para añadir imágenes automáticamente.`
      );
      return;
    }

    let attached = 0;
    const failed: string[] = [];
    for (let index = 0; index < scenes.length; index++) {
      const scene = scenes[index];
      setImageProgress(`Buscando imagen ${index + 1} de ${scenes.length}: ${scene.title}`);
      try {
        const { asset } = await createPexelsImageAsset(scene.visualIntent || scene.title, {
          apiKey: pexelsKey,
          sceneTitle: scene.title,
        });
        working = assignImageAssetToScene(working, scene.id, asset);
        attached += 1;
      } catch {
        failed.push(scene.title);
      }
    }
    setImageProgress(null);

    if (attached > 0) onUpdateProject(working);
    const failedNote = failed.length > 0 ? ` Sin imagen: ${failed.join(', ')}.` : '';
    setGenerationNotice(
      `Guion cargado en el Taller: ${scenes.length} escenas editables. Imágenes de Pexels asignadas: ${attached}/${scenes.length}.${failedNote}`
    );
  };

  const handleGenerateScript = async () => {
    setGenerationError(null);
    setGenerationNotice(null);

    if (!geminiKey) {
      setGenerationError('Falta la clave de API de Gemini. Configúrala en Ajustes del proyecto.');
      return;
    }
    if (!topic.trim()) {
      setGenerationError('Escribe el tema del video antes de generar el guion.');
      return;
    }

    setGenerating(true);
    try {
      const script = await generateScriptWithGemini({
        apiKey: geminiKey,
        topic,
        tone,
        model: project.settings.geminiModel || DEFAULT_GEMINI_MODEL,
      });
      // No se pisa un guion existente sin confirmación.
      if ((project.script.scenes ?? []).length > 0) setPendingScript(script);
      else await applyGeneratedScript(script);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : 'No se pudo generar el guion con Gemini.'
      );
    } finally {
      setGenerating(false);
    }
  };
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [perspective, setPerspective] = useState('');
  const [questions, setQuestions] = useState('');
  const [alternative, setAlternative] = useState('');

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [aiStatus, setAiStatus] = useState<string>('');

  const handleAddAngle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hook.trim()) return;

    const newAngle: NarrativeAngle = {
      id: `ang-${Date.now()}`,
      title,
      hook,
      perspective,
      criticalQuestions: questions.split('\n').filter((q) => q.trim().length > 0),
      alternativeApproach: alternative,
    };

    const updatedAngles = [newAngle, ...angles];
    setAngles(updatedAngles);
    onUpdateProject({ ...project, angles: updatedAngles });

    setTitle('');
    setHook('');
    setPerspective('');
    setQuestions('');
    setAlternative('');
  };

  const handleDeleteAngle = (id: string) => {
    const updatedAngles = angles.filter((a) => a.id !== id);
    setAngles(updatedAngles);
    onUpdateProject({ ...project, angles: updatedAngles });
  };

  const handleGenerateAISuggestion = async () => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    setAiStatus('Invocando motor de IA con contexto del proyecto...');

    const controller = new AbortController();
    setAbortController(controller);

    const context = aiEngine.buildContextFromProject(project);

    const res = await aiEngine.executeTask<NarrativeAngle[]>({
      task: 'SUGGEST_NARRATIVE_ANGLES',
      context,
      userPrompt: `Sugiere ángulos críticos no convencionales para el documental "${project.title}".`,
      abortSignal: controller.signal,
    });

    setIsGeneratingAI(false);
    setAbortController(null);

    if (res.success && res.parsedData && Array.isArray(res.parsedData)) {
      const newAngles = [...res.parsedData, ...angles];
      setAngles(newAngles);
      onUpdateProject({ ...project, angles: newAngles });
      setAiStatus(`Generados ${res.parsedData.length} ángulos con ${res.modelName} (${res.latencyMs}ms).`);
      setTimeout(() => setAiStatus(''), 4000);
    } else {
      setAiStatus(`Error o respuesta no estructurada: ${res.error || 'Verifica el proveedor'}`);
    }
  };

  const handleCancelAI = () => {
    if (abortController) {
      abortController.abort();
      setIsGeneratingAI(false);
      setAbortController(null);
      setAiStatus('Generación cancelada por el usuario.');
    }
  };

  const handlePromoteToScene = (angle: NarrativeAngle) => {
    const newScene = {
      id: `scene-promoted-${Date.now()}`,
      title: angle.title,
      durationSeconds: 15,
      narrationText: `${angle.hook} ${angle.perspective}`,
      visualIntent: `Plano documental: ${angle.alternativeApproach || 'Contraste visual de la hipótesis'}`,
      cameraMotion: 'Zoom In' as const,
      transition: 'Fade' as const,
    };

    const updatedScenes = [...project.script.scenes, newScene];
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        scenes: updatedScenes,
      },
    });

    if (onNavigateToScript) {
      onNavigateToScript();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 titulo-seccion">
            <Lightbulb className="w-5 h-5" />
            <span>Laboratorio de Ideas & Ángulos Narrativos</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono border border-indigo-800">
              IA Contextual
            </span>
          </div>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Explora cuestionamientos críticos, evita introducciones clónicas y convierte ángulos aprobados en escenas con un solo clic.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleGenerateAISuggestion}
            disabled={isGeneratingAI}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-lg text-xs md:text-sm transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Sugerir Ángulos Críticos (IA Real)</span>
              </>
            )}
          </button>

          {isGeneratingAI && (
            <button
              onClick={handleCancelAI}
              className="p-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg"
              title="Cancelar generación"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {aiStatus && (
        <div className="px-4 py-2 bg-slate-900 border border-indigo-500/30 rounded-lg text-xs font-mono text-indigo-300">
          {aiStatus}
        </div>
      )}

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Formular Ángulo Manualmente
          </h3>

          <form onSubmit={handleAddAngle} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-400 mb-1">Título del Ángulo</label>
              <input
                type="text"
                placeholder="Ej. La perspectiva histórica de la computación local"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Gancho Narrativo (Hook)</label>
              <textarea
                rows={2}
                placeholder="Pregunta o afirmación contundente para captar atención..."
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Perspectiva / Tesis Principal</label>
              <input
                type="text"
                placeholder="Explicación del enfoque único..."
                value={perspective}
                onChange={(e) => setPerspective(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Preguntas Críticas (una por línea)</label>
              <textarea
                rows={2}
                placeholder="¿Por qué la mayoría supone X?&#10;¿Qué evidencia contradice Y?"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-400 mb-1">Enfoque Alternativo Sugerido</label>
              <input
                type="text"
                placeholder="Contra-argumento o experimento visual..."
                value={alternative}
                onChange={(e) => setAlternative(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium rounded-lg transition-colors border border-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Ángulo Narrativo</span>
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span>Ángulos Registrados ({angles.length})</span>
          </h3>

          {angles.length === 0 ? (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
              No hay ángulos registrados aún. Utiliza el botón de IA o formula uno manualmente para estructurar tu narrativa.
            </div>
          ) : (
            <div className="space-y-4">
              {angles.map((ang) => (
                <div key={ang.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative group shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono px-2 py-0.5 bg-indigo-950 text-indigo-400 rounded border border-indigo-800/50">
                        Ángulo Crítico
                      </span>
                      <h4 className="text-base font-semibold text-slate-100 mt-2">{ang.title}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePromoteToScene(ang)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/80 px-2.5 py-1 rounded transition-colors"
                        title="Convertir ángulo directamente en escena de guion"
                      >
                        <span>A Guion</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteAngle(ang.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Eliminar Ángulo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Gancho (Hook)</p>
                    <p className="text-xs text-indigo-200 font-medium italic">"{ang.hook}"</p>
                  </div>

                  <p className="text-xs text-slate-300"><strong className="text-slate-400">Perspectiva:</strong> {ang.perspective}</p>

                  {ang.criticalQuestions && ang.criticalQuestions.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Preguntas de Cuestionamiento:</span>
                      </p>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
                        {ang.criticalQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ang.alternativeApproach && (
                    <div className="text-xs text-slate-400 border-t border-slate-800/60 pt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span><strong>Enfoque Alternativo:</strong> {ang.alternativeApproach}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
