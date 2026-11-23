# Registro de cambios

Los cambios de las dos últimas sesiones de trabajo. Las versiones anteriores (1.2.0 a 2.1.0) están en
[docs/CHANGELOG.md](docs/CHANGELOG.md) y describen documentación de diseño, no funcionalidad verificada.

## [Sin publicar] — 23 de noviembre de 2026 (fases 21–24)

### Añadido

- **Guion completo con Gemini** (fase 21): en Ideas hay un campo «Tema del video», un selector de tono
  (Educativo, Documental, Entretenimiento, Historia) y «Generar guion». La petición pide un JSON con gancho
  de 15 palabras o menos, 4–6 escenas (título, narración de 2–4 oraciones, intención visual y duración) y
  un cierre con llamada a la acción. La respuesta se normaliza (acepta bloques de código y nombres de campo
  alternativos) y se carga en el Taller como escenas editables: gancho, cuerpo y cierre. Si el proyecto ya
  tenía escenas, se pide confirmación. La clave de Gemini y el modelo se configuran en Ajustes del proyecto.
- **Voz TTS por escena** (fase 22): «Generar voz» usa Google Cloud TTS con voz femenina o masculina, guarda
  el MP3 en la Biblioteca y lo asigna a la escena (`scene.narrationAssetId`). La mezcla coloca cada voz al
  inicio de su escena y la recorta a su duración; la narración global anterior sigue funcionando. Si la
  escena ya tenía voz se pide confirmación. «Escuchar» reproduce la narración con la Web Speech API sin
  clave, pero no genera archivo (el navegador no expone sus muestras).
- **Imágenes automáticas con Pexels** (fase 23): la clave de Pexels se configura en Ajustes. «Buscar imagen»
  extrae palabras clave de la intención visual, busca una foto horizontal, la descarga como blob, la guarda
  en la Biblioteca y la asigna a la escena. Al generar un guion con clave de Pexels se busca una imagen para
  cada escena generada (6 búsquedas en la prueba) y se pueden reemplazar a mano.
- **Ritmo visual con cortes automáticos** (fase 24): en escenas de más de 4 segundos con imagen secundaria,
  el renderer alterna imagen principal → secundaria cada 3 segundos (0–3 s principal, 3–6 s secundaria,
  6–9 s principal). Hay un selector de imagen secundaria y una casilla «Cortes automáticos cada 3 s» por
  escena; con la casilla desactivada se usa solo la principal. Funciona igual en el Monitor y en la
  exportación.

### Verificado con archivos reales

- **Fase 21**: en Chromium, con la respuesta de Gemini simulada (el entorno no tiene clave), la petición real
  salió a `…/models/gemini-2.5-flash:generateContent` con la cabecera de la clave, el tema y el tono; el
  proyecto pasó de 0 a 6 escenas (gancho + 4 del guion + cierre), visibles en el Taller, y el diálogo de
  reemplazo apareció al regenerar. Captura: `artifacts/phase21-guion-generado.png`.
- **Fase 22**: el stub de Google TTS devolvió dos MP3 de voz española real (generados con `edge-tts`, 3,98 s
  y 6,76 s) para el texto exacto de cada escena. En la app se pulsó «Generar voz» en las dos escenas; los
  archivos quedaron en la Biblioteca y asignados a su escena. La exportación real (13 s, VP9 1280×720@30 +
  Opus 48 kHz) se descargó y se comparó muestra a muestra: la voz A correlaciona 0,9994 en 0,5–2,5 s, la voz
  B 0,9993 en 5,5–7,5 s, las correlaciones cruzadas son 0,03 y el hueco entre escenas está en silencio
  (RMS 0). Archivo: `artifacts/phase22-voz-por-escena.webm`.
- **Fase 23**: con Pexels simulado (dos PNG de color sólido), «Buscar imagen» envió las consultas «coche
  rojo» y «coche azul» con la cabecera `Authorization`, guardó las dos imágenes con su licencia y procedencia,
  y las asignó a la escena correcta. La exportación real de 8 s se descargó y se midió el píxel central:
  (82,24,36) en t = 1 y 3 s (escena roja) y (19,35,98) en t = 5 y 7 s (escena azul). También se verificó la
  ruta automática al generar un guion: 6 búsquedas → 6 escenas con imagen. Archivos:
  `artifacts/phase23-imagenes-pexels.webm`, `phase23-t1.png`, `phase23-t5.png`.
- **Fase 24**: escena de 9 s con imagen principal roja y secundaria azul. La exportación real
  (`artifacts/phase24-cortes-9s.webm`) muestrea (82,24,36) en t = 1 s, (19,35,98) en t = 4 s y (82,24,36) en
  t = 7 s: dos cambios visuales, en 3 s y 6 s. Con la casilla desactivada
  (`phase24-cortes-desactivados.webm`) los tres instantes son rojos. Cuadros: `phase24-t1.png`,
  `phase24-t4.png`, `phase24-t7.png`.

## [Sin publicar] — 22 de noviembre de 2026 (fases 17–20)

### Añadido

- **Audio en la vista previa del Monitor** (fase 17): el reproductor prepara la misma mezcla que la
  exportación (`prepareProjectAudio`: narración + música en bucle con ducking + efectos por escena) y la
  reproduce con un `AudioContext`. La fuente se detiene al pausar y se recoloca al mover la barra de tiempo
  o reiniciar; el botón de silencio controla un `GainNode` real (antes no hacía nada). El reproductor muestra
  el estado del audio y el punto desde el que suena.

- **Tiempos individuales por subtítulo** (fase 18): cada línea guarda opcionalmente `startSeconds` y
  `durationSeconds`. El editor del taller de guion tiene campos de inicio y duración (y un enlace para volver
  al reparto automático); el renderer dibuja cada subtítulo solo dentro de su ventana y no dibuja nada en
  los huecos ni fuera de la escena. Las escenas guardadas con solo texto siguen usando el reparto en partes
  iguales.

- **Exportación .srt** (fase 19): botón «Descargar .srt» en el modal y en el panel de exportación. El
  archivo incluye todos los subtítulos de todas las escenas con timestamps absolutos (`HH:MM:SS,mmm`),
  omite líneas vacías y ventanas sin duración, y usa un nombre ASCII terminado en `.srt`.

- **Historial persistente** (fase 20): el historial de hasta 50 pasos se guarda en un almacén de IndexedDB
  (`history`, un registro por proyecto) y se restaura al abrir el proyecto, revalidando las URLs de medios de
  cada instantánea. Se borra con el proyecto, se vuelca al volver al inicio y se intenta guardar al cerrar
  la pestaña.

### Verificado con archivos reales

- `artifacts/phase17-preview-audio.webm`: audio capturado de la propia salida del Monitor (MediaStreamDestination
  del `GainNode`) mientras se reproducía, se silenciaba y se reactivaba. Con ffmpeg y Goertzel: voz de 1 kHz a
  0,0376 y música de 200 Hz a 0,0115 con voz; silencio (0,0000) durante el mute; música a 0,0355 sin voz
  (≈31 % con voz, el mismo ducking que la exportación). El SFX de 4 kHz aparece al empezar la segunda escena.
  En Chromium la fuente arrancó con offset 0, se detuvo al pausar y volvió a arrancar con offset 2,5 s tras
  hacer scrub; el mute llevó la ganancia a 0 y a 1.
- `artifacts/phase18-subtitle-windows.webm` y `phase18-t0.3/1.0/2.0/3.5/5.0.png`: export real de 6 s con dos
  ventanas explícitas (0,5–1,5 s y 3,0–4,5 s). Los cuadros muestran «PRIMERA VENTANA» en t = 1,0 s,
  «SEGUNDA VENTANA» en t = 3,5 s y ningún subtítulo en 0,3, 2,0 y 5,0 s.
- `artifacts/phase19-subtitulos.srt`: archivo descargado desde el botón de la UI; ffmpeg lo lee y lo
  reescribe con los mismos tiempos. Quemado con `subtitles` de ffmpeg sobre el video de la fase 18
  (`phase19-subtitles-burned.mp4`, cuadros `phase19-burn-t0.8/2.0/3.6.png`) muestra el primer subtítulo en
  t = 0,8 s, ninguno en t = 2,0 s y el segundo en t = 3,6 s. También se multiplexó como pista `subrip` en
  `phase19-video-con-subtitulos.mkv`.
- `artifacts/phase20-history-after-reload.png`: tras borrar la segunda escena, recargar la página y abrir el
  proyecto, el header mostró «Deshacer (1 pasos)». Ctrl+Z restauró «Escena B original» con su narración y su
  subtítulo; Ctrl+Y la volvió a quitar y Ctrl+Z la restauró otra vez.
- `npx tsc --noEmit` sin errores, `npx vitest run` 43/43 en 10 archivos y `npm run build` correcto.

### Limitaciones que siguen

- El audio del Monitor se prepara al abrir la sección y se rehace al cambiar recursos, volumen o duración de
  escenas; no hay pista de audio propia por clip de video.
- No se exporta `.vtt` ni hay estilos configurables de subtítulos; los tiempos se ajustan a mano, sin
  herramienta de sincronización.
- El historial persiste los últimos 50 pasos del deshacer, no versiones con nombre ni restauración más allá
  de ese límite.

## [Sin publicar] — 22 de noviembre de 2026 (fases 13–16)

### Añadido

- **Música de fondo con ducking** (fase 13): la Biblioteca permite marcar un audio como **música de fondo**,
  separado de la narración (`musicAssetId`). El exportador mezcla narración + música: la música suena en
  bucle, al volumen general del proyecto (`settings.musicVolume`, 60 % por defecto) y baja al **30 %**
  mientras hay voz, con ataque de 0,12 s y liberación de 0,4 s. Se ajusta en Ajustes del proyecto y el modal
  de exportación muestra la música y los efectos asignados.

- **Efectos de sonido por escena** (fase 14): cada escena guarda `sfxAssetId` y suena una sola vez al
  inicio de la escena, mezclado con narración y música (ganancia fija de 0,8). Se asigna en el taller de
  guion con un desplegable de los audios de la Biblioteca.

- **Subtítulos editables** (fase 15): cada escena guarda su lista de subtítulos y ya no se derivan de
  `narrationText.split('. ')`. En el taller de guion se añaden, editan y borran; el render los reparte en
  partes iguales de la duración de la escena (`subtitleAt`, función pura y probada) y no dibuja nada si la
  lista está vacía. Editar la narración ya no toca los subtítulos, ni al revés.

- **Deshacer / rehacer** (fase 16): historial de hasta 50 estados (`services/history/history.ts`, lógica
  pura). Ctrl+Z deshace, Ctrl+Y y Ctrl+Shift+Z rehacen, y la cabecera muestra dos botones con el número de
  pasos disponibles. Las pulsaciones seguidas en un mismo campo de texto se agrupan en un paso para no
  llenar el historial con cada carácter. El taller de guion sincroniza su lista local al restaurar un
  estado.

### Verificado con archivos reales

- `artifacts/phase16-header-undo.png`: captura del header tras borrar una escena, con «Deshacer 1» activo y
  «Rehacer 0» deshabilitado. En la misma sesión de Chromium, Ctrl+Z restauró la escena con su título, su
  efecto de sonido y su subtítulo; Ctrl+Y la volvió a borrar y Ctrl+Shift+Z la rehizo.
- `artifacts/phase15-subtitles.webm` con `phase15-t05.png` y `phase15-t15.png`: export real de 4 s con dos
  subtítulos escritos desde la UI en una escena de 2 s. Los cuadros extraídos con ffmpeg en t = 0,5 s y
  t = 1,5 s muestran «PRIMERA LINEA EDITABLE» y «SEGUNDA LINEA DISTINTA» en el recuadro inferior.
- `artifacts/phase14-scene-sfx.webm`: export real de 4 s con dos escenas y un SFX de 4 kHz en la segunda.
  Medido con ffmpeg: 4 kHz a 0,0480 en t = 2,0–2,3 s y 0,0000 fuera de ese tramo, con narración y música
  presentes a la vez.
- `artifacts/phase13-music-ducking.webm`: export real por la UI (4 s, VP9 1280×720@30 + Opus). Narración de
  1 kHz de 0 a 2 s y música de 200 Hz. Analizado con ffmpeg: la música a 200 Hz vale **0,0593 sin voz** y
  **0,0182 con voz** (30,7 %, −10,3 dB), y vuelve a subir tras la narración.

### Limitaciones que siguen

- La música es una sola pista global, sin puntos de entrada/salida ni fundidos propios.
- El SFX no tiene control de volumen propio ni se puede retrasar dentro de la escena.
- Los subtítulos no tienen tiempos individuales ni se exportan como `.srt`/`.vtt`.
- El historial de deshacer vive en memoria: se pierde al recargar y no hay versiones persistentes.

## [Sin publicar] — 22 de noviembre de 2026 (fases 9–12)

### Añadido

- **Clips MP4 en escenas**: verificado un MP4 H.264 (`avc1`) como fondo de escena, con bucle y recorte, en
  Chromium. No hubo que cambiar código: el mismo `HTMLVideoElement` + `drawImage` sirve para ambos
  contenedores; ahora está documentado.
- **Exportación completa desde la UI**: el flujo proyecto → escenas → narración WAV → «Exportar video» →
  descarga se probó de punta a punta, incluido el nombre real del archivo.
- **Pruebas de comportamiento**: se sustituyeron las 8 pruebas de constantes por 17 pruebas (5 archivos)
  sobre persistencia real en IndexedDB, nombre de archivo, límite móvil, opacidad del Fundido y
  recorte/relleno de la narración. Se añadió `fake-indexeddb` como dependencia de desarrollo.
- **Evidencias versionadas** en `artifacts/` con un README que describe cada archivo y qué verifica.

### Cambiado

- `renderEngine.ts`: la resolución de la línea de tiempo es ahora una función pura exportada
  (`computeTransitionFrame`, `fadeOpacity`, `transitionSecondsFor`) que usan el render y las pruebas. Una
  escena empieza en su instante exacto de inicio (intervalo semiabierto), así el primer cuadro de una
  transición tiene opacidad 0.
- `audioTrack.ts`: `prepareNarration` decodifica a 48 kHz y ajusta las muestras con `fitNarrationChannels`
  (recorte o silencio) en lugar de renderizar con `OfflineAudioContext`.

### Verificado con archivos reales

- `artifacts/phase9-mp4-scene.webm`: escena de 3 s con un MP4 H.264 de 2 s; el píxel pasa de rojo a verde y
  vuelve a rojo (bucle) en los tiempos esperados.
- `artifacts/phase10-ui-export.webm`: descargado pulsando el botón, nombre
  `prueba-fase-10-exportacion-completa-720p.webm`, 5,00 s, VP9 + Opus, correlación 0,9992 con el WAV.
- `artifacts/phase11-export-after-refactor.webm`: misma exportación tras el cambio de narración; audio
  idéntico (RMS 0,0945, correlación 0,9992, desfase 0).
- `npx tsc --noEmit` sin errores, `npx vitest run` 17/17 y `npm run build` correcto.

### Limitaciones que siguen

- La salida sigue siendo WebM; el MP4 solo se probó como entrada de escena y solo con H.264 en Chromium.
- El clip de escena se reproduce mudo.
- Las pruebas no cubren la UI ni una exportación completa; eso se comprobó a mano en Chromium.

## [Sin publicar] — 22 de noviembre de 2026 (fases 5–8)

### Añadido

- **Transiciones reales en el render**: Fundido, Deslizamiento y Zoom, con composición en buffers fuera de
  pantalla y **duración configurable por escena** (0,5 s por defecto). Corte sigue siendo el cambio directo.
  Verificado exportando `artifacts/phase5-transitions.webm`.
- **Resolución y FPS configurables** (480p/720p/1080p y 24/30/60 fps) en la nueva sección **Ajustes**, usados
  por la previsualización y la exportación.
- **Límite automático en Android/móvil** a 720p y 30 fps, con aviso en Ajustes y en el modal de exportación.
  Verificado simulando el user agent.
- **Clips de video por escena**: un MP4/WebM de la Biblioteca se dibuja con `drawImage` en el timestamp exacto,
  en bucle si es más corto que la escena y recortado si es más largo.
- **Resolución de medios por id**: las escenas guardan `imageAssetId` / `videoAssetId` y reconstruyen la URL
  desde el blob, así las imágenes y clips sobreviven a una recarga.

### Verificado con archivos reales

- `artifacts/phase5-transitions.webm`: fundido con color medio interpolado de forma monotónica y zoom con
  ambas capas visibles a escalas distintas (cuadro medio extraído).
- `artifacts/phase6-1080p30.webm`: ffmpeg confirma 1920×1080 a 30 fps (90 cuadros, 2,97 s).
- `artifacts/phase7-video-scene.webm`: clip de 1,2 s en escena de 2,5 s (bucle) y de 0,8 s (recorte),
  comprobado con el timecode incrustado del propio clip.
- `artifacts/phase8-wav-narration.webm`: narración WAV PCM 48 kHz → Opus 48 kHz estéreo, correlación 0,9992
  con la fuente y desfase 0 ms.

### Limitaciones que siguen

- La salida sigue siendo WebM (sin MP4/H.264) y solo se probó en Chromium.
- Dentro de una escena solo se verificó un clip WebM; MP4 no se probó (se verificó en la fase 9).
- El límite móvil se verificó simulando el user agent, no en un dispositivo Android real.

## [Sin publicar] — 22 de noviembre de 2026

### Añadido

- **Pantalla de inicio** con el nombre de la app, botón «Nuevo proyecto» y la lista de proyectos guardados
  en IndexedDB. Se acabó la apertura automática del proyecto del CERN.
- **Crear, renombrar y eliminar proyectos** desde la pantalla de inicio, con confirmación antes de borrar.
- **Barra lateral de navegación** con icono y etiqueta (Guion, Storyboard, Biblioteca, Ideas,
  Investigación, Monitor). Solo se muestra una sección a la vez.
- **Indicador de guardado permanente** en la cabecera: `Guardado ✓`, `Guardando...`, `Error al guardar`.
- **Modal previo a la exportación** con la resolución real, el formato real (contenedor, códecs, modo de
  codificación) y si el video lleva narración o no, además de duración, cuadros y nombre del archivo.
- **Reordenar escenas arrastrando** en el taller de guion.
- **Asignar una imagen de la Biblioteca a una escena**, guardada en `imageUrl` para el motor de canvas.
- **Autoguardado con debounce de 1 segundo** y mensaje visible si el guardado falla por cuota de
  almacenamiento.
- **Narración real y exportación determinista** (sesión anterior): `decodeAudioData` +
  `AudioBufferSourceNode`/`AudioEncoder`, render cuadro por cuadro con WebCodecs (VP9 + Opus),
  empaquetado con `webm-muxer`, respaldo `MediaRecorder` en tiempo real y nombre de archivo con la
  extensión real (`.webm`).
- Documentos `README.md`, `ROADMAP.md`, `PROJECT_STATUS.md` y este `CHANGELOG.md` con el estado real.

### Cambiado

- Tipografía base de 14 px, títulos de sección de 18 px y etiquetas de 12 px en mayúsculas.
- Toda la interfaz en español: «Zoom In» → «Acercar», «Cut» → «Corte», «Fade» → «Fundido», «Hook» →
  «Gancho», etc. Los valores internos del modelo no cambian.
- El tono senoidal de 220 Hz del video exportado se eliminó por completo; si no hay narración el video
  sale mudo.
- La biblioteca reconstruye los object URLs desde IndexedDB al recargar y borra el blob al eliminar un
  recurso.
- Padding mínimo de 16 px en los paneles.

### Eliminado

- Badges «Verificado» y «Licencia confirmada» de la Biblioteca.
- `src/services/cloud/api.ts`, `src/services/sync/syncEngine.ts` y `src/services/jobs/jobQueue.ts`
  (código muerto de una nube simulada) y todas sus importaciones.
- El ZIP `freebuff-saved-files.zip` de 12 MB que estaba versionado en la raíz.
- La configuración temporal de `allowedHosts` del VM en `vite.config.ts`; ahora usa `allowedHosts: true`.

### Verificado

- `npx tsc --noEmit` sin errores y `npm run build` correcto.
- `npx vitest run`: 8/8 pruebas.
- Exportación real de 10 s (300 cuadros) con narración TTS: WebM VP9 + Opus, audio audible y correlación
  0,9991 con la fuente, también a través de la UI y con el respaldo `MediaRecorder` forzado.

### Limitaciones conocidas

IA real inexistente, sin nube/sincronización/multiusuario, Android sin verificar, solo WebM (sin MP4),
WAV sin probar, Safari y Firefox sin verificar, transiciones no aplicadas en el render y ajustes de
resolución/fps fijos. Detalle completo en [PROJECT_STATUS.md](PROJECT_STATUS.md).
