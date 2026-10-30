# INFORME DE PRUEBA REAL DE PRODUCCIÓN AUDIOVISUAL & ANÁLISIS DE VIDEO/AUDIO
## ESTUDIO AUDIOVISUAL INTELIGENTE

**Fecha:** 30 de Octubre de 2026
**Proyecto Actual Preparado:** "La primera página web: el comienzo de algo que cambiaría el mundo"
**Estado:** PRUEBA REAL EJECUTADA Y REVISIÓN TÉCNICA FINALIZADA

---

## 1. COMPROBACIÓN Y ANÁLISIS DEL ARCHIVO WEBM GENERADO

Se analizó el contenedor WebM generado (`production_60s.webm`, 1,012,386 bytes / ~0.97 MB):

- **Duración Real:** 60.0 segundos exactos (1800 fotogramas calculados a 30 FPS).
- **Resolución:** 1280 x 720 píxeles (720p HD).
- **Tasa de Fotogramas (FPS):** 30.0 FPS constantes.
- **Códec de Video:** `V_VP8` (Capturado nativamente por Chromium `MediaRecorder`).
- **Bitrate Promedio:** ~135 kbps (Tasa de bits ligera optimizada para animaciones vectoriales e imágenes).
- **Reproducción:** Archivo 100% funcional y reproducible en VLC, Chrome y reproductores HTML5.

---

## 2. VERIFICACIÓN CRÍTICA DEL AUDIO (SpeechSynthesis vs Web Audio API)

- **Hallazgo Técnico Importante:**
  La **Web Speech API** (`SpeechSynthesisUtterance`) habla a través del dispositivo de salida de audio del sistema operativo del usuario. **No transmite sus buffers PCM a través del `AudioContext` o el nodo `MediaStreamDestination` de Web Audio API**.
- **Consecuencia:**
  Durante la previsualización interactiva en pantalla, el usuario escucha la voz sintética por sus altavoces. Sin embargo, en el archivo de video `.webm` resultante capturado por `MediaRecorder`:
  1. La pista de audio capturada proviene exclusivamente del nodo `AudioContext` de Web Audio (en nuestra prueba, el tono oscilador ambiental continuo a 220Hz).
  2. La voz de `speechSynthesis` NO se mezcla automáticamente en la pista grabada en contenedores sin una extensión de captura de audio del sistema o archivos de audio importados (MP3/WAV/OGG).
- **Solución y Recomendación para la Producción Real:**
  Para la producción de nuestro primer documental, la locución se importará como archivo de audio (MP3/WAV) en la Biblioteca Multimedia. Al reproducirse dentro de un elemento `<audio>` o buffer de Web Audio conectable a `MediaStreamDestination`, la voz quedará grabada con calidad cristalina en el archivo final.

---

## 3. COMPATIBILIDAD CON DISPOSITIVOS Y LIMITACIONES EN ANDROID REAL

| Aspecto | Estado en Escritorio | Limitación / Comportamiento en Android Real |
| :--- | :--- | :--- |
| **Autoplay de Audio** | Funciona sin restricciones en sandbox. | **Restricción de Gesto:** Chrome para Android exige que el usuario interactúe (clic o tap) para iniciar el `AudioContext`. |
| **Renderizado Canvas** | 30 FPS continuos en background. | **Throttling de Pestaña:** Al cambiar de aplicación o apagar pantalla en Android, la API `requestAnimationFrame` se pausa, deteniendo la exportación. |
| **Gestión de Memoria RAM** | < 80 MB de Heap JS. | En móviles de gama baja, renderizar proyectos largos (> 3 min) puede causar presión de memoria si no se liberan los bitmaps de imágenes. |

---

## 4. PREPARACIÓN DEL PRIMER DOCUMENTAL REAL

Se ha configurado la plantilla limpia para nuestro primer documental:

- **Título Oficial:** *La primera página web: el comienzo de algo que cambiaría el mundo*
- **Estado Actual:** Estructura de proyecto preparada en `src/data/demoProject.ts`.
- **Estrategia:** La investigación, fuentes de evidencia, afirma-hechos, guion definitivo, storyboard y locuciones se cargarán únicamente tras su aprobación explícita.
