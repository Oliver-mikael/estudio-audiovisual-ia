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
- **Imágenes por escena**: se elige una imagen subida a la Biblioteca y se guarda en el campo `imageUrl` que
  consume el motor de canvas.
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
- **Audio**: la narración se probó con MP3. WAV debería decodificar con `decodeAudioData`, pero no está
  probado. La narración es una sola pista para todo el proyecto (no hay audio por escena).
- **Video de la biblioteca**: se puede subir, pero no se compone dentro de las escenas; solo se usan
  imágenes y la pista de narración.
- **Transiciones**: el motor aplica Zoom/Pan y la entrada de subtítulos; los valores Corte, Fundido,
  Deslizamiento y Zoom se guardan pero **no se aplican** en el render.
- **Ajustes fijos**: 1280×720 a 30 fps. No hay interfaz para cambiar resolución, fps ni relación de aspecto.
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
