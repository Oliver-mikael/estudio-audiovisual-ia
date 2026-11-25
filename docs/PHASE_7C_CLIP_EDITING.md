# Edición Interactiva de Clips (Fase 7C)

**Documento:** `docs/PHASE_7C_CLIP_EDITING.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Desarrollador Principal

---

## 1. Operaciones Interactivas Soportadas

1. **División en el Cabezal (Split):** `splitClipAtPlayhead(project, trackId, clipId, playheadMs)` divide el clip en dos partes independientes (P1 y P2), calculando duraciones y offsets de forma exacta y creando una nueva escena sincronizada.
2. **Recorte de Entrada (Trim In):** `trimClipIn(project, trackId, clipId, deltaMs)` desplaza el `startMs` y ajusta el `offsetMs` preservando una duración mínima de seguridad (500 ms).
3. **Recorte de Salida (Trim Out):** `trimClipOut(project, trackId, clipId, newDurationMs)` modifica la duración final sin alterar el punto de inicio.
4. **Duplicación de Clips:** `duplicateClip(project, trackId, clipId)` crea una copia idéntica del clip en la pista y sincroniza una nueva escena en el guion.
5. **Eliminación Segura:** `deleteClip(project, trackId, clipId)` remueve el clip seleccionado de la pista y actualiza el array de escenas.
6. **Desplazamiento Temporal:** `moveClip(project, trackId, clipId, newStartMs)` reubica el clip y mantiene el orden secuencial de la pista.
