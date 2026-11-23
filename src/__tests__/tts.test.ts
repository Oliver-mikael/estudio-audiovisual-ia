import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TTS_VOICE,
  TTS_VOICES,
  buildSpeechFileName,
  buildTtsRequestBody,
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
