# Evidencias de verificación

Esta carpeta no forma parte de la app: son los archivos que se usaron para comprobar el funcionamiento real
del motor de render, la exportación y las transiciones. Cada archivo se generó ejecutando la app en Chromium
y se analizó con ffmpeg (`ffmpeg-static`, versión 7.0.2).

Los videos son la salida real del exportador (`VideoExporter`), no capturas de pantalla ni archivos de
ejemplo descargados de internet. Las cifras (duración, resolución, fps, canales, correlación) salen de
`ffmpeg -i` y de comparar PCM extraído con `-f f32le`.

## Exportación y narración (sesión inicial)

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `export-test.webm` | Exportación determinista de 10 s (VP9 1280×720@30 + Opus 48 kHz estéreo). | El render cuadro por cuadro y la narración MP3 llegan al archivo; correlación 0,9991 con la fuente. |
| `export-test-frame-3s.png` | Cuadro extraído del video anterior en t = 3 s (1280×720). | El contenido dibujado coincide con la escena esperada. |
| `export-ui.webm` | Exportación de 10 s lanzada desde el botón «Exportar video». | El flujo de la UI produce el mismo WebM con audio. |
| `export-fallback.webm` | Exportación forzando el respaldo `MediaRecorder` + `captureStream(0)`. | Hay respaldo con audio real cuando no se usa WebCodecs; el WebM no declara duración (ffmpeg muestra `Duration: N/A`). |
| `narracion-prueba.mp3` | Voz TTS de prueba, MP3 24 kHz mono, 11,28 s. | Fuente de la narración para las exportaciones con MP3. |
| `narracion-prueba.wav` | La misma voz en WAV PCM 16 bits 48 kHz estéreo, 11,28 s. | Fuente para verificar la decodificación de WAV. |

## Fase 5 — transiciones

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase5-transitions.webm` | 4,47 s, VP9 1280×720@30, sin audio: escenas de color con Fundido, Deslizamiento y Zoom. | El render compone dos escenas en buffers. El color medio del fundido pasa de (83,25,37) a (19,42,101) de forma monótona. |
| `phase5-fade-mid.png` | Cuadro en mitad de un Fundido. | Se ven las dos escenas superpuestas con la opacidad intermedia. |
| `phase5-zoom-mid.png` | Cuadro en mitad de un Zoom. | Ambas capas aparecen a escalas distintas (1,0 → 1,1). |

## Fase 6 — resolución y FPS

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase6-1080p30.webm` | 2,97 s, VP9 1920×1080@30. | El exportador respeta 1080p y 30 fps pedidos en Ajustes (confirmado por ffmpeg). El límite móvil se probó aparte simulando el user agent de Android: 1080p/60 → 1280×720/30. |

## Fase 7 — clips de video en escenas (WebM)

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `testclip.webm` | Clip VP8 640×360, 1,2 s, con timecode incrustado. | Recurso de entrada para la escena. |
| `phase7-video-scene.webm` | 3,27 s, VP9 1280×720@30. | El clip se dibuja en el timestamp correcto: bucle en escena de 2,5 s y recorte en escena de 0,8 s. |
| `phase7-t02.png` | Cuadro del video en t = 0,2 s. | Timecode del clip: `00:00:00.200`. |
| `phase7-t14.png` | Cuadro en t = 1,4 s. | Timecode: `00:00:00.167` (el clip de 1,2 s volvió a empezar). |
| `phase7-t29.png` | Cuadro en t = 2,9 s, dentro de una escena corta. | Timecode: `00:00:00.367` (recorte, no se pasa de la escena). |

## Fase 8 — narración WAV

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase8-wav-narration.webm` | 6,00 s, VP9 1280×720@30 + Opus 48 kHz estéreo. | El WAV PCM se decodifica y se mezcla: pico 0,5817, RMS −20,8 dBFS, correlación 0,9992 con la fuente y desfase 0 ms. |

## Fase 9 — clip MP4 dentro de una escena

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `testclip.mp4` | Clip H.264 (`avc1`, perfil High) 640×360, 2 s: rojo de 0 a 1 s y verde de 1 a 2 s. Generado con ffmpeg/libx264. | Recurso MP4 de entrada. |
| `phase9-mp4-scene.webm` | 2,97 s, VP9 1280×720@30, escena de 3 s con el MP4 como fondo. | El navegador decodifica el MP4 y `drawImage` lo usa en el frame correcto. Con el velo oscuro del render, el píxel muestreado es (98,14,26) en t = 0,5 s, (8,103,26) en t = 1,5 s y otra vez (98,14,26) en t = 2,5 s: rojo → verde → rojo por el bucle del clip de 2 s. |
| `phase9-t05.png` | Cuadro del canvas en t = 0,5 s (1280×720). | Mismo resultado que el video, extraído directamente del motor de render. |

## Fase 10 — exportación completa desde la UI

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase10-export-modal.png` | Captura del modal «Confirmar exportación» (360×712). | Antes de exportar se muestran la resolución real (1280 × 720), el formato real (WebM · VP9 · Opus), el modo (WebCodecs), la narración (`narracion-prueba.wav`), la duración (5 s · 150 cuadros · 30 fps) y el nombre saneado del archivo. |
| `phase10-ui-export.webm` | Exportación de 5 s descargada pulsando «Exportar» y luego «Descargar .webm» en la UI. El navegador propuso `prueba-fase-10-exportacion-completa-720p.webm`. | Flujo completo de usuario: proyecto creado en la app, dos escenas, WAV importado en la Biblioteca y exportado. ffmpeg: VP9 1280×720@30 + Opus 48 kHz estéreo, RMS 0,0945, pico 0,5817, correlación 0,9992 con el WAV y desfase 0 (voz audible). |
| `phase10-result-panel.png` | Captura del panel «Video exportado» (360×712). | La UI confirma el formato, el modo y la narración usada, y ofrece la descarga. |

## Fase 11 — pruebas de comportamiento

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase11-export-after-refactor.webm` | La misma exportación de la fase 10 repetida después de extraer `fitNarrationChannels` para las pruebas. | El camino nuevo de narración (decodificar y recortar/rellenar muestras) produce el mismo audio: 5,00 s, RMS 0,0945 y correlación 0,9992 con el WAV, desfase 0. |

Las pruebas automatizadas no generan archivos: se ejecutan con `npx vitest run` (17 pruebas en 5 archivos).

## Cómo reproducirlo

1. `npm install` y `npm run dev`.
2. Crear un proyecto, añadir escenas y, si hace falta audio, importar `narracion-prueba.wav` en la Biblioteca.
3. «Exportar video» → «Exportar» → «Descargar .webm».
4. Analizar con ffmpeg:

```bash
ffmpeg -i archivo.webm                      # duración, códecs, resolución, fps
ffmpeg -i archivo.webm -vn -f f32le -ac 1 -ar 48000 audio.f32   # PCM para comparar con la fuente
```

`ffmpeg-static` no está en `package.json`; se instaló con `npm i --no-save ffmpeg-static` solo para estas
verificaciones.

## Límites de esta evidencia

- Todo se ejecutó en Chromium 156 (Linux, x64) dentro del entorno de desarrollo. Safari y Firefox no se
  probaron.
- El MP4 verificado es H.264 en Chromium. No se probaron otros códecs MP4 (HEVC, AV1) ni navegadores sin
  decodificador H.264.
- El audio propio de un clip de video se ignora: la única pista de audio del archivo exportado es la
  narración del proyecto.
- Las capturas se tomaron con un viewport estrecho (360×712), por eso el texto aparece partido; el contenido
  es el real de la app.
