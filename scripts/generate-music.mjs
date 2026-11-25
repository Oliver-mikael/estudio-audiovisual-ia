// Genera las 10 pistas CC0 que se incluyen en `public/music`.
//
// Todo se sintetiza aquí (osciladores, envolventes y ruido determinista): no se
// descarga ni se samplea música de terceros. Uso:
//
//   node scripts/generate-music.mjs
//   node scripts/generate-music.mjs --wav   (deja también los WAV intermedios)
//
// El MP3 se codifica con ffmpeg (ffmpeg-static o el del sistema).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SAMPLE_RATE = 22050;
const DURATION = 16;
const OUT_DIR = join(process.cwd(), 'public', 'music');
const KEEP_WAV = process.argv.includes('--wav');

const TRACKS = [
  {
    id: 'epica-amanecer',
    bpm: 96,
    root: 50,
    scale: [0, 2, 3, 5, 7, 8, 10],
    chords: [[0, 3, 7], [0, 3, 7], [5, 8, 12], [3, 7, 10], [0, 3, 7], [8, 12, 15], [5, 8, 12], [3, 7, 10]],
    style: 'epic',
    seed: 11,
  },
  {
    id: 'epica-marcha',
    bpm: 110,
    root: 45,
    scale: [0, 2, 3, 5, 7, 8, 11],
    chords: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [3, 7, 10], [0, 3, 7], [10, 14, 17], [8, 12, 15], [3, 7, 10]],
    style: 'epic',
    seed: 23,
  },
  {
    id: 'suave-brisa',
    bpm: 72,
    root: 48,
    scale: [0, 2, 4, 5, 7, 9, 11],
    chords: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [2, 5, 9, 12], [0, 4, 7, 11], [9, 12, 16, 19], [7, 11, 14, 17], [5, 9, 12, 16]],
    style: 'soft',
    seed: 31,
  },
  {
    id: 'suave-nubes',
    bpm: 64,
    root: 53,
    scale: [0, 2, 4, 5, 7, 9, 10],
    chords: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14], [0, 4, 7], [2, 5, 9], [5, 9, 12], [7, 11, 14]],
    style: 'ambient',
    seed: 37,
  },
  {
    id: 'tecnologia-circuito',
    bpm: 120,
    root: 45,
    scale: [0, 2, 3, 5, 7, 8, 10],
    chords: [[0, 3, 7], [0, 3, 10], [5, 8, 12], [3, 7, 12], [0, 3, 7], [8, 12, 15], [5, 8, 12], [3, 7, 10]],
    style: 'tech',
    seed: 41,
  },
  {
    id: 'tecnologia-datos',
    bpm: 104,
    root: 50,
    scale: [0, 2, 3, 5, 7, 9, 10],
    chords: [[0, 5, 7], [0, 3, 7], [8, 12, 15], [5, 10, 12], [0, 5, 7], [3, 7, 10], [8, 12, 15], [5, 8, 12]],
    style: 'tech',
    seed: 47,
  },
  {
    id: 'misterio-sombra',
    bpm: 68,
    root: 41,
    scale: [0, 1, 3, 5, 7, 8, 10],
    chords: [[0, 3, 7], [1, 5, 8], [0, 3, 6], [10, 13, 17], [0, 3, 7], [1, 6, 8], [3, 6, 10], [1, 5, 8]],
    style: 'mystery',
    seed: 53,
  },
  {
    id: 'misterio-eco',
    bpm: 60,
    root: 38,
    scale: [0, 1, 3, 5, 6, 8, 10],
    chords: [[0, 3, 7], [0, 5, 7], [3, 6, 10], [1, 5, 8], [0, 3, 7], [6, 10, 13], [1, 5, 8], [3, 6, 10]],
    style: 'mystery',
    seed: 59,
  },
  {
    id: 'motivacional-paso',
    bpm: 112,
    root: 48,
    scale: [0, 2, 4, 5, 7, 9, 11],
    chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [9, 12, 16], [0, 4, 7], [5, 9, 12], [7, 11, 14], [10, 14, 17]],
    style: 'uplift',
    seed: 61,
  },
  {
    id: 'motivacional-luz',
    bpm: 100,
    root: 55,
    scale: [0, 2, 4, 5, 7, 9, 11],
    chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12], [0, 4, 7], [7, 11, 14], [10, 14, 17], [5, 9, 12]],
    style: 'uplift',
    seed: 67,
  },
];

const midiToFrequency = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function envelope(time, start, length, attack, release) {
  const local = time - start;
  if (local < 0 || local >= length) return 0;
  const fadeIn = Math.min(1, local / Math.max(0.001, attack));
  const fadeOut = Math.min(1, (length - local) / Math.max(0.001, release));
  return Math.min(fadeIn, fadeOut);
}

function renderTrack(track) {
  const frames = Math.round(SAMPLE_RATE * DURATION);
  const samples = new Float64Array(frames);
  const random = makeRandom(track.seed);
  const beat = 60 / track.bpm;
  const chordLength = DURATION / track.chords.length;
  const isSoft = track.style === 'soft' || track.style === 'ambient';
  const isTech = track.style === 'tech';
  const isUplift = track.style === 'uplift';

  const addTone = (time, frequency, gain, wave, attack, release, length = 1) => {
    const frameStart = Math.floor(time * SAMPLE_RATE);
    const frameLength = Math.floor(length * SAMPLE_RATE);
    for (let offset = 0; offset < frameLength; offset++) {
      const index = frameStart + offset;
      if (index < 0 || index >= frames) continue;
      const localTime = offset / SAMPLE_RATE;
      const env = envelope(localTime, 0, length, attack, release);
      if (env <= 0) continue;
      const phase = 2 * Math.PI * frequency * localTime;
      let value;
      if (wave === 'triangle') value = (2 / Math.PI) * Math.asin(Math.sin(phase));
      else if (wave === 'saw') value = 2 * ((frequency * localTime) % 1) - 1;
      else value = Math.sin(phase);
      samples[index] += value * gain * env;
    }
  };

  const addNoise = (time, gain, length) => {
    const frameStart = Math.floor(time * SAMPLE_RATE);
    const frameLength = Math.floor(length * SAMPLE_RATE);
    for (let offset = 0; offset < frameLength; offset++) {
      const index = frameStart + offset;
      if (index < 0 || index >= frames) continue;
      const env = envelope(offset / SAMPLE_RATE, 0, length, 0.002, length * 0.9);
      samples[index] += (random() * 2 - 1) * gain * env;
    }
  };

  const addKick = (time, gain) => {
    const frameStart = Math.floor(time * SAMPLE_RATE);
    const frameLength = Math.floor(0.22 * SAMPLE_RATE);
    for (let offset = 0; offset < frameLength; offset++) {
      const index = frameStart + offset;
      if (index < 0 || index >= frames) continue;
      const localTime = offset / SAMPLE_RATE;
      const env = Math.exp(-localTime * 16);
      const frequency = 62 + 90 * Math.exp(-localTime * 30);
      samples[index] += Math.sin(2 * Math.PI * frequency * localTime) * gain * env;
    }
  };

  // Pads: acorde sostenido con entrada lenta (o drone en misterio/ambiente).
  track.chords.forEach((chord, chordIndex) => {
    const start = chordIndex * chordLength;
    const padGain = isSoft ? 0.095 : 0.075;
    chord.forEach((interval, noteIndex) => {
      const octave = track.style === 'mystery' ? 0 : 12;
      const frequency = midiToFrequency(track.root + interval + octave - 12);
      addTone(start, frequency, padGain / (1 + noteIndex * 0.15), 'sine', 0.45, 0.5, chordLength);
      if (!isSoft) {
        addTone(
          start,
          frequency * 2.002,
          padGain * 0.28,
          'triangle',
          0.5,
          0.5,
          chordLength
        );
      }
    });
  });

  // Bajo: raíz en cada negra (o cada dos en ambiente).
  const bassStep = track.style === 'ambient' ? beat * 2 : beat;
  for (let time = 0; time < DURATION - 0.1; time += bassStep) {
    const chordIndex = Math.floor(time / chordLength) % track.chords.length;
    const root = track.root + track.chords[chordIndex][0] - 24;
    addTone(time, midiToFrequency(root), isSoft ? 0.12 : 0.16, 'sine', 0.02, bassStep * 0.8, bassStep * 0.92);
  }

  // Arpegio: corcheas o dieciseisavos según el estilo.
  const arpStep = isTech ? beat / 4 : isSoft ? beat : beat / 2;
  let arpIndex = 0;
  for (let time = 0; time < DURATION - 0.05; time += arpStep) {
    if (track.style === 'ambient' && arpIndex % 3 !== 0) {
      arpIndex++;
      continue;
    }
    const chordIndex = Math.floor(time / chordLength) % track.chords.length;
    const chord = track.chords[chordIndex];
    const note = chord[arpIndex % chord.length] + (arpIndex % 4 === 3 ? 12 : 0);
    const gain = (isTech ? 0.055 : isSoft ? 0.04 : 0.045) * (0.75 + random() * 0.4);
    addTone(
      time,
      midiToFrequency(track.root + note + 12),
      gain,
      isTech ? 'saw' : 'triangle',
      0.005,
      arpStep * 1.4,
      arpStep * 2.1
    );
    arpIndex++;
  }

  // Melodía: frase de 8 notas por compás de acorde en estilos con protagonismo.
  if (!isSoft) {
    const melodyNotes = {
      epic: [0, 2, 4, 2, 0, 4, 5, 4],
      tech: [0, 4, 2, 5, 4, 2, 0, 2],
      mystery: [0, 1, 4, 1, 0, 5, 3, 1],
      uplift: [0, 2, 4, 5, 4, 2, 0, 2],
    }[track.style];
    const melodyStep = beat;
    for (let time = 0; time < DURATION - 0.2; time += melodyStep) {
      const chordIndex = Math.floor(time / chordLength) % track.chords.length;
      const degree = melodyNotes[Math.round(time / melodyStep) % melodyNotes.length];
      const midi = track.root + track.scale[degree % track.scale.length] + 24;
      const gain = track.style === 'mystery' ? 0.04 : 0.05;
      addTone(time, midiToFrequency(midi), gain, track.style === 'tech' ? 'triangle' : 'sine', 0.01, melodyStep * 1.2, melodyStep * 1.6);
    }
  }

  // Percusión: bombo y ruido según el estilo.
  if (isUplift || track.style === 'epic' || isTech) {
    for (let time = 0; time < DURATION - 0.1; time += beat) {
      addKick(time, track.style === 'epic' ? 0.2 : 0.16);
      if (isTech) addNoise(time + beat / 2, 0.035, 0.05);
      else if (isUplift) addNoise(time + beat / 2, 0.045, 0.08);
    }
  }
  if (track.style === 'mystery') {
    for (let time = beat * 2; time < DURATION - 0.1; time += beat * 2) {
      addNoise(time, 0.02, 0.12);
    }
  }

  // Normaliza a 0,7 de pico y suaviza los extremos para que el bucle no chasquee.
  let peak = 0;
  for (let index = 0; index < frames; index++) peak = Math.max(peak, Math.abs(samples[index]));
  const scale = peak > 0 ? 0.7 / peak : 1;
  const edge = Math.round(0.04 * SAMPLE_RATE);
  const pcm = Buffer.alloc(frames * 2);
  for (let index = 0; index < frames; index++) {
    let value = samples[index] * scale;
    if (index < edge) value *= index / edge;
    if (index >= frames - edge) value *= (frames - index) / edge;
    const int = Math.max(-32768, Math.min(32767, Math.round(value * 32767)));
    pcm.writeInt16LE(int, index * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function resolveFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const local = join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
  return existsSync(local) ? local : 'ffmpeg';
}

mkdirSync(OUT_DIR, { recursive: true });
const ffmpeg = resolveFfmpeg();

for (const track of TRACKS) {
  const wavPath = join(OUT_DIR, `${track.id}.wav`);
  const mp3Path = join(OUT_DIR, `${track.id}.mp3`);
  writeFileSync(wavPath, renderTrack(track));

  const result = spawnSync(
    ffmpeg,
    ['-y', '-loglevel', 'error', '-i', wavPath, '-codec:a', 'libmp3lame', '-b:a', '96k', mp3Path],
    { stdio: 'inherit' }
  );
  if (result.status !== 0) {
    console.error(`No se pudo codificar ${track.id}.mp3 (ffmpeg: ${ffmpeg})`);
    process.exit(1);
  }
  if (!KEEP_WAV) rmSync(wavPath);
  console.log(`OK ${track.id}.mp3`);
}
