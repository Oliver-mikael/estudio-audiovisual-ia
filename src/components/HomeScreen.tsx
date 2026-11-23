// Pantalla de inicio: nombre de la app, creación de proyecto y lista de
// proyectos guardados en IndexedDB.
import React, { useState } from 'react';
import { Project } from '../types';
import { ConfirmDialog } from './Modal';
import { STYLE_TEMPLATES, StyleTemplateId } from '../data/styleTemplates';
import { Clock, Film, FolderOpen, Pencil, Plus, Trash2, Check, X, Palette } from 'lucide-react';

interface HomeScreenProps {
  projects: Project[];
  onCreateProject: (title: string, templateId?: StyleTemplateId | null) => void;
  onOpenProject: (id: string) => void;
  onRenameProject: (id: string, title: string) => void;
  onDeleteProject: (id: string) => void;
}

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

const projectDuration = (project: Project) =>
  project.script.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

export const HomeScreen: React.FC<HomeScreenProps> = ({
  projects,
  onCreateProject,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
}) => {
  const [isCreating, setIsCreating] = useState(projects.length === 0);
  const [newTitle, setNewTitle] = useState('');
  const [templateId, setTemplateId] = useState<StyleTemplateId | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim() || 'Proyecto sin título';
    onCreateProject(title, templateId);
    setNewTitle('');
    setTemplateId(null);
    setIsCreating(false);
  };

  const startRename = (project: Project) => {
    setRenamingId(project.id);
    setRenameValue(project.title);
  };

  const submitRename = (id: string) => {
    const title = renameValue.trim();
    if (title) onRenameProject(id, title);
    setRenamingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Cabecera de la app */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight">Estudio Audiovisual Inteligente</h1>
              <p className="text-sm text-slate-400">
                Investigación, guion, storyboard y exportación de video con narración, todo local en tu navegador.
              </p>
            </div>
          </div>
        </header>

        {/* Crear proyecto */}
        <section className="card space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="titulo-seccion">Tus proyectos</h2>
            {!isCreating && (
              <button onClick={() => setIsCreating(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>Nuevo proyecto</span>
              </button>
            )}
          </div>

          {isCreating && (
            <form onSubmit={submitCreate} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1 space-y-1">
                <label htmlFor="new-project-title" className="block text-slate-400">
                  Nombre del proyecto
                </label>
                <input
                  id="new-project-title"
                  autoFocus
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Ej. Historia de la primera página web"
                  className="campo"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  <Check className="w-4 h-4" />
                  <span>Crear proyecto</span>
                </button>
                {projects.length > 0 && (
                  <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">
                    Cancelar
                  </button>
                )}
              </div>
              </div>

              {/* Plantillas de estilo (fase 30): se aplican al crear el proyecto. */}
              <fieldset className="border-t border-slate-800 pt-3 space-y-2">
                <legend className="etiqueta flex items-center gap-1.5 pb-1">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span>Plantilla de estilo</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <button
                    type="button"
                    data-testid="style-template-none"
                    aria-pressed={templateId === null}
                    onClick={() => setTemplateId(null)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      templateId === null
                        ? 'border-indigo-500 bg-indigo-950/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-100">Sin plantilla</span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      Ajustes por defecto, sin tipografía ni colores predefinidos.
                    </span>
                  </button>
                  {STYLE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      data-testid={`style-template-${template.id}`}
                      aria-pressed={templateId === template.id}
                      onClick={() => setTemplateId(template.id)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        templateId === template.id
                          ? 'border-indigo-500 bg-indigo-950/40'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-slate-100">
                        {template.name}
                      </span>
                      <span className="block text-xs text-slate-400 mt-0.5">
                        {template.description}
                      </span>
                      <span className="block text-[11px] font-mono text-indigo-300 mt-1">
                        {template.summary}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Configura tipografía, color de subtítulos, gancho, categoría de música y transición.
                  Puedes cambiar cualquiera después en el proyecto.
                </p>
              </fieldset>
            </form>
          )}
        </section>

        {/* Lista de proyectos guardados */}
        {projects.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-400">
            Todavía no hay proyectos guardados. Crea el primero con el formulario de arriba.
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => {
              const isRenaming = renamingId === project.id;
              const duration = projectDuration(project);

              return (
                <li key={project.id} className="card space-y-3">
                  {isRenaming ? (
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                      <div className="flex-1 space-y-1">
                        <label htmlFor={`rename-${project.id}`} className="block text-slate-400">
                          Nuevo nombre
                        </label>
                        <input
                          id={`rename-${project.id}`}
                          autoFocus
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          className="campo"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => submitRename(project.id)} className="btn-primary">
                          <Check className="w-4 h-4" />
                          <span>Guardar</span>
                        </button>
                        <button onClick={() => setRenamingId(null)} className="btn-secondary">
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        onClick={() => onOpenProject(project.id)}
                        className="text-left flex-1 min-w-0 space-y-1"
                        title="Abrir proyecto"
                      >
                        <h3 className="text-[16px] font-semibold text-slate-100 truncate">{project.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <FolderOpen className="w-4 h-4" />
                            {project.script.scenes.length} escena(s)
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {duration} s
                          </span>
                          <span>Actualizado: {formatDate(project.updatedAt)}</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => onOpenProject(project.id)} className="btn-primary">
                          Abrir
                        </button>
                        <button onClick={() => startRename(project)} className="btn-secondary" title="Renombrar">
                          <Pencil className="w-4 h-4" />
                          <span>Renombrar</span>
                        </button>
                        <button
                          onClick={() => setDeletingProject(project)}
                          className="btn-secondary text-rose-300 hover:text-rose-200"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {deletingProject && (
        <ConfirmDialog
          title="Eliminar proyecto"
          message={`Se eliminará "${deletingProject.title}" del almacenamiento local. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar proyecto"
          onCancel={() => setDeletingProject(null)}
          onConfirm={() => {
            onDeleteProject(deletingProject.id);
            setDeletingProject(null);
          }}
        />
      )}
    </div>
  );
};
