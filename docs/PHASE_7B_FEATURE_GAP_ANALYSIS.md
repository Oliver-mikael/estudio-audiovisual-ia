# Análisis de Brechas Funcionales (Feature Gap Analysis) (Fase 7B)

**Documento:** `docs/PHASE_7B_FEATURE_GAP_ANALYSIS.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. Resumen de Brechas frente al Objetivo

Para alcanzar la visión de un **Estudio Híbrido Profesional** con la sencillez de CapCut y el rigor técnico de DaVinci Resolve, se identifican las siguientes brechas operativas:

### Brecha 1: Inyección de Locución Grabable en el Archivo de Video Exportado (Crítica - P0)
- **Estado Actual:** `exporter.ts` invoca `window.speechSynthesis` durante el renderizado, lo que produce sonido en los altavoces de la computadora pero no se mezcla dentro del `MediaStreamDestination` del `MediaRecorder`. El archivo de video WebM descargado solo contiene el tono sintetizado de fondo.
- **Acción Requerida (Fase 7D):** Permitir al usuario grabar o cargar clips de voz reales para cada escena y decodificarlos con `AudioContext.decodeAudioData`, mezclándolos directamente en la pista A1 enrutada a la exportación.

### Brecha 2: Manipulación Interactiva de Pistas en Timeline (P1)
- **Estado Actual:** El componente `ProductionStudio` muestra las pistas V1, A1 y T1 con zoom horizontal y selección de escenas, pero aún no permite arrastrar los bordes de los clips para cambiar duraciones directamente en el timeline (drag-to-trim).
- **Acción Requerida (Fase 7C):** Incorporar handles de recorte interactivo (in/out points) con puntero táctil y ratón.

### Brecha 3: Bins y Clasificación de Medios (P1)
- **Estado Actual:** `MediaLibraryModule` almacena los archivos en IndexedDB y los filtra por tipo (imagen/audio/video), pero no cuenta con carpetas (bins) ni indicador de "Clip en uso en Escena #X".
- **Acción Requerida (Fase 7E):** Añadir asignación directa a escena y etiquetas de uso en el proyecto.

### Brecha 4: Parsers de Subtítulos Externos SRT/VTT (P2)
- **Estado Actual:** Los subtítulos se generan automáticamente a partir del texto de la narración de cada escena.
- **Acción Requerida (Fase 7D):** Implementar funciones utilitarias en TypeScript para importar y exportar archivos `.srt` y `.vtt` independientes.
