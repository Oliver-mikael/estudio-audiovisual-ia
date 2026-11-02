# CHANGELOG - ESTUDIO AUDIOVISUAL INTELIGENTE

Todos los cambios notables realizados en el proyecto quedan registrados en este documento.

---

## [Fase 7D - Motor de Audio Híbrido, Grabación de Voz y Mezcla Multipista] - 2026-10-31

### Agregado
- **Motor Web Audio API Multicanal (`src/services/audio/AudioEngine.ts`):**
  - Singleton de gestión de contexto de audio Web Audio API, submixes independientes para Diálogo/Locución (A1), Música de fondo (A2) y Efectos especiales (A3), master gain, y provisión de stream multidestino `createMediaStreamDestination()` para renderizado y exportación.
  - Programador de reproducción precisa de buffers sincronizado con el código de tiempo y playhead SMPTE a 30 FPS.
- **Grabador de Locución Directa en Vivo (`src/services/audio/AudioRecorder.ts`):**
  - Captura en tiempo real del micrófono local mediante `navigator.mediaDevices.getUserMedia` y `MediaRecorder`.
  - Conversión automática a `MediaAsset` y asignación instantánea en la pista A1 del proyecto.
- **Consola de Mezcla y Auto-Ducking (`src/services/audio/AudioMixer.ts`):**
  - Faders de ganancia individual para cada canal (A1, A2, A3 y Master).
  - Estados de Mute y Solo para control analítico de escucha.
  - Algoritmo de atenuación automática (auto-ducking) que atenúa la música secundaria cuando el locutor habla en A1.
- **Persistencia de Recursos de Audio (`src/services/audio/AudioPersistence.ts`):**
  - Almacenamiento duradero de grabaciones y clips de audio en IndexedDB con soporte para Blobs y conversiones ArrayBuffer.
- **Integración con el Exportador de Video (`src/engine/exporter.ts`):**
  - Reemplazo del sintetizador básico SpeechSynthesis por el stream multicanal real de `AudioEngine` acoplado al `MediaRecorder` de video.
- **Suite de Pruebas Unitarias de Fase 7D (`src/__tests__/audioEngine.test.ts`):**
  - 5 pruebas exhaustivas elevando el total del repositorio a 52 pruebas pasando al 100% en Vitest.
- **Documentación de la Fase 7D:**
  - `docs/PHASE_7D_AUDIO_ARCHITECTURE.md`
  - `docs/PHASE_7D_AUDIO_ENGINE_SPEC.md`
  - `docs/PHASE_7D_VOICE_RECORDING_SPEC.md`
  - `docs/PHASE_7D_MULTITRACK_MIXER_GUIDE.md`
  - `docs/PHASE_7D_NARRATION_SYNC_MANUAL.md`
  - `docs/PHASE_7D_EXPORTER_INTEGRATION_GUIDE.md`
  - `docs/PHASE_7D_ANDROID_AUDIO_GUIDE.md`
  - `docs/PHASE_7D_TEST_REPORT.md`
  - `docs/PHASE_7D_FINAL_ACCEPTANCE.md`

---

## [Fase 7C - Edición Interactiva Real y Timeline Multipista] - 2026-10-31

### Agregado
- **Motor de Edición de Clips y Timeline (`src/services/timeline/timelineEngine.ts`):**
  - Métodos puros deterministas: `moveClip`, `trimClipIn`, `trimClipOut`, `splitClipAtPlayhead`, `duplicateClip`, `deleteClip`, `reorderClips` y conmutadores de bloqueo, visibilidad y silencio.
  - Sincronización bidireccional continua entre `TimelineTrack[]` y `Scene[]` en el modelo del proyecto.
- **Gestor de Historial Deshacer/Rehacer (`UndoRedoManager`):**
  - Pila inmutable con límite configurable (30 estados) y limpieza de rehacer en nuevas acciones.
- **Controles Interactivos en `ProductionStudio.tsx`:**
  - Botón de división rápida en cabezal (split con icono de tijeras).
  - Botones de duplicación, eliminación y recorte de entrada (+1s) y salida (+1s/-1s).
  - Cabezal de tiempo interactivo (scrubber) con telemetría de posición en milisegundos.
  - Cabeceras de pista con conmutadores de bloqueo, visibilidad y silencio de audio.
  - Botones Deshacer y Rehacer integrados en la barra de herramientas del timeline.
- **Actualización del Motor Visual Canvas 2D (`src/engine/renderEngine.ts`):**
  - Detección y respeto del estado de visibilidad de las pistas V1 (Video) y T1 (Subtítulos).
- **Suite de Pruebas Unitarias de Fase 7C (`src/__tests__/timelineEngine.test.ts`):**
  - 10 pruebas unitarias completas elevando el total a 47 pruebas pasando al 100% en Vitest.
- **Documentación de la Fase 7C:**
  - `docs/PHASE_7C_TIMELINE_IMPLEMENTATION.md`
  - `docs/PHASE_7C_CLIP_EDITING.md`
  - `docs/PHASE_7C_TRACK_SYSTEM.md`
  - `docs/PHASE_7C_UNDO_REDO.md`
  - `docs/PHASE_7C_PERSISTENCE_TESTS.md`
  - `docs/PHASE_7C_ANDROID_DESKTOP_TESTS.md`
  - `docs/PHASE_7C_TEST_REPORT.md`
  - `docs/PHASE_7C_FINAL_ACCEPTANCE.md`

---

## [Fase 7B - Diseño y Planificación Integral del Estudio Audiovisual Profesional] - 2026-10-31

### Agregado
- **Barra de Estado Global en Tiempo Real (`src/components/GlobalStatusBar.tsx`):**
  - Exhibe telemetría activa del proyecto: título, indicador reactivo de guardado IndexedDB, código de tiempo SMPTE (HH:MM:SS:FF) a 30 FPS, persistencia duradera de almacenamiento (`navigator.storage.persist()`), contador de escenas y estado del motor de IA.
- **Estudio de Producción y Montaje Unificado (`src/modules/ProductionStudio.tsx`):**
  - Panel interactivo que combina el monitor Canvas 2D, el timeline multipista (pistas V1 Video, A1 Audio, T1 Subtítulos) con control de zoom de escala, y 10 categorías de herramientas especializadas (Medios, Audio, Texto, Subtítulos, Transiciones, Efectos, Filtros, Animaciones, Color, Capas).
- **Selector de Perfiles de Exportación Multiformato (`src/components/ExportProfilesModal.tsx`):**
  - Configuración previa al renderizado con soporte para Full HD 1080p (16:9), HD 720p (16:9), Vertical 1080p (9:16 para TikTok, Reels, Shorts) y Cuadrado 720p (1:1), con cálculo automático de peso estimado en megabytes.
- **Modelos de Dominio Extensibles (`src/types/index.ts`):**
  - Incorporación de `TimelineTrack`, `TimelineClip`, `TimelineMarker`, `SubtitleCue`, `ExportProfile` y propiedades de transformación, velocidad y color.
- **Batería de Pruebas Unitarias de Fase 7B (`src/__tests__/productionStudio.test.ts`):**
  - 4 pruebas unitarias que elevan el total a 37 pruebas superadas al 100% en Vitest.
- **Documentación de la Fase 7B:**
  - `docs/PHASE_7B_FUNCTIONAL_INVENTORY.md`
  - `docs/PHASE_7B_FEATURE_GAP_ANALYSIS.md`
  - `docs/PHASE_7B_FORMAT_COMPATIBILITY.md`
  - `docs/PHASE_7B_PRODUCTION_ARCHITECTURE.md`
  - `docs/PHASE_7B_DESIGN_SYSTEM.md`
  - `docs/PHASE_7B_IMPLEMENTATION_REPORT.md`
  - `docs/PHASE_7B_TEST_REPORT.md`
  - `docs/PHASE_7B_MASTER_ROADMAP.md`
  - `docs/PHASE_7B_FINAL_ACCEPTANCE.md`

---

## [Fase 7A - Auditoría UX, Benchmarking y Arquitectura del Estudio Híbrido] - 2026-10-31

### Agregado
- **Investigación y Auditoría Integral de la Fase 7A:**
  - `docs/PHASE_7A_PRODUCT_AUDIT.md`: Estado real del producto, inventario de módulos y diagnóstico de brechas técnicas.
  - `docs/PHASE_7A_UX_AUDIT.md`: Evaluación de fricciones de experiencia y oportunidades de diseño por pantalla.
  - `docs/PHASE_7A_COMPETITIVE_BENCHMARK.md`: Análisis técnico verificado de DaVinci Resolve 21, Adobe Premiere Pro, Descript y Runway ML.
  - `docs/PHASE_7A_INFORMATION_ARCHITECTURE.md`: Arquitectura de información unificada con 9 espacios de trabajo y barra de estado global.
  - `docs/PHASE_7A_DESIGN_SYSTEM.md`: Sistema de diseño para postproducción audiovisual profesional (paleta cromática, tipografía y ergonomía táctil Android).
  - `docs/PHASE_7A_AI_EXPERIENCE.md`: Estrategia de IA contextual no invasiva, ética socrática, separación de hechos/hipótesis y aislamiento BYOK en `sessionStorage`.
  - `docs/PHASE_7A_PRODUCTION_ARCHITECTURE.md`: Hoja de evolución del motor de renderizado y solución Web Audio API para locución grabable en video.
  - `docs/PHASE_7A_MASTER_ROADMAP.md`: Priorización de mejoras P0 a P3 y cronograma secuencial para Fases 7B a 7G.
  - `docs/PHASE_7A_DECISION_REGISTER.md`: Registro formal de decisiones arquitectónicas (ADRs), matriz de riesgos y mitigaciones.

### Modificado
- `docs/PROJECT_STATUS.md` y `docs/ROADMAP.md`: Actualizados reflejando la culminación de la investigación de la Fase 7A y la planificación de las Fases 7B a 7G.

---

## [Fase 6 - Auditoría y Aceptación Integral] - 2026-10-31

### Agregado
- **Suite de Pruebas de Integración y Recuperación `.EAI` (`src/__tests__/integrationEAI.test.ts`):**
  - Verificación end-to-end de exportación/importación, comprobación de firma SHA-256 ante manipulaciones, reconstrucción binaria y rendimiento con payload de 1 MB.
- **Suite de Pruebas de Flujo Cruzado IA + Restauración (`src/__tests__/aiRestoredFlow.test.ts`):**
  - Validación del ciclo completo: generación asistida por IA -> exportación `.eai` -> restauración no destructiva -> inyección contextual -> crítica y expansión narrativa.
- **Documentos de Auditoría de Fase 6:**
  - `docs/PHASE_6_INTEGRATION_AUDIT.md`: Informe maestro de integración de componentes.
  - `docs/PHASE_6_EAI_RECOVERY_TESTS.md`: Protocolo de pruebas de respaldo y recuperación.
  - `docs/PHASE_6_AI_INTEGRATION_TESTS.md`: Validación de tareas del motor de IA asistencial.
  - `docs/PHASE_6_ANDROID_COMPATIBILITY.md`: Auditoría de compatibilidad APK y viewport móvil.
  - `docs/PHASE_6_FINAL_ACCEPTANCE.md`: Acta de aceptación final y cumplimiento integral.

### Modificado
- `src/services/storage/projectBackup.ts`: Agregado fallback universal `blob.arrayBuffer()` en `blobToBase64()` para compatibilidad en entornos Node/Vite y browser.
- `docs/PROJECT_STATUS.md` y `docs/TESTING.md`: Actualizados con el estado de 33 pruebas unitarias e integración pasando al 100%.

---

## [Fase 6C] - 2026-10-31

### Agregado
- **Motor de IA Modular y Desacoplado (`src/services/ai/aiEngine.ts`, `types.ts`):**
  - Soporte multi-proveedor sin dependencias de pago obligatorias: `offline-heuristic` ($0/mes, local determinista), `gemini-free` (Google Gemini 1.5 Flash Free Tier) y `openai-compatible` (Groq/Ollama/OpenAI).
  - Aislamiento estricto de claves API en `sessionStorage` (sin fugas en disco, repo ni paquetes de respaldo `.eai`).
  - Soporte para cancelación mediante `AbortController` y seguimiento de progreso.
- **Asistente Global Flotante (`src/components/AIAssistantDrawer.tsx`):**
  - Panel lateral deslizable para interacciones asistidas con inyección automática del estado completo del proyecto activo.
- **Rediseño e Integración Bidireccional en Módulos de Estudio:**
  - `IdeaLab.tsx`: Generación de ángulos críticos contextuales y promoción instantánea a escena en guion ("A Guion").
  - `ScriptWorkshop.tsx`: Auditoría de cadencia/ritmo, cálculo de palabras por segundo, expansión con IA e historial de versiones no destructivo ("Antes de expansión IA").
  - `ResearchModule.tsx`: Diagnóstico automático de evidencias y balance de hechos/interpretaciones/hipótesis.
  - `StoryboardModule.tsx`: Recomendaciones automáticas de movimientos de cámara y transiciones según la densidad de texto.
  - `MediaLibraryModule.tsx`: Etiquetado semántico inteligente para assets.
- **Batería de Pruebas Unitarias de IA (`src/__tests__/aiEngine.test.ts`):**
  - 9 pruebas unitarias exhaustivas elevando el total a 26 pruebas pasando al 100% en Vitest.
- **Documentación Completa:**
  - `docs/PHASE_6_UX_AUDIT.md`: Auditoría de componentes de IA existentes (Categorías A, B, C, D).
  - `docs/PHASE_6_UX_BENCHMARK.md`: Análisis comparativo frente a Linear, Figma, Descript y DaVinci Resolve.
  - `docs/PHASE_6_DESIGN_SYSTEM_REPORT.md`: Sistema de diseño consolidado (paleta, tipografía, ergonomía pro).
  - `docs/PHASE_6C_PROVIDER_COMPARISON.md`: Comparativa técnica y económica de proveedores de IA.
  - `docs/PHASE_6C_AI_ARCHITECTURE.md`: Diagrama y flujos arquitectónicos del subsistema de IA.
  - `docs/PHASE_6C_AI_IMPLEMENTATION_REPORT.md`: Reporte de implementación técnica.
  - `docs/PHASE_6_PRODUCT_ACCEPTANCE_REPORT.md`: Reporte de aceptación final de producto.

---

## [Fase 6A & 6B] - 2026-10-31

### Agregado
- **Formato y Servicio de Respaldo `.eai` (`src/services/storage/projectBackup.ts`):**
  - Exportación de proyectos a paquetes binarios JSON canónicos con extensión `.eai`.
  - Generación de checksum criptográfico SHA-256 utilizando la Web Crypto API (`crypto.subtle.digest`).
  - Detección inmediata de manipulaciones o archivos corruptos durante la importación.
  - Resolución configurable de colisiones de identificador (`create_copy` con nuevo UUID, `overwrite` y `skip`).
  - Exportación multilicencia y por lotes (batch) de toda la base de datos de proyectos locales.
  - Función `ensureStoragePersistence()` que comprueba y solicita persistencia duradera en el navegador (`navigator.storage.persist()`).
- **Home Dashboard & Gestor de Temas (`src/modules/HomeDashboard.tsx` y `src/services/ui/theme.ts`):**
  - Panel unificado de control de proyectos locales con métricas de estudio en tiempo real (escenas, duración, medios).
  - Modal asistido de importación con previsualización de metadatos (título, autor, fecha) y validación criptográfica en vivo.
  - Selector de temas (`light`, `dark`, `auto`) persistido en `localStorage['estudio_theme']`.
  - Interfaz responsiva y amigable para dispositivos móviles y escritorio.
- **Suite de Pruebas Unitarias de Respaldo (`src/__tests__/backup.test.ts`):**
  - 7 pruebas unitarias completas que cubren cálculo SHA-256, rechazo de alteraciones, magic number e importación con colisiones.
- **Documentación de Validación y Progreso:**
  - `docs/PHASE_6_VALIDATION_REPORT.md`: Auditoría de la APK de 4.1 MB, modelo de costos $0/mes y validación de las 8 especificaciones.
  - `docs/PHASE_6A_IMPLEMENTATION_REPORT.md`: Reporte técnico de la fase 6A.
  - `docs/PHASE_6B_IMPLEMENTATION_REPORT.md`: Reporte técnico de la fase 6B.
  - `docs/PHASE_6_IMPLEMENTATION_PROGRESS.md`: Estado de avance de la Fase 6.
  - `docs/PHASE_6_TEST_RESULTS.md`: Resumen detallado de las 17 pruebas unitarias y verificación Playwright.

### Modificado
- `src/App.tsx`: Incorporación de la pestaña "Inicio" (`home`), botón de acceso rápido a copia física `.eai` en el header global, y enlace directo desde el dashboard al taller audiovisual.
- `docs/PROJECT_STATUS.md`: Actualizado reflejando la completitud de las Fases 6A y 6B.

---

## [Fase 1 a 5] - 2026-10-30

### Agregado
- Motor audiovisual Canvas 2D local a 720p 30 FPS (`src/engine/renderEngine.ts`).
- Exportador de video WebM con `MediaRecorder` (`src/engine/exporter.ts`).
- Capa de persistencia local en IndexedDB (`src/services/storage/db.ts`).
- Módulos de estudio: Laboratorio de Ideas, Investigación con fuentes y hechos/hipótesis, Taller de Guion con estimación de locución, Storyboard audiovisual y Biblioteca Multimedia.
- Proyectos documentales predefinidos: "La primera página web" y "El nacimiento de Linux".
