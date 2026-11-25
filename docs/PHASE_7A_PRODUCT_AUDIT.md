# Auditoría del Producto Actual y Diagnóstico Funcional (Fase 7A)

**Documento:** `docs/PHASE_7A_PRODUCT_AUDIT.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico
**Estado:** Inspección Verificada sobre el Repositorio Real

---

## 1. Resumen Ejecutivo de la Auditoría

Se realizó una inspección exhaustiva de todo el código fuente del repositorio (`src/`, `docs/`, configuraciones y binarios compilados), evaluando la correspondencia entre la documentación previa y el código real ejecutándose en la aplicación.

### Principales Conclusiones:
1. **El núcleo de la aplicación es 100% funcional y opera offline.** No depende de infraestructura de pago ni de credenciales en GitHub.
2. **La persistencia local en IndexedDB y el sistema de respaldo `.eai` son sólidos y seguros.** Se verificó la firma criptográfica SHA-256 y la resolución de colisiones `create_copy`.
3. **El paquete nativo Android (`app-debug.apk` y `public/app-debug.apk`) se encuentra íntegro y verificado** (SHA-256: `cba367cce76c2613a59220007ea1eb71f5f9cc43fc6a63c47dd4cbfa871c4b0e`, 4.1 MB).
4. **Existen áreas de desacoplamiento y limitaciones técnicas:**
   - La voz sintetizada por `window.speechSynthesis` en `exporter.ts` suena en los altavoces locales del dispositivo durante la exportación pero no se canaliza al stream del `MediaRecorder`, por lo que el archivo descargado actualmente carece de locución real incorporada (solo contiene el tono oscilador sintetizado por Web Audio API).
   - No existe un timeline visual interactivo de múltiples pistas (video, audio, subtítulos).
   - El reproductor de previsualización `VideoPlayer` y el panel de edición están acoplados en una disposición fija de dos columnas.

---

## 2. Inventario y Diagnóstico Módulo por Módulo

### 2.1 Módulo Home / Dashboard (`src/modules/HomeDashboard.tsx`)
- **Estado:** **Implementado y Operativo.**
- **Funcionalidad real:** Muestra métricas agregadas del estudio (proyectos, escenas, duración total, medios en BD), estado de persistencia de `navigator.storage`, selector de temas (`dark`, `light`, `auto`), exportación `.eai` individual y por lotes, modal de importación con chequeo SHA-256 y prevención de colisión (`create_copy` o `overwrite`).
- **Problemas detectados:** Si se borra un proyecto, no hay papelera temporal (solo diálogo de confirmación `confirm()`).
- **Oportunidades:** Permitir renombrar proyectos desde el listado y filtrar por etiquetas.

### 2.2 Laboratorio de Ideas (`src/modules/IdeaLab.tsx`)
- **Estado:** **Implementado y Operativo.**
- **Funcionalidad real:** Formulación de ángulos narrativos manuales y generación mediante IA (`SUGGEST_NARRATIVE_ANGLES`). Botón "A Guion" que convierte el gancho en escena cinematográfica.
- **Problemas detectados:** Los ángulos creados no quedan vinculados relacionalmente a las escenas una vez promovidos; la conversión es una copia unidireccional de texto.
- **Oportunidades:** Permitir trazabilidad de qué escena surgió de qué ángulo.

### 2.3 Matriz de Investigación (`src/modules/ResearchModule.tsx`)
- **Estado:** **Implementado y Operativo.**
- **Funcionalidad real:** Registro de fuentes con autor, URL, notas, tipo de evidencia (`Fact`, `Hypothesis`, `Interpretation`, `Debunked`), licencia (`CC-BY`, `Public Domain`, etc.) y estado de verificación. Auditoría asistida de evidencias por IA (`ANALYZE_RESEARCH_EVIDENCE`).
- **Problemas detectados:** Las fuentes no están enlazadas directamente a las escenas del guion ni a los textos de narración específicos.
- **Oportunidades:** Resaltar en el guion las afirmaciones que tienen o carecen de respaldo fáctico registrado.

### 2.4 Taller de Guion (`src/modules/ScriptWorkshop.tsx`)
- **Estado:** **Implementado y Operativo.**
- **Funcionalidad real:** Edición escena por escena, cálculo de cadencia de locución en tiempo real (palabras/segundo), auditoría de ritmo por IA (`CRITIQUE_SCRIPT`), expansión no destructiva (`EXPAND_SCENE_NARRATION`) e historial de versiones local en memoria para restaurar cambios previos.
- **Problemas detectados:** El historial de versiones es volátil en el estado React (`useState`) y se reinicia si el usuario navega a otra pestaña sin haber guardado cambios mayores en el proyecto.
- **Oportunidades:** Persistir el historial de versiones en IndexedDB como commits o snapshots del proyecto.

### 2.5 Dirección Audiovisual y Storyboard (`src/modules/StoryboardModule.tsx`)
- **Estado:** **Parcialmente Implementado.**
- **Funcionalidad real:** Muestra tarjetas de cada escena con previsualización de imagen, duración, intención visual, tipo de movimiento de cámara (`Zoom In`, `Pan Left`, etc.) y transición (`Cut`, `Fade`, etc.). Botón para pedir recomendaciones a la IA.
- **Problemas detectados:** No permite reordenar escenas mediante arrastrar y soltar (drag & drop), ni editar los parámetros directamente desde la tarjeta del storyboard (hay que ir al Taller de Guion).
- **Oportunidades:** Permitir reordenamiento visual interactivo y edición rápida in situ.

### 2.6 Biblioteca Multimedia (`src/modules/MediaLibraryModule.tsx`)
- **Estado:** **Implementado y Operativo.**
- **Funcionalidad real:** Carga de imágenes, audios y videos locales, almacenamiento de blobs en IndexedDB (`assets`), filtrado por tipo, cálculo de tamaño y etiquetado semántico asistido (`CATEGORIZE_MEDIA_ASSET`).
- **Problemas detectados:** No permite asignar un medio cargado directamente a una escena específica desde este módulo; el usuario debe copiar o recordar el archivo.
- **Oportunidades:** Selector directo "Asignar a Escena #X" o arrastrar a la escena correspondiente.

### 2.7 Motor Audiovisual Canvas 2D (`src/engine/renderEngine.ts`)
- **Estado:** **Implementado y Operativo.**
- **Funcionalidad real:** Renderizado autónomo a 720p 30 FPS. Dibuja fondos con interpolación de movimiento de cámara (Ken Burns), fondos procedimentales si no hay imagen, banners de intención visual, textos cinéticos animados con ajuste automático de saltos de línea (word wrap) y marca de agua del estudio.
- **Problemas detectados:** Solo soporta una capa de imagen/video de fondo y una capa de texto superpuesta. No tiene soporte para múltiples pistas superpuestas (video b-roll, overlays gráficos simultáneos, pistas de audio separadas).
- **Oportunidades:** Modularizar el pipeline de renderizado en capas o pistas.

### 2.8 Exportador de Video (`src/engine/exporter.ts`)
- **Estado:** **Parcialmente Implementado / Con Limitación en Audio.**
- **Funcionalidad real:** Exportación autónoma a WebM (VP9/VP8) usando `HTMLCanvasElement.captureStream(30)` y `MediaRecorder`. Emite telemetría de progreso cuadro por cuadro.
- **Problema Crítico Detectado:** Utiliza `window.speechSynthesis` para leer el guion durante la exportación. Sin embargo, la Web Speech API no se conecta a un `MediaStreamTrack` ni al `AudioContext` de la grabación, por lo que la locución se oye por los altavoces de la computadora pero no se graba en el archivo de video resultante (el video solo contiene el tono ambiental generado por el oscilador Web Audio).
- **Solución Requerida:** Integrar síntesis o reproducción de audio basada en Web Audio API (cargando clips de audio o pregrabando la locución) para inyectarla directamente al `MediaStreamDestination`.

### 2.9 Motor Central de IA (`src/services/ai/aiEngine.ts`)
- **Estado:** **Implementado y Operativo.**
- **Funcionalidad real:** 3 proveedores (`offline-heuristic`, `gemini-free`, `openai-compatible`), soporte de cancelación con `AbortController`, inyección de contexto desde el proyecto activo, credenciales aisladas en `sessionStorage`.
- **Problemas detectados:** Las respuestas de los modelos externos a veces requieren limpieza de markdown fences (se maneja con regex, pero debe formalizarse con schemas estructurados).
- **Oportunidades:** Streaming de texto para proveedores compatibles y biblioteca de sugerencias frecuentes.
