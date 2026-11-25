import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TTS_VOICE,
  ELEVENLABS_MODEL,
  ELEVENLABS_VOICE_ID,
  MIN_SPEECH_SECONDS,
  TTS_VOICES,
  buildElevenLabsRequestBody,
  buildSpeechFileName,
  buildTtsRequestBody,
  mp3DurationSeconds,
  speechDurationProblem,
  synthesizeSpeech,
  synthesizeWithElevenLabs,
  synthesizeWithGoogle,
  voiceById,
} from '../engine/tts';
import { findNarrationAsset, projectHasAudio, sceneNarrationSlots } from '../engine/audioTrack';
import { Project } from '../types';

const project = (): Project => ({
  id: 'p',
  title: 'Prueba',
  description: '',
  createdAt: 0,
  updatedAt: 0,
  angles: [],
  sources: [],
  mediaAssets: [
    { id: 'a1', name: 'voz 1.mp3', type: 'audio', url: 'blob:a1', mimeType: 'audio/mpeg', sizeBytes: 10, license: 'x', provenance: 'x', createdAt: 0 },
    { id: 'a2', name: 'voz 2.mp3', type: 'audio', url: 'blob:a2', mimeType: 'audio/mpeg', sizeBytes: 10, license: 'x', provenance: 'x', createdAt: 0 },
    { id: 'm1', name: 'musica.mp3', type: 'audio', url: 'blob:m1', mimeType: 'audio/mpeg', sizeBytes: 10, license: 'x', provenance: 'x', createdAt: 0 },
  ],
  musicAssetId: 'm1',
  script: {
    title: 'g',
    summary: '',
    targetAudience: '',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 's1',
        title: 'Una',
        narrationText: 'Texto uno',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 4,
        narrationAssetId: 'a1',
      },
      {
        id: 's2',
        title: 'Dos',
        narrationText: 'Texto dos',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 6,
        narrationAssetId: 'a2',
      },
      {
        id: 's3',
        title: 'Tres',
        narrationText: 'Sin voz',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 2,
      },
    ],
  },
  settings: { fps: 30, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' },
});

describe('tts: voces y petición', () => {
  it('ofrece una voz femenina y una masculina', () => {
    expect(TTS_VOICES).toHaveLength(2);
    expect(TTS_VOICES.map((voice) => voice.gender).sort()).toEqual(['FEMALE', 'MALE']);
    expect(voiceById('desconocida').id).toBe(DEFAULT_TTS_VOICE);
  });

  it('construye el cuerpo de text:synthesize con el texto y la voz', () => {
    const body = buildTtsRequestBody('Hola mundo', TTS_VOICES[1].id) as any;
    expect(body.input.text).toBe('Hola mundo');
    expect(body.voice.name).toBe(TTS_VOICES[1].id);
    expect(body.voice.languageCode).toBe('es-US');
    expect(body.audioConfig.audioEncoding).toBe('MP3');
  });

  it('nombra el archivo con la escena y el género de la voz', () => {
    expect(buildSpeechFileName('Escena: minerales', TTS_VOICES[0].id, 0)).toBe(
      'voz-escena-minerales-1-femenina.mp3'
    );
    expect(buildSpeechFileName('Escena', TTS_VOICES[1].id, 2)).toBe(
      'voz-escena-3-masculina.mp3'
    );
  });

  it('convierte la respuesta base64 en un blob de audio', async () => {
    const payload = Buffer.from('%PDF-1.4-audio-falso', 'utf8').toString('base64');
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ audioContent: payload }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const result = await synthesizeWithGoogle('Hola mundo', {
      apiKey: 'clave-prueba',
      voiceId: TTS_VOICES[1].id,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.blob.size).toBe(Buffer.from('%PDF-1.4-audio-falso', 'utf8').length);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://texttospeech.googleapis.com/v1/text:synthesize?key=clave-prueba');
    expect(String(init.body)).toContain('Hola mundo');
    expect(String(init.body)).toContain(TTS_VOICES[1].id);
  });

  it('falla sin clave o sin texto antes de llamar a la red', async () => {
    const fetchMock = vi.fn();
    await expect(
      synthesizeWithGoogle('Hola', { apiKey: '  ', fetchImpl: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(/clave/);
    await expect(
      synthesizeWithGoogle('   ', { apiKey: 'k', fetchImpl: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(/narración/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('traduce un 403 en un mensaje sobre la clave', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: 'API key not valid' } }), { status: 403 })
    );
    await expect(
      synthesizeWithGoogle('Hola', { apiKey: 'k', fetchImpl: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(/no es válida/);
  });
});

/** MP3 sintético de tramas MPEG 1 Layer III válidas (128 kbps, 44,1 kHz). */
function syntheticMp3(frames: number): Uint8Array {
  const frameLength = 417; // floor(144 * 128000 / 44100), sin relleno
  const bytes = new Uint8Array(frameLength * frames);
  for (let frame = 0; frame < frames; frame++) {
    const at = frame * frameLength;
    bytes[at] = 0xff;
    bytes[at + 1] = 0xfb;
    bytes[at + 2] = 0x90;
    bytes[at + 3] = 0x00;
  }
  return bytes;
}

/** MP3 real incluido en el proyecto (16,07 s según ffprobe, 22,05 kHz). */
const realMp3 = () => new Uint8Array(readFileSync('public/music/suave-brisa.mp3'));

/** Copia a un ArrayBuffer propio, que es lo que acepta `Response` como cuerpo. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

describe('tts: ElevenLabs', () => {
  it('mide la duración leyendo los bytes de un MP3 real', () => {
    const duration = mp3DurationSeconds(realMp3());
    // ffprobe: 16,065 s; el conteo de tramas no cuenta el último relleno.
    expect(duration).toBeGreaterThan(15.9);
    expect(duration).toBeLessThan(16.2);
    expect(Math.abs(duration - 16.065306)).toBeLessThan(0.1);
  });

  it('cuenta las tramas de un MP3 sintético y detecta audios demasiado cortos', () => {
    expect(mp3DurationSeconds(syntheticMp3(20))).toBeCloseTo((20 * 1152) / 44100, 2);
    expect(mp3DurationSeconds(syntheticMp3(10))).toBeLessThan(MIN_SPEECH_SECONDS);
    expect(speechDurationProblem(0.26)).toMatch(/truncado/);
    expect(speechDurationProblem(0.26)).toContain('0.26 s');
    expect(speechDurationProblem(2.4)).toBeNull();
    expect(speechDurationProblem(0)).toBeNull();
    expect(mp3DurationSeconds(new Uint8Array([1, 2, 3]))).toBe(0);
  });

  it('construye el cuerpo con el modelo fijo y el texto', () => {
    const body = buildElevenLabsRequestBody('Hola mundo') as any;
    expect(body.model_id).toBe(ELEVENLABS_MODEL);
    expect(ELEVENLABS_MODEL).toBe('eleven_monolingual_v1');
    expect(body.text).toBe('Hola mundo');
  });

  it('pide el MP3 a la voz Rachel con xi-api-key y mide los bytes devueltos', async () => {
    const audio = realMp3();
    const fetchMock = vi.fn(async () =>
      new Response(toArrayBuffer(audio), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } })
    );

    const result = await synthesizeWithElevenLabs('Escena de prueba', {
      apiKey: 'clave-eleven',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(result.provider).toBe('elevenlabs');
    expect(result.mimeType).toBe('audio/mpeg');
    expect(result.blob.size).toBe(audio.length);
    expect(result.durationSeconds).toBeGreaterThan(MIN_SPEECH_SECONDS);
    expect(Math.abs(result.durationSeconds - 16.065306)).toBeLessThan(0.1);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`);
    expect(ELEVENLABS_VOICE_ID).toBe('21m00Tcm4TlvDq8ikWAM');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['xi-api-key']).toBe('clave-eleven');
    expect(String(init.body)).toContain('eleven_monolingual_v1');
    expect(String(init.body)).toContain('Escena de prueba');
  });

  it('rechaza un MP3 truncado y traduce los errores de clave', async () => {
    const shortFetch = vi.fn(
      async () => new Response(toArrayBuffer(syntheticMp3(10)), { status: 200 })
    );
    await expect(
      synthesizeWithElevenLabs('Hola', {
        apiKey: 'k',
        fetchImpl: shortFetch as unknown as typeof fetch,
      })
    ).rejects.toThrow(/truncado/);

    const unauthorized = vi.fn(
      async () => new Response(JSON.stringify({ detail: { message: 'invalid api key' } }), { status: 401 })
    );
    await expect(
      synthesizeWithElevenLabs('Hola', {
        apiKey: 'k',
        fetchImpl: unauthorized as unknown as typeof fetch,
      })
    ).rejects.toThrow(/no es válida/);
  });

  it('prefiere ElevenLabs si hay clave y cae a Google si no', async () => {
    const audio = realMp3();
    const eleven = vi.fn(async () => new Response(toArrayBuffer(audio), { status: 200 }));
    const preferred = await synthesizeSpeech('Hola', {
      elevenlabsApiKey: 'eleven',
      googleApiKey: 'google',
      fetchImpl: eleven as unknown as typeof fetch,
    });
    expect(preferred.provider).toBe('elevenlabs');
    expect((eleven.mock.calls[0] as unknown as [string])[0]).toContain('api.elevenlabs.io');

    const googlePayload = Buffer.from('audio-google', 'utf8').toString('base64');
    const google = vi.fn(async () =>
      new Response(JSON.stringify({ audioContent: googlePayload }), { status: 200 })
    );
    const fallback = await synthesizeSpeech('Hola', {
      googleApiKey: 'google',
      googleVoiceId: TTS_VOICES[1].id,
      fetchImpl: google as unknown as typeof fetch,
    });
    expect(fallback.provider).toBe('google');
    const [googleUrl, googleInit] = google.mock.calls[0] as unknown as [string, RequestInit];
    expect(googleUrl).toContain('texttospeech.googleapis.com');
    expect(String(googleInit.body)).toContain(TTS_VOICES[1].id);

    await expect(synthesizeSpeech('Hola', {})).rejects.toThrow(/Falta una clave de voz/);
  });

  it('nombra el archivo de ElevenLabs sin confundirlo con las voces de Google', () => {
    expect(buildSpeechFileName('Escena: minerales', ELEVENLABS_VOICE_ID, 1, 'elevenlabs')).toBe(
      'voz-escena-minerales-2-elevenlabs.mp3'
    );
  });
});

describe('narración por escena', () => {
  it('coloca cada voz al inicio de su escena con su duración', () => {
    const slots = sceneNarrationSlots(project());
    expect(slots.map((slot) => [slot.sceneId, slot.asset.id, slot.start, slot.duration])).toEqual([
      ['s1', 'a1', 0, 4],
      ['s2', 'a2', 4, 6],
    ]);
  });

  it('no confunde una voz de escena con la narración global', () => {
    const value = project();
    expect(findNarrationAsset(value)).toBeNull();
    expect(projectHasAudio(value)).toBe(true);
    value.script.scenes[0].narrationAssetId = undefined;
    value.script.scenes[1].narrationAssetId = undefined;
    // Sin voces por escena vuelve el comportamiento antiguo (primer audio no musical).
    expect(findNarrationAsset(value)?.id).toBe('a1');
    expect(projectHasAudio(value)).toBe(true);
  });
});
