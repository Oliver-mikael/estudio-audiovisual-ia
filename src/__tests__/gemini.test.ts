import { describe, expect, it, vi } from 'vitest';
import {
  buildScriptPrompt,
  countWords,
  durationForText,
  extractGeminiText,
  extractJsonPayload,
  generatedScriptToScenes,
  limitWords,
  parseGeneratedScript,
} from '../engine/gemini';

const SAMPLE = {
  title: 'El costo oculto de tu celular',
  hook: 'Tu celular guarda un secreto que nadie te contó cuando lo compraste.',
  scenes: [
    {
      title: 'El mineral invisible',
      narration: 'Cada teléfono lleva minerales extraídos a miles de kilómetros. Su rastro se pierde antes de llegar a la fábrica.',
      visual_intent: 'mina a cielo abierto con excavadoras',
      duration_seconds: 7,
    },
    {
      title: 'La ruta del envío',
      narration: 'El trayecto suma cientos de vuelos y barcos. Cada escala deja una huella que no aparece en la factura.',
      visual_intent: 'buque de carga en el puerto al amanecer',
      duration_seconds: 8,
    },
    {
      title: 'Lo que puedes hacer',
      narration: 'Alargar la vida del teléfono reduce esa huella casi a la mitad. Reparar es más barato que reemplazar.',
      visual_intent: 'manos reparando un teléfono con herramientas',
      duration_seconds: 6,
    },
    {
      title: 'La pregunta final',
      narration: 'La próxima vez que cambies de teléfono, piensa qué estás comprando además del aparato.',
      visual_intent: 'persona mirando su teléfono en una calle concurrida',
      duration_seconds: 5,
    },
  ],
  closing: 'Si te sirvió, suscríbete y cuéntame en los comentarios cuánto tiempo llevas con tu teléfono.',
};

describe('gemini: prompt y utilidades', () => {
  it('incluye el tema, el tono y el esquema JSON obligatorio', () => {
    const prompt = buildScriptPrompt('minerales de los celulares', 'Documental');
    expect(prompt).toContain('minerales de los celulares');
    expect(prompt).toContain('Documental');
    expect(prompt).toContain('Entre 4 y 6 escenas');
    expect(prompt).toContain('15 palabras');
    expect(prompt).toContain('"visual_intent"');
    expect(prompt).toContain('llamada a la acción');
  });

  it('recorta el gancho a 15 palabras y cuenta palabras', () => {
    const long = Array.from({ length: 20 }, (_, i) => `palabra${i + 1}`).join(' ');
    expect(countWords(long)).toBe(20);
    expect(countWords(limitWords(long, 15))).toBe(15);
  });

  it('estima la duración desde las palabras con topes', () => {
    expect(durationForText('una', 3, 8)).toBe(3);
    expect(durationForText(Array.from({ length: 100 }, () => 'x').join(' '), 3, 8)).toBe(8);
  });
});

describe('gemini: lectura de la respuesta', () => {
  it('acepta JSON envuelto en un bloque de código', () => {
    const raw = '```json\n' + JSON.stringify(SAMPLE) + '\n```';
    expect(extractJsonPayload(raw)).toBe(JSON.stringify(SAMPLE));
    expect(parseGeneratedScript(raw).scenes).toHaveLength(4);
  });

  it('normaliza campos alternativos, duraciones y el gancho', () => {
    const parsed = parseGeneratedScript(
      JSON.stringify({
        titulo: 'Prueba',
        gancho: Array.from({ length: 18 }, (_, i) => `p${i + 1}`).join(' '),
        escenas: [
          { titulo: 'Uno', narracion: 'Texto de la escena.', intencion_visual: 'foto', duracion: '9' },
        ],
        cierre: 'Suscríbete.',
      })
    );
    expect(parsed.title).toBe('Prueba');
    expect(parsed.scenes[0]).toMatchObject({
      title: 'Uno',
      narration: 'Texto de la escena.',
      visualIntent: 'foto',
      durationSeconds: 9,
    });
    expect(countWords(parsed.hook)).toBe(15);
    expect(parsed.closing).toBe('Suscríbete.');
  });

  it('falla con un mensaje claro si no hay JSON o no hay escenas', () => {
    expect(() => parseGeneratedScript('sin json')).toThrow(/JSON/);
    expect(() =>
      parseGeneratedScript(JSON.stringify({ hook: 'gancho', scenes: [], closing: 'x' }))
    ).toThrow(/escenas/);
    expect(() =>
      parseGeneratedScript(JSON.stringify({ scenes: [SAMPLE.scenes[0]], closing: 'x' }))
    ).toThrow(/gancho/);
  });

  it('extrae el texto de la respuesta de generateContent', () => {
    expect(
      extractGeminiText({ candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }] })
    ).toBe('{"a":1}');
    expect(extractGeminiText({ candidates: [] })).toBe('');
  });
});

describe('gemini: guion a escenas editables', () => {
  it('crea escena de gancho, escenas del guion y cierre, con ids únicos', () => {
    const scenes = generatedScriptToScenes(parseGeneratedScript(JSON.stringify(SAMPLE)));
    expect(scenes).toHaveLength(6);
    expect(scenes[0].title).toBe('Gancho');
    expect(scenes[0].narrationText).toBe(SAMPLE.hook);
    expect(scenes.slice(1, 5).map((scene) => scene.title)).toEqual(
      SAMPLE.scenes.map((scene) => scene.title)
    );
    expect(scenes[5].title).toBe('Cierre');
    expect(scenes[5].narrationText).toBe(SAMPLE.closing);
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(scenes.length);
    scenes.forEach((scene) => {
      expect(scene.durationSeconds).toBeGreaterThanOrEqual(2);
      expect(scene.durationSeconds).toBeLessThanOrEqual(30);
      expect(scene.subtitles).toEqual([]);
    });
  });

  it('omite la escena de cierre si el modelo no la devuelve', () => {
    const scenes = generatedScriptToScenes({
      title: 't',
      hook: 'Un gancho breve',
      scenes: SAMPLE.scenes.slice(0, 4).map((scene) => ({
        title: scene.title,
        narration: scene.narration,
        visualIntent: scene.visual_intent,
        durationSeconds: scene.duration_seconds,
      })),
      closing: '',
    });
    expect(scenes).toHaveLength(5);
    expect(scenes[scenes.length - 1].title).not.toBe('Cierre');
  });

  it('envía la petición con la cabecera de la clave y devuelve el guion', async () => {
    const { generateScriptWithGemini } = await import('../engine/gemini');
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(SAMPLE) }] } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    const script = await generateScriptWithGemini({
      apiKey: 'clave-de-prueba',
      topic: 'minerales',
      tone: 'Documental',
      model: 'gemini-2.5-flash',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(script.title).toBe(SAMPLE.title);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/models/gemini-2.5-flash:generateContent');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('clave-de-prueba');
    expect(String(init.body)).toContain('minerales');
  });
});
