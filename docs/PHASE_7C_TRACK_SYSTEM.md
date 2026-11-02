# Sistema de Pistas y Controles (Fase 7C)

**Documento:** `docs/PHASE_7C_TRACK_SYSTEM.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Especialista Audiovisual

---

## 1. Controles y Conmutadores por Pista

Cada pista del timeline en `ProductionStudio.tsx` dispone de controles de estado accesibles:

- **Bloqueo (Lock):** Cuando una pista está bloqueada (`isLocked: true`), ninguna operación de movimiento, división, recorte o eliminación puede modificar sus clips.
- **Visibilidad (Visibility):** Al ocultar una pista (`isVisible: false`), el motor de renderizado Canvas 2D en `renderEngine.ts` omite el dibujado de sus elementos (en V1 dibuja fondo neutro oscuro y en T1 oculta los subtítulos).
- **Silencio (Mute):** En pistas de tipo audio (`A1`), permite silenciar los canales de locución o música.
