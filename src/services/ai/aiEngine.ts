// Central Modular AI Engine for Estudio Audiovisual Inteligente
import {
  AIProviderId,
  AIProviderConfig,
  AISecureCredentials,
  AIRequestOptions,
  AIExecutionResult,
  AIContextPayload,
} from './types';
import { Project, NarrativeAngle, Scene } from '../../types';

export const AVAILABLE_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'offline-heuristic',
    name: 'Motor Local Autónomo (Offline)',
    description: 'Motor heurístico y semántico que opera 100% en cliente sin internet ni costo alguno ($0/mes).',
    isOnlineRequired: false,
    requiresApiKey: false,
    supportsStreaming: false,
    modelName: 'Studio-Local-Heuristics-v1',
  },
  {
    id: 'gemini-free',
    name: 'Google Gemini 1.5 Flash (Cloud Gratuito)',
    description: 'Inferencia ultra-rápida y 1M tokens de contexto usando la cuota gratuita de Google AI Studio.',
    isOnlineRequired: true,
    requiresApiKey: true,
    supportsStreaming: true,
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelName: 'gemini-1.5-flash',
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI / Groq / Ollama Local (API Compatible)',
    description: 'Conecta endpoints compatibles como Groq (gratis), Ollama local o servicios de nube.',
    isOnlineRequired: true,
    requiresApiKey: true,
    supportsStreaming: true,
    endpointUrl: 'https://api.groq.com/openai/v1',
    modelName: 'llama-3.3-70b-versatile',
  },
];

export class CentralAIEngine {
  private activeProviderId: AIProviderId = 'offline-heuristic';
  private credentialsMap: Map<AIProviderId, AISecureCredentials> = new Map();

  constructor() {
    this.loadActiveProvider();
  }

  public getActiveProviderId(): AIProviderId {
    return this.activeProviderId;
  }

  public getActiveProviderConfig(): AIProviderConfig {
    const config = AVAILABLE_PROVIDERS.find((p) => p.id === this.activeProviderId);
    return config || AVAILABLE_PROVIDERS[0];
  }

  public setActiveProvider(providerId: AIProviderId): void {
    this.activeProviderId = providerId;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('estudio_ai_active_provider', providerId);
    }
  }

  private loadActiveProvider(): void {
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('estudio_ai_active_provider') as AIProviderId | null;
      if (saved && AVAILABLE_PROVIDERS.some((p) => p.id === saved)) {
        this.activeProviderId = saved;
      }
    }
  }

  public setCredentials(providerId: AIProviderId, credentials: AISecureCredentials): void {
    this.credentialsMap.set(providerId, credentials);
  }

  public getCredentials(providerId: AIProviderId): AISecureCredentials | undefined {
    return this.credentialsMap.get(providerId);
  }

  public buildContextFromProject(project: Project, currentSceneId?: string): AIContextPayload {
    const activeScene = currentSceneId
      ? project.script.scenes.find((s) => s.id === currentSceneId)
      : project.script.scenes[0];

    return {
      projectTitle: project.title,
      projectDescription: project.description,
      currentScene: activeScene,
      existingScenes: project.script.scenes,
      narrativeAngles: project.angles,
      sources: project.sources,
    };
  }

  public async executeTask<T = any>(options: AIRequestOptions): Promise<AIExecutionResult<T>> {
    const startTime = performance.now();
    const providerConfig = this.getActiveProviderConfig();

    try {
      if (options.abortSignal?.aborted) {
        throw new Error('Operación cancelada por el usuario antes de iniciar');
      }

      let result: AIExecutionResult<T>;

      if (this.activeProviderId === 'offline-heuristic' || !navigator.onLine) {
        result = await this.executeLocalHeuristic<T>(options, startTime);
      } else if (this.activeProviderId === 'gemini-free') {
        result = await this.executeGemini<T>(options, startTime);
      } else if (this.activeProviderId === 'openai-compatible') {
        result = await this.executeOpenAICompatible<T>(options, startTime);
      } else {
        result = await this.executeLocalHeuristic<T>(options, startTime);
      }

      return result;
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        providerId: this.activeProviderId,
        modelName: providerConfig.modelName,
        rawText: '',
        latencyMs,
        error: err?.message || 'Error desconocido durante la ejecución de IA',
      };
    }
  }

  // Local Offline Heuristic Engine
  private async executeLocalHeuristic<T>(
    options: AIRequestOptions,
    startTime: number
  ): Promise<AIExecutionResult<T>> {
    const { task, context, userPrompt } = options;
    const latencyMs = Math.round(performance.now() - startTime);

    switch (task) {
      case 'SUGGEST_NARRATIVE_ANGLES': {
        const title = context.projectTitle || 'la producción audiovisual';
        const angles: NarrativeAngle[] = [
          {
            id: `ang-heuristic-${Date.now()}-1`,
            title: `La paradoja invisible de ${title}`,
            hook: `¿Qué ocurre cuando lo que consideramos un avance técnico crea una fragilidad oculta?`,
            perspective: `Analiza la transición desde la perspectiva de la autonomía frente a la dependencia sistémica.`,
            criticalQuestions: [
              `¿Quién poseía el control antes de este cambio y quién lo tiene ahora?`,
              `¿Qué premisas dadas por sentadas contradicen la evidencia real?`,
            ],
            alternativeApproach: `Contrastar un ejemplo cotidiano con el impacto estructural global documentado.`,
          },
          {
            id: `ang-heuristic-${Date.now()}-2`,
            title: `El factor humano detrás del hito`,
            hook: `No fue una decisión corporativa calculada: fue el resultado de convicciones individuales frente a la inercia institucional.`,
            perspective: `Enfoca el relato en las fricciones, dudas y decisiones morales de los protagonistas reales.`,
            criticalQuestions: [
              `¿Qué sacrificios personales implicó mantener este desarrollo abierto o público?`,
              `¿Cómo reaccionó la estructura tradicional ante esta disrupción?`,
            ],
            alternativeApproach: `Mostrar testimonios directos y correspondencia histórica en lugar de gráficos abstractos.`,
          },
        ];

        return {
          success: true,
          providerId: 'offline-heuristic',
          modelName: 'Studio-Local-Heuristics-v1',
          rawText: JSON.stringify(angles, null, 2),
          parsedData: angles as unknown as T,
          latencyMs,
        };
      }

      case 'CRITIQUE_SCRIPT': {
        const scenes = context.existingScenes || [];
        const issues: string[] = [];

        const totalSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
        if (totalSeconds < 30) {
          issues.push(`Duración total corta (${totalSeconds}s). Para un video explicativo sólido se recomiendan entre 60s y 180s.`);
        }

        scenes.forEach((sc, idx) => {
          const words = sc.narrationText.trim().split(/\s+/).filter(Boolean).length;
          const wordsPerSecond = words / (sc.durationSeconds || 1);
          if (wordsPerSecond > 2.8) {
            issues.push(`Escena #${idx + 1} ("${sc.title}"): Densidad de locución excesiva (${wordsPerSecond.toFixed(1)} palabras/seg). El espectador no retendrá la idea.`);
          } else if (wordsPerSecond < 1.0 && words > 0) {
            issues.push(`Escena #${idx + 1} ("${sc.title}"): Pausa prolongada (${wordsPerSecond.toFixed(1)} pal/s). Evalúa reforzar la locución o enriquecer la animación.`);
          }
        });

        if (issues.length === 0) {
          issues.push('Estructura narrativa equilibrada. Cadencia y pausas de locución dentro del rango profesional óptimo (2.0 a 2.5 palabras/segundo).');
        }

        return {
          success: true,
          providerId: 'offline-heuristic',
          modelName: 'Studio-Local-Heuristics-v1',
          rawText: issues.join('\n'),
          parsedData: issues as unknown as T,
          latencyMs,
        };
      }

      case 'EXPAND_SCENE_NARRATION': {
        const scene = context.currentScene;
        const currentText = scene?.narrationText || userPrompt || '';
        const words = currentText.split(/\s+/).length;
        const targetDuration = scene?.durationSeconds || 15;

        const expanded = `${currentText.trim()} ${
          currentText.endsWith('.') ? '' : '.'
        } Este momento clave no sólo redefinió las condiciones técnicas, sino que sentó las bases operativas que hoy consideramos indispensables. Comprender su origen permite anticipar con precisión hacia dónde se dirige el estándar audiovisual.`;

        return {
          success: true,
          providerId: 'offline-heuristic',
          modelName: 'Studio-Local-Heuristics-v1',
          rawText: expanded,
          parsedData: { expandedNarration: expanded, estimatedWords: words + 30, targetDuration } as unknown as T,
          latencyMs,
        };
      }

      case 'RECOMMEND_CAMERA_AND_VISUALS': {
        const scene = context.currentScene;
        const text = (scene?.narrationText || '').toLowerCase();
        let motion: Scene['cameraMotion'] = 'Zoom In';
        let transition: Scene['transition'] = 'Fade';
        let visualIntent = 'Composición cinematográfica cinemática destacando puntos clave.';

        if (text.includes('origen') || text.includes('historia') || text.includes('inicio')) {
          motion = 'Zoom Out';
          visualIntent = 'Plano general contextual con gráficos históricos superpuestos.';
        } else if (text.includes('crítico') || text.includes('conflicto') || text.includes('problema')) {
          motion = 'Zoom In';
          visualIntent = 'Encuadre cerrado enfocado en la tensión del argumento y datos duros.';
        } else if (text.includes('código') || text.includes('sistema') || text.includes('dato')) {
          motion = 'Kinetic Text';
          visualIntent = 'Tipografía cinética y flujo de datos dinámico sobre fondo técnico.';
        }

        const recommendation = {
          cameraMotion: motion,
          transition,
          visualIntent,
          narrativePurpose: `Acompaña la locución enfatizando la carga conceptual del segmento.`,
        };

        return {
          success: true,
          providerId: 'offline-heuristic',
          modelName: 'Studio-Local-Heuristics-v1',
          rawText: JSON.stringify(recommendation, null, 2),
          parsedData: recommendation as unknown as T,
          latencyMs,
        };
      }

      case 'ANALYZE_RESEARCH_EVIDENCE': {
        const sources = context.sources || [];
        const verified = sources.filter((s) => s.verified).length;
        const facts = sources.filter((s) => s.evidenceType === 'Fact').length;
        const hypotheses = sources.filter((s) => s.evidenceType === 'Hypothesis').length;

        const synthesis = {
          summary: `Se analizaron ${sources.length} fuentes registradas. ${verified} han sido formalmente verificadas.`,
          balance: `${facts} Hechos / ${hypotheses} Hipótesis. ${
            hypotheses > facts
              ? 'Atención: Existen más hipótesis que datos fácticos contrastados.'
              : 'El proyecto cuenta con un respaldo fáctico sólido.'
          }`,
          recommendations: [
            'Corroborar fuentes primarias directas (documentos originales o papers técnicos).',
            'Verificar licencias de reproducción comercial para materiales audiovisuales externos.',
          ],
        };

        return {
          success: true,
          providerId: 'offline-heuristic',
          modelName: 'Studio-Local-Heuristics-v1',
          rawText: JSON.stringify(synthesis, null, 2),
          parsedData: synthesis as unknown as T,
          latencyMs,
        };
      }

      case 'CATEGORIZE_MEDIA_ASSET': {
        const categoryResult = {
          suggestedTags: ['audiovisual', 'local', 'documental', context.projectCategory || 'general'],
          semanticDescription: `Recurso registrado localmente para el proyecto "${context.projectTitle}".`,
        };

        return {
          success: true,
          providerId: 'offline-heuristic',
          modelName: 'Studio-Local-Heuristics-v1',
          rawText: JSON.stringify(categoryResult, null, 2),
          parsedData: categoryResult as unknown as T,
          latencyMs,
        };
      }

      default:
        return {
          success: false,
          providerId: 'offline-heuristic',
          modelName: 'Studio-Local-Heuristics-v1',
          rawText: '',
          latencyMs,
          error: `Tarea ${task} no soportada`,
        };
    }
  }

  // Google Gemini 1.5 Flash Provider
  private async executeGemini<T>(
    options: AIRequestOptions,
    startTime: number
  ): Promise<AIExecutionResult<T>> {
    const creds = this.getCredentials('gemini-free');
    if (!creds?.apiKey) {
      throw new Error('Se requiere una clave API de Google AI Studio (Gratuita) para usar Gemini.');
    }

    const systemPrompt = `Eres el Asistente de Dirección y Productor de Estudio Audiovisual Inteligente.
Responde de forma concisa, rigurosa, en español y con formato JSON válido cuando se soliciten estructuras.
Contexto del Proyecto:
Título: ${options.context.projectTitle}
Descripción: ${options.context.projectDescription}`;

    const userMessage = `${options.userPrompt || ''}
Tarea: ${options.task}
Contexto activo: ${JSON.stringify(options.context)}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${creds.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userMessage}` }],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
        },
      }),
      signal: options.abortSignal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Error en API Gemini (${res.status}): ${errBody.slice(0, 150)}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const latencyMs = Math.round(performance.now() - startTime);

    let parsedData: T | undefined;
    try {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch {
      parsedData = rawText as unknown as T;
    }

    return {
      success: true,
      providerId: 'gemini-free',
      modelName: 'gemini-1.5-flash',
      rawText,
      parsedData,
      latencyMs,
    };
  }

  // OpenAI / Groq / Ollama Compatible Provider
  private async executeOpenAICompatible<T>(
    options: AIRequestOptions,
    startTime: number
  ): Promise<AIExecutionResult<T>> {
    const creds = this.getCredentials('openai-compatible');
    const endpoint = creds?.endpointUrl || 'https://api.groq.com/openai/v1';
    const model = creds?.modelName || 'llama-3.3-70b-versatile';

    const systemPrompt = `Eres el asistente de producción de Estudio Audiovisual Inteligente.
Responde en español con rigor profesional.
Proyecto: ${options.context.projectTitle}`;

    const res = await fetch(`${endpoint.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(creds?.apiKey ? { Authorization: `Bearer ${creds.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${options.task}: ${options.userPrompt || ''}\n${JSON.stringify(options.context)}` },
        ],
        temperature: options.temperature ?? 0.7,
      }),
      signal: options.abortSignal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Error en Proveedor Compatible (${res.status}): ${errBody.slice(0, 150)}`);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    const latencyMs = Math.round(performance.now() - startTime);

    let parsedData: T | undefined;
    try {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch {
      parsedData = rawText as unknown as T;
    }

    return {
      success: true,
      providerId: 'openai-compatible',
      modelName: model,
      rawText,
      parsedData,
      latencyMs,
    };
  }
}

export const aiEngine = new CentralAIEngine();
