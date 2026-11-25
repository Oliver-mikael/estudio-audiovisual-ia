# Arquitectura del Estudio de Producción Audiovisual (Fase 7B)

**Documento:** `docs/PHASE_7B_PRODUCTION_ARCHITECTURE.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. Arquitectura Unificada de Producción

En la Fase 7B, la arquitectura de la aplicación evoluciona desde vistas aisladas hacia un entorno cohesionado compuesto por:
1. **Barra de Estado Global (`GlobalStatusBar`):** Telemetría continua que exhibe el código de tiempo SMPTE (`00:00:00:00` a 30 FPS), estado de guardado reactivo en IndexedDB, persistencia de cuota en el dispositivo y estado del proveedor de IA.
2. **Navegación Unificada por 10 Espacios:** Inicio, Producción & Montaje, Ideas, Investigación, Guion, Storyboard, Biblioteca Multimedia, Exportación, Asistente IA y Configuración.
3. **Estudio de Producción (`ProductionStudio`):**
   - Monitor de previsualización en Canvas 2D.
   - Selector horizontal de 10 categorías de herramientas (Medios, Audio, Texto, Subtítulos, Transiciones, Efectos, Filtros, Animaciones, Color, Capas).
   - Timeline multipista visual que representa las pistas V1 (Video), A1 (Audio/Voz) y T1 (Subtítulos cinemáticos) con control de escala zoom.
4. **Selector de Perfiles de Exportación (`ExportProfilesModal`):**
   - Permite elegir aspecto (16:9, 9:16 vertical, 1:1 cuadrado), resolución (1080p, 720p) y bitrate antes de iniciar el renderizado.
