// Idea Lab Module Component
import React, { useState } from 'react';
import { Project, NarrativeAngle } from '../types';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  DEFAULT_GEMINI_MODEL,
  GeneratedScript,
  SCRIPT_TONES,
  ScriptTone,
  generateScriptWithGemini,
  generatedScriptToScenes,
} from '../engine/gemini';
import { ConfirmDialog } from '../components/Modal';

interface IdeaLabProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  /** Abre el Taller de guion con las escenas generadas. */
  onGoToScript?: () => void;
  /** Abre los ajustes para configurar la clave de Gemini. */
  onOpenSettings?: () => void;
}

const TONE_TO_SCRIPT: Record<ScriptTone, Project['script']['tone']> = {
  Educativo: 'Divulgativo',
  Documental: 'Riguroso',
  Entretenimiento: 'Dramático',
  Historia: 'Riguroso',
};

export const IdeaLab: React.FC<IdeaLabProps> = ({
  project,
  onUpdateProject,
  onGoToScript,
  onOpenSettings,
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
  const geminiKey = (project.settings.geminiApiKey ?? '').trim();

  const applyGeneratedScript = (script: GeneratedScript) => {
    const scenes = generatedScriptToScenes(script);
    onUpdateProject({
      ...project,
      script: {
        ...project.script,
        title: script.title || project.script.title,
        summary: script.hook,
        tone: TONE_TO_SCRIPT[tone],
        scenes,
      },
    });
    setGeneratedScript(script);
    setPendingScript(null);
    setGenerationError(null);
    setGenerationNotice(`Guion cargado en el Taller: ${scenes.length} escenas editables.`);
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
      else applyGeneratedScript(script);
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

  const handleAddAngle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !hook.trim()) return;

    const newAngle: NarrativeAngle = {
      id: `ang-${Date.now()}`,
      title: title.trim(),
      hook: hook.trim(),
      perspective: perspective.trim() || 'Enfoque general',
      criticalQuestions: questions ? questions.split('\n').filter((q) => q.trim()) : [],
      alternativeApproach: alternative.trim() || 'Perspectiva estándar',
    };

    const updatedAngles = [newAngle, ...angles];
    setAngles(updatedAngles);
    onUpdateProject({ ...project, angles: updatedAngles });

    // Reset form
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

  const handleGenerateAISugestion = () => {
    const suggestions: NarrativeAngle[] = [
      {
        id: `ang-ai-${Date.now()}`,
        title: 'El Paradigma Invertido',
        hook: '¿Y si la nube no fuera el destino final sino solo una fase de transición?',
        perspective: 'Cuestiona la premisa de que los servidores remotos son más eficientes.',
        criticalQuestions: [
          '¿Qué ocurre con la latencia cuando millones de dispositivos soliciten IA al mismo tiempo?',
          '¿Cómo afecta la soberanía de datos a las leyes locales?'
        ],
        alternativeApproach: 'Demostrar mediante benchmark directo cómo un modelo local responde en milisegundos sin conexión.'
      },
      {
        id: `ang-ai-2-${Date.now()}`,
        title: 'Análisis de Coste Energético y Ecológico',
        hook: 'El precio oculto de cada consulta en la nube.',
        perspective: 'Enfoque en la sostenibilidad ambiental del hardware personal versus centros de cómputo masivos.',
        criticalQuestions: [
          '¿Cuántos litros de agua consume enfriar un servidor por cada generación de video?',
          '¿Es el cómputo distribuido más respetuoso con el medio ambiente?'
        ],
        alternativeApproach: 'Presentar una comparativa visual entre el consumo de un teléfono vs un data center.'
      }
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    const updatedAngles = [randomSuggestion, ...angles];
    setAngles(updatedAngles);
    onUpdateProject({ ...project, angles: updatedAngles });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 titulo-seccion">
            <Lightbulb className="w-5 h-5" />
            <span>Laboratorio de ideas y ángulos narrativos</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Explora cuestionamientos críticos, evita introducciones clónicas y descubre enfoques originales para tus producciones.
          </p>
        </div>

        <button
          onClick={handleGenerateAISugestion}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>Sugerir ángulo crítico</span>
        </button>
      </div>

      {/* Generación del guion completo con Gemini */}
      <div className="bg-slate-900 border border-indigo-900/50 rounded-xl p-5 space-y-4" data-testid="gemini-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-md font-semibold text-slate-100 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-400" />
              <span>Generar guion completo con IA</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Gemini escribe un gancho, entre 4 y 6 escenas con narración e intención visual, y un cierre con
              llamada a la acción. El resultado se carga como escenas editables en el Taller de guion.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {project.settings.geminiModel || DEFAULT_GEMINI_MODEL}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 space-y-1">
            <label htmlFor="gemini-topic" className="etiqueta">
              Tema del video
            </label>
            <input
              id="gemini-topic"
              data-testid="gemini-topic"
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Ej. Por qué los minerales de tu celular viajan 40.000 km"
              className="campo"
            />
          </div>
          <div className="md:col-span-4 space-y-1">
            <label htmlFor="gemini-tone" className="etiqueta">
              Tono
            </label>
            <select
              id="gemini-tone"
              data-testid="gemini-tone"
              value={tone}
              onChange={(event) => setTone(event.target.value as ScriptTone)}
              className="campo"
            >
              {SCRIPT_TONES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!geminiKey ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-800/60 bg-amber-950/40 p-3">
            <p className="text-sm text-amber-200 flex items-start gap-2">
              <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Configura tu clave de API de Gemini en Ajustes del proyecto para generar guiones. La clave se
                guarda solo en este proyecto, en el navegador.
              </span>
            </p>
            {onOpenSettings && (
              <button onClick={onOpenSettings} className="btn-secondary text-xs shrink-0">
                Abrir Ajustes
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-emerald-300/80 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clave de Gemini configurada en este proyecto.</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              void handleGenerateScript();
            }}
            disabled={generating || !geminiKey}
            data-testid="gemini-generate"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium rounded-lg text-sm transition-colors"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{generating ? 'Generando guion...' : 'Generar guion'}</span>
          </button>
          {generatedScript && onGoToScript && (
            <button onClick={onGoToScript} data-testid="gemini-open-script" className="btn-secondary">
              <ArrowRight className="w-4 h-4" />
              <span>Ver en el Taller de guion</span>
            </button>
          )}
        </div>

        {generationNotice && (
          <p data-testid="gemini-status" className="text-sm text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{generationNotice}</span>
          </p>
        )}
        {generationError && (
          <p data-testid="gemini-status" className="text-sm text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{generationError}</span>
          </p>
        )}

        {generatedScript && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Último guion generado</p>
            <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">Gancho</p>
              <p data-testid="generated-hook" className="text-sm text-indigo-100 font-medium">
                “{generatedScript.hook}”
              </p>
            </div>
            <ol className="space-y-2" data-testid="generated-scenes">
              {generatedScript.scenes.map((scene, index) => (
                <li key={`${scene.title}-${index}`} className="text-sm text-slate-300">
                  <span className="font-mono text-xs text-slate-500 mr-2">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-semibold text-slate-100">{scene.title}</span>
                  <span className="text-xs text-slate-500 font-mono"> · {scene.durationSeconds}s</span>
                  <p className="text-xs text-slate-400 mt-0.5">{scene.narration}</p>
                  <p className="text-[11px] text-indigo-300/70 mt-0.5">Visual: {scene.visualIntent}</p>
                </li>
              ))}
            </ol>
            {generatedScript.closing && (
              <div className="border-t border-slate-800 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                  Cierre con llamada a la acción
                </p>
                <p className="text-sm text-slate-200">{generatedScript.closing}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {pendingScript && (
        <ConfirmDialog
          title="Reemplazar el guion actual"
          message={`El proyecto ya tiene ${project.script.scenes.length} escena(s). El guion generado las reemplazará por ${pendingScript.scenes.length + 2} escenas nuevas (gancho, cuerpo y cierre). El cambio se puede deshacer con Ctrl+Z.`}
          confirmLabel="Reemplazar guion"
          onCancel={() => setPendingScript(null)}
          onConfirm={() => applyGeneratedScript(pendingScript)}
        />
      )}

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-md font-semibold text-slate-200 border-b border-slate-800 pb-3">
            Formular Nuevo Ángulo
          </h3>

          <form onSubmit={handleAddAngle} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Título del Ángulo</label>
              <input
                type="text"
                placeholder="Ej. La perspectiva histórica de la computación local"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Gancho narrativo</label>
              <textarea
                rows={2}
                placeholder="Pregunta o afirmación contundente para captar atención..."
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Perspectiva / Tesis Principal</label>
              <input
                type="text"
                placeholder="Explicación del enfoque único..."
                value={perspective}
                onChange={(e) => setPerspective(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Preguntas Críticas (una por línea)</label>
              <textarea
                rows={2}
                placeholder="¿Por qué la mayoría supone X?&#10;¿Qué evidencia contradice Y?"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Enfoque Alternativo Sugerido</label>
              <input
                type="text"
                placeholder="Contra-argumento o experimento visual..."
                value={alternative}
                onChange={(e) => setAlternative(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium rounded-lg text-sm transition-colors border border-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Ángulo Narrativo</span>
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-md font-semibold text-slate-200 flex items-center justify-between">
            <span>Ángulos Registrados ({angles.length})</span>
          </h3>

          {angles.length === 0 ? (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500">
              No hay ángulos narrativos registrados aún. Crea uno manualmente o solicita una sugerencia de IA.
            </div>
          ) : (
            <div className="space-y-4">
              {angles.map((ang) => (
                <div key={ang.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative group">
                  <div className="flex items-start justify-between pr-8">
                    <div>
                      <span className="text-xs font-mono px-2 py-0.5 bg-indigo-950 text-indigo-400 rounded border border-indigo-800/50">
                        Ángulo Crítico
                      </span>
                      <h4 className="text-base font-semibold text-slate-100 mt-2">{ang.title}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteAngle(ang.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Eliminar Ángulo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Gancho</p>
                    <p className="text-sm text-indigo-200 font-medium italic">"{ang.hook}"</p>
                  </div>

                  <p className="text-sm text-slate-300"><strong className="text-slate-400">Perspectiva:</strong> {ang.perspective}</p>

                  {ang.criticalQuestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-1">
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
