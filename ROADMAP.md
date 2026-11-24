# Roadmap

Lista priorizada de lo que falta, empezando por lo que más limita el uso real. Nada de esta lista está
implementado salvo que se indique lo contrario. Las fases 21–24 (guion con Gemini, voz TTS por escena,
imágenes de Pexels y cortes automáticos), las fases 33–36 (ElevenLabs opcional, MP4/H.264, resumen previo
y exportación solo de audio), las fases 37–40 (audio AAC en MP4, modo claro, atajos de teclado y reporte de
calidad) y las fases 41–44 (bienvenida del primer uso, interfaz móvil, enlaces para compartir e historial de
versiones) están implementadas con claves opcionales del usuario y verificadas en Chromium; la voz y las
imágenes se probaron con respuestas simuladas, así que quedan las pruebas contra los servicios reales.

## 1. IA real (prioridad alta)

Hoy las ideas y la crítica de guion son textos fijos y heurísticas. Falta:

- [x] Conectar un modelo real para generar el guion completo (Gemini, fase 21).
- [x] Definir dónde corre: API en la nube con la clave del usuario, guardada en los ajustes del proyecto.
- [ ] Generar también ángulos narrativos y críticas con el modelo (hoy siguen siendo fijos/heurísticas).
- [ ] Probar con una clave real, medir calidad del guion y añadir límites de uso por proyecto.
- [x] Mostrar que el guion viene de un modelo (panel «Generar guion completo con IA» y estado con la clave).

## 2. Reproducción y exportación más robustas

- [x] Reproducción de audio en la vista previa del Monitor, con el mismo ducking que la exportación
  (fase 17).
- Verificar Safari y Firefox; allí WebCodecs no existe y la exportación cae al respaldo en tiempo real.
- [x] Exportación MP4/H.264 con `avc1.42E01E` y `mp4-muxer` (fase 34). Aviso claro si el navegador no
  soporta H.264 en WebCodecs; falta un respaldo MP4 sin WebCodecs.
- [x] Audio AAC-LC (`mp4a.40.2`) en el MP4, con sondeo real del codificador y respaldo a Opus cuando el
  navegador no puede codificar AAC (fase 37). Queda verificarlo en un navegador con codificador AAC.
- [ ] Exportar el MP4 con audio PCM sin comprimir cuando no haya AAC (hoy el respaldo es Opus porque
  `mp4-muxer` no empaqueta PCM).
- Arreglar la duración del WebM del respaldo `MediaRecorder` (hoy no declara duración).
- [x] Exportar solo audio como WAV de 48 kHz, sin video (fase 36).
- [x] Resumen del proyecto antes de exportar: duración, escenas, palabras, pistas de audio y resolución
  (fase 35).
- Probar clips con audio propio (hoy el clip se reproduce mudo) y códecs MP4 distintos de H.264.
- Interfaz para la relación de aspecto 9:16 y 1:1 (hoy solo 16:9 en la UI).
- Probar el límite móvil en un dispositivo real, no solo simulando el user agent.

## 2b. Hecho en las fases 5–11

- [x] Transiciones Fundido / Deslizamiento / Zoom con duración configurable por escena.
- [x] Resolución 480p/720p/1080p y fps 24/30/60, con límite automático 720p/30 en móvil.
- [x] Clips de video de la biblioteca como fondo de escena, con bucle y recorte.
- [x] Narración WAV verificada con ffmpeg además de MP3.
- [x] Clip MP4 H.264 dentro de una escena, con bucle y recorte (`phase9`).
- [x] Exportación completa desde el botón de la UI, con nombre y extensión reales y voz audible (`phase10`).
- [x] 17 pruebas de comportamiento: persistencia en IndexedDB, nombre de archivo, límite móvil, opacidad del Fundido y recorte/relleno de narración.

## 2c. Hecho en las fases 21–24

- [x] Guion completo con Gemini (gancho, 4–6 escenas, cierre con llamada a la acción) cargado al Taller.
- [x] Voz TTS por escena con Google Cloud TTS (femenina/masculina), guardada en la Biblioteca y mezclada en
  su escena. Escucha previa con Web Speech API sin clave.
- [x] Imágenes automáticas con Pexels a partir de la intención visual, al generar el guion o por escena.
- [x] Ritmo visual: cortes cada 3 s entre imagen principal y secundaria, desactivables por escena.

## 2d. Hecho en las fases 25–28

- [x] Música adaptativa por timestamp: intro al 80 % subiendo, ducking al 30 % con voz y cierre al 100 %
  con fundido de salida (fase 25).
- [x] Animaciones de subtítulo por línea: fundido de 0,3 s, máquina de escribir y deslizamiento (fase 26).
- [x] Gancho visual superpuesto en los primeros 3 s, con zoom 110 % → 100 %, velo y opción de desactivarlo
  (fase 27).
- [x] Biblioteca de 10 pistas CC0 por categoría, con vista previa y asignación como música de fondo
  (fase 28).

## 2e. Hecho en las fases 29–32

- [x] Brillo, contraste y saturación por escena con `ctx.filter`, neutral 1,0 (fase 29).
- [x] Cuatro plantillas de estilo (YouTube Educativo, TikTok Viral, Corporativo, Cinematic) que fijan
  tipografía, color de subtítulos, gancho, categoría de música y transición (fase 30).
- [x] Preview del storyboard con audio antes de exportar, un cuadro de 1 s por escena (fase 31).
- [x] Título animado del proyecto en el tercio inferior de la escena 1, 0,4 s de deslizamiento (fase 32).

## 2f. Hecho en las fases 33–36

- [x] ElevenLabs como alternativa opcional a Google Cloud TTS: voz Rachel, modelo `eleven_monolingual_v1`
  y rechazo de audios de menos de 0,5 s medidos en los bytes del MP3 (fase 33). Probado con una respuesta
  simulada; falta probarlo con una clave real.
- [x] Exportación MP4/H.264 (fase 34), con aviso cuando el navegador no expone H.264 en WebCodecs.
- [x] Panel de estadísticas del proyecto antes de exportar (fase 35).
- [x] Exportación de solo audio en WAV a 48 kHz con `OfflineAudioContext` (fase 36).

## 2g. Hecho en las fases 37–40

- [x] Audio AAC-LC en el MP4 con comprobación real del codificador y respaldo a Opus (fase 37).
- [x] Tema claro/oscuro persistido en `localStorage`, con las variables de color cambiando desde
  `html[data-theme]` (fase 38).
- [x] Atajos de teclado globales: Espacio, Ctrl+E, Ctrl+Z, Ctrl+Shift+Z y Escape (fase 39).
- [x] Reporte de calidad antes de exportar con advertencias de imágenes, duración, narración y música, sin
  bloquear la exportación (fase 40).

## 2h. Hecho en las fases 41–44

- [x] Bienvenida de tres pasos en el primer uso, con botón «Saltar» y marca en `localStorage` (fase 41).
- [x] Interfaz móvil por debajo de 768 px: menú hamburguesa, objetivos táctiles de 44 px y paneles
  secundarios ocultos (fase 42).
- [x] Compartir el proyecto como URL con el JSON comprimido en el hash `#project=`, con importación al abrir
  el enlace y límite a proyectos sin recursos binarios (fase 43).
- [x] Historial de versiones: una instantánea por exportación, máximo 5 con rotación, panel «Versiones» con
  fecha y duración, y restauración en el proyecto abierto (fase 44).

## 3. Edición de audio

- [x] Narración por escena con voz TTS (fase 22) y alternativa ElevenLabs opcional (fase 33).
- [ ] Probar ElevenLabs con una clave real y elegir entre varias voces suyas (hoy Rachel fija).
- [ ] Asignar a una escena un audio importado de la Biblioteca (hoy la voz por escena solo se genera con TTS).
- [ ] Ajustar la duración de la escena a la voz generada o recortar la voz con una interfaz de ondas.
- [x] Música de fondo global con mezcla y ducking (fase 13).
- [x] Efecto de sonido por escena al inicio de la escena (fase 14).
- [x] Subtítulos editables por escena, independientes de la narración (fase 15).
- [x] Tiempos individuales por subtítulo (fase 18).
- [x] Exportación de subtítulos a `.srt` (fase 19).
- [x] Animaciones de subtítulo por línea: fundido, máquina de escribir y deslizamiento (fase 26).
- [ ] Exportación a `.vtt`.
- Recorte y ajuste de inicio de la narración desde la UI.
- Curva adaptativa global de la música (intro, ducking y cierre, fase 25); falta un fundido propio por pista y
  puntos de entrada/salida configurables por el usuario.

## 4. Recursos

- [x] Imágenes automáticas de Pexels por intención visual (fase 23).
- [ ] Elegir entre varias fotos candidatas y editar la consulta antes de descargar.
- [x] Biblioteca de música libre CC0 incluida, con vista previa y asignación (fase 28).
- Miniaturas y previsualización de audio importado con reproducción.
- Límites y aviso de cuota antes de quedarse sin espacio en IndexedDB.

## 5. Persistencia y nube (prioridad media)

- Sincronización entre dispositivos con backend real (el módulo simulado se eliminó).
- Autenticación y datos por usuario.
- Exportar/importar el proyecto completo como archivo para no depender del navegador (los enlaces de la
  fase 43 solo llevan texto y configuración, no recursos binarios).
- [x] Deshacer/rehacer, hasta 50 pasos (fase 16).
- [x] Historial de deshacer persistente en IndexedDB, restaurado al abrir el proyecto (fase 20).
- Historial de versiones guardadas con nombre y fecha (más allá de los 50 pasos del deshacer).

## 6. Multiusuario (prioridad baja)

- Espacios de trabajo compartidos.
- Comentarios sobre escenas y fuentes.
- Roles y permisos.

## 7. Android (prioridad baja, sin verificar)

- Build real con Capacitor y pruebas en dispositivo.
- Comprobar si WebCodecs existe en el WebView usado y qué rendimiento tiene.
- Almacenamiento y exportación de archivos con las APIs nativas.

## 8. Calidad

- Pruebas de la UI y de la exportación de punta a punta (hoy hay 145 pruebas de lógica pura y persistencia, sin navegador).
- Accesibilidad del editor (foco, teclado, anuncios de estado).
- Idiomas: hoy toda la interfaz está en español.
