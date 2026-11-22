# Estudio Audiovisual Inteligente

Editor de video documental que corre **entero en el navegador**: escribes el guion por escenas, asignas
imágenes, importas una narración y exportas un WebM real con voz. No hay servidor, no hay cuentas y no hay
claves de API: los proyectos y los archivos viven en IndexedDB.

## Cómo correrlo localmente

Requisitos: Node.js 18 o superior y npm 9 o superior.

```bash
npm install
npm run dev
```

La app queda en `http://localhost:3000`.

Otros comandos:

```bash
npm run build     # tsc + vite build
npm test          # Vitest (32 pruebas de lógica y persistencia)
```

## Qué funciona hoy

- **Pantalla de inicio**: lista los proyectos guardados en IndexedDB, permite crear, abrir, renombrar y
  eliminar proyectos (con confirmación).
- **Editor con barra lateral**: Guion, Storyboard, Biblioteca, Ideas, Investigación y Monitor. Se ve una sola
  sección a la vez.
- **Taller de guion**: crear, editar y eliminar escenas (con confirmación), duración por escena, texto de
  narración, **subtítulos editables**, movimiento de cámara, transición y **reordenar escenas arrastrando**.
- **Subtítulos editables**: cada escena tiene su propia lista de subtítulos, independiente de la narración.
  Se pueden añadir, editar y borrar; se reparten en partes iguales de la duración de la escena y se dibujan
  en el recuadro inferior del video exportado.
- **Imágenes por escena**: se elige una imagen subida a la Biblioteca (se guarda `imageAssetId`, y la URL se
  reconstruye desde el blob al recargar).
- **Clips de video por escena**: un MP4 (H.264) o WebM de la Biblioteca se dibuja cuadro a cuadro con
  `drawImage` en el timestamp exacto. Si el clip dura menos que la escena se repite en bucle; si dura más,
  se recorta. El clip se reproduce mudo.
- **Transiciones reales**: Fundido (opacidad), Deslizamiento (empuje horizontal) y Zoom (escala 1.0 → 1.1)
  entre escenas, con duración configurable por escena (0,5 s por defecto). Corte es el cambio directo.
- **Resolución y FPS configurables**: 480p, 720p o 1080p y 24, 30 o 60 fps. En Android/móvil la exportación
  se limita automáticamente a 720p y 30 fps.
- **Biblioteca**: importa imágenes, audio y video; los blobs se guardan en IndexedDB y los object URLs se
  reconstruyen al recargar. Puedes marcar un audio como **narración** o como **música de fondo** (son
  pistas distintas).
- **Música de fondo con ducking**: la música se mezcla en bucle con la narración y baja automáticamente al
  30 % mientras hay voz, volviendo a su volumen en el silencio. El volumen general (0–100 %) se ajusta en
  Ajustes.
- **Efectos de sonido por escena**: cada escena puede llevar un audio corto de la Biblioteca como SFX, que
  suena una vez al inicio de la escena mezclado con la narración y la música.
- **Deshacer / rehacer**: Ctrl+Z deshace y Ctrl+Y o Ctrl+Shift+Z rehace hasta 50 pasos (escenas, textos,
  subtítulos, reordenar, asignaciones). La cabecera muestra cuántos pasos hay disponibles. El historial vive
  en memoria mientras el proyecto está abierto y se reinicia al recargar.
- **Autoguardado** con 1 segundo de debounce e indicador permanente en la cabecera
  (`Guardado ✓` / `Guardando...` / `Error al guardar`). Si IndexedDB falla por cuota, el mensaje aparece
  visible bajo la cabecera.
- **Exportación real**: antes de exportar se muestra un modal con resolución, formato y si lleva narración.
  El render es **cuadro por cuadro** con WebCodecs (VP9 + Opus) y `webm-muxer`; el archivo descargado lleva
  la extensión real (`.webm`). No se genera ningún tono sintético: si no hay narración asignada, el video
  sale mudo.
- **Respaldo**: si el navegador no soporta WebCodecs, se exporta con `MediaRecorder` +
  `captureStream(0)` en tiempo real, manteniendo el audio de narración.

## Qué NO funciona (o no está probado)

- **No hay IA real.** «Sugerir ángulo crítico» inserta uno de dos textos fijos y la crítica de guion son
  reglas heurísticas (longitud, duración, fórmulas clásicas). No hay modelo ni API.
- **No hay nube, sincronización ni multiusuario.** El antiguo módulo de nube simulado
  (`cloudApi`, `syncEngine`, `jobQueueManager`) se eliminó del código. Los proyectos solo existen en este
  navegador y en este perfil.
- **No hay app Android publicada.** Solo queda `capacitor.config.json`; no hay build ni paridad probada.
- **Solo WebM.** No se exporta MP4/H.264. En Safari y Firefox (sin WebCodecs) se usa el respaldo
  `MediaRecorder`, cuyo WebM no declara duración en los metadatos.
- **Subtítulos**: no hay tiempos por subtítulo (se reparten a partes iguales en su escena), ni archivo
  `.srt`/`.vtt` aparte, ni estilo configurable.
- **Audio**: MP3 y WAV funcionan como narración, música de fondo y efectos de escena (verificado con
  ffmpeg). Sigue habiendo una sola pista de narración para todo el proyecto, y la música y los efectos no
  tienen control de volumen propio (la música sí un volumen global en Ajustes).
- **Clips de video**: el soporte depende de lo que el navegador pueda decodificar. Se probaron un WebM
  (VP8) y un MP4 H.264 dentro de escenas en Chromium; HEVC, AV1 y navegadores sin decodificador H.264 no se
  probaron. El audio propio del clip se ignora.
- **Sin versiones guardadas del proyecto**: hay deshacer/rehacer en memoria, pero no un historial de
  versiones persistente ni restauración tras recargar.
- **Probado solo en Chromium.** El resto de navegadores está sin verificar.
- **Cobertura de pruebas parcial**: 17 pruebas de Vitest cubren persistencia en IndexedDB (con
  `fake-indexeddb`), nombre de archivo, límite móvil, opacidad del Fundido, recorte/relleno de narración y
  la envolvente de ducking de la música. No hay pruebas de la UI ni de una exportación completa.

## Estructura

```
src/
  App.tsx                 # shell: inicio, editor, modal de exportación, autoguardado
  components/             # HomeScreen, Modal/ConfirmDialog, VideoPlayer
  engine/                 # renderEngine (canvas 2D), exporter (WebCodecs), audioTrack (narración)
  modules/                # Guion, Storyboard, Biblioteca, Ideas, Investigación
  services/storage/db.ts  # IndexedDB: proyectos y blobs
  services/history/       # deshacer/rehacer (50 pasos, lógica pura)
  data/                   # proyecto demo y fábrica de proyectos vacíos
artifacts/                # evidencias de verificación (videos, cuadros, WAV) y su README
docs/                     # auditorías y documentación histórica
```

Las evidencias de las pruebas (videos exportados por la app y su análisis con ffmpeg) están versionadas en
[artifacts/](artifacts/README.md).

Estado real del proyecto: [PROJECT_STATUS.md](PROJECT_STATUS.md). Pendientes: [ROADMAP.md](ROADMAP.md).
