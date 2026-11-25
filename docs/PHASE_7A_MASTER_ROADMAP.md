# Hoja de Ruta Maestra y Plan de Implementación (Fase 7A a 7G)

**Documento:** `docs/PHASE_7A_MASTER_ROADMAP.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. Matriz de Priorización de Mejoras

| Nivel | Iniciativa | Valor Usuario | Complejidad | Dependencias | Impacto Android | Impacto Offline |
|---|---|---|---|---|---|---|
| **P0** | **Pipeline Web Audio para Locución Grabable** | Crítico | Media | Web Audio API | Totalmente compatible | 100% Offline |
| **P0** | **Preservación Incondicional del APK Android** | Crítico | Baja | Hash SHA-256 | Cero regresiones | 100% Offline |
| **P0** | **Persistencia Duradera y Respaldo .eai** | Crítico | Baja | IndexedDB / Crypto | Seguro | 100% Offline |
| **P1** | **Timeline Multipista (Video, Audio, Subtítulos)** | Alto | Media-Alta | React / State | Adaptable táctil | 100% Offline |
| **P1** | **Edición de Guion Sincronizada con Tiempo** | Alto | Media | ScriptWorkshop | Fluido | 100% Offline |
| **P1** | **Barra de Estado Global Unificada** | Alto | Baja | Layout / UI | Ergonómico | 100% Offline |
| **P2** | **Grabador de Locución Integrado (Micrófono)** | Alto | Media | MediaStream API | Requiere permiso mic | 100% Offline |
| **P2** | **Reordenamiento Drag & Drop en Storyboard** | Medio | Media | HTML5 Drag / Pointer | Soporte touch | 100% Offline |
| **P2** | **Ducking Automático de Audio (Voz vs Música)** | Medio | Media | Web Audio Dynamics | Ligero | 100% Offline |
| **P3** | **Shaders WebGL para Transiciones Complejas** | Medio | Alta | WebGL Context | Opcional con fallback | 100% Offline |
| **P3** | **Modelos Locales Wasm / WebLLM en Navegador** | Alto | Muy Alta | WebGPU / Memoria | Solo móviles potentes | 100% Offline |

---

## 2. Plan Secuencial por Fases (Fases 7B a 7G)

### Fase 7B: Sistema de Navegación Unificada, Barra de Estado Global y Responsive Layout
- Implementar la barra de estado global fija (proyecto activo, indicador de guardado en IndexedDB, estado de persistencia de cuota, proveedor de IA activo, conectividad).
- Reestructurar el layout de la pantalla de trabajo: desacoplar el monitor de video de la columna fija para permitir vista expandida de guion y storyboard, con monitor colapsable o acoplable.
- Optimizar touch targets (mínimo 44px) y navegación táctil en Android.

### Fase 7C: Timeline Multipista y Sincronización Narrativa Guion-Video
- Crear componente `MultiTrackTimeline` interactivo con pistas V1 (Video/Imagen), A1 (Locución/Audio) y T1 (Subtítulos cinemáticos).
- Añadir scrubber de reproducción interactivo con indicación de código de tiempo en milisegundos.
- Sincronizar el cursor del timeline con el texto del guion (resaltando la escena activa en reproducción).

### Fase 7D: Motor de Audio Híbrido Web Audio API y Locución Grabable
- Implementar mezclador de audio con Web Audio API conectando pistas de locución y música de fondo a un `MasterGainNode`.
- Añadir grabador de voz con micrófono en el Taller de Guion para que el creador pueda grabar su propia voz por escena sin software externo.
- Conectar el `MediaStreamDestination` del mixer al `MediaRecorder` en `exporter.ts`, garantizando que el video exportado contenga la locución grabada real.

### Fase 7E: Biblioteca de Medios Inteligente (Bins, Previsualización y Vinculación)
- Incorporar mini-reproductor de audio para preescuchar clips antes de utilizarlos.
- Añadir acción "Asignar directamente a Escena #X".
- Mostrar etiquetas visuales en los medios indicando si están "En uso" o "Disponibles".

### Fase 7F: Asistencia IA Contextual Profunda y Auditoría de Coherencia
- Integrar asistente flotante no intrusivo con acciones contextuales de 1 clic ("Aplicar a guion", "Crear nueva escena", "Corregir cadencia").
- Validación cruzada entre afirmaciones del guion y fuentes fácticas registradas en la Matriz de Investigación.

### Fase 7G: Optimización de Renderizado, Exportación Multiformato y Validación Integral
- Soporte para exportación en resoluciones configurables (720p, 1080p, 16:9 apaisado y 9:16 vertical para redes).
- Verificación exhaustiva de rendimiento de memoria en Android WebView y prueba de exportación descargable de 30 a 90 segundos.
- Auditoría visual Playwright final y pruebas de regresión.
