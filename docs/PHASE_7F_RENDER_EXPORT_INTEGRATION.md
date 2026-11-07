# Fase 7F: Integración con los Motores de Renderizado y Exportación

**Módulos:** `src/engine/renderEngine.ts`, `src/engine/exporter.ts`
**Estado:** Implementado y Validado

---

## 1. Pipeline de Cuadro a Cuadro
1. **Sincronización:** Tanto la reproducción interactiva en el monitor como la exportación determinista en `VideoExporter` llaman a la misma función central:
   ```typescript
   renderEngine.renderFrame(project, currentTimeSeconds);
   ```
2. **Cálculo de Animaciones:** Para el clip activo en la pista de video (V1), `renderEngine` consulta `KeyframeEngine.interpolateClipTransform(activeClip.animations, clipTimeMs, activeClip.transform, activeClip.opacity)` y aplica la matriz afín directamente al contexto Canvas 2D (`translate`, `rotate`, `scale`, `globalAlpha`).
3. **Grabación de Video:** El `VideoExporter` utiliza `canvas.captureStream(30)` acoplado al stream multicanal de audio (`audioEngine.getDestinationStream()`), codificando en WebM VP9/VP8 o MP4 mediante `MediaRecorder` sin desincronización de audio ni saltos visuales.
