# Pruebas de Persistencia y Sincronización en Almacenamiento (Fase 7C)

**Documento:** `docs/PHASE_7C_PERSISTENCE_TESTS.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Responsable Técnico & Calidad

---

## 1. Validación de Guardado Automático y Recuperación

1. **Sincronización Bidireccional:** Toda modificación de clips en el timeline invoca `onUpdateProject`, lo que actualiza de inmediato el almacén `projects` en IndexedDB mediante `saveProjectToStorage()`.
2. **Compatibilidad Retroactiva:** Proyectos antiguos que carecen del atributo `timeline` son inicializados de forma transparente mediante `TimelineEngine.ensureTimeline()`.
3. **Resistencia a Cierres Inesperados:** La persistencia reactiva garantiza que si el usuario cierra el navegador o la aplicación Android, al reabrirla los cortes, divisiones y duraciones modificadas se conservan fielmente.
