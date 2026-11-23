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

## Fase 13 — música de fondo con ducking

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `test-voice-gated-2s.wav` | Tono de 1 kHz a amplitud 0,3 durante 2 s (WAV PCM 48 kHz estéreo). | Hace de voz: hay narración de 0 a 2 s y silencio de 2 a 4 s, así se puede medir el ducking por tramos. |
| `test-music-200hz.mp3` | Tono de 200 Hz a amplitud 0,5 durante 30 s (MP3 192 kbps). | Hace de música: se distingue de la voz por frecuencia y se repite en bucle si el video es más largo. |
| `test-sfx-4000hz.mp3` | Tono de 4 kHz de 0,4 s (MP3 192 kbps). | Efecto de sonido de la fase 14. |
| `phase13-export-modal.png` | Captura del modal de exportación (360×712). | Muestra la narración `voz-1000hz-2s.wav`, la música `musica-200hz.mp3`, 4 s · 120 cuadros · 30 fps y el nombre `prueba-fase-13-mezcla-720p.webm`. |
| `phase13-music-ducking.webm` | Export real descargado pulsando el botón, 4,00 s, VP9 1280×720@30 + Opus 48 kHz estéreo. | La música baja durante la voz: medida con Goertzel sobre el PCM extraído con ffmpeg, la componente de 200 Hz vale 0,0182 en 0,8–1,8 s (voz) y 0,0593 en 3,0–3,9 s (silencio), es decir el 30,7 % (−10,3 dB). La voz de 1 kHz aparece a 0,0375 en la primera mitad y desaparece en la segunda. |

## Fase 14 — efecto de sonido por escena

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase14-export-modal.png` | Captura del modal de exportación (360×712). | Muestra «Efectos por escena: 1 asignado(s)» junto a la narración y la música. |
| `phase14-scene-sfx.webm` | Export real de 4,00 s (VP9 1280×720@30 + Opus), dos escenas de 2 s; la segunda lleva `test-sfx-4000hz.mp3`. | El efecto suena al inicio de su escena y solo allí: la componente de 4 kHz vale 0,0480 en t = 2,0–2,3 s, 0,0000 en 0,4–0,7 s y 0,0000 en 2,4–2,7 s. La música de 200 Hz sigue con ducking (0,0187 con voz, 0,0593 al final) y la voz de 1 kHz solo en la primera escena. |

## Fase 15 — subtítulos editables

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase15-subtitles.webm` | Export real de 4,00 s (VP9 1280×720@30 + Opus) tras escribir dos subtítulos en la UI: «PRIMERA LINEA EDITABLE» y «SEGUNDA LINEA DISTINTA» en la escena de 2 s. | Los subtítulos escritos a mano llegan al video, no se derivan de la narración (que se cambió a otro texto) y se reparten a partes iguales de la escena. |
| `phase15-t05.png` | Cuadro extraído con ffmpeg en t = 0,5 s (1280×720). | Se ve el primer subtítulo en el recuadro inferior centrado. |
| `phase15-t15.png` | Cuadro extraído en t = 1,5 s. | Se ve el segundo subtítulo, en la misma posición y con el texto correcto. |

## Fase 16 — deshacer / rehacer

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase16-header-undo.png` | Captura del header (360×712) justo después de borrar la segunda escena. | El botón «Deshacer» muestra el paso disponible y «Rehacer» está a 0 y deshabilitado. En la misma sesión, Ctrl+Z restauró la escena con su SFX y su subtítulo y Ctrl+Y / Ctrl+Shift+Z rehicieron el borrado. |

El resto de la prueba es automatizado: `src/__tests__/history.test.ts` (5 casos, incluido deshacer un borrado
de escena y recuperar su contenido) y `src/__tests__/subtitles.test.ts` (5 casos).

## Fase 17 — audio en la vista previa del Monitor

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase17-preview-audio.webm` | Audio de 3,9 s capturado de la salida real del Monitor (un `MediaStreamDestination` conectado al mismo `GainNode` que suena), reproduciendo el proyecto de prueba y pulsando Silenciar / Activar sonido. | La vista previa usa la mezcla completa: voz de 1 kHz a 0,0376 con música de 200 Hz a 0,0115 (ducking), silencio de 0,0000 durante el mute y música a 0,0355 sin voz (31 % con voz). El SFX de 4 kHz entra con la segunda escena. |
| `phase17-monitor-av.png` | Captura del Monitor (360×712) con el estado del audio. | El reproductor muestra la mezcla asignada y el estado de reproducción; el botón de silencio es el mismo que actúa sobre la ganancia. |

Las medidas salen de extraer PCM con ffmpeg (`-f f32le -ac 1 -ar 48000`) y aplicar Goertzel en Node, igual que en la fase 13.

## Fase 18 — tiempos individuales por subtítulo

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase18-subtitle-timings-ui.png` | Captura del taller de guion (360×712) con los campos «Inicio (s)» y «Duración (s)». | La UI lee y escribe los tiempos por línea (0,5 s / 1 s y 3 s / 1,5 s). |
| `phase18-subtitle-windows.webm` | Export real de 6 s, VP9 1280×720@30, una escena con dos ventanas explícitas: 0,5–1,5 s y 3,0–4,5 s. | Cada subtítulo aparece solo en su ventana; en los huecos no se dibuja nada. |
| `phase18-t0.3.png`, `phase18-t1.0.png`, `phase18-t2.0.png`, `phase18-t3.5.png`, `phase18-t5.0.png` | Cuadros extraídos con ffmpeg en t = 0,3, 1,0, 2,0, 3,5 y 5,0 s. | «PRIMERA VENTANA» en 1,0 s, «SEGUNDA VENTANA» en 3,5 s y ningún subtítulo en 0,3, 2,0 y 5,0 s. |

## Fase 19 — exportación .srt

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase19-subtitulos.srt` | Archivo descargado desde el botón «Descargar .srt» de la UI (97 bytes). | Contiene dos bloques con timestamps absolutos `00:00:00,500 --> 00:00:01,500` y `00:00:03,000 --> 00:00:04,500`; ffmpeg lo lee y lo reescribe idéntico. |
| `phase19-export-panel.png` | Captura del modal de exportación (360×712). | Muestra «Subtítulos: 2 línea(s)» y el botón «Descargar .srt» junto a Cancelar/Exportar. |
| `phase19-subtitles-burned.mp4` | El video de la fase 18 con el `.srt` quemado por el filtro `subtitles` de ffmpeg. | El archivo es válido para ffmpeg junto al video: el subtítulo se ve en t = 0,8 s y 3,6 s y no en t = 2,0 s, respetando los tiempos absolutos. |
| `phase19-burn-t0.8.png`, `phase19-burn-t2.0.png`, `phase19-burn-t3.6.png` | Cuadros del MP4 anterior. | El texto amarillo del `.srt` aparece y desaparece en los mismos tiempos que en el video original. |
| `phase19-video-con-subtitulos.mkv` | El WebM de la fase 18 con el `.srt` multiplexado como pista de subtítulos (`-c:s srt`). | ffmpeg reconoce `Stream #0:1: Subtitle: subrip (srt)` dentro del contenedor. |

## Fase 20 — historial persistente

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase20-history-after-reload.png` | Captura del header tras recargar la página y abrir el proyecto, después de un Ctrl+Z. | El historial sobrevive a la recarga: el botón muestra «Rehacer (1 pasos)» y el proyecto tiene otra vez 2 escenas / 5 s. Antes de deshacer, tras recargar, el header mostraba «Deshacer (1 pasos)»; Ctrl+Z restauró «Escena B original» con su contenido y Ctrl+Y la volvió a quitar. |

## Fase 21 — guion con Gemini

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase21-guion-generado.png` | Captura del Taller de guion (1440×950) con un guion cargado desde Ideas. | La respuesta de Gemini se convirtió en escenas editables: el proyecto muestra 6 escenas (gancho, 4 escenas y cierre) y el editor permite tocar duración, narración, voz y transición. La captura es de una regeneración posterior usada también para probar las imágenes automáticas (27,2 s); la primera generación dio 6 escenas y 36,4 s. |
| `phase21-ideas-ia.png` | Captura del panel «Generar guion completo con IA». | Muestra el tema, el tono (Documental) y el estado de la clave de Gemini. |

La respuesta de Gemini fue simulada (el entorno no tenía clave). La petición real que salió del navegador se
comprobó con Playwright: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
con `x-goog-api-key`, el tema y el tono en el cuerpo, y el esquema JSON (`visual_intent`, etc.). El diálogo de
reemplazo apareció al regenerar con escenas existentes. Límite: no se llamó al servicio real, así que no se
verifica la calidad del guion ni la disponibilidad del modelo.

## Fase 22 — voz TTS por escena

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase22-voz-por-escena.webm` | Export real de 13 s (VP9 1280×720@30 + Opus 48 kHz estéreo), dos escenas de 5 y 8 s con una voz TTS en cada una. | Cada voz suena al inicio de su escena y no invade la otra. Comparado con los MP3 originales: r = 0,9994 (voz A en 0,5–2,5 s) y r = 0,9993 (voz B en 5,5–7,5 s); cruzadas 0,03; RMS 0 en el hueco 4,2–4,9 s. |

Los MP3 de entrada se generaron con `edge-tts` (voz española real) a partir del texto exacto de cada escena,
y se sirvieron como respuesta simulada de Google Cloud TTS. La app envió cada texto a
`texttospeech.googleapis.com/v1/text:synthesize`, guardó el MP3 en la Biblioteca y lo asignó a su escena
(`narrationAssetId`). Límite: no se llamó a Google Cloud TTS real; la «correlación con el texto» es
acústica (la exportación conserva el audio de la voz generada), no un reconocimiento de voz del texto.

## Fase 23 — imágenes de Pexels

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase23-imagenes-pexels.webm` | Export real de 8 s, dos escenas de 4 s con imagen de Pexels asignada por «Buscar imagen». | Cada imagen aparece en su escena: píxel central (82,24,36) en t = 1 y 3 s (escena 1, imagen roja) y (19,35,98) en t = 5 y 7 s (escena 2, imagen azul). |
| `phase23-t1.png`, `phase23-t5.png` | Cuadros extraídos en t = 1 s y t = 5 s. | Se ven las imágenes descargadas en el orden correcto. |

La API de Pexels se simuló con dos PNG de color sólido. La app envió las consultas reales «coche rojo» y
«coche azul» con la cabecera `Authorization`, descargó los blobs, los guardó con licencia y procedencia, y
los asignó a la escena. También se probó la ruta automática al generar un guion: 6 búsquedas → 6 escenas con
imagen. Límite: no se llamó a la API real de Pexels y no se evaluó la relevancia de las fotos reales.

## Fase 24 — ritmo visual

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase24-cortes-9s.webm` | Export real de 9 s (VP9 1280×720@30) con una escena, imagen principal roja y secundaria azul, cortes automáticos activos. | Muestreando con ffmpeg: principal en 0–3 s, secundaria en 3–6 s y principal otra vez en 6–9 s. Cambios exactos en t = 3 y t = 6 (dos cambios visuales). |
| `phase24-cortes-desactivados.webm` | El mismo proyecto con «Cortes automáticos cada 3 s» desactivado. | Los píxeles en t = 1, 4 y 7 s son rojos: la escena usa solo la imagen principal. |
| `phase24-t1.png`, `phase24-t4.png`, `phase24-t7.png` | Cuadros extraídos del primer video. | Rojo, azul y rojo en los instantes esperados. |

## Fase 25 — música adaptativa

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase25-music-adaptive.webm` | Export real de 9,00 s (VP9 640×360@30 + Opus 48 kHz) generado desde la app. Música de 200 Hz en bucle y voz de 1 kHz entre 4 y 6 s. | La ganancia de la música sigue una curva: 80,8 % al inicio, 100 % en la intro alta, 29,7 % con voz, 97 % al recuperarse y 29 % durante el fundido final. |

Medición (ffmpeg + Goertzel sobre PCM de 48 kHz, ventanas de 0,3 s):

| t | 0,2 s | 2,0 s | 4,5 s | 6,5 s | 8,5 s |
| :--- | ---: | ---: | ---: | ---: | ---: |
| 200 Hz (música) | 0,0300 | 0,0372 | 0,0110 | 0,0361 | 0,0108 |
| 1 kHz (voz) | 0,00001 | 0,00009 | 0,12579 | 0,00000 | 0,00002 |

## Fase 26 — animaciones de texto

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase26-text-animations.webm` | Export real de 6,00 s (VP9 640×360@30, sin audio) con tres subtítulos: Fundido (0,2–2,0 s), Máquina de escribir (2,2–4,0 s) y Deslizamiento (4,2–5,8 s). | Las tres animaciones se dibujan en la exportación, no solo en la vista previa. |
| `phase26-fade-025.png` / `phase26-fade-060.png` | Cuadros en t = 0,25 y 0,6 s. | El subtítulo «FUNDIDO» gana opacidad durante los primeros 0,3 s. |
| `phase26-type-230.png` / `phase26-type-290.png` / `phase26-type-370.png` | Cuadros en t = 2,3, 2,9 y 3,7 s. | La máquina de escribir muestra «MA», luego «MAQUINA DE E» y por último «MAQUINA DE ESCRIBIR». |
| `phase26-slide-425.png` / `phase26-slide-460.png` | Cuadros en t = 4,25 y 4,6 s. | «DESLIZAMIENTO» entra más abajo y tenue, y termina centrado en su caja. |

## Fase 27 — gancho visual

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase27-intro-hook.webm` | Export real de 5,00 s (VP9 640×360@30) de una escena con el gancho «EL GANCHO EN GRANDE». | El texto se superpone en la intro y desaparece a los 3 s. |
| `phase27-hook-005.png` / `phase27-hook-030.png` / `phase27-hook-150.png` | Cuadros en t = 0,05, 0,3 y 1,5 s. | El gancho está visible y hace zoom: el ancho del texto medido baja de 470 px a 447 px. |
| `phase27-sin-gancho-310.png` | Cuadro en t = 3,1 s. | Ya no hay gancho. La luma media del fondo (39,2) es mayor que con el velo (32,6). |

## Fase 28 — biblioteca de música libre

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase28-musica-libre.png` | Captura de la Biblioteca en Chromium (viewport estrecho 360×712). | Se ven la sección «Música libre incluida», las 5 categorías, las pistas y los botones «Escuchar» / «Usar como música». |

En la misma sesión, «Usar como música» guardó un blob MP3 de 193 141 bytes en IndexedDB con licencia
«CC0 1.0 (dominio público)» y procedencia «Biblioteca incluida · Épica · 96 BPM»; `musicAssetId` quedó
apuntando a ese recurso. El navegador headless no confirmó reproducción audible (`readyState` 0), aunque
`play()` se invocó con la URL real de la pista.

## Fase 34 — exportación MP4/H.264

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase34-export.mp4` | Salida directa de `VideoExporter` con `{ container: 'mp4' }`: 2 escenas de 1 s, 640 × 360 a 24 fps, con narración WAV. 151 877 bytes. | ffprobe: `h264` 640×360@24 + `opus` 48 kHz estéreo; duración 2,02 s. El contenedor es MP4 (`ftyp isom`). |
| `phase34-ui-export.mp4` | El archivo descargado pulsando el flujo completo de la UI: «Exportar video» → contenedor MP4 · H.264 → «Ver preview y exportar» → «Descargar .mp4». El navegador propuso `prueba-mp4-ui-fase-34-360p.mp4`. 130 703 bytes. | ffprobe: `h264` 640×360, duración 3,00 s (3 escenas de 1 s), sin pista de audio porque el proyecto no tenía audio. El modal mostró «MP4 · H.264 (avc1.42E01E)» y deshabilitó la exportación cuando el navegador no soporta el códec. |

## Fase 36 — exportar solo audio (WAV)

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase36-audio.wav` | WAV descargado con el botón «Exportar audio» de un proyecto de 3 s con narración de 1 kHz y música de 200 Hz. 576 044 bytes. | ffprobe: `pcm_s16le`, 48 000 Hz, 2 canales, 16 bits, duración 3,000000 s (0,000 s de diferencia con el proyecto). `volumedetect`: media −15,7 dB y pico −8,2 dB, así que la mezcla no está en silencio. La interfaz mostró «prueba-audio-ui-fase-36-mezcla.wav · 3.00 s · 48000 Hz · 2 canales». |

No hay archivo para las fases 33 y 35: la fase 33 se comprobó con la petición real que salió del navegador
(URL de ElevenLabs, cabeceras y cuerpo) y el MP3 resultante asignado a la escena, y la fase 35 leyendo los
`data-value` del panel y comparándolos con el proyecto guardado en IndexedDB. Los detalles están en
`PROJECT_STATUS.md`.

## Fase 11 — pruebas de comportamiento

| Archivo | Qué es | Qué verifica |
| :--- | :--- | :--- |
| `phase11-export-after-refactor.webm` | La misma exportación de la fase 10 repetida después de extraer `fitNarrationChannels` para las pruebas. | El camino nuevo de narración (decodificar y recortar/rellenar muestras) produce el mismo audio: 5,00 s, RMS 0,0945 y correlación 0,9992 con el WAV, desfase 0. |

Las pruebas automatizadas no generan archivos: se ejecutan con `npx vitest run` (127 pruebas en 24 archivos).

## Cómo reproducirlo

1. `npm install` y `npm run dev`.
2. Crear un proyecto, añadir escenas y, si hace falta audio, importar `narracion-prueba.wav` en la Biblioteca.
   Para la fase 13 se importan `test-voice-gated-2s.wav` (narración) y `test-music-200hz.mp3` (música).
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
- El audio propio de un clip de video se ignora: la pista de audio del archivo exportado es la mezcla de
  los archivos importados (narración, música de fondo y efectos de escena).
- Las capturas se tomaron con un viewport estrecho (360×712), por eso el texto aparece partido; el contenido
  es el real de la app. Las capturas de las fases 21–24 usan 390×844 y la de la fase 28, 360×712.
- Las pistas de `public/music` son composiciones sintetizadas por `scripts/generate-music.mjs`, sin samples
  de terceros, y se publican como CC0. No se comparó su calidad subjetiva con música comercial.
- Las APIs de Gemini, Google Cloud TTS, ElevenLabs y Pexels se simularon con respuestas del mismo formato; no
  se llamó a los servicios reales porque el entorno no tenía claves. En ElevenLabs la respuesta fue un MP3
  real del propio proyecto para poder medir su duración desde los bytes. La voz de la fase 22 sí es habla española real
  (generada con `edge-tts`) y las imágenes de la fase 23 son PNG reales descargados por la app.
