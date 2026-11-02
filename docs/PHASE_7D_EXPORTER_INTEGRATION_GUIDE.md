# FASE 7D: MANUAL Y ARQUITECTURA DE INTEGRACIÓN CON EL EXPORTADOR DE VIDEO

## 1. Desacoplamiento de SpeechSynthesis y Adopción de Web Audio Destination
Anteriormente, `src/engine/exporter.ts` recurría a `window.speechSynthesis` y a un oscilador senoidal de tono fijo como demostrador. Esto presentaba limitaciones críticas en navegadores y en entornos móviles (las APIs de síntesis vocal del sistema operativo a menudo no son capturables en un `MediaStreamDestination`).

Con la Fase 7D:
- `audioEngine.initContext()` inicializa la matriz de nodos de audio.
- `audioEngine.getDestinationStream()` proporciona un `MediaStream` real con pistas `audio/webm;codecs=opus` o `audio/mp4`.
- Los tracks de video generados por `canvas.captureStream(fps)` y los tracks de audio se fusionan en un único `MediaStream` multidestino.
- `MediaRecorder` empaqueta ambos flujos simultáneamente cuadro a cuadro.
- Al culminar la duración del guion, `audioEngine.stop()` y `mediaRecorder.stop()` finalizan limpiamente sin desbordamiento de memoria ni desincronización de audio y video.
