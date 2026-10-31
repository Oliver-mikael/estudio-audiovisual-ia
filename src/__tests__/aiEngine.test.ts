// Unit tests for Central Modular AI Engine
import { describe, it, expect } from 'vitest';
import { aiEngine } from '../services/ai/aiEngine';
import { DEMO_PROJECT } from '../data/demoProject';

describe('Central Modular AI Engine (Fase 6C)', () => {
  it('inicializa con el proveedor offline-heuristic por defecto', () => {
    const providerId = aiEngine.getActiveProviderId();
    expect(providerId).toBe('offline-heuristic');

    const config = aiEngine.getActiveProviderConfig();
    expect(config.isOnlineRequired).toBe(false);
    expect(config.requiresApiKey).toBe(false);
  });

  it('construye un payload de contexto válido a partir de un proyecto', () => {
    const context = aiEngine.buildContextFromProject(DEMO_PROJECT);
    expect(context.projectTitle).toBe(DEMO_PROJECT.title);
    expect(context.existingScenes?.length).toBe(DEMO_PROJECT.script.scenes.length);
    expect(context.narrativeAngles?.length).toBe(DEMO_PROJECT.angles.length);
    expect(context.sources?.length).toBe(DEMO_PROJECT.sources.length);
  });

  it('ejecuta la tarea SUGGEST_NARRATIVE_ANGLES de forma offline con análisis contextual', async () => {
    const context = aiEngine.buildContextFromProject(DEMO_PROJECT);
    const result = await aiEngine.executeTask({
      task: 'SUGGEST_NARRATIVE_ANGLES',
      context,
      userPrompt: 'Proponer ángulos críticos para la historia del CERN y la World Wide Web',
    });

    expect(result.success).toBe(true);
    expect(result.providerId).toBe('offline-heuristic');
    expect(Array.isArray(result.parsedData)).toBe(true);
    expect(result.parsedData.length).toBeGreaterThanOrEqual(1);
    expect(result.parsedData[0].title).toBeDefined();
    expect(result.parsedData[0].hook).toBeDefined();
  });

  it('ejecuta la auditoría CRITIQUE_SCRIPT calculando cadencia y densidad de palabras', async () => {
    const context = aiEngine.buildContextFromProject(DEMO_PROJECT);
    const result = await aiEngine.executeTask({
      task: 'CRITIQUE_SCRIPT',
      context,
    });

    expect(result.success).toBe(true);
    expect(result.providerId).toBe('offline-heuristic');
    expect(result.rawText.length).toBeGreaterThan(10);
  });

  it('expande la narración de una escena activa de forma contextual (EXPAND_SCENE_NARRATION)', async () => {
    const context = aiEngine.buildContextFromProject(DEMO_PROJECT, DEMO_PROJECT.script.scenes[0].id);
    const result = await aiEngine.executeTask({
      task: 'EXPAND_SCENE_NARRATION',
      context,
      userPrompt: 'Expandir la escena con mayor dramatismo',
    });

    expect(result.success).toBe(true);
    expect(result.parsedData?.expandedNarration).toBeDefined();
    expect(result.parsedData.expandedNarration.length).toBeGreaterThan(20);
  });

  it('recomienda movimientos de cámara y transiciones cinematográficas (RECOMMEND_CAMERA_AND_VISUALS)', async () => {
    const context = aiEngine.buildContextFromProject(DEMO_PROJECT, DEMO_PROJECT.script.scenes[0].id);
    const result = await aiEngine.executeTask({
      task: 'RECOMMEND_CAMERA_AND_VISUALS',
      context,
    });

    expect(result.success).toBe(true);
    expect(result.parsedData?.cameraMotion).toBeDefined();
    expect(result.parsedData?.transition).toBeDefined();
    expect(result.parsedData?.visualIntent).toBeDefined();
  });

  it('analiza el rigor de las evidencias y fuentes (ANALYZE_RESEARCH_EVIDENCE)', async () => {
    const context = aiEngine.buildContextFromProject(DEMO_PROJECT);
    const result = await aiEngine.executeTask({
      task: 'ANALYZE_RESEARCH_EVIDENCE',
      context,
    });

    expect(result.success).toBe(true);
    expect(result.parsedData?.summary).toBeDefined();
    expect(result.parsedData?.balance).toBeDefined();
  });

  it('permite cancelar operaciones mediante AbortController', async () => {
    const controller = new AbortController();
    controller.abort(); // Pre-aborted

    const context = aiEngine.buildContextFromProject(DEMO_PROJECT);
    const result = await aiEngine.executeTask({
      task: 'SUGGEST_NARRATIVE_ANGLES',
      context,
      abortSignal: controller.signal,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cancelada/i);
  });

  it('mantiene las credenciales seguras aisladas en memoria sin exponerlas', () => {
    aiEngine.setCredentials('gemini-free', {
      apiKey: 'test_secret_key_12345',
    });

    const creds = aiEngine.getCredentials('gemini-free');
    expect(creds?.apiKey).toBe('test_secret_key_12345');

    // Comprobamos que el engine aísla las credenciales por proveedor
    const offlineCreds = aiEngine.getCredentials('offline-heuristic');
    expect(offlineCreds).toBeUndefined();
  });
});
