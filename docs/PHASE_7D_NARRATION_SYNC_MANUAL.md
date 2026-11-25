# FASE 7D: MANUAL DE SINCRONIZACIÓN DE NARRACIÓN Y CABEZAL SMPTE

## 1. Sincronización Temporal entre Audio y Video
El motor de renderizado `CanvasRenderEngine` y el motor de audio `AudioEngine` operan sincronizados bajo el mismo reloj maestro:
- FPS de referencia: 30 cuadros por segundo (1 frame = 33.333 ms).
- Notación de tiempo: SMPTE HH:MM:SS:FF.
- El cabezal de reproducción programa los eventos de inicio (`start(when, offset)`) de cada buffer en Web Audio Context con precisión de sub-milisegundo.

## 2. Reubicación del Cabezal (Scrubbing)
- Cuando el usuario desplaza la barra de tiempo o hace clic en un clip, `AudioEngine.stop()` detiene los nodos activos instantáneamente.
- Si la reproducción estaba activa, `AudioEngine.play(project, newTime)` recalcula qué clips deben comenzar de inmediato y programa los futuros con su delta correspondiente.
