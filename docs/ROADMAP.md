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
