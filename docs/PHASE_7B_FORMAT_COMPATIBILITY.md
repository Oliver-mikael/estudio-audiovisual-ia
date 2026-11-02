# Compatibilidad Real de Formatos Multimedia (Fase 7B)

**Documento:** `docs/PHASE_7B_FORMAT_COMPATIBILITY.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Especialista Multimedia

---

## 1. Matriz de Compatibilidad en Navegadores y Android WebView

| Formato / Extensión | Tipo MIME | Soporte Entrada (Importación) | Soporte Salida (Exportación) | Notas Técnicas y Restricciones |
|---|---|---|---|---|
| **WebM (VP9/VP8 + Opus)** | `video/webm` | **Nativo (100%)** | **Nativo (100%)** | Formato de máxima compatibilidad en navegadores modernos y Android System WebView. |
| **MP4 (H.264 / AVC + AAC)**| `video/mp4` | **Nativo (100%)** | Condicional | La exportación depende del soporte de `MediaRecorder.isTypeSupported('video/mp4')` en el cliente. Si no se soporta, se exporta WebM. |
| **QuickTime MOV** | `video/quicktime` | Parcial | No compatible en cliente | Solo se reproduce si el códec interno es H.264/AAC. No se recomienda como salida directa. |
| **MKV** | `video/x-matroska` | Limitado | No compatible en cliente | Requiere transcodificación previa. |
| **PNG** | `image/png` | **Nativo (100%)** | **Nativo** | Soporte para transparencias. Ideal para logos y banners. |
| **JPEG / JPG** | `image/jpeg` | **Nativo (100%)** | **Nativo** | Fotografías estándar de archivo. |
| **WebP** | `image/webp` | **Nativo (100%)** | **Nativo** | Alta compresión y bajo consumo de memoria en Android. |
| **SVG** | `image/svg+xml` | **Nativo (100%)** | **Nativo (Vectorial)** | Escalabilidad infinita para iconos e infografías. |
| **GIF** | `image/gif` | Nativo (Primer cuadro) | No animado en Canvas directo | El canvas 2D dibuja solo el primer cuadro estático sin decodificador GIF frame a frame. |
| **MP3** | `audio/mpeg` | **Nativo (100%)** | **Nativo (Mezcla Opus/AAC)**| Decodificado de forma universal por `AudioContext.decodeAudioData`. |
| **WAV** | `audio/wav` | **Nativo (100%)** | **Nativo** | Sin pérdida (PCM). Recomendado para locuciones maestras. |
| **AAC / M4A** | `audio/aac`, `audio/mp4`| **Nativo (100%)** | **Nativo** | Audio comprimido estándar de telefonía y video. |
| **OGG (Vorbis/Opus)** | `audio/ogg` | **Nativo (100%)** | **Nativo** | Códec libre excelente para música ambiental. |
| **FLAC** | `audio/flac` | Parcial (Navegadores modernos)| No prioritario | Decodificable si el navegador lo soporta. |
| **SRT** | `application/x-subrip`| **Nativo (Texto Plano)** | **Nativo** | Parser de marcas de tiempo HH:MM:SS,mmm en TypeScript. |
| **VTT** | `text/vtt` | **Nativo (Texto Plano)** | **Nativo** | Formato W3C estándar para subtítulos web. |
| **TTF / OTF** | `font/ttf`, `font/otf` | **Nativo (CSS FontFace)** | En Canvas 2D | Cargable en tiempo de ejecución con `document.fonts.add()`. |
