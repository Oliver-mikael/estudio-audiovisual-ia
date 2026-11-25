# FASE 7D: MANUAL Y ESPECIFICACIÓN DE GRABACIÓN DE VOZ EN OFF

## 1. Flujo de Trabajo del Operador
1. En el panel de Producción & Montaje, seleccionar la pestaña "Audio" en el inspector lateral o el botón de grabación en el cabezal de la pista A1.
2. Hacer clic en "Grabar Locución en A1".
3. El navegador solicita permisos de micrófono local (o Android Webview/Capacitor hardware permissions).
4. El indicador de grabación parpadea en rojo con contador de tiempo en vivo.
5. Al pulsar "Detener y Guardar en A1", la grabación se detiene, se genera un Blob seguro, se registra en IndexedDB como `MediaAsset` y se añade automáticamente como un clip de audio al timeline en la pista A1.

## 2. Telemetría y Monitoreo de Audio
- Monitor de amplitud y nivel de señal integrado en UI para evitar distorsión o clipeo digital.
- Medición de volumen independiente por canal y fader de escucha maestra.
