# Roadmap

Lista priorizada de lo que falta, empezando por lo que más limita el uso real. Nada de esta lista está
implementado salvo que se indique lo contrario.

## 1. IA real (prioridad alta)

Hoy las ideas y la crítica de guion son textos fijos y heurísticas. Falta:

- Conectar un modelo real para generar ángulos narrativos y críticas de guion.
- Definir dónde corre: API en la nube con clave del usuario, o modelo local (WebGPU/ONNX).
- Presupuesto y límites de uso por proyecto.
- Mostrar claramente cuándo un texto lo ha generado un modelo y cuándo es una plantilla.

## 2. Reproducción y exportación más robustas

- Verificar Safari y Firefox; allí WebCodecs no existe y la exportación cae al respaldo en tiempo real.
- Añadir exportación MP4/H.264 (hoy la única salida es WebM).
- Arreglar la duración del WebM del respaldo `MediaRecorder` (hoy no declara duración).
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

## 3. Edición de audio

- Narración por escena en lugar de una sola pista para todo el proyecto.
- [x] Música de fondo global con mezcla y ducking (fase 13).
- [x] Efecto de sonido por escena al inicio de la escena (fase 14).
- [x] Subtítulos editables por escena, independientes de la narración (fase 15).
- [ ] Tiempos por subtítulo y exportación a `.srt`/`.vtt`.
- Recorte y ajuste de inicio de la narración desde la UI.
- Puntos de entrada/salida y fundido propio de la música.

## 4. Recursos

- Miniaturas y previsualización de audio con reproducción.
- Límites y aviso de cuota antes de quedarse sin espacio en IndexedDB.

## 5. Persistencia y nube (prioridad media)

- Sincronización entre dispositivos con backend real (el módulo simulado se eliminó).
- Autenticación y datos por usuario.
- Exportar/importar el proyecto completo como archivo para no depender del navegador.
- Historial de versiones y deshacer.

## 6. Multiusuario (prioridad baja)

- Espacios de trabajo compartidos.
- Comentarios sobre escenas y fuentes.
- Roles y permisos.

## 7. Android (prioridad baja, sin verificar)

- Build real con Capacitor y pruebas en dispositivo.
- Comprobar si WebCodecs existe en el WebView usado y qué rendimiento tiene.
- Almacenamiento y exportación de archivos con las APIs nativas.

## 8. Calidad

- Pruebas de la UI y de la exportación de punta a punta (hoy hay 17 pruebas de lógica pura y persistencia, sin navegador).
- Accesibilidad del editor (foco, teclado, anuncios de estado).
- Idiomas: hoy toda la interfaz está en español.
