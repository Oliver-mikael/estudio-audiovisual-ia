// Generación de guiones completos con la API de Gemini.
//
// La clave se guarda en los ajustes del proyecto (no está en el código) y la
// llamada se hace desde el navegador a la API REST de Google. La respuesta se
// pide en JSON y se normaliza antes de convertirla en escenas editables, para
// que un texto con formato inesperado no rompa el Taller de guion.

import { Scene } from '../types';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type ScriptTone = 'Educativo' | 'Documental' | 'Entretenimiento' | 'Historia';

export const SCRIPT_TONES: ScriptTone[] = [
  'Educativo',
  'Documental',
  'Entretenimiento',
  'Historia',
];

const TONE_GUIDE: Record<ScriptTone, string> = {
  Educativo:
    'explica un concepto con claridad, usa ejemplos cotidianos y cierra con una idea que el espectador pueda aplicar',
  Documental:
    'tono sobrio y periodístico, datos concretos, contexto y una mirada que cuestione lo evidente',
  Entretenimiento:
    'ritmo rápido y conversacional, humor ligero, comparaciones inesperadas y preguntas que inviten a comentar',
  Historia:
    'narración con épica y detalle humano, sitúa el momento histórico y conecta el pasado con el presente',
};

export interface GeneratedScene {
  title: string;
  narration: string;
  visualIntent: string;
  durationSeconds: number;
}

export interface GeneratedScript {
  title: string;
  /** Primera frase del video: curiosidad en 15 palabras o menos. */
  hook: string;
  scenes: GeneratedScene[];
  /** Cierre con llamada a la acción. */
  closing: string;
}

/** Palabras de un texto (separadas por espacios, sin contar vacíos). */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Recorta un texto a un máximo de palabras, sin cortar la última a medias. */
export function limitWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

/** Instrucción completa que se envía a Gemini (en español, con esquema fijo). */
export function buildScriptPrompt(topic: string, tone: ScriptTone): string {
  return [
    'Eres guionista de videos cortos para YouTube y redes. Escribes en español neutro, sin markdown.',
    `Tema del video: ${topic.trim()}`,
    `Tono: ${tone}. ${TONE_GUIDE[tone]}.`,
    '',
    'Estructura obligatoria:',
    '- Un gancho inicial de máximo 15 palabras: la primera frase del video y debe generar curiosidad inmediata. No empieces con "Hola a todos" ni con una definición de diccionario.',
    '- Entre 4 y 6 escenas. Cada escena lleva: título corto, narración de 2 a 4 oraciones (como se diría en voz alta) y una intención visual concreta que se pueda buscar como foto de archivo.',
    '- Un cierre de 1 a 2 oraciones con una llamada a la acción concreta (suscribirse, comentar, probar algo).',
    '- La duración sugerida de cada escena va entre 5 y 10 segundos.',
    '',
    'Devuelve SOLO un objeto JSON válido, sin bloques de código ni texto adicional, con esta forma exacta:',
    '{',
    '  "title": "título del video",',
    '  "hook": "gancho inicial de máximo 15 palabras",',
    '  "scenes": [',
    '    {',
    '      "title": "título de la escena",',
    '      "narration": "narración de 2 a 4 oraciones",',
    '      "visual_intent": "qué se ve en pantalla, en pocas palabras y buscable como foto",',
    '      "duration_seconds": 6',
    '    }',
    '  ],',
    '  "closing": "cierre con llamada a la acción"',
    '}',
  ].join('\n');
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return '';
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** Quita los bloques ```json ... ``` y el texto que rodee al objeto JSON. */
export function extractJsonPayload(raw: string): string {
  const withoutFences = raw
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('La respuesta de Gemini no contiene un objeto JSON.');
  }
  return withoutFences.slice(start, end + 1);
}

/**
 * Normaliza la respuesta del modelo: valida el gancho, las escenas y el cierre,
 * acepta nombres de campo alternativos y recorta el gancho a 15 palabras.
 */
export function parseGeneratedScript(raw: string): GeneratedScript {
  let payload: unknown;
  try {
    payload = JSON.parse(extractJsonPayload(raw));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('La respuesta de Gemini')) throw error;
    throw new Error('La respuesta de Gemini no es un JSON válido.');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('La respuesta de Gemini no es un objeto de guion.');
  }
  const record = payload as Record<string, unknown>;

  const rawScenes = Array.isArray(record.scenes)
    ? record.scenes
    : Array.isArray(record.escenas)
      ? record.escenas
      : [];
  if (rawScenes.length === 0) {
    throw new Error('La respuesta de Gemini no incluye escenas.');
  }

  const scenes: GeneratedScene[] = [];
  rawScenes.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const scene = item as Record<string, unknown>;
    const narration = firstString(scene, ['narration', 'narracion', 'narrativa', 'text']);
    if (!narration) return;
    const duration = asNumber(scene.duration_seconds ?? scene.durationSeconds ?? scene.duracion);
    scenes.push({
      title: firstString(scene, ['title', 'titulo']) || `Escena ${scenes.length + 1}`,
      narration,
      visualIntent:
        firstString(scene, ['visual_intent', 'visualIntent', 'intencion_visual', 'visual']) ||
        'Imagen de apoyo que ilustre la narración',
      durationSeconds: Math.max(2, Math.min(30, duration ?? 6)),
    });
  });

  if (scenes.length === 0) {
    throw new Error('La respuesta de Gemini no tiene escenas con narración.');
  }

  const hook = firstString(record, ['hook', 'gancho']);
  if (!hook) {
    throw new Error('La respuesta de Gemini no incluye el gancho inicial.');
  }

  return {
    title: firstString(record, ['title', 'titulo']) || 'Guion generado con IA',
    hook: limitWords(hook, 15),
    scenes,
    closing: firstString(record, ['closing', 'cierre', 'call_to_action', 'cta']),
  };
}

/** Duración sugerida a partir del número de palabras (≈ 2,6 palabras/s). */
export function durationForText(text: string, min = 3, max = 8): number {
  const seconds = countWords(text) / 2.6;
  return Math.round(Math.min(max, Math.max(min, seconds)) * 10) / 10;
}

/**
 * Convierte el guion generado en escenas editables: el gancho es la primera
 * escena (los primeros segundos del video) y el cierre la última, con la
 * llamada a la acción. Así todo queda en el Taller como escenas normales.
 */
export function generatedScriptToScenes(script: GeneratedScript): Scene[] {
  const stamp = Date.now();
  const makeScene = (
    index: number,
    title: string,
    narration: string,
    visualIntent: string,
    durationSeconds: number,
    cameraMotion: Scene['cameraMotion']
  ): Scene => ({
    id: `scene-${stamp}-${index}`,
    title,
    narrationText: narration,
    visualIntent,
    cameraMotion,
    transition: 'Fade',
    transitionDurationSeconds: 0.5,
    durationSeconds: Math.max(2, Math.min(30, durationSeconds)),
    subtitles: [],
  });

  const hookScene = makeScene(
    0,
    'Gancho',
    script.hook,
    'Primer plano impactante que ilustre el gancho',
    durationForText(script.hook, 3, 6),
    'Zoom In'
  );

  const bodyScenes = script.scenes.map((scene, index) =>
    makeScene(
      index + 1,
      scene.title,
      scene.narration,
      scene.visualIntent,
      scene.durationSeconds,
      'Static'
    )
  );

  const closingScene = script.closing
    ? [
        makeScene(
          script.scenes.length + 1,
          'Cierre',
          script.closing,
          'Plano final con el logo o la pantalla de suscripción',
          durationForText(script.closing, 3, 7),
          'Static'
        ),
      ]
    : [];

  return [hookScene, ...bodyScenes, ...closingScene];
}

function describeGeminiError(status: number, detail: string): string {
  const suffix = detail ? `: ${detail}` : '';
  if (status === 400) return `Gemini rechazó la petición (400). Revisa el modelo configurado${suffix}`;
  if (status === 401 || status === 403) {
    return `La clave de Gemini no es válida o no tiene permisos (${status})${suffix}`;
  }
  if (status === 404) return `El modelo de Gemini configurado no existe (404)${suffix}`;
  if (status === 429) return `Se agotó la cuota de Gemini para esta clave (429)${suffix}`;
  return `Gemini respondió con un error ${status}${suffix}`;
}

async function readGeminiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? '';
  } catch {
    return '';
  }
}

/** Extrae el texto de la respuesta estándar de `generateContent`. */
export function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';
  const content = (candidates[0] as { content?: { parts?: unknown } }).content;
  if (!content || !Array.isArray(content.parts)) return '';
  return content.parts
    .map((part) => (part && typeof part === 'object' ? asString((part as { text?: unknown }).text) : ''))
    .filter(Boolean)
    .join('\n');
}

export interface GenerateScriptOptions {
  apiKey: string;
  topic: string;
  tone: ScriptTone;
  model?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Llama a Gemini y devuelve el guion ya normalizado. La clave nunca se registra
 * en consola ni se envía fuera de esta petición.
 */
export async function generateScriptWithGemini(
  options: GenerateScriptOptions
): Promise<GeneratedScript> {
  const apiKey = options.apiKey.trim();
  if (!apiKey) {
    throw new Error('Falta la clave de API de Gemini. Configúrala en Ajustes del proyecto.');
  }
  const topic = options.topic.trim();
  if (!topic) throw new Error('Escribe el tema del video antes de generar el guion.');

  const model = (options.model || DEFAULT_GEMINI_MODEL).trim();
  const request = options.fetchImpl ?? fetch;
  const response = await request(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildScriptPrompt(topic, options.tone) }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(describeGeminiError(response.status, await readGeminiError(response)));
  }

  const payload: unknown = await response.json();
  const text = extractGeminiText(payload);
  if (!text) {
    throw new Error('Gemini devolvió una respuesta vacía. Prueba de nuevo o cambia de modelo.');
  }
  return parseGeneratedScript(text);
}
