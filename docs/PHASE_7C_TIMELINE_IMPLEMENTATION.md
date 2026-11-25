# Implementación del Timeline Multipista (Fase 7C)

**Documento:** `docs/PHASE_7C_TIMELINE_IMPLEMENTATION.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. Arquitectura del Timeline Multipista

El timeline multipista de `ProductionStudio.tsx` y su motor `timelineEngine.ts` implementan una estructura de edición no lineal (NLE) que sincroniza de forma determinista y bidireccional los clips en pistas con las escenas del proyecto:

1. **Pista V1 (Video Base):** Secuencia principal de clips visuales derivados de las escenas del guion, con duración en milisegundos, offset de punto de entrada y transformaciones.
2. **Pista V2 (Capas / Overlays):** Pista para superposición de material gráfico adicional, logotipos y banners de contexto.
3. **Pista A1 (Audio / Locución):** Clips de voz y narración asociados a cada fragmento audiovisual.
4. **Pista T1 (Subtítulos Cinéticos):** Cues textuales de subtítulos con sincronización temporal exacta.
