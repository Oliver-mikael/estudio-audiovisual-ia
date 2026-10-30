# Arquitectura Técnica - Estudio Audiovisual Inteligente

## Visión General
El Estudio Audiovisual Inteligente es una SPA (Single Page Application) concebida para ejecutarse 100% en el navegador del cliente (compatible con Escritorio y Android). Garantiza la privacidad, elimina costes por renderizado en la nube y funciona completamente offline si es necesario.

```
[ Usuario / Creador ]
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT UI / TAILWIND                      │
├─────────────┬─────────────┬──────────────┬──────────────────┤
│ Ideas & Lab │ Script Shop │  Storyboard  │  Media Library   │
└──────┬──────┴──────┬──────┴──────┬───────┴────────┬─────────┘
       │             │             │                │
       ▼             ▼             ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                 PROJECT & TIMELINE STORE                    │
│                        (Zustand)                            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               AUDIOVISUAL RENDER ENGINE                     │
│    (HTML5 2D Canvas + Web Audio API + Animation Loop)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               LOCAL VIDEO EXPORTER (MediaRecorder)          │
│               Generates .webm / .mp4 video file             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              LOCAL STORAGE LAYER (IndexedDB)                │
└─────────────────────────────────────────────────────────────┘
```

## Decisiones Clave de Diseño

1. **Client-side Pure Video Generation**:
   Para evitar cuotas, servidores de pago y credenciales complejas, el motor de render utiliza un bucle de animación sobre un `HTMLCanvasElement` combinado con `AudioContext` de la Web Audio API. Las imágenes, subtítulos y animaciones se componen en tiempo real y se graban cuadro a cuadro o mediante un `Canvas.captureStream()` con `MediaRecorder`.

2. **IA Asistencial e Intercambiable**:
   El sistema no depende exclusivamente de una API propietaria. Incluye un motor de sugerencias críticas y plantillas estructuradas basado en reglas, con interfaces preparadas para integrar proveedores de LLM opcionales (OpenAI, Ollama local, etc.).

3. **Garantía de Derechos y Procedencia (Licencias)**:
   Cada recurso insertado en la biblioteca multimedia o citación en la investigación cuenta con campos de metadatos estrictos: Origen, Licencia (CC-BY, Dominio Público, etc.), Autor y Estado de verificación.

4. **Compatibilidad con Android**:
   Optimizaciones de uso de memoria en Canvas, liberando contextos y bitmaps de imágenes al cambiar de escena para evitar cierres imprevistos del navegador móvil por consumo excesivo de RAM.
