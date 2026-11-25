# Fase 7F: Integración con la Línea de Tiempo Multipista

**Módulos:** `src/types/index.ts`, `src/modules/ProductionStudio.tsx`, `src/services/timeline/timelineEngine.ts`
**Estado:** Implementado y Validado

---

## 1. Extensiones del Modelo de Dominio
- Cada `TimelineClip` puede contener opcionalmente:
  - `transition?: ClipTransition`: Especifica la transición de entrada del clip con tipo, duración y easing.
  - `animations?: ClipAnimation[]`: Lista de curvas de propiedades con sus respectivos keyframes ordenados en tiempo relativo.
- Cada `TimelineTrack` soporta la colección `transitions?: ClipTransition[]`.

## 2. Experiencia de Edición en el Estudio
- Panel de herramientas con pestañas dedicadas:
  - **Transiciones:** Asignación visual instantánea de cortes, disolvencias, deslizamientos, zooms o fundidos a negro al clip activo.
  - **Animaciones:** Presets cinemáticos rápidos para Zoom Suave (1.0 -> 1.25), Desvanecimiento suave (1.0 -> 0.0), Paneo Horizontal (0 -> 60px) y Paneo Vertical (0 -> -40px).
- Integración completa con el sistema de deshacer/rehacer inmutable (`UndoRedoManager`) de hasta 30 estados.
