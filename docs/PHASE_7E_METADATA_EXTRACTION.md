# Fase 7E: Especificación de Extracción de Metadatos Audiovisuales

**Módulo:** `src/services/media/metadataExtractor.ts`
**Objetivo:** Obtención de información técnica y generación de miniaturas sin dependencias pesadas en el cliente (Browser y Android WebView).

---

## 1. Pipeline de Extracción

### 1.1 Imágenes (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`)
1. Creación de `HTMLImageElement` temporal con URL creada vía `URL.createObjectURL(file)`.
2. Detección de dimensiones intrínsecas: `img.naturalWidth`, `img.naturalHeight`.
3. Cálculo de relación de aspecto simplificada: `16:9`, `9:16`, `1:1`, `4:3` o formato flotante aproximado.
4. Renderizado a un elemento `<canvas>` escalado proporcionalmente a un ancho máximo de 160px para generar `thumbnailUrl` en formato `image/webp` (o `image/jpeg` de respaldo).
5. Liberación inmediata del Blob URL con `URL.revokeObjectURL`.

### 1.2 Videos (`video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`)
1. Creación de `HTMLVideoElement` con atributos `muted = true`, `preload = 'metadata'`.
2. Espera al evento `loadedmetadata`: extracción de `video.videoWidth`, `video.videoHeight` y `video.duration`.
3. Avance temporal a `video.currentTime = Math.min(0.5, video.duration / 2)` para capturar un frame significativo que evite pantallas negras iniciales.
4. Espera al evento `seeked` y volcado del frame a un Canvas 160x90 para generar `thumbnailUrl`.
5. Manejo de timeouts: si el video no puede reproducirse o tarda más de 3 segundos, se asignan valores de respaldo y se revoca el Blob URL.

### 1.3 Audio y Locuciones (`audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/webm`, `audio/aac`, `audio/mp4`)
1. Extracción de ArrayBuffer con `file.arrayBuffer()`.
2. Decodificación de cabeceras mediante `OfflineAudioContext` o `AudioContext.decodeAudioData()`.
3. Determinación exacta de duración (`audioBuffer.duration`), frecuencia de muestreo (`sampleRate`) y número de canales.
4. Para audio, no se crea miniatura Canvas sino que la UI le asigna un avatar espectral interactivo.

### 1.4 Hashing Criptográfico SHA-256
1. Lectura del buffer binario completo o de los primeros 4MB si el archivo excede los 50MB (para garantizar fluidez en teléfonos Android de gama media).
2. Cálculo con `crypto.subtle.digest('SHA-256', buffer)`.
3. Conversión a cadena hexadecimal de 64 caracteres.
4. Utilidad: Garantiza que si el usuario sube dos veces el mismo archivo con nombres distintos (ej. `video.mp4` y `copia_video.mp4`), el sistema detecta la colisión y previene consumo innecesario de almacenamiento IndexedDB/OPFS.
