# CHANGELOG - ESTUDIO AUDIOVISUAL INTELIGENTE

Todos los cambios notables realizados en el proyecto quedan registrados en este documento.

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
