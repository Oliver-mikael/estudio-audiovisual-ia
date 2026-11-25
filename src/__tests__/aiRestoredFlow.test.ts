import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEAIPackage,
  restoreProjectFromEAI
} from '../services/storage/projectBackup';
import { CentralAIEngine } from '../services/ai/aiEngine';
import { Project, NarrativeAngle, Scene } from '../types';

const activeMockDb = new Map<string, Project>();

vi.mock('../services/storage/db', () => ({
  saveProjectToStorage: vi.fn().mockImplementation(async (project: Project) => {
    activeMockDb.set(project.id, { ...project, updatedAt: Date.now() });
  }),
  getProjectFromStorage: vi.fn().mockImplementation(async (id: string) => {
    return activeMockDb.get(id) || null;
  }),
  getAllProjectsFromStorage: vi.fn().mockImplementation(async () => {
    return Array.from(activeMockDb.values());
  }),
  saveMediaAssetBlob: vi.fn().mockResolvedValue(undefined),
  getMediaAssetBlob: vi.fn().mockResolvedValue(null)
}));

describe('Auditoría Crítica de Flujo Cruzado: IA + Proyecto Restaurado (Fases 6A, 6B y 6C)', () => {

  const initialProject: Project = {
    id: 'proj-origin-cern',
    title: 'Proyecto Original CERN 1989',
    description: 'Investigación sobre la pérdida de memoria en experimentos complejos',
    createdAt: 1600000000000,
    updatedAt: 1600000100000,
    angles: [
      {
        id: 'angle-init-1',
        title: 'Ángulo CERN Primario',
        hook: '¿Por qué la física de partículas necesitaba hipertexto?',
        perspective: 'Perspectiva institucional interna',
        criticalQuestions: ['¿Quién controlaba los protocolos?'],
        alternativeApproach: 'Centralizado vs Distribuido'
      }
    ],
    sources: [
      {
        id: 'src-1',
        title: 'Propuesta Original Tim Berners-Lee 1989',
        evidenceType: 'Fact',
        license: 'Public Domain',
        notes: 'Documento archivado CERN',
        verified: true
      }
    ],
    script: {
      title: 'Guion Origen',
      summary: 'Resumen',
      targetAudience: 'General',
      tone: 'Riguroso',
      scenes: [
        {
          id: 'sc-1',
          title: 'Escena 1: El Vacío de Información',
          narrationText: 'CERN agrupaba miles de científicos con contratos de dos años que se marchaban con su conocimiento sin documentarlo...',
          visualIntent: 'Corredores vacíos y servidores apagados',
          cameraMotion: 'Zoom In',
          transition: 'Fade',
          durationSeconds: 15
        }
      ]
    },
    mediaAssets: [],
    settings: {
      fps: 30,
      resolution: { width: 1280, height: 720 },
      aspectRatio: '16:9'
    }
  };

  beforeEach(() => {
    activeMockDb.clear();
    activeMockDb.set(initialProject.id, initialProject);
  });

  it('Flujo Integral E2E: Proyecto -> IA -> Exportación .EAI -> Restauración -> IA en Proyecto Restaurado', async () => {
    const aiEngine = new CentralAIEngine();

    // 1. Invocar IA sobre el proyecto original: sugerir ángulos críticos
    const originAnglesTask = await aiEngine.executeTask<NarrativeAngle[]>({
      task: 'SUGGEST_NARRATIVE_ANGLES',
      context: aiEngine.buildContextFromProject(initialProject)
    });

    expect(originAnglesTask.success).toBe(true);
    expect(originAnglesTask.parsedData).toBeDefined();
    const parsedOriginAngles = originAnglesTask.parsedData as NarrativeAngle[];
    expect(parsedOriginAngles.length).toBeGreaterThanOrEqual(1);

    // Incorporar el nuevo ángulo al proyecto original
    const projectWithAIAngle: Project = {
      ...initialProject,
      angles: [...initialProject.angles, parsedOriginAngles[0]]
    };
    activeMockDb.set(projectWithAIAngle.id, projectWithAIAngle);

    // 2. Exportar proyecto como paquete .eai físico
    const eaiPackage = await createEAIPackage(projectWithAIAngle);
    expect(eaiPackage.checksum).toBeDefined();
    expect(eaiPackage.project.angles).toHaveLength(2); // 1 original + 1 generado por IA

    // 3. Restaurar paquete .eai como copia independiente (create_copy)
    const restoredProject = await restoreProjectFromEAI(eaiPackage, 'create_copy');

    // 4. Validar aislamiento estricto de IDs y datos
    expect(restoredProject.id).not.toBe(projectWithAIAngle.id);
    expect(restoredProject.title).toContain('(Copia importada)');
    expect(restoredProject.angles).toHaveLength(2);
    expect(restoredProject.script.scenes).toHaveLength(1);

    // 5. Inyectar el proyecto restaurado como contexto en el motor de IA
    const restoredContext = aiEngine.buildContextFromProject(restoredProject, restoredProject.script.scenes[0].id);
    expect(restoredContext.projectTitle).toBe(restoredProject.title);
    expect(restoredContext.existingScenes).toHaveLength(1);

    // 6. Ejecutar auditoría de ritmo con IA sobre la escena del proyecto restaurado
    const rhythmAudit = await aiEngine.executeTask<string[]>({
      task: 'CRITIQUE_SCRIPT',
      context: restoredContext
    });

    expect(rhythmAudit.success).toBe(true);
    expect(rhythmAudit.parsedData).toBeDefined();
    expect(rhythmAudit.rawText.length).toBeGreaterThan(10);

    // 7. Modificar escena en el proyecto restaurado tras sugerencia de IA
    const expandedScene: Scene = {
      ...restoredProject.script.scenes[0],
      narrationText: `${restoredProject.script.scenes[0].narrationText} Y así surgió la necesidad de un protocolo universal.`
    };

    const finalRestoredProject: Project = {
      ...restoredProject,
      script: {
        ...restoredProject.script,
        scenes: [expandedScene]
      }
    };
    activeMockDb.set(finalRestoredProject.id, finalRestoredProject);

    // 8. Verificar que el proyecto original NO fue contaminado ni modificado
    const untouchedOriginal = activeMockDb.get(initialProject.id);
    expect(untouchedOriginal).toBeDefined();
    expect(untouchedOriginal?.title).toBe(projectWithAIAngle.title);
    expect(untouchedOriginal?.script.scenes[0].narrationText).toBe(initialProject.script.scenes[0].narrationText);
    expect(untouchedOriginal?.script.scenes[0].narrationText).not.toContain('protocolo universal');

    // 9. Comprobar que coexisten ambos proyectos en la base de datos
    expect(activeMockDb.size).toBe(2);
  });
});
