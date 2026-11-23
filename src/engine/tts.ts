// Voz generada para la narración de una escena.
//
// Se integra Google Cloud Text-to-Speech (clave del usuario en los ajustes del
// proyecto): la API devuelve el audio en base64 y aquí se convierte en un
// MediaAsset de la biblioteca. La Web Speech API se usa además como escucha
// previa sin clave, pero el navegador no expone sus muestras de audio, así que
// no puede guardarse como archivo para la exportación: para eso está Google.

export interface TtsVoiceOption {
  id: string;
  label: string;
  languageCode: string;
  gender: 'FEMALE' | 'MALE';
}

/** Dos voces estables de Google Cloud TTS en español (femenina y masculina). */
export const TTS_VOICES: TtsVoiceOption[] = [
  {
    id: 'es-US-Chirp3-HD-Aoede',
    label: 'Femenina · Aoede (es-US)',
    languageCode: 'es-US',
    gender: 'FEMALE',
  },
  {
    id: 'es-US-Chirp3-HD-Charon',
    label: 'Masculina · Charon (es-US)',
    languageCode: 'es-US',
    gender: 'MALE',
  },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES[0].id;
export const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

export interface TtsSynthesisResult {
  blob: Blob;
  mimeType: string;
  extension: 'mp3';
  durationSeconds: number;
}

export function voiceById(voiceId: string | undefined): TtsVoiceOption {
  return TTS_VOICES.find((voice) => voice.id === voiceId) ?? TTS_VOICES[0];
}

/** Cuerpo que se envía a `text:synthesize` (MP3, español, voz elegida). */
export function buildTtsRequestBody(text: string, voiceId: string): Record<string, unknown> {
  const voice = voiceById(voiceId);
  return {
    input: { text },
    voice: { languageCode: voice.languageCode, name: voice.id },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 1, pitch: 0 },
  };
}

function sanitizeSlug(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'escena'
  );
}

/** Nombre del archivo de voz generado, con la escena y la voz usada. */
export function buildSpeechFileName(sceneTitle: string, voiceId: string, index: number): string {
  const voice = voiceById(voiceId);
  const gender = voice.gender === 'MALE' ? 'masculina' : 'femenina';
  return `voz-${sanitizeSlug(sceneTitle)}-${index + 1}-${gender}.mp3`;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

/** Duración de un blob de audio leyendo sus metadatos; 0 si no se puede medir. */
export async function audioBlobDurationSeconds(blob: Blob): Promise<number> {
  if (typeof document === 'undefined') return 0;
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    let settled = false;
    const finish = (value: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      audio.removeAttribute('src');
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => finish(0), 5000);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
    audio.onerror = () => finish(0);
    audio.src = url;
  });
}

function describeTtsError(status: number, detail: string): string {
  const suffix = detail ? `: ${detail}` : '';
  if (status === 400) return `Google TTS rechazó el texto o la voz (400)${suffix}`;
  if (status === 401 || status === 403) {
    return `La clave de Google Cloud TTS no es válida o la API no está habilitada (${status})${suffix}`;
  }
  if (status === 429) return `Se agotó la cuota de Google Cloud TTS (429)${suffix}`;
  return `Google Cloud TTS respondió con un error ${status}${suffix}`;
}

async function readTtsError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? '';
  } catch {
    return '';
  }
}

export interface SynthesizeOptions {
  apiKey: string;
  voiceId?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Sintetiza el texto con Google Cloud TTS y devuelve el MP3 listo para guardar
 * como recurso. La clave viaja en la cabecera `X-Goog-Api-Key`.
 */
export async function synthesizeWithGoogle(
  text: string,
  options: SynthesizeOptions
): Promise<TtsSynthesisResult> {
  const apiKey = options.apiKey.trim();
  if (!apiKey) {
    throw new Error(
      'Falta la clave de Google Cloud TTS. Configúrala en Ajustes del proyecto para generar voz.'
    );
  }
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('La escena no tiene texto de narración que convertir en voz.');
  }

  const voiceId = options.voiceId || DEFAULT_TTS_VOICE;
  const request = options.fetchImpl ?? fetch;
  const response = await request(`${TTS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildTtsRequestBody(cleanText, voiceId)),
  });

  if (!response.ok) {
    throw new Error(describeTtsError(response.status, await readTtsError(response)));
  }

  const payload = (await response.json()) as { audioContent?: string };
  if (!payload.audioContent) {
    throw new Error('Google Cloud TTS devolvió una respuesta sin audio.');
  }

  const blob = base64ToBlob(payload.audioContent, 'audio/mpeg');
  const durationSeconds = await audioBlobDurationSeconds(blob);
  return { blob, mimeType: 'audio/mpeg', extension: 'mp3', durationSeconds };
}

/** Escucha previa con la Web Speech API (sin clave, no genera archivo). */
export function speakTextPreview(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const clean = text.trim();
  if (!clean) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'es-ES';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeechPreview(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
