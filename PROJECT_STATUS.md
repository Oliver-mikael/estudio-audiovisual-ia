# Estado real del proyecto

**Última actualización:** 22 de noviembre de 2026
**Resumen:** el flujo local «crear proyecto → escenas con imagen → narración → exportar WebM» está
implementado y probado en Chromium. Lo que rodeaba a ese flujo (IA, nube, Android) no existe o no está
verificado.

## Verificado con evidencia

| Área | Estado | Detalle |
| :--- | :--- | :--- |
| Exportación WebCodecs | **Probado** | VP9 + Opus + `webm-muxer`, cuadro por cuadro. Video de prueba de 10,00 s / 300 cuadros, correlación 0,9991 con la voz fuente. |
| Narración importada | **Probado (MP3)** | `decodeAudioData` en `OfflineAudioContext` 48 kHz estéreo, recortada a la duración del proyecto. |
| Nombre y extensión del archivo | **Probado** | Chrome descargó `…-720p.webm`; el nombre se sanea y la extensión sale del MIME real. |
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
| Compilación | **Probado** | `npx tsc --noEmit` sin errores; `npm run build` correcto. |
| Pruebas unitarias | **Probado** | `npx vitest run` 8/8 (modelo de datos, no UI ni exportación). |

## No implementado o no verificado

| Área | Estado | Detalle |
| :--- | :--- | :--- |
| IA real (ideas, crítica, guion) | **No existe** | Sugerencias y críticas son textos fijos y reglas heurísticas. |
| Nube, sync, multiusuario | **Eliminado** | `cloudApi`, `syncEngine` y `jobQueueManager` se borraron; no hay backend conectado. |
| Android (Capacitor) | **No verificado** | Solo queda la configuración; no hay build ni pruebas en dispositivo. |
| MP4/H.264 de salida | **No implementado** | La salida es siempre WebM. Un MP4 H.264 sí funciona como clip dentro de una escena (verificado en Chromium). |
| Clips con audio propio | **No implementado** | El clip de escena se decodifica mudo; la única pista de audio exportada es la narración del proyecto. |
| Códecs MP4 distintos de H.264 | **No verificado** | Solo se probó `avc1` (H.264) en Chromium; HEVC, AV1 y navegadores sin decodificador H.264 quedan sin probar. |
| Safari y Firefox | **No verificado** | Sin WebCodecs se usaría el respaldo en tiempo real; no se probó. |
| Audio por escena / musicalización | **No implementado** | Una sola pista de narración por proyecto. |
| Deshacer / versiones | **No implementado** | — |
| Persistencia más allá del navegador | **No existe** | IndexedDB local; borrar datos del sitio borra los proyectos. |

## Notas sobre documentación antigua

Los documentos de `docs/` (arquitectura cloud, auditorías, roadmap y changelog anteriores) describen un
diseño previsto, no el estado actual. Donde afirman que la sincronización, la cola de trabajos o el
despliegue Android están «operativos», debe leerse como diseño no implementado: ese código ya no está en el
repositorio.
