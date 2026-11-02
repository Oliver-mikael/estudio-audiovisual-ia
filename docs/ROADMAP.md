# Roadmap de Desarrollo - Estudio Audiovisual Inteligente

## Fase 1: Inspección, Protección y Documentación Base
- [x] Crear `.gitignore` seguro para evitar subir claves y dependencias.
- [x] Establecer documentos de arquitectura, roadmap, status y changelog en `/docs`.
- [x] Actualizar `README.md` general.

## Fase 2: Configuración del Proyecto y Estructura Modular
- [ ] Configuración de Vite, React, TypeScript y Tailwind CSS.
- [ ] Estructura modular de carpetas en `src/modules/`.
- [ ] Sistema de estado global y persistencia en IndexedDB (`src/services/storage/`).

## Fase 3: Demostración Real del Motor Audiovisual y Exportación
- [ ] Motor de renderizado en HTML5 Canvas con soporte para imágenes, textos kinéticos y voz en off.
- [ ] Sistema de línea de tiempo e hilos de audio sincronizados.
- [ ] Exportador de video en cliente mediante MediaRecorder/Canvas stream (720p 30fps).
- [ ] Interfaz de previsualización con controles de reproducción.

## Fase 4: Módulos Inteligentes de Creación
- [ ] Módulo Laboratorio de Ideas (generador de enfoques y cuestionamiento crítico).
- [ ] Módulo de Investigación (registro de fuentes, hechos, hipótesis y licencias).
- [ ] Módulo Taller de Guion (editor interactivo, análisis de ritmo y división en escenas).
- [ ] Módulo Storyboard & Dirección Audiovisual.
- [ ] Módulo Biblioteca Multimedia (subida de recursos, previsualización, licencias).

## Fase 5: Validación Integral y Pruebas Automáticas
- [x] Pruebas unitarias para cálculo de tiempos y parsers de guion (8 tests pasados).
- [x] Verificación de exportación local sin fugas de memoria (WebM 720p @ 30 FPS).
- [x] Documentación final y auditoría técnica completa.
- [x] Compilación y empaquetado de APK Android (4.1 MB).

## Fase 6: Transformación en Plataforma Cloud-First
- [x] **Investigación, Diseño y Planificación Maestra (`docs/CLOUD_FIRST_TRANSFORMATION_PLAN.md`):**
  - Entregable 1: Auditoría de arquitectura actual (real vs. simulado).
  - Entregable 2: Comparación técnica PWA vs. Capacitor OTA vs. Híbrida.
  - Entregable 3: Propuesta de arquitectura Cloud-First (Supabase + Workers FFmpeg).
  - Entregable 4: Sistema de diseño visual profesional y compacto.
  - Entregable 5: Propuesta de navegación adaptativa (Android vs. Computadora).
  - Entregable 6: Plan de migración y protección de datos locales.
  - Entregable 7: Estimación de costes y niveles gratuitos ($0/mes).
  - Entregable 8: Plan de implementación secuencial por etapas.
- [ ] **Etapa 6.1:** Rediseño visual compacto y navegación adaptativa.
- [ ] **Etapa 6.2:** Autenticación de usuarios y perfiles en Supabase.
- [ ] **Etapa 6.3:** Sincronización remota real y migración de datos IndexedDB.
- [ ] **Etapa 6.4:** Actualizaciones silenciosas OTA (sin reinstalar APK).
- [ ] **Etapa 6.5:** Worker cloud de renderizado FFmpeg y tareas asíncronas.

## Fase 7: Estudio Híbrido Profesional (Evolución Local-First y Control Creativo)
- [x] **Fase 7A: Auditoría UX, Benchmarking y Arquitectura del Estudio Híbrido:**
  - [x] Inspección exhaustiva del código fuente real y diagnóstico funcional (`docs/PHASE_7A_PRODUCT_AUDIT.md`).
  - [x] Auditoría de experiencia de usuario y oportunidades de mejora (`docs/PHASE_7A_UX_AUDIT.md`).
  - [x] Benchmarking competitivo oficial: DaVinci Resolve 21, Premiere Pro, Descript, Runway (`docs/PHASE_7A_COMPETITIVE_BENCHMARK.md`).
  - [x] Mapa de navegación y arquitectura de información de 9 áreas (`docs/PHASE_7A_INFORMATION_ARCHITECTURE.md`).
  - [x] Sistema de diseño profesional para postproducción audiovisual (`docs/PHASE_7A_DESIGN_SYSTEM.md`).
  - [x] Estrategia de IA contextual no invasiva y ética socrática (`docs/PHASE_7A_AI_EXPERIENCE.md`).
  - [x] Arquitectura de producción y solución de audio Web Audio API (`docs/PHASE_7A_PRODUCTION_ARCHITECTURE.md`).
  - [x] Hoja de ruta maestra y priorización P0 a P3 (`docs/PHASE_7A_MASTER_ROADMAP.md`).
  - [x] Registro de decisiones arquitectónicas y mitigación de riesgos (`docs/PHASE_7A_DECISION_REGISTER.md`).
- [x] **Fase 7B:** Sistema de Navegación Unificada, Barra de Estado Global y Responsive Layout:
  - [x] Implementación de `GlobalStatusBar.tsx` con telemetría SMPTE, IndexedDB y estado de IA.
  - [x] Implementación de `ProductionStudio.tsx` con 10 categorías de herramientas y timeline multipista.
  - [x] Implementación de `ExportProfilesModal.tsx` con aspectos 16:9, 9:16 vertical y 1:1.
  - [x] Extensión de tipos de datos en `types/index.ts` con compatibilidad hacia atrás.
  - [x] 37 pruebas pasando limpiamente en Vitest (`src/__tests__/productionStudio.test.ts`).
  - [x] 9 documentos de auditoría e inventario generados en `docs/PHASE_7B_*.md`.
- [x] **Fase 7C:** Timeline Multipista y Sincronización Narrativa Guion-Video:
  - [x] Implementación de `TimelineEngine` con división en cabezal, recorte In/Out, duplicación y eliminación.
  - [x] Implementación de `UndoRedoManager` inmutable con 30 pasos de historial.
  - [x] Actualización de `ProductionStudio.tsx` con controles interactivos de edición y cabezal scrubber.
  - [x] Actualización de `renderEngine.ts` respetando visibilidad de pistas V1 y subtítulos T1.
  - [x] 47 pruebas unitarias aprobadas al 100% en Vitest (`src/__tests__/timelineEngine.test.ts`).
  - [x] 8 documentos de implementación y pruebas generados en `docs/PHASE_7C_*.md`.
- [x] **Fase 7D:** Motor de Audio Híbrido Web Audio API, Grabación de Voz y Mezcla Multipista (Completada y Aprobada Provisionalmente):
  - [x] Implementación de `AudioEngine.ts` con Web Audio Context, faders y enrutamiento a altavoces y `createMediaStreamDestination`.
  - [x] Grabación directa de voz por micrófono mediante `AudioRecorder.ts` y persistencia en IndexedDB (`AudioPersistence.ts`).
  - [x] Mezcladora multicanal desacoplada (`AudioMixer.ts`) con faders independientes (A1, A2, A3, Master) y atenuación automática (auto-ducking).
  - [x] Reemplazo de `speechSynthesis` en `exporter.ts` por el stream de mezcla multicanal real conectado a `MediaRecorder`.
  - [x] 52 pruebas unitarias y de integración pasando al 100% en Vitest (`src/__tests__/audioEngine.test.ts`).
  - [x] 9 documentos técnicos y de especificación generados en `docs/PHASE_7D_*.md`.
- [ ] **Fase 7E:** Biblioteca de Medios Inteligente (Bins, Previsualización y Vinculación Dinámica) [En Espera de Autorización].
- [ ] **Fase 7F:** Asistencia IA Contextual Profunda y Auditoría de Coherencia.
- [ ] **Fase 7G:** Optimización de Renderizado, Exportación Multiformato y Validación Integral en Android.
