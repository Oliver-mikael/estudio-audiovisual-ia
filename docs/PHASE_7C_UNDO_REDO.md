# Sistema de Deshacer y Rehacer (Undo / Redo) (Fase 7C)

**Documento:** `docs/PHASE_7C_UNDO_REDO.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Especialista UX

---

## 1. Arquitectura Inmutable de Historial

Se implementó la clase `UndoRedoManager` en `src/services/timeline/timelineEngine.ts`:

- **Pilas Inmutables:** Mantiene `undoStack` y `redoStack` mediante clones profundos del estado de `Project`.
- **Límite de Estados:** Capacidad configurable (por defecto 30 estados) para proteger el consumo de memoria en dispositivos móviles Android.
- **Limpieza de Rehacer:** Cualquier acción de edición manual invalida automáticamente la pila de rehacer.
- **Integración en UI:** Botones dedicados en la barra de herramientas del timeline con atajos y retroalimentación de estado (`canUndo` y `canRedo`).
