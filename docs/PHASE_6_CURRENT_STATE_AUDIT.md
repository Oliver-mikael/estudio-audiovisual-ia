# ENTREGABLE 1 — AUDITORÍA DEL ESTADO ACTUAL DEL PROYECTO
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_CURRENT_STATE_AUDIT.md`
**Fase:** Fase 6 — Auditoría Técnica y Diagnóstico de Estado
**Propósito:** Proporcionar una fotografía técnica confiable del proyecto, distinguiendo taxativamente entre capacidades demostradas y código simulado o diseñado sin desplegar.

---

## 1. RESUMEN EJECUTIVO Y METODOLOGÍA DE AUDITORÍA

La auditoría se ejecutó directamente sobre el árbol de archivos, dependencias (`package.json`), scripts de compilación, suite de pruebas unitarias (`src/__tests__/`), configuración nativa (`capacitor.config.json`, `android/`), y esquemas SQL en el repositorio.

### Criterios de Clasificación:
1. **Funcional y Verificado:** Implementado en código fuente, verificado mediante tests automáticos o compilación ejecutada exitosamente.
2. **Parcialmente Implementado:** El código base existe pero carece de integración completa con la interfaz o backend.
3. **Simulado o Local:** Funciona en el navegador mediante stubs, temporizadores o memoria local (`localStorage`/`setTimeout`), sin persistencia distribuida.
4. **Diseñado, pero no Desplegado:** Especificaciones de arquitectura, modelos SQL o scripts documentados, pero sin servidor ni entorno activo.
5. **Pendiente:** Planificado en roadmap pero sin implementación activa en código.
6. **No Verificado:** Código escrito que no cuenta con suite de pruebas ni verificación en entorno productivo.

---

## 2. ARQUITECTURA GENERAL DEL FRONTEND Y ESTRUCTURA DE CÓDIGO

### Estructura de Directorios y Responsabilidades:
- `src/main.tsx`: Punto de entrada de React 18 montando `<App />` sobre el contenedor DOM `root`.
- `src/App.tsx`: Shell principal de la aplicación. Gestiona el estado reactivo del proyecto activo (`project`), selector de pestañas modulares, barra superior con botón de renderizado local y enlace directo de descarga del APK (`public/app-debug.apk`).
- `src/types/index.ts`: Definición rigurosa de modelos TypeScript (`Project`, `Scene`, `IdeaItem`, `EvidenceItem`, `MediaAsset`, `CloudJob`, `RenderConfig`).
- `src/modules/`:
  - `IdeaLab.tsx`: Laboratorio de ideas (preguntas disparadoras, ángulos narrativos y heurísticas de crítica).
  - `ResearchModule.tsx`: Registro y verificación de fuentes, afirmaciones, evidencias y clasificación epistemológica (hecho/hipótesis).
  - `ScriptWorkshop.tsx`: Taller de guion con cálculo automático de ritmo (~2.5 palabras/segundo) y desglose de locución.
  - `StoryboardModule.tsx`: Dirección visual, movimientos de cámara (Zoom In/Out, Pan Left/Right) e intención de escena.
  - `MediaLibraryModule.tsx`: Gestión de recursos multimedia y atribución de licencias.
- `src/components/VideoPlayer.tsx`: Monitor audiovisual interactivo montado sobre elemento `<canvas>`.
- `src/engine/`:
  - `renderEngine.ts`: Motor de composición Canvas 2D en cliente (fotogramas, textos cinéticos, barras de progreso y subtítulos).
  - `exporter.ts`: Exportador de video en cliente mediante `captureStream()`, `MediaRecorder` y Web Audio API.
- `src/services/`:
  - `storage/db.ts`: Capa de persistencia local IndexedDB (`idb`).
  - `cloud/api.ts`: Cliente de API cloud (actualmente adaptador mock con sesión en `localStorage`).
  - `sync/syncEngine.ts`: Motor de sincronización offline con cola de mutaciones en `localStorage`.
  - `jobs/jobQueue.ts`: Gestor de tareas pesadas simuladas con `setTimeout`.

---

## 3. MATRIZ DE ESTADO DE COMPONENTES DEL SISTEMA

| Componente / Módulo | Archivo(s) de Referencia | Clasificación | Evidencia Técnica en el Código |
| :--- | :--- | :---: | :--- |
| **Persistencia Local** | `src/services/storage/db.ts` | **Funcional y Verificado** | Base IndexedDB `EstudioAudiovisualDB` versión 1 con dos object stores: `projects` y `assets`. Probado en tests unitarios (`storage.test.ts`). |
| **Biblioteca Multimedia Local** | `src/modules/MediaLibraryModule.tsx`, `db.ts` | **Funcional y Verificado** | Carga de archivos vía `FileReader`, conversión a DataURL/Blob y guardado en IndexedDB. |
| **Motor Audiovisual Canvas 2D** | `src/engine/renderEngine.ts` | **Funcional y Verificado** | Composición a 1280x720p @ 30 FPS. Dibuja fondos cinéticos, gradientes oscuros, textos centrados animados y barras de subtítulo. |
| **Exportación de Video WebM** | `src/engine/exporter.ts` | **Funcional y Verificado** | Captura de stream de canvas mediante `captureStream(30)` y pistas de audio vía Web Audio API. Graba chunks en WebM (VP8/Opus). |
| **Autenticación Cloud** | `src/services/cloud/api.ts` | **Simulado o Local** | Guarda un token falso en `localStorage['estudio_cloud_session']` con usuario mock (`Mock Demo User`). No hay llamadas HTTP reales. |
| **Seguridad y RLS** | `supabase/schema.sql` | **Diseñado, pero no Desplegado** | Tablas `projects`, `scenes`, `source_references`, `cloud_jobs` con políticas `auth.uid() = user_id`. No hay instancia Supabase conectada. |
| **Sincronización Offline-First** | `src/services/sync/syncEngine.ts` | **Parcialmente Implementado** | La cola de mutaciones `estudio_sync_queue` guarda deltas en `localStorage`, pero el endpoint de subida invoca el mock local de `api.ts`. |
| **Cola de Trabajos Asíncronos** | `src/services/jobs/jobQueue.ts` | **Simulado o Local** | Encola trabajos en `localStorage['estudio_remote_jobs']` y simula progreso (0%-25%-75%-100%) mediante `setTimeout`. Si la app se cierra, se interrumpe. |
| **Worker Remoto FFmpeg** | `docs/CLOUD_RENDERING.md` | **Diseñado, pero no Desplegado** | Dockerfile y flujo de renderizado en Node.js/FFmpeg documentados, pero sin servidor físico en la nube ni worker desplegado. |
| **Envoltorio Android (APK)** | `capacitor.config.json`, `app-debug.apk` | **Funcional y Verificado** | APK compilado exitosamente con Gradle 8.14 (4.1 MB). Sirve el bundle de Vite en `assets/public/`. Verificado estructuralmente. |
| **Suite de Pruebas Unitarias** | `src/__tests__/` (`core`, `exporter`, `storage`) | **Funcional y Verificado** | 8 pruebas unitarias ejecutadas mediante Vitest (`vitest run`), pasando al 100% en < 2 segundos. |

---

## 4. DISTINCIÓN EXPRESA ENTRE LO DEMOSTRADO Y LO DOCUMENTADO

Para evitar falsas expectativas técnicas:

1. **Lo Demostrado Empíricamente:**
   - La aplicación React carga, reproduce y previsualiza a 30 FPS en tiempo real un guion documental estructurado de 2 capítulos (CERN, ENQUIRE, propuesta WWW de 1989).
   - El exportador genera un archivo `.webm` descargable de 720p con audio sintetizado local y subtítulos.
   - El almacenamiento local recupera el proyecto tras recargar la página.
   - El APK Android existe en disco (`app-debug.apk`), pesa 4.19 MB y contiene el build de producción en `assets/public/`.
2. **Lo que Solo Aparece en Documentación o Simulación:**
   - No existe un servidor en la nube activo procesando peticiones.
   - Si el usuario cierra el navegador o la aplicación Android mientras se procesa un trabajo simulado (`jobQueue.ts`), la tarea no continúa en ningún worker externo.
   - No hay sincronización multidispositivo real: los cambios hechos en el celular no viajan a la computadora porque ambos guardan únicamente en sus respectivos almacenes IndexedDB locales.

---

## 5. DIAGNÓSTICO DE LO QUE DEBE CONSERVARSE Y LO QUE DEBE EVOLUCIONAR

### Lo que Debe Conservarse Intacto:
- **El motor Canvas 2D local (`renderEngine.ts`):** Proporciona previsualización instantánea a coste cero sin latencia de red.
- **La persistencia local IndexedDB (`db.ts`):** Es la garantía de resiliencia y funcionamiento offline cuando el usuario no tiene conexión.
- **La estructura del proyecto documental:** Los modelos de datos y guiones documentales existentes (Capítulos 1 y 2) deben mantenerse 100% íntegros.

### Lo que Necesita Evolucionar:
- **Sustituir el mock de autenticación:** Reemplazar el token falso en `localStorage` por autenticación real mediante Supabase Auth o equivalente.
- **Sincronización remota:** La cola de mutaciones local debe conectarse a una base de datos PostgreSQL remota con resolución de conflictos.
- **Trabajos en segundo plano:** Las tareas de renderizado pesado y consultas de IA deben ser procesadas por workers independientes en la nube para no depender de la pantalla activa del celular.
- **Rediseño visual UI/UX:** Sustituir la interfaz experimental de botones grandes y espaciados excesivos por un entorno de trabajo compacto y optimizado para pantallas táctiles y escritorios.
