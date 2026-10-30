// Idea Lab Module Component
import React, { useState } from 'react';
import { Project, NarrativeAngle } from '../types';
import { Lightbulb, Plus, Trash2, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface IdeaLabProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export const IdeaLab: React.FC<IdeaLabProps> = ({ project, onUpdateProject }) => {
  const [angles, setAngles] = useState<NarrativeAngle[]>(project.angles || []);
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
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-lg">
            <Lightbulb className="w-5 h-5" />
            <span>Laboratorio de Ideas & Ángulos Narrativos</span>
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
          <span>Sugerir Ángulo Crítico (IA)</span>
        </button>
      </div>

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
              <label className="block text-xs font-medium text-slate-400 mb-1">Gancho Narrativo (Hook)</label>
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
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Gancho (Hook)</p>
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
