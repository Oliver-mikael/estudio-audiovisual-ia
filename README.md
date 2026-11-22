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
npm test          # Vitest (8 pruebas del modelo de datos)
```

## Qué funciona hoy

- **Pantalla de inicio**: lista los proyectos guardados en IndexedDB, permite crear, abrir, renombrar y
  eliminar proyectos (con confirmación).
- **Editor con barra lateral**: Guion, Storyboard, Biblioteca, Ideas, Investigación y Monitor. Se ve una sola
  sección a la vez.
- **Taller de guion**: crear, editar y eliminar escenas (con confirmación), duración por escena, texto de
  narración, movimiento de cámara, transición y **reordenar escenas arrastrando**.
- **Imágenes por escena**: se elige una imagen subida a la Biblioteca (se guarda `imageAssetId`, y la URL se
  reconstruye desde el blob al recargar).
- **Clips de video por escena**: un MP4/WebM de la Biblioteca se dibuja cuadro a cuadro con `drawImage` en el
  timestamp exacto. Si el clip dura menos que la escena se repite en bucle; si dura más, se recorta.
- **Transiciones reales**: Fundido (opacidad), Deslizamiento (empuje horizontal) y Zoom (escala 1.0 → 1.1)
  entre escenas, con duración configurable por escena (0,5 s por defecto). Corte es el cambio directo.
- **Resolución y FPS configurables**: 480p, 720p o 1080p y 24, 30 o 60 fps. En Android/móvil la exportación
  se limita automáticamente a 720p y 30 fps.
- **Biblioteca**: importa imágenes, audio y video; los blobs se guardan en IndexedDB y los object URLs se
  reconstruyen al recargar. Puedes marcar un audio como **narración**.
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
- **Audio**: MP3 y WAV funcionan como narración (verificado con ffmpeg). Sigue habiendo una sola pista de
  narración para todo el proyecto: no hay audio por escena ni música de fondo.
- **Clips de video**: el soporte depende de lo que el navegador pueda decodificar. Solo se probó un WebM
  (VP8) generado con ffmpeg; MP4 dentro de una escena no está verificado.
- **Sin deshacer** y sin versiones del proyecto.
- **Probado solo en Chromium.** El resto de navegadores está sin verificar.
- **Cobertura de pruebas mínima**: Vitest cubre el modelo de datos y el cálculo de cuadros, no la UI ni la
  exportación.

## Estructura

```
src/
  App.tsx                 # shell: inicio, editor, modal de exportación, autoguardado
  components/             # HomeScreen, Modal/ConfirmDialog, VideoPlayer
  engine/                 # renderEngine (canvas 2D), exporter (WebCodecs), audioTrack (narración)
  modules/                # Guion, Storyboard, Biblioteca, Ideas, Investigación
  services/storage/db.ts  # IndexedDB: proyectos y blobs
  data/                   # proyecto demo y fábrica de proyectos vacíos
docs/                     # auditorías y documentación histórica
```

Estado real del proyecto: [PROJECT_STATUS.md](PROJECT_STATUS.md). Pendientes: [ROADMAP.md](ROADMAP.md).
