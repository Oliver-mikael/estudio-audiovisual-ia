# ENTREGABLE 7 — ARQUITECTURA DE PROCESAMIENTO AUDIOVISUAL REMOTO
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_REMOTE_MEDIA_ENGINE.md`
**Fase:** Fase 6 — Evolución del Motor Multimedia y Renderizado Asíncrono
**Propósito:** Analizar la evolución tecnológica del motor audiovisual sin sustituir prematuramente el Canvas 2D local, estableciendo una división clara entre previsualización interactiva y transcodificación profesional en la nube.

---

## 1. EVALUACIÓN Y COMPARACIÓN DE MOTORES AUDIOVISUALES

Para evitar adoptar tecnologías únicamente por popularidad, se analizaron rigurosamente las opciones de renderizado:

| Tecnología | Rol Recomendado en la Plataforma | Ventajas Técnicas | Limitaciones y Licencias |
| :--- | :--- | :--- | :--- |
| **Canvas 2D + Web Audio API (Actual)** | **Previsualización Interactiva Inmediata (Cliente)** | Latencia 0 ms, sin consumo de red ni costes de servidor. 100% estándar web, funciona en móvil y PC. | No transcodifica a códecs comerciales nativos (H.264/MP4 en todos los navegadores). Vulnerable a caídas si la app se cierra. |
| **FFmpeg Nativo (Contenedor Docker Cloud Worker)** | **Motor Maestro de Renderizado Final (Nube)** | Estándar de la industria audiovisual. Soporta cualquier códec (H.264, H.265, VP9, AV1, ProRes), filtros de color, normalización EBU R128 de audio y subtítulos quemados perfectos. | Requiere servidor Linux con CPU/RAM dedicada. Licencia LGPL/GPL (totalmente compatible con ejecución en microservicios backend). |
| **FFmpeg.wasm (WebAssembly en Cliente)** | **Evaluación Experimental para Cortes Locales** | Permite transcodificar pequeños clips MP4 en el navegador sin enviar datos a la nube. | Exige encabezados HTTP `SharedArrayBuffer` (`Cross-Origin-Opener-Policy`). En teléfonos móviles satura la memoria y es 10x más lento que FFmpeg nativo. |
| **Motion Canvas** | **Motor para Diagramas Matemáticos / Código** | Animaciones programáticas ultra-precisas para conceptos técnicos complejos (hipertexto, protocolos de red). | Basado en TypeScript. Excelente para generar clips secundarios que luego se importan al montaje principal. |
| **Remotion** | **No recomendado para el núcleo principal** | Permite programar videos con React. | **Licencia comercial restrictiva (Remotion Company License):** Prohíbe su uso comercial en herramientas de generación de video para terceros sin pagar suscripción recurrente de alto coste. |
| **Blender (Headless CLI en Cloud Worker)** | **Integración Selectiva para Escenas 3D** | Permite renderizar modelos 3D históricos fotorrealistas (ej. la computadora NeXT Cube de Tim Berners-Lee en el CERN). | Alta demanda de GPU/CPU. Debe reservarse únicamente para tomas estelares específicas mediante trabajos asíncronos. |

### Decisión de Arquitectura Audiovisual: Modelo Híbrido de Dos Motores
1. **En el Cliente (Navegador / Móvil):** **Conservar el Motor Canvas 2D actual (`renderEngine.ts`).** Es óptimo para editar, desplazar el cabezal de tiempo, probar textos y ver el resultado a 30 FPS al instante sin gastar un solo céntimo de servidor.
2. **En la Nube (Cloud Worker):** **Desplegar un Worker FFmpeg (Node.js + fluent-ffmpeg).** Cuando el usuario decide *"Exportar Video Final en Alta Calidad (1080p MP4)"*, el proyecto se envía a la cola y el worker compone el video utilizando los assets originales sin compresión.

---

## 2. FLUJO DE TRABAJO AUDIOVISUAL ASÍNCRONO REMOTO

```
[Usuario edita en Móvil o PC con Canvas 2D instantáneo]
                      |
                      v
         [Pulsa "Exportar en la Nube (1080p)"]
                      |
                      v
[Cliente genera JSON del Storyboard y sube assets pendientes a S3]
                      |
                      v
[Se registra tarea en PostgreSQL: cloud_jobs (status='QUEUED')]
                      |
                      +------------------------------------------+
                      | El usuario puede cerrar la aplicación    |
                      | o apagar el teléfono sin problema        |
                      +------------------------------------------+
                      |
                      v
[Cloud Worker Docker toma el trabajo con FOR UPDATE SKIP LOCKED]
                      |
                      +--> Descarga imágenes en alta resolución y pistas de audio MP3
                      +--> Genera lista de filtros FFmpeg (Ken Burns, fundidos, overlays)
                      +--> Renderiza video a 1920x1080 @ 60 FPS con códec H.264 + AAC
                      +--> Notifica progreso a Supabase (10%, 45%, 80%, 100%)
                      +--> Sube el archivo final .mp4 a S3/R2 (bucket `render-outputs`)
                      |
                      v
[Supabase marca el trabajo como COMPLETED y guarda la URL pública/firmada]
                      |
                      v
[Cliente recibe notificación en vivo o la lee al volver a abrir la App]
                      |
                      v
[Usuario previsualiza el video terminado en streaming o lo descarga]
```

---

## 3. ESPECIFICACIÓN DE CALIDAD, CÓDECS Y LICENCIAS

- **Contenedor y Códec de Video:** MP4 (MPEG-4 Part 14) utilizando `libx264` con perfil `High` (`crf=18` para calidad casi sin pérdidas, o `crf=22` para distribución web ágil).
- **Códec de Audio:** AAC (Advanced Audio Coding) a 192 kbps estéreo, con normalización automática de sonoridad a -14 LUFS (estándar para YouTube y plataformas digitales).
- **Subtítulos:** Generación de pistas de subtítulos incrustadas (*burned-in*) mediante el filtro `subtitles` de FFmpeg con tipografía limpia y sombra para garantizar legibilidad sobre cualquier fondo visual.
- **Licencias:** FFmpeg se ejecutará bajo su licencia **LGPL v2.1+** (compilado sin componentes no redistribuibles), cumpliendo con total legalidad para proyectos personales y profesionales sin costes de regalías.
