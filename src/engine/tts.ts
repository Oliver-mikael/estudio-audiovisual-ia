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

// ElevenLabs (fase 33): alternativa opcional, voz Rachel en español neutro.
export const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
export const ELEVENLABS_VOICE_NAME = 'Rachel';
export const ELEVENLABS_MODEL = 'eleven_monolingual_v1';
export const ELEVENLABS_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
/** Duración mínima por debajo de la cual se considera que el MP3 vino vacío o truncado. */
export const MIN_SPEECH_SECONDS = 0.5;

export type SpeechProvider = 'google' | 'elevenlabs';

export interface TtsSynthesisResult {
  blob: Blob;
  mimeType: string;
  extension: 'mp3';
  /** Duración medida sobre los bytes del MP3 devuelto por el servicio. */
  durationSeconds: number;
  provider: SpeechProvider;
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
export function buildSpeechFileName(
  sceneTitle: string,
  voiceId: string,
  index: number,
  provider: SpeechProvider = 'google'
): string {
  if (provider === 'elevenlabs') {
    return `voz-${sanitizeSlug(sceneTitle)}-${index + 1}-elevenlabs.mp3`;
  }
  const voice = voiceById(voiceId);
  const gender = voice.gender === 'MALE' ? 'masculina' : 'femenina';
  return `voz-${sanitizeSlug(sceneTitle)}-${index + 1}-${gender}.mp3`;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

const MPEG1_LAYER3_KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const MPEG2_LAYER3_KBPS = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const MPEG_SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG 1
  2: [22050, 24000, 16000], // MPEG 2
  0: [11025, 12000, 8000], // MPEG 2.5
};

/**
 * Duración de un MP3 medida directamente en sus bytes: recorre las cabeceras de
 * trama (MPEG 1/2/2.5, Layer III) y suma las muestras de cada trama. No depende
 * de un elemento <audio>, así que sirve también para comprobar lo que devolvió
 * el servicio antes de guardarlo.
 */
export function mp3DurationSeconds(bytes: Uint8Array): number {
  let offset = 0;
  // Etiqueta ID3v2 al inicio, con tamaño "syncsafe" de 28 bits.
  if (bytes.length > 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);
    offset = 10 + size;
  }

  let seconds = 0;
  let frames = 0;
  let cursor = offset;
  while (cursor + 4 <= bytes.length) {
    if (bytes[cursor] !== 0xff || (bytes[cursor + 1] & 0xe0) !== 0xe0) {
      cursor++;
      continue;
    }

    const versionBits = (bytes[cursor + 1] >> 3) & 0x03; // 3 = MPEG 1, 2 = MPEG 2, 0 = MPEG 2.5
    const layerBits = (bytes[cursor + 1] >> 1) & 0x03; // 1 = Layer III
    const bitrateIndex = (bytes[cursor + 2] >> 4) & 0x0f;
    const sampleRateIndex = (bytes[cursor + 2] >> 2) & 0x03;
    const padding = (bytes[cursor + 2] >> 1) & 0x01;

    const sampleRates = MPEG_SAMPLE_RATES[versionBits];
    const bitrates = versionBits === 3 ? MPEG1_LAYER3_KBPS : MPEG2_LAYER3_KBPS;
    if (
      layerBits !== 1 ||
      !sampleRates ||
      sampleRateIndex === 3 ||
      bitrateIndex === 0 ||
      bitrateIndex === 15
    ) {
      cursor++;
      continue;
    }

    const sampleRate = sampleRates[sampleRateIndex];
    const bitrate = bitrates[bitrateIndex] * 1000;
    const frameLength =
      Math.floor(((versionBits === 3 ? 144 : 72) * bitrate) / sampleRate) + padding;
    if (frameLength < 4) {
      cursor++;
      continue;
    }

    seconds += (versionBits === 3 ? 1152 : 576) / sampleRate;
    frames++;
    cursor += frameLength;
  }

  return frames > 0 ? Number(seconds.toFixed(3)) : 0;
}

/** Motivo por el que una duración no es razonable; null si lo es (o no se pudo medir). */
export function speechDurationProblem(durationSeconds: number): string | null {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return null;
  if (durationSeconds < MIN_SPEECH_SECONDS) {
    return `El audio devuelto dura solo ${durationSeconds.toFixed(2)} s (menos de ${MIN_SPEECH_SECONDS} s): parece vacío o truncado.`;
  }
  return null;
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

async function measureMp3(blob: Blob): Promise<number> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const fromBytes = mp3DurationSeconds(bytes);
  if (fromBytes > 0) return fromBytes;
  return audioBlobDurationSeconds(blob);
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

  const blob = new Blob([base64ToBytes(payload.audioContent).slice()], { type: 'audio/mpeg' });
  const durationSeconds = await measureMp3(blob);
  const problem = speechDurationProblem(durationSeconds);
  if (problem) throw new Error(`Google Cloud TTS devolvió un audio inválido. ${problem}`);
  return { blob, mimeType: 'audio/mpeg', extension: 'mp3', durationSeconds, provider: 'google' };
}

/** Cuerpo que se envía a ElevenLabs (`model_id` fijo y ajustes de voz estables). */
export function buildElevenLabsRequestBody(text: string): Record<string, unknown> {
  return {
    text,
    model_id: ELEVENLABS_MODEL,
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  };
}

function describeElevenLabsError(status: number, detail: string): string {
  const suffix = detail ? `: ${detail}` : '';
  if (status === 401 || status === 403) {
    return `La clave de ElevenLabs no es válida o no tiene permisos (${status})${suffix}`;
  }
  if (status === 422) return `ElevenLabs rechazó el texto o la voz (422)${suffix}`;
  if (status === 429) return `Se agotó la cuota o el plan de ElevenLabs (429)${suffix}`;
  return `ElevenLabs respondió con un error ${status}${suffix}`;
}

/** Texto que se lee en la petición de error de ElevenLabs. */
async function readElevenLabsError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      detail?: string | { message?: string };
      message?: string;
    };
    if (typeof body.detail === 'string') return body.detail;
    return body.detail?.message ?? body.message ?? '';
  } catch {
    return '';
  }
}

/**
 * Sintetiza el texto con ElevenLabs (voz Rachel) y devuelve el MP3 listo para
 * guardar. La clave viaja en la cabecera `xi-api-key`.
 */
export async function synthesizeWithElevenLabs(
  text: string,
  options: SynthesizeOptions
): Promise<TtsSynthesisResult> {
  const apiKey = options.apiKey.trim();
  if (!apiKey) {
    throw new Error(
      'Falta la clave de ElevenLabs. Configúrala en Ajustes del proyecto para generar voz.'
    );
  }
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('La escena no tiene texto de narración que convertir en voz.');
  }

  const voiceId = options.voiceId || ELEVENLABS_VOICE_ID;
  const request = options.fetchImpl ?? fetch;
  const response = await request(`${ELEVENLABS_ENDPOINT}/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify(buildElevenLabsRequestBody(cleanText)),
  });

  if (!response.ok) {
    throw new Error(describeElevenLabsError(response.status, await readElevenLabsError(response)));
  }

  const received = await response.blob();
  if (received.size === 0) {
    throw new Error('ElevenLabs devolvió una respuesta sin audio.');
  }

  const blob = new Blob([received], { type: 'audio/mpeg' });
  const durationSeconds = await measureMp3(blob);
  const problem = speechDurationProblem(durationSeconds);
  if (problem) throw new Error(`ElevenLabs devolvió un audio inválido. ${problem}`);
  return { blob, mimeType: 'audio/mpeg', extension: 'mp3', durationSeconds, provider: 'elevenlabs' };
}

export interface SpeechSynthesisOptions {
  /** Clave de ElevenLabs; si existe, tiene prioridad sobre Google. */
  elevenlabsApiKey?: string;
  googleApiKey?: string;
  googleVoiceId?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Elige el proveedor de voz: ElevenLabs si hay clave configurada (voz Rachel),
 * y si no Google Cloud TTS con la voz elegida en los ajustes.
 */
export async function synthesizeSpeech(
  text: string,
  options: SpeechSynthesisOptions
): Promise<TtsSynthesisResult> {
  const elevenlabsApiKey = (options.elevenlabsApiKey ?? '').trim();
  if (elevenlabsApiKey) {
    return synthesizeWithElevenLabs(text, {
      apiKey: elevenlabsApiKey,
      fetchImpl: options.fetchImpl,
    });
  }

  const googleApiKey = (options.googleApiKey ?? '').trim();
  if (googleApiKey) {
    return synthesizeWithGoogle(text, {
      apiKey: googleApiKey,
      voiceId: options.googleVoiceId,
      fetchImpl: options.fetchImpl,
    });
  }

  throw new Error(
    'Falta una clave de voz. Configura ElevenLabs o Google Cloud TTS en Ajustes del proyecto (o usa «Escuchar» para oír la voz del navegador).'
  );
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
