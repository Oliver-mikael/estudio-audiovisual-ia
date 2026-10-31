# Registro de Decisiones de Arquitectura, Riesgos y Preguntas (Fase 7A)

**Documento:** `docs/PHASE_7A_DECISION_REGISTER.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. Decisiones Arquitectónicas Clave (ADRs)

### ADR-01: Mantener Canvas 2D como Núcleo de Renderizado y Descartar Remotion Server-Side
- **Contexto:** Remotion requiere entornos Node/Puppeteer con licencias comerciales restrictivas para herramientas automatizadas y no es viable para renderizado local cliente autónomo en Android.
- **Decisión:** Mantener el motor Canvas 2D en cliente desarrollado en `renderEngine.ts`, el cual no genera costos de servidor, es 100% de código abierto bajo control total y funciona dentro de Android WebView.
- **Consecuencia:** Cero costos de nube y máxima compatibilidad; las animaciones complejas deben implementarse mediante funciones matemáticas procedimentales (interpolación polinómica y transformaciones afines).

### ADR-02: Reemplazo del Flujo de Audio Web Speech por Web Audio Buffer Mix
- **Contexto:** `window.speechSynthesis` no puede ser enrutado al stream de `MediaRecorder`, dejando los videos exportados sin locución audible en el archivo final.
- **Decisión:** Implementar mezcla de audio basada en Web Audio API donde las locuciones provienen de archivos de audio reales (grabados por el usuario o cargados como assets) conectados a un `AudioBufferSourceNode` enrutado al `MediaStreamDestination`.
- **Consecuencia:** Los videos exportados contendrán audio real masterizado y sincronizado exactamente con los fotogramas.

### ADR-03: Preservación Criptográfica del Binario Android (APK Invariant)
- **Contexto:** Se cuenta con un paquete compilado de 4,324,598 bytes (~4.1 MB) con identificador `com.estudioaudiovisual.app` y firma v2 que no debe ser alterado ni sobreescrito.
- **Decisión:** Conservar inalterados `app-debug.apk` y `public/app-debug.apk`, verificando periódicamente el hash SHA-256 `cba367cce76c2613a59220007ea1eb71f5f9cc43fc6a63c47dd4cbfa871c4b0e`.

### ADR-04: Estrategia de IA "Zero-Cost Local First" con BYOK
- **Contexto:** La aplicación no debe requerir pagos de suscripción obligatorios ni exponer claves secretas.
- **Decisión:** Proveer el motor `offline-heuristic` como predeterminado con costo $0/mes, y permitir a usuarios avanzados utilizar sus propias claves de Google Gemini Flash o endpoints compatibles (Groq/Ollama) guardadas exclusivamente en la memoria de sesión (`sessionStorage`).

---

## 2. Matriz de Riesgos Técnicos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
|---|---|---|---|
| **Consumo Excesivo de Memoria al Exportar en Android** | Media | Alto | Procesar cuadros mediante intervalos controlados por tiempo y tamaños de buffer pequeños (100ms) en `MediaRecorder`. |
| **Colisión de Proyectos al Restaurar Archivos .eai** | Baja | Medio | Mantener la estrategia predeterminada `create_copy` que genera un nuevo UUID y prefijo `(Copia importada)`. |
| **Evicción de Almacenamiento IndexedDB por el SO** | Baja | Alto | Ejecutar `ensureStoragePersistence()` al iniciar para invocar `navigator.storage.persist()`. |
| **Pérdida de Contexto de IA al Cambiar de Escena** | Media | Bajo | Generar `AIContextPayload` dinámicamente desde el estado del proyecto en cada invocación de tarea. |

---

## 3. Supuestos y Preguntas Abiertas

1. **Supuesto:** La gran mayoría de dispositivos móviles objetivo cuentan con soporte para `MediaRecorder` con códecs WebM (VP8/VP9) o MP4 básico a través de Android System WebView.
2. **Pregunta Pendiente:** ¿Se deseará en fases posteriores empaquetar un modelo de síntesis de voz Wasm local (ej. Piper / Sherpa-ONNX) para generar voces sintetizadas offline directamente como archivos PCM/WAV en el cliente? (Registrado como mejora potencial para Fase 7D+).
