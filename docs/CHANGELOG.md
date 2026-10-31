# CHANGELOG - ESTUDIO AUDIOVISUAL INTELIGENTE

Todos los cambios notables realizados en el proyecto quedan registrados en este documento.

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
