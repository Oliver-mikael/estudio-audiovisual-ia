# Fase 7F: Compatibilidad de Formatos y Retrocompatibilidad

**Objetivo:** Garantizar que proyectos previos y paquetes `.eai` sigan funcionando transparentemente con las nuevas capacidades de la Fase 7F.

---

## 1. Compatibilidad Retroactiva (Backward Compatibility)
- Los proyectos creados en Fases 1 a 7E carecen de las propiedades `transition` y `animations` en sus clips.
- `CanvasRenderEngine`, `KeyframeEngine` y `TransitionEngine` tratan estas propiedades como estrictamente opcionales (`undefined`), asegurando que cualquier proyecto antiguo se cargue y reproduzca exactamente igual que antes.
- El formato de paquete portable `.eai` serializa las nuevas propiedades sin romper esquemas previos.

## 2. Compatibilidad entre Dispositivos y Navegadores
- **Desktop (Chrome / Edge / Firefox):** Soporte total de 1080p y 720p a 30/60 FPS con transiciones completas.
- **Android WebView (Capacitor APK):** Soporte garantizado a 720p 30 FPS en procesadores de gama de entrada y media.
- **Formato de Exportación:** WebM (VP9/VP8) y MP4 según soporte detectado por `MediaRecorder.isTypeSupported`.
