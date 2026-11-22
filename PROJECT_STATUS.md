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
| Compilación | **Probado** | `npx tsc --noEmit` sin errores; `npm run build` correcto. |
| Pruebas unitarias | **Probado** | `npx vitest run` 8/8 (modelo de datos, no UI ni exportación). |

## No implementado o no verificado

| Área | Estado | Detalle |
| :--- | :--- | :--- |
| IA real (ideas, crítica, guion) | **No existe** | Sugerencias y críticas son textos fijos y reglas heurísticas. |
| Nube, sync, multiusuario | **Eliminado** | `cloudApi`, `syncEngine` y `jobQueueManager` se borraron; no hay backend conectado. |
| Android (Capacitor) | **No verificado** | Solo queda la configuración; no hay build ni pruebas en dispositivo. |
| MP4/H.264 | **No implementado** | La salida es siempre WebM. |
| Safari y Firefox | **No verificado** | Sin WebCodecs se usaría el respaldo en tiempo real; no se probó. |
| WAV | **No probado** | Debería funcionar vía `decodeAudioData`, sin evidencia. |
| Transiciones de escena | **No aplicadas** | El dato se guarda; el render no las ejecuta. |
| Audio por escena / musicalización | **No implementado** | Una sola pista de narración por proyecto. |
| Video dentro de escenas | **No implementado** | Se sube a la biblioteca, no se compone. |
| Resolución / fps configurables | **No implementado** | 1280×720 @ 30 fps fijos. |
| Deshacer / versiones | **No implementado** | — |
| Persistencia más allá del navegador | **No existe** | IndexedDB local; borrar datos del sitio borra los proyectos. |

## Notas sobre documentación antigua

Los documentos de `docs/` (arquitectura cloud, auditorías, roadmap y changelog anteriores) describen un
diseño previsto, no el estado actual. Donde afirman que la sincronización, la cola de trabajos o el
despliegue Android están «operativos», debe leerse como diseño no implementado: ese código ya no está en el
repositorio.
