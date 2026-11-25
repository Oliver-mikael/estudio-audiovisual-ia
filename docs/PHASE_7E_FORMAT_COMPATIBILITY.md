# Fase 7E: Compatibilidad de Formatos y Límites Técnicos

**Módulo:** `src/services/media/mediaImporter.ts`, `src/services/media/metadataExtractor.ts`
**Estado:** Implementado y Validado

---

## 1. Lista Blanca de Formatos Admitidos

| Tipo | Formato / Contenedor | MIME Types Soportados | Extensiones | Soporte Android WebView | Soporte Desktop (Chrome/Edge/Firefox) |
|---|---|---|---|---|---|
| **Video** | MP4 (H.264 + AAC) | `video/mp4` | `.mp4`, `.m4v` | Nativo (Hardware) | Nativo |
| **Video** | WebM (VP8, VP9, AV1) | `video/webm` | `.webm` | Nativo (Chrome engine) | Nativo |
| **Video** | QuickTime / MOV | `video/quicktime` | `.mov` | Parcial (solo H.264) | Parcial (solo H.264) |
| **Video** | OGG Theora | `video/ogg` | `.ogv` | Limitado | Nativo en Firefox/Chrome |
| **Imagen**| WebP | `image/webp` | `.webp` | Nativo | Nativo |
| **Imagen**| JPEG | `image/jpeg` | `.jpg`, `.jpeg` | Nativo | Nativo |
| **Imagen**| PNG | `image/png` | `.png` | Nativo | Nativo |
| **Imagen**| GIF | `image/gif` | `.gif` | Nativo (primer frame) | Nativo |
| **Imagen**| SVG Vectorial | `image/svg+xml` | `.svg` | Nativo | Nativo |
| **Audio** | MP3 | `audio/mpeg`, `audio/mp3` | `.mp3` | Nativo | Nativo |
| **Audio** | WAV PCM | `audio/wav`, `audio/wave`, `audio/x-wav` | `.wav` | Nativo | Nativo |
| **Audio** | OGG Vorbis/Opus | `audio/ogg` | `.ogg`, `.oga` | Nativo | Nativo |
| **Audio** | AAC / M4A | `audio/aac`, `audio/x-m4a`, `audio/mp4` | `.aac`, `.m4a` | Nativo | Nativo |
| **Audio** | WebM Audio | `audio/webm` | `.weba` | Nativo | Nativo |

## 2. Límites y Restricciones Técnicas

1. **Tamaño Máximo por Archivo (Recomendado):**
   - **Escritorio:** 500 MB por archivo de video, 50 MB por archivo de audio/imagen.
   - **Android Móvil:** 100 MB por archivo de video (debido a limitaciones de asignación de memoria heap en navegadores móviles para evitar crashes de pestaña por OOM).
2. **Archivos Dañados o No Compatibles:**
   - La función `validateMediaFile(file)` rechaza extensiones binarias no multimedia (`.exe`, `.pdf`, `.zip`, `.txt`).
   - Si un archivo multimedia tiene cabeceras corruptas, `metadataExtractor` captura la excepción en un bloque `try/catch` y asigna metadatos seguros de respaldo (`durationSeconds: 0`, dimensiones por defecto) informando del estado de advertencia sin bloquear la aplicación.
3. **Formatos No Soportados Directamente:**
   - Codecs propietarios o pesados como Apple ProRes RAW o Avid DNxHR requieren transcodificación previa a MP4 H.264 antes de ser importados en navegadores estándar.
