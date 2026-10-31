# Registro de Cambios - Estudio Audiovisual Inteligente

## [2.3.0] - Implementación Fase 6A (.eai & Persistencia) y Piloto UI/UX Fase 6B
### Añadido
- **Servicio de Respaldo e Importación Portable (`src/services/storage/projectBackup.ts`)**: Generación y lectura de paquetes `.eai` completos, serializando escenas, fuentes y medios en Base64.
- **Protección de Almacenamiento Persistente**: Invocación y diagnóstico de `navigator.storage.persist()` para proteger IndexedDB contra purgas del sistema operativo en Android y navegadores.
- **Componente Piloto de Inicio (`src/modules/HomeDashboard.tsx`)**: Pantalla de Inicio compacta con selector de proyectos, métricas de producción, estado de persistencia y botones de exportación/importación `.eai`.
- **Suite de Pruebas Unitarias (`src/__tests__/backup.test.ts`)**: 5 nuevas pruebas unitarias para serialización, parsing y restauración de paquetes `.eai` (13/13 pruebas pasando).
- **Informe de Resultados en `docs/PHASE_6A_IMPLEMENTATION_REPORT.md`**.

## [2.2.0] - Generación y Entrega del APK Android (`app-debug.apk`)
### Añadido
- **Empaquetado APK Nativo Android**: Compilación exitosa del archivo descargable `app-debug.apk` (4.1 MB) mediante Capacitor 6.2 y Gradle 8.14.
- **Sección de Entrega en `docs/APP_DEMO_AUDIT.md`**: Actualización con detalles técnicos de plataforma, arquitectura soportada (ARM64/ARMv7/x86_64) e instrucciones de descarga e instalación.

## [2.1.0] - Auditoría de Funcionamiento Real Cloud-First
### Añadido
- **Informe de Auditoría de Integración Cloud (`docs/CLOUD_INTEGRATION_AUDIT.md`)**: Diagnóstico detallado del funcionamiento real frente a simuladores, clasificación de las 6 áreas clave (Autenticación, Persistencia, Sincronización, Trabajos Cloud, Renderizado y Capacitor) y respuesta directa a las 9 preguntas clave del proyecto.

## [2.0.0] - Implementación Cloud-First y Desarrollo del Capítulo 2
### Añadido
- **Arquitectura Cloud-First & Multiplataforma**: Documentación de arquitectura (`docs/CLOUD_ARCHITECTURE.md`), modelo de seguridad RLS (`docs/SECURITY_MODEL.md`) y guía de despliegue (`docs/DEPLOYMENT_GUIDE.md`).
- **Esquema Relacional PostgreSQL/Supabase**: Definición SQL completa en `supabase/schema.sql` con Row Level Security por usuario.
- **Sincronización Incremental Offline-First**: Implementación de `SyncEngine` (`src/services/sync/syncEngine.ts`) y documentación en `docs/STORAGE_AND_SYNC.md`.
- **Cola de Trabajos Asíncronos Cloud**: Gestor de trabajos pesados `JobQueueManager` (`src/services/jobs/jobQueue.ts`) y especificación de costos/renderizado (`docs/CLOUD_RENDERING.md`).
- **Configuración Native Android**: Integración de Capacitor JS (`capacitor.config.json`).
- **Capítulo 2 del Documental**: Guion completo de 85s en `docs/SCRIPT_CHAPTER_02.md` y sincronización con `src/data/demoProject.ts`.

## [1.3.0] - Auditoría Narrativa, Histórica y Audiovisual del Capítulo 1
### Añadido
- **Informe de Auditoría Completo (`docs/AUDIT_CHAPTER_01.md`)**: Evaluación del Capítulo 1 ("El problema invisible", 80s) obteniendo una puntuación global integrada de **9.0/10**.
- **Prueba Real con Playwright**: Renderizado de video WebM de 80s (`bf029341946061e314ca233848657e92.webm`, 1.45 MB, 720p @ 30 FPS) y captura de pantalla `audit_chapter_01.png`.
- **Evolución del Guion de Cap. 1 (`docs/SCRIPT_CHAPTER_01.md`)**: 5 escenas desglosadas con intenciones visuales, movimientos de cámara y verificación histórica frente a fuentes del CERN y W3C.

## [1.2.0] - Inicialización del Primer Documental y Cierre de Análisis
### Añadido
- **Proyecto Documental Oficial Preparado**: Proyecto de producción inicializado para *"La primera página web: el comienzo de algo que cambiaría el mundo"* (`src/data/demoProject.ts`).
- **Análisis de Pista de Audio y Códecs**: Documentación exhaustiva en `docs/PRODUCTION_TEST.md` sobre `SpeechSynthesis` vs `WebAudioDestination`, códec VP8 en WebM y limitaciones Android.
- **Batería de Pruebas Unitarias Actualizada**: Tests adaptados a la plantilla inicial del documental en `src/__tests__/`.
