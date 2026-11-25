# FASE 7D: ARQUITECTURA DEL MOTOR DE AUDIO MULTIPISTA Y ENRUTAMIENTO

## 1. Visión y Propósito
El motor de audio de la Fase 7D transforma el Estudio Audiovisual Inteligente de un renderizador visual básico a una estación de trabajo de audio digital (DAW) ligera integrada directamente en el navegador del cliente (Android y Escritorio), operando 100% offline y sin suscripciones.

## 2. Diagrama de Enrutamiento Web Audio API
```
[ Micrófono Local ] ---> [ AudioRecorder (MediaStream) ] ---> [ Blob WebM/WAV ] ---> [ MediaAsset (IndexedDB) ]
                                                                                         |
                                                                                         v
                                                                                [ ArrayBuffer Decoded ]
                                                                                         |
[ AudioBufferSourceNode A1 (Voz)   ] ---> [ GainNode A1 ] ----------------+              |
[ AudioBufferSourceNode A2 (Música)] ---> [ GainNode A2 ] ----------------+              |
[ AudioBufferSourceNode A3 (FX)    ] ---> [ GainNode A3 ] ----------------+              |
                                                                          |              |
                                                                          v              v
                                                                [ Master GainNode (Fader General) ]
                                                                          |
                                            +-----------------------------+-----------------------------+
                                            |                                                           |
                                            v                                                           v
                              [ audioCtx.destination ]                                   [ createMediaStreamDestination ]
                            (Monitoreo en Altavoces/Cascos)                                (VideoExporter: MediaRecorder)
```

## 3. Componentes Implementados
1. **`src/types/audio.ts`**: Tipado estricto para estados de reproducción, configuración de pistas (A1, A2, A3), metadatos de buffers, sesiones de grabación y faders.
2. **`src/services/audio/AudioEngine.ts`**: Singleton Web Audio Context, gestión de buffers en memoria, control maestro, scheduler sincronizado con playhead SMPTE y export stream.
3. **`src/services/audio/AudioRecorder.ts`**: Grabación directa por micrófono usando `MediaRecorder` estándar con callbacks de telemetría de decibelios y guardado como `MediaAsset`.
4. **`src/services/audio/AudioMixer.ts`**: Lógica desacoplada de mezcla de pistas con auto-ducking para atenuar música/efectos de fondo durante la voz del locutor.
5. **`src/services/audio/AudioPersistence.ts`**: Almacenamiento seguro e indexado de pistas en IndexedDB.
6. **`src/engine/exporter.ts`**: Renderizado de video sincronizado conectado al destino de mezcla multicanal, eliminando la dependencia defectuosa de SpeechSynthesis.
