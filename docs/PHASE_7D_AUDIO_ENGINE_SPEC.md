# FASE 7D: ESPECIFICACIÓN DEL MOTOR DE AUDIO Y PROTOCOLO DE TRANSMISIÓN

## 1. Topología del Nodo de Ganancia
- Frecuencia de muestreo estándar: 44,100 Hz / 48,000 Hz nativo del hardware.
- Canales: Estéreo (2 canales) para pistas de acompañamiento y efectos; Mono / Estéreo automático para grabación de micrófono.
- Rangos de fader: 0.0 (Mute absoluto, -inf dB) a 1.25 (+2 dB headroom).

## 2. Pistas de Dominio y Prioridad
- **A1 (Diálogo / Voz en Off Principal)**: Prioridad máxima. Activa el trigger de compresión lateral (ducking).
- **A2 (Banda Sonora / Música de Fondo)**: Pista continua con atenuación automática configurada por defecto a -12 dB (factor 0.25) durante locución.
- **A3 (Efectos de Sonido / Ambientes Sonoros)**: Pista puntual para transiciones, impactos y énfasis dramático.

## 3. Formatos y Codecs
- Grabación de entrada: `audio/webm;codecs=opus` (Android/Chrome/Edge), `audio/mp4` / `audio/wav` en navegadores con restricciones Opus.
- Exportación en video contenedor: Empaquetamiento sincronizado en WebM (Opus) o MP4 mediante Web Audio Destination.
