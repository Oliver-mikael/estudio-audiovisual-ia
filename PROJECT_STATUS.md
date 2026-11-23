# Estado real del proyecto

**Última actualización:** 23 de noviembre de 2026
**Resumen:** el flujo «crear proyecto → guion generado o manual → voz e imágenes por escena → exportar WebM»
está implementado y probado en Chromium. Las integraciones de IA (Gemini, Google Cloud TTS y Pexels) son
opcionales y requieren la clave del usuario; los flujos se verificaron con respuestas simuladas porque el
entorno de desarrollo no tenía claves. La nube y Android siguen sin existir.

## Verificado con evidencia

| Área | Estado | Detalle |
| :--- | :--- | :--- |
| Exportación WebCodecs | **Probado** | VP9 + Opus + `webm-muxer`, cuadro por cuadro. Video de prueba de 10,00 s / 300 cuadros, correlación 0,9991 con la voz fuente. |
| Narración importada | **Probado (MP3)** | `decodeAudioData` en `OfflineAudioContext` 48 kHz estéreo, recortada a la duración del proyecto. |
| Nombre y extensión del archivo | **Probado** | Chrome descargó `…-720p.webm`; el nombre se sanea y la extensión sale del MIME real. |
| Exportación completa desde la UI | **Probado** | Proyecto creado en la pantalla de inicio, dos escenas (3 s + 2 s), WAV importado en la Biblioteca y «Exportar video». El modal mostró 1280 × 720, WebM · VP9 · Opus, WebCodecs, la narración y el nombre `prueba-fase-10-exportacion-completa-720p.webm`; la descarga del navegador usó ese mismo nombre. ffmpeg: 5,00 s, VP9 1280×720@30 + Opus 48 kHz estéreo, RMS 0,0945, pico 0,5817, correlación 0,9992 con el WAV y desfase 0. |
| Respaldo sin WebCodecs | **Probado (Chromium, forzado)** | `MediaRecorder` + `captureStream(0)` con audio real; el WebM no declara duración. |
| Pantalla de inicio y proyectos | **Implementado** | Crear, abrir, renombrar y eliminar contra IndexedDB. No se ha probado con cuota llena. |
| Editor y navegación lateral | **Implementado** | Una sección visible a la vez; tipografía 14/18/12 px; textos en español. |
| Reordenar escenas | **Implementado** | Drag & drop nativo; no se probó con lector de pantalla ni táctil. |
| Imagen de escena desde la Biblioteca | **Implementado** | Resuelve el blob y lo asigna a `imageUrl`. |
| Autoguardado | **Implementado** | Debounce de 1 s; el aviso de cuota está escrito pero no se forzó un fallo real. |
| Transiciones | **Probado** | Fundido, Deslizamiento y Zoom compuestos en buffers. Export real (4,5 s) con fundido medido: color medio interpolado de forma monotona. |
| Resolución y FPS | **Probado** | 480p/720p/1080p y 24/30/60 fps. Export real 1920×1080 a 30 fps confirmado por ffmpeg. |
| Límite móvil | **Probado (simulado)** | Con UA de Android, una petición de 1080p/60 se exporta a 1280×720/30 (`mobileLimited=true`). No se probó en un teléfono real. |
| Clips de video en escenas | **Probado (WebM y MP4)** | WebM VP8 de 1,2 s en escena de 2,5 s: el timecode interno vuelve a ~0,2 s a los 1,4 s (bucle); en escena de 0,8 s se recorta. MP4 H.264 (`avc1`, 640×360, 2 s) en escena de 3 s: píxel (98,14,26) en t=0,5 s, (8,103,26) en t=1,5 s y otra vez (98,14,26) en t=2,5 s (bucle), medido en el canvas y en el WebM exportado. El clip se reproduce mudo: su audio propio se ignora. |
| Narración WAV | **Probado** | WAV PCM 48 kHz estéreo (voz TTS). Export de 6 s: Opus 48 kHz, pico 0,58, RMS −20,8 dBFS, correlación 0,9992 con la fuente y desfase 0 ms. |
| Guion generado con Gemini | **Probado con respuesta simulada** | El flujo real de la UI envió la petición a `gemini-2.5-flash:generateContent` con la clave en `x-goog-api-key`, el tema y el tono. La respuesta JSON se normalizó y el proyecto pasó a 6 escenas editables (gancho, 4 del guion y cierre) en el Taller. Regenerar pidió confirmación antes de reemplazar. El entorno no tenía clave de Gemini: no se llamó al servicio real. |
| Voz TTS por escena | **Probado con respuesta simulada** | «Generar voz» envió el texto exacto de cada escena a `texttospeech.googleapis.com` y el stub devolvió dos MP3 de voz española real (3,98 s y 6,76 s). Los dos quedaron en la Biblioteca y asignados a su escena. Export real de 13 s: la voz A correlaciona 0,9994 en 0,5–2,5 s, la B 0,9993 en 5,5–7,5 s, las cruzadas 0,03 y el hueco entre escenas tiene RMS 0. No se llamó a Google Cloud TTS real (sin clave). |
| Imágenes de Pexels | **Probado con respuesta simulada** | «Buscar imagen» envió «coche rojo» y «coche azul» con `Authorization`, descargó las dos imágenes, las guardó con licencia/procedencia y las asignó a su escena. Export real de 8 s: píxel central (82,24,36) en t = 1 y 3 s y (19,35,98) en t = 5 y 7 s. Al generar un guion con clave configurada se buscaron 6 imágenes y las 6 escenas quedaron con imagen. No se llamó a la API real de Pexels (sin clave). |
| Ritmo visual (B-roll) | **Probado** | Escena de 9 s con imagen principal y secundaria, export real: (82,24,36) en t = 1 s, (19,35,98) en t = 4 s y (82,24,36) en t = 7 s; los cambios ocurren exactamente en 3 s y 6 s. Con «Cortes automáticos» desactivado los tres instantes son rojos. En escenas de 4 s o menos no hay cortes. |
| Música adaptativa | **Probado** | Curva de ganancia por timestamp en lugar de valor fijo: intro al 80 % subiendo, ducking al 30 % con voz y cierre al 100 % con fundido. Export real de 9 s (música de 200 Hz + voz de 1 kHz de 4 a 6 s). Componente de 200 Hz medida con ffmpeg/Goertzel en cinco puntos: 0,0300 (t = 0,2 s), 0,0372 (t = 2,0 s), 0,0110 con voz (t = 4,5 s), 0,0361 (t = 6,5 s) y 0,0108 en el fundido (t = 8,5 s), es decir 80,8 %, 100 %, 29,7 %, 97 % y 29 % del volumen de referencia. La voz de 1 kHz solo aparece en t = 4,5 s. |
| Animaciones de subtítulo | **Probado** | Cada línea elige Fundido, Máquina de escribir o Deslizar hacia arriba. Export real de 6 s con tres líneas: cuadros en t = 0,25 y 0,6 s muestran el fundido ganando opacidad; la máquina de escribir muestra «MA» en t = 2,3 s, «MAQUINA DE E» en t = 2,9 s y «MAQUINA DE ESCRIBIR» completa en t = 3,7 s; el deslizamiento aparece más abajo y tenue en t = 4,25 s y centrado en t = 4,6 s. |
| Gancho visual en la intro | **Probado** | Texto grande y centrado sobre la primera escena con zoom 110 % → 100 % en 0,5 s, velo oscuro y casilla para desactivarlo. Export real de 5 s: el gancho se ve en t = 0,05, 0,3 y 1,5 s y ya no aparece en t = 3,1 s. El ancho del texto medido pasa de 470 px (t = 0,05) a 447 px (t = 0,3) y la luma media del fondo baja de 39,2 a 32,6 con el velo. |
| Biblioteca de música libre | **Probado** | 10 pistas MP3 CC0 de 16 s (Épica, Suave, Tecnología, Misterio y Motivacional) servidas desde `/music`. En Chromium, la Biblioteca mostró las categorías y las pistas; «Escuchar» pidió el MP3 real correspondiente y «Usar como música» guardó en IndexedDB un blob de 193 141 bytes (`audio/mpeg`), lo asignó a `musicAssetId` y la cabecera pasó a mostrar «Música: Amanecer heroico.mp3». La reproducción audible no se pudo confirmar en el navegador headless (el elemento quedó en `readyState` 0). |
| Subtítulos editables | **Probado** | Cada escena tiene su lista de subtítulos (`scene.subtitles`), independiente del texto de narración. Se añaden, editan y borran en el taller de guion y cada línea puede tener su propio inicio y duración. Export real de 4 s con dos subtítulos en una escena de 2 s: los cuadros en t = 0,5 s y t = 1,5 s muestran «PRIMERA LINEA EDITABLE» y «SEGUNDA LINEA DISTINTA». Antes se derivaban de `text.split('. ')` y no se podían editar; no se genera ninguno si la lista está vacía. |
| Ventanas por subtítulo | **Probado** | Export real de 6 s con ventanas explícitas de 0,5–1,5 s y 3,0–4,5 s: los cuadros extraídos muestran «PRIMERA VENTANA» en t = 1,0 s, «SEGUNDA VENTANA» en t = 3,5 s y ningún subtítulo en t = 0,3, 2,0 y 5,0 s. Las escenas antiguas con solo texto siguen repartiéndose en partes iguales. |
| Exportación .srt | **Probado** | Botón «Descargar .srt» en el modal y el panel de exportación. El archivo descargado desde la UI (97 bytes, dos líneas) lo lee ffmpeg y lo reescribe con los mismos timestamps; quemado con el filtro `subtitles` sobre el video de la fase 18 aparece en t = 0,8 s y 3,6 s y no en t = 2,0 s. También se multiplexó como pista `subrip` en un MKV junto al video. |
| Historial persistente | **Probado** | El historial de 50 pasos se guarda en el almacén `history` de IndexedDB y se restaura al abrir el proyecto. En Chromium: borrar la segunda escena, recargar la página, abrir el proyecto → el header muestra «Deshacer (1 pasos)»; Ctrl+Z restaura «Escena B original» con su narración y su subtítulo, Ctrl+Y la quita y Ctrl+Z la vuelve a restaurar. Se borra con el proyecto. |
| Efecto de sonido por escena | **Probado** | En el taller de guion se asigna un audio de la Biblioteca como SFX de una escena (`scene.sfxAssetId`); suena una vez al inicio de la escena, mezclado con narración y música. Export real de 4 s (dos escenas de 2 s, SFX en la segunda): la componente de 4 kHz vale 0,0480 en t = 2,0–2,3 s y 0,0000 en 0,4–0,7 s y en 2,4–2,7 s. |
| Vista previa con audio | **Probado** | El Monitor reproduce la mezcla completa (`prepareProjectAudio`) con un `AudioContext`. Se capturó su salida real (MediaStreamDestination del `GainNode`) en Chromium: voz 1 kHz a 0,0376 y música 200 Hz a 0,0115 con voz; mute a 0,0000; música a 0,0355 sin voz (31 % con voz, mismo ducking que la exportación); SFX de 4 kHz en la segunda escena. La fuente arranca en el offset pedido, se detiene al pausar y se recoloca al hacer scrub; el botón de silencio lleva la ganancia a 0 y a 1. |
| Música de fondo con ducking | **Probado** | Un audio se marca aparte como «música» en la Biblioteca; se mezcla en bucle con la narración y baja al 30 % mientras hay voz. Export real por la UI de 4 s (voz 1 kHz de 0 a 2 s + música 200 Hz): la música medida a 200 Hz vale 0,0593 sin voz y 0,0182 con voz (30,7 %, −10,3 dB) y vuelve a subir en el silencio. El volumen general de la música (0–100 %) se guarda en Ajustes del proyecto. |
| Compilación | **Probado** | `npx tsc --noEmit` sin errores; `npm run build` correcto. |
| Pruebas unitarias | **Probado** | `npx vitest run`: 93 pruebas en 18 archivos. Persistencia real en IndexedDB (guardar, recargar el módulo y recuperar; historial persistido y restaurado), nombre de archivo ASCII, límite móvil con user agent de Android, opacidad del Fundido cuadro a cuadro, recorte/relleno de la narración, envolvente de ducking y bucle de la música, curva adaptativa por timestamp, animaciones de subtítulo, gancho de la intro, catálogo de música CC0, reparto y ventanas de subtítulos, generación de `.srt`, historial de deshacer/rehacer, normalización de la respuesta de Gemini, peticiones y respuestas de TTS y Pexels, palabras clave visuales y cortes automáticos. No cubren la UI ni una exportación completa. |

## No implementado o no verificado

| Área | Estado | Detalle |
| :--- | :--- | :--- |
| APIs contra los servicios reales | **Sin verificar** | Gemini, Google Cloud TTS y Pexels están implementados, pero no se llamaron con claves reales en este entorno. La verificación usó respuestas simuladas con la misma forma que las APIs. |
| IA de ideas y crítica | **No existe** | «Sugerir ángulo crítico» son textos fijos y la crítica de guion son reglas heurísticas; solo el guion completo usa Gemini. |
| Nube, sync, multiusuario | **Eliminado** | `cloudApi`, `syncEngine` y `jobQueueManager` se borraron; no hay backend conectado. |
| Android (Capacitor) | **No verificado** | Solo queda la configuración; no hay build ni pruebas en dispositivo. |
| MP4/H.264 de salida | **No implementado** | La salida es siempre WebM. Un MP4 H.264 sí funciona como clip dentro de una escena (verificado en Chromium). |
| Clips con audio propio | **No implementado** | El clip de escena se decodifica mudo; la única pista de audio exportada es la narración del proyecto. |
| Códecs MP4 distintos de H.264 | **No verificado** | Solo se probó `avc1` (H.264) en Chromium; HEVC, AV1 y navegadores sin decodificador H.264 quedan sin probar. |
| Pruebas de UI y de exportación | **No existen** | Las 74 pruebas cubren lógica pura y persistencia, no clics reales ni el archivo exportado. Esas comprobaciones se hicieron a mano en Chromium y quedan en `artifacts/`. |
| Safari y Firefox | **No verificado** | Sin WebCodecs se usaría el respaldo en tiempo real; no se probó. |
| Narración por escena importada | **No implementado** | La voz por escena se genera con TTS; no hay un selector para asignar un audio importado de la Biblioteca a una escena concreta (sí se puede usar como narración global, música o SFX). |
| Calidad de las imágenes de Pexels | **Sin verificar** | La búsqueda usa las primeras palabras clave de la intención visual y la primera foto; no hay selección entre varias candidatas ni edición de la consulta desde la UI. |
| Deshacer / rehacer | **Probado** | Historial de hasta 50 estados del proyecto. Ctrl+Z deshace y Ctrl+Y / Ctrl+Shift+Z rehace; el header muestra botones con el número de pasos disponibles. En Chromium: borrar la segunda escena (2 → 1), Ctrl+Z la restaura con su título, su SFX y su subtítulo, Ctrl+Y la vuelve a quitar y Ctrl+Shift+Z la rehace. Las pulsaciones seguidas en un mismo campo de texto se agrupan en un solo paso. Pruebas automatizadas: `history.test.ts` (5) e `history-persistence.test.ts` (3). |
| Historial de versiones guardadas | **No implementado** | El deshacer persiste hasta 50 pasos, pero no hay versiones con nombre y fecha ni restauración más allá de ese límite. |
| Persistencia más allá del navegador | **No existe** | IndexedDB local; borrar datos del sitio borra los proyectos. |

## Notas sobre documentación antigua

Los documentos de `docs/` (arquitectura cloud, auditorías, roadmap y changelog anteriores) describen un
diseño previsto, no el estado actual. Donde afirman que la sincronización, la cola de trabajos o el
despliegue Android están «operativos», debe leerse como diseño no implementado: ese código ya no está en el
repositorio.
