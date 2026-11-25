# Inventario Funcional Completo del Estudio Audiovisual (Fase 7B)

**Documento:** `docs/PHASE_7B_FUNCTIONAL_INVENTORY.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. Inventario por Áreas Funcionales (Comparativa CapCut vs DaVinci Resolve)

| Área | Función | Estado Actual | Clasificación | Entorno de Ejecución |
|---|---|---|---|---|
| **A. Importación y Medios** | Carga de imágenes (PNG, JPG, WebP) | Implementado | Esencial (P0) | Local (IndexedDB) |
| A. Importación y Medios | Carga de audio (MP3, WAV) | Implementado | Esencial (P0) | Local (IndexedDB) |
| A. Importación y Medios | Carga de video (MP4, WebM) | Parcial | Esencial (P0) | Local (IndexedDB) |
| A. Importación y Medios | Importación de subtítulos (SRT, VTT) | Diseñado | Importante (P1) | Local (Parser texto) |
| A. Importación y Medios | Importación de fuentes (TTF, OTF) | Propuesto | Ampliación (P2) | Local (FontFace API) |
| **B. Edición de Video** | Recorte y ajuste de duración de escenas | Implementado | Esencial (P0) | Local (React State) |
| B. Edición de Video | División de clips / Corte interactivo | Diseñado | Esencial (P0) | Local (Timeline State) |
| B. Edición de Video | Control de velocidad (0.25x a 4x) | Modelado | Importante (P1) | Local (Canvas Engine) |
| B. Edición de Video | Transformaciones (X, Y, Escala, Rotación) | Modelado | Esencial (P0) | Local (Canvas 2D) |
| B. Edición de Video | Revertir reproducción / Congelar cuadro | Propuesto | Ampliación (P2) | Local |
| **C. Línea de Tiempo** | Timeline multipista visual (V1, A1, T1) | Implementado | Esencial (P0) | Local (`ProductionStudio`) |
| C. Línea de Tiempo | Scrubber de tiempo interactivo | Implementado | Esencial (P0) | Local |
| C. Línea de Tiempo | Bloqueo y visibilidad de pistas | Implementado | Importante (P1) | Local |
| C. Línea de Tiempo | Zoom de escala de tiempo (0.5x a 2x) | Implementado | Importante (P1) | Local |
| C. Línea de Tiempo | Ajuste magnético (Snapping) | Propuesto | Importante (P1) | Local |
| **D. Texto y Títulos** | Tipografía cinética con Word Wrap | Implementado | Esencial (P0) | Local (`renderEngine`) |
| D. Texto y Títulos | Títulos cinemáticos con fade y slide | Implementado | Esencial (P0) | Local |
| D. Texto y Títulos | Subtítulos inferiores con fondo translúcido | Implementado | Esencial (P0) | Local |
| D. Texto y Títulos | Plantillas de tercios inferiores y rótulos | Diseñado | Importante (P1) | Local |
| **E. Efectos y Color** | Efecto Ken Burns (Zoom In/Out, Pan) | Implementado | Esencial (P0) | Local (`renderEngine`) |
| E. Efectos y Color | Banner dinámico de intención visual | Implementado | Esencial (P0) | Local |
| E. Efectos y Color | Controles de exposición y saturación | Modelado | Importante (P1) | Local (CSS/Canvas Filter)|
| E. Efectos y Color | Presets de color (Noir, Cálido, Vintage) | Modelado | Importante (P1) | Local |
| E. Efectos y Color | Pantalla verde (Chroma Key) | Propuesto | Avanzado (P3) | Local (Canvas Pixel Loop) |
| **F. Audio y Locución** | Generación de tono ambiental Web Audio | Implementado | Esencial (P0) | Local (Web Audio API) |
| F. Audio y Locución | Grabación de voz en off con micrófono | Diseñado | Esencial (P0) | Local (MediaStream) |
| F. Audio y Locución | Ducking automático (música vs locución) | Modelado | Importante (P1) | Local (Web Audio API) |
| F. Audio y Locución | Locución integrada en video descargado | Diseñado (7D) | Crítico (P0) | Local (Web Audio Mix) |
| **G. Subtítulos** | Generación de cues sincronizados | Implementado | Esencial (P0) | Local |
| G. Subtítulos | Exportación SRT / VTT independiente | Diseñado | Importante (P1) | Local |
| **H. Asistente IA** | Generación de ángulos críticos | Implementado | Esencial (P0) | Local / Cloud Opcional |
| H. Asistente IA | Auditoría de cadencia y ritmo (w/s) | Implementado | Esencial (P0) | Local ($0/mes) |
| H. Asistente IA | Diagnóstico de fuentes fácticas vs hipótesis| Implementado | Esencial (P0) | Local ($0/mes) |
| H. Asistente IA | Recomendación de cámara y transiciones | Implementado | Esencial (P0) | Local ($0/mes) |
| **I. Exportación** | Renderizado en Canvas 2D a 720p 30 FPS | Implementado | Esencial (P0) | Local (`exporter.ts`) |
| I. Exportación | Perfiles 1080p, 720p, 9:16 y 1:1 | Implementado | Esencial (P0) | Local (`ExportProfilesModal`)|
| I. Exportación | Telemetría cuadro a cuadro y % progreso | Implementado | Esencial (P0) | Local |
