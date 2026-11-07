# Fase 7F: Arquitectura del Sistema de Transiciones y Animaciones entre Clips

**Fecha:** 2025-05-18
**Módulos:** `src/services/animation/*`, `src/engine/renderEngine.ts`, `src/engine/exporter.ts`, `src/modules/ProductionStudio.tsx`
**Estado:** Implementado, Verificado y Documentado

---

## 1. Visión y Objetivos
La Fase 7F dota al motor audiovisual Canvas 2D de capacidades avanzadas de postproducción cinemática:
1. **Transiciones entre clips:** Disolvencias cruzadas, deslizamientos direccionales, zooms, barridos y fundidos a/desde negro.
2. **Animaciones espaciales por keyframes:** Interpolación suave de posición X/Y, escala, rotación y opacidad con curvas de aceleración (`linear`, `ease-in`, `ease-out`, `ease-in-out`).
3. **Determinismo y consistencia absoluta:** El monitor en tiempo real y el exportador de video renderizan exactamente los mismos cuadros sin discrepancias visuales.
4. **Almacenamiento persistente e interoperable:** Integración completa en el formato portable `.eai` y base de datos local IndexedDB.

## 2. Componentes del Subsistema
- **`TransitionEngine` (`src/services/animation/transitionEngine.ts`):** Motor puro de cálculo y pintado en Canvas 2D para transiciones ópticas.
- **`KeyframeEngine` (`src/services/animation/keyframeEngine.ts`):** Evaluador de curvas y transformaciones espaciales continuas.
- **`CanvasRenderEngine` (`src/engine/renderEngine.ts`):** Pipeline de renderizado por capas con integración en caliente de transformaciones interpoladas.
- **`VideoExporter` (`src/engine/exporter.ts`):** Capturador de cuadros sincronizado a 30 FPS acoplado al destino de mezcla Web Audio API.
- **`ProductionStudio` (`src/modules/ProductionStudio.tsx`):** Interfaz interactiva para selección y edición de transiciones y curvas en el timeline multipista.
