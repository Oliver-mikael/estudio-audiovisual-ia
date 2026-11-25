# Arquitectura del Motor de Producción Audiovisual (Fase 7A)

**Documento:** `docs/PHASE_7A_PRODUCTION_ARCHITECTURE.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. Diagnóstico del Pipeline Actual

El motor actual se compone de dos módulos principales:
- `CanvasRenderEngine` (`src/engine/renderEngine.ts`): Dibuja fotogramas individuales en un `<canvas>` 2D a 1280x720 30 FPS.
- `VideoExporter` (`src/engine/exporter.ts`): Orquesta la grabación de los cuadros en tiempo real mediante `HTMLCanvasElement.captureStream()` y `MediaRecorder`, generando un Blob WebM con códecs VP9/VP8.

### 1.1 Brecha Técnica Crítica en Audio:
En la implementación actual:
```typescript
// exporter.ts:
if ('speechSynthesis' in window) {
  window.speechSynthesis.speak(utterance);
}
```
**Diagnóstico:** La API de síntesis de voz del navegador (`window.speechSynthesis`) emite sonido directamente hacia la salida física de audio del sistema operativo. La especificación W3C no permite capturar esa voz en un nodo `MediaStreamTrack` o `AudioNode`. En consecuencia, el archivo WebM resultante solo graba el tono generado por el oscilador Web Audio API, dejando el video sin la locución hablada.

---

## 2. Hoja de Evolución de la Arquitectura de Producción

Para corregir esta limitación y llevar el motor a un estándar profesional híbrido, se diseña la siguiente arquitectura por fases:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRODUCCIÓN AUDIOVISUAL                          │
├────────────────────────────────────────────────────────────────────────┤
│  CANVAS 2D / CAPA VISUAL                                               │
│  ├─ Capa 1: Fondo Cinemático Procedural / Gradiente Dinámico          │
│  ├─ Capa 2: Imagen/Video de Fondo con Efecto Ken Burns (Zoom/Pan)       │
│  ├─ Capa 3: Banners de Intención Visual & Gráficos Explicativos       │
│  └─ Capa 4: Tipografía Cinética & Subtítulos con Word Wrap Dinámico    │
├────────────────────────────────────────────────────────────────────────┤
│  WEB AUDIO API / PIPELINE DE SONIDO MASTERIZADO                        │
│  ├─ Pista A1 (Locución): AudioBuffer precargado / Locución en vivo     │
│  ├─ Pista A2 (Música): Loop ambiental con ganancia controlada (-18dB)  │
│  ├─ Pista A3 (Efectos): Transiciones sonoras y acentos auditivos       │
│  └─ Master Gain Node ──► MediaStreamDestination ──► MediaRecorder      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Especificación Técnica de Componentes

### 3.1 Timeline Multipista
- **Pista V1 (Video Base):** Imagen o clip de fondo correspondiente a cada escena.
- **Pista V2 (Superposiciones Gráficas):** Banners de datos, gráficos explicativos, intenciones narrativas.
- **Pista T1 (Subtítulos Cinéticos):** Subtítulos divididos por frases con interpolación de entrada y salida (fade & slide).
- **Pista A1 (Voz / Narración):** Archivo de audio grabado por el usuario o clip generado localmente.
- **Pista A2 (Música de Fondo):** Pista musical con ducking automático (baja de volumen cuando hay locución activa).

### 3.2 Solución Definitiva para la Locución en la Exportación
Se implementarán tres modos de audio compatibles con `MediaStreamDestination`:
1. **Modo Locución Grabada (Recomendado):** El usuario graba su propia voz con el micrófono del dispositivo o sube un clip de audio en la Biblioteca Multimedia. El buffer se decodifica con `AudioContext.decodeAudioData` y se reproduce en el tiempo exacto de la escena hacia el `destNode`.
2. **Modo Web Audio Procedural:** Generación de pulsos y tonos de ritmo cinemático directamente en Web Audio API para acompañar el video sin voz.
3. **Modo Audio Importado:** Pistas musicales libres de derechos asociadas al proyecto.

### 3.3 Evaluación de WebGL vs Canvas 2D
- **Canvas 2D:** Se mantiene como el motor principal y fallback universal garantizado para Android WebView, asegurando estabilidad en dispositivos de gama media y baja con consumo mínimo de batería.
- **WebGL:** Se reserva como capa opcional progresiva exclusivamente para transiciones complejas entre escenas (fundidos cruzados mediante shaders GLSL) sin forzar su uso si el dispositivo no reporta aceleración por hardware.
