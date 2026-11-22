# Registro de cambios

Los cambios de las dos últimas sesiones de trabajo. Las versiones anteriores (1.2.0 a 2.1.0) están en
[docs/CHANGELOG.md](docs/CHANGELOG.md) y describen documentación de diseño, no funcionalidad verificada.

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
- Dentro de una escena solo se verificó un clip WebM; MP4 no se probó.
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
