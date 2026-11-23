# Estudio Audiovisual Inteligente

Editor de video documental que corre **entero en el navegador**: generas el guion, la voz y las imágenes
con APIs opcionales, ajustas las escenas y exportas un WebM real. No hay servidor ni cuentas: los proyectos
y los archivos viven en IndexedDB. Las claves de Gemini, Google Cloud TTS y Pexels son opcionales, se pegan
en Ajustes del proyecto y se guardan junto a él (nunca en el código).

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
npm test          # Vitest (93 pruebas de lógica y persistencia)
```

## Claves de API (opcionales)

Las tres integraciones se configuran en **Ajustes del proyecto → Claves de API del proyecto**. Se guardan en
IndexedDB junto al proyecto y solo se envían al servicio correspondiente cuando usas la función. Al ser una
app sin backend, la clave viaja desde tu navegador: usa claves propias y con límites de cuota.

| Servicio | Para qué | Dónde se obtiene |
| :--- | :--- | :--- |
| Gemini (`geminiApiKey`) | Generar el guion completo en Ideas. Modelo configurable (por defecto `gemini-2.5-flash`). | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| Google Cloud TTS (`ttsApiKey`) | Convertir la narración de una escena en un MP3 y exportarlo. | Habilita «Cloud Text-to-Speech» en Google Cloud Console y crea una clave de API. |
| Pexels (`pexelsApiKey`) | Buscar y descargar una imagen por escena. | [pexels.com/api](https://www.pexels.com/api/) |

Sin claves puedes seguir usando el editor, el guion manual, la Biblioteca, los subtítulos, el historial y la
exportación. Las pruebas de las fases 21–24 usaron respuestas simuladas de estas APIs porque el entorno de
desarrollo no tenía claves; los flujos se verificaron con archivos reales. Las fases 25–28 (música adaptativa,
animaciones, gancho y biblioteca CC0) se verificaron exportando y midiendo archivos reales (ver
[artifacts/](artifacts/README.md)).

## Qué funciona hoy

- **Pantalla de inicio**: lista los proyectos guardados en IndexedDB, permite crear, abrir, renombrar y
  eliminar proyectos (con confirmación).
- **Editor con barra lateral**: Guion, Storyboard, Biblioteca, Ideas, Investigación y Monitor. Se ve una sola
  sección a la vez.
- **Guion completo con Gemini**: en Ideas se escribe el tema, se elige tono (Educativo, Documental,
  Entretenimiento, Historia) y «Generar guion» pide a Gemini un gancho de 15 palabras o menos, 4–6 escenas
  con narración e intención visual, y un cierre con llamada a la acción. El resultado se carga como escenas
  editables (gancho, cuerpo y cierre) en el Taller de guion, con confirmación si ya había escenas.
- **Taller de guion**: crear, editar y eliminar escenas (con confirmación), duración por escena, texto de
  narración, **subtítulos editables**, movimiento de cámara, transición y **reordenar escenas arrastrando**.
- **Subtítulos editables**: cada escena tiene su propia lista de subtítulos, independiente de la narración.
  Se pueden añadir, editar y borrar, y cada línea tiene su propio **inicio y duración** (o el reparto
  automático en partes iguales). El renderer la dibuja solo dentro de su ventana de tiempo.
- **Animaciones de subtítulo**: cada línea elige **Fundido**, **Máquina de escribir** o **Deslizar hacia
  arriba**. La entrada y la salida duran 0,3 s; la máquina de escribir revela el texto carácter a carácter
  y el deslizamiento entra desde 40 px abajo. Las escenas antiguas usan el fundido por defecto.
- **Exportación de subtítulos**: el modal y el panel de exportación ofrecen «Descargar .srt» con todos los
  subtítulos del proyecto y sus timestamps absolutos.
- **Imágenes por escena**: se elige una imagen subida a la Biblioteca (se guarda `imageAssetId`, y la URL se
  reconstruye desde el blob al recargar).
- **Imágenes automáticas con Pexels**: con clave de Pexels, «Buscar imagen» en una escena usa las palabras
  clave de su intención visual, descarga la foto, la guarda en la Biblioteca y la asigna. Al generar un guion
  también se busca una imagen para cada escena generada (y se pueden reemplazar a mano).
- **Ritmo visual (B-roll)**: en escenas de más de 4 segundos, el renderer alterna la imagen principal y una
  secundaria cada 3 segundos para que el cuadro no quede estático. Se puede desactivar por escena.
- **Gancho visual en la intro**: el texto del gancho (editable, o el título de la primera escena) se superpone
  en grande y centrado durante los primeros 3 s, con zoom de entrada de 110 % a 100 % en 0,5 s y un velo
  oscuro para legibilidad. Se puede desactivar por proyecto desde el Taller.
- **Voz TTS por escena**: «Generar voz» convierte la narración de una escena en un MP3 con Google Cloud TTS
  (voz femenina o masculina), lo guarda en la Biblioteca y lo asigna a esa escena; suena al inicio de la
  escena y no invade la siguiente. Si la escena ya tenía voz, pide confirmación. «Escuchar» reproduce la
  narración con la voz del navegador (Web Speech API, sin clave, pero no genera archivo).
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
- **Música de fondo adaptativa**: la ganancia se calcula muestra a muestra según el timestamp. En la intro
  (primeros 3 s) empieza al 80 % y sube gradualmente; con narración baja al 30 % (ducking); en el cierre
  (últimos 3 s) vuelve al 100 % y hace un fundido de salida suave. El volumen general (0–100 %) se ajusta
  en Ajustes.
- **Música libre incluida**: 10 pistas CC0 propias en Épica, Suave, Tecnología, Misterio y Motivacional.
  Se escuchan antes de elegir, se filtran por categoría y la elegida se descarga, se guarda en IndexedDB y
  queda asignada como música de fondo del proyecto.
- **Efectos de sonido por escena**: cada escena puede llevar un audio corto de la Biblioteca como SFX, que
  suena una vez al inicio de la escena mezclado con la narración y la música.
- **Monitor con audio**: la vista previa reproduce la misma mezcla que la exportación (narración, música con
  ducking y efectos), se detiene al pausar, se recoloca al hacer scrub y tiene un mute real.
- **Deshacer / rehacer**: Ctrl+Z deshace y Ctrl+Y o Ctrl+Shift+Z rehace hasta 50 pasos (escenas, textos,
  subtítulos, reordenar, asignaciones). La cabecera muestra cuántos pasos hay disponibles. El historial se
  guarda en IndexedDB y se restaura al volver a abrir el proyecto.
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

- **Las APIs requieren clave del usuario y no se probaron contra los servicios reales.** La generación de
  guion (Gemini), la voz (Google Cloud TTS) y las imágenes (Pexels) están implementadas de punta a punta,
  pero las verificaciones usaron respuestas simuladas: en este entorno no había claves. Sin clave, «Sugerir
  ángulo crítico» sigue insertando textos fijos y la crítica de guion son reglas heurísticas.
- **La voz del navegador no se puede guardar.** La Web Speech API solo reproduce; el navegador no expone sus
  muestras. Para exportar voz hace falta la clave de Google Cloud TTS.
- **Pexels y TTS desde el navegador dependen de CORS.** Si el servicio bloquea la petición directa, hay que
  subir los archivos a la Biblioteca a mano (el resto del flujo no cambia).
- **No hay nube, sincronización ni multiusuario.** El antiguo módulo de nube simulado
  (`cloudApi`, `syncEngine`, `jobQueueManager`) se eliminó del código. Los proyectos solo existen en este
  navegador y en este perfil.
- **No hay app Android publicada.** Solo queda `capacitor.config.json`; no hay build ni paridad probada.
- **Solo WebM.** No se exporta MP4/H.264. En Safari y Firefox (sin WebCodecs) se usa el respaldo
  `MediaRecorder`, cuyo WebM no declara duración en los metadatos.
- **Subtítulos**: hay tiempos individuales, animaciones por línea y exportación `.srt`, pero no `.vtt`; la
  sincronización se ajusta a mano, sin editor de ondas.
- **Audio**: MP3 y WAV funcionan como narración (global o una voz por escena), música de fondo y efectos de
  escena (verificado con ffmpeg). La música y los efectos no tienen control de volumen propio (la música sí
  un volumen global en Ajustes). La narración por escena se recorta a la duración de la escena.
- **Clips de video**: el soporte depende de lo que el navegador pueda decodificar. Se probaron un WebM
  (VP8) y un MP4 H.264 dentro de escenas en Chromium; HEVC, AV1 y navegadores sin decodificador H.264 no se
  probaron. El audio propio del clip se ignora.
- **Sin historial de versiones**: el deshacer persiste hasta 50 pasos, pero no hay versiones con nombre ni
  restauración más allá de ese límite.
- **Probado solo en Chromium.** El resto de navegadores está sin verificar.
- **Cobertura de pruebas parcial**: 93 pruebas de Vitest cubren persistencia en IndexedDB (proyectos,
  historial y `fake-indexeddb`), nombre de archivo, límite móvil, opacidad del Fundido, recorte/relleno de
  narración, envolvente de ducking, curva adaptativa de la música, animaciones de subtítulo, gancho de la
  intro, catálogo de música CC0, ventanas de subtítulos, generación de `.srt`, análisis del guion de Gemini,
  peticiones de TTS y Pexels, palabras clave visuales y cortes automáticos. No hay pruebas de la UI ni de una
  exportación completa dentro de Vitest (esas se hicieron a mano en Chromium).

## Estructura

```
src/
  App.tsx                 # shell: inicio, editor, modal de exportación, autoguardado
  components/             # HomeScreen, Modal/ConfirmDialog, VideoPlayer
  engine/                 # renderEngine (canvas 2D), exporter (WebCodecs), audioTrack (mezcla), srt,
                          # gemini (guion), tts (voz), pexels (imágenes), visualRhythm (cortes),
                          # musicDynamics (curva de música), textAnimation, introHook
  modules/                # Guion, Storyboard, Biblioteca, Ideas, Investigación
  services/storage/db.ts  # IndexedDB: proyectos, blobs e historial persistente
  services/history/       # deshacer/rehacer (50 pasos, lógica pura)
  data/                   # proyecto demo y fábrica de proyectos vacíos
artifacts/                # evidencias de verificación (videos, cuadros, WAV) y su README
docs/                     # auditorías y documentación histórica
```

Las evidencias de las pruebas (videos exportados por la app y su análisis con ffmpeg) están versionadas en
[artifacts/](artifacts/README.md).

Estado real del proyecto: [PROJECT_STATUS.md](PROJECT_STATUS.md). Pendientes: [ROADMAP.md](ROADMAP.md).
