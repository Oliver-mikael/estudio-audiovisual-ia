# BENCHMARK COMPARATIVO DE INTERFACES PROFESIONALES (UX)
## Estudio Audiovisual Inteligente — Fase 6B+

**Fecha:** 31 de Octubre de 2026
**Productos Analizados:** Notion, Linear, Figma, DaVinci Resolve, Runway, Descript.

---

## 1. Matriz de Patrones de Diseño Profesional

| Producto | Fortaleza Central | Patrón de Interfaz Relevante | Aplicabilidad a Estudio Audiovisual |
|---|---|---|---|
| **Linear** | Velocidad de flujo, atajos y densidad equilibrada. | Comandos flotantes (`Cmd+K`), estados discretos con badges compactos, transiciones fluidas sin recargas. | Adoptar un cajón de comando / asistente IA contextual accesible sin cambiar de pestaña, y tarjetas de alta densidad informativa. |
| **Notion** | Flexibilidad de bloques y jerarquía de texto. | Asistente de IA inline en el bloque de texto activo, opciones de "Aceptar sugerencia", "Intentar de nuevo" y "Descartar". | Integrar asistente inline en el Taller de Guion que muestre comparativas de variantes de locución antes de reemplazar la escena. |
| **DaVinci Resolve / Premiere** | Paradigma de estudio audiovisual por salas/páginas. | Barra inferior o superior de flujo secuencial continuo (Media -> Cut -> Edit -> Fusion -> Color -> Fairlight -> Deliver). | Mantener la coherencia de pipeline continuo: `Inicio` -> `Ideas` -> `Investigación` -> `Guion` -> `Storyboard` -> `Medios` -> `Monitor/Exportar`. |
| **Descript** | Edición audiovisual basada en el texto del guion. | El texto guía directamente los cortes y las marcas de tiempo en el timeline del video. | Sincronización automática de conteo de palabras por segundo (~2.5 palabras/segundo) con la duración en segundos de la escena. |
| **Runway** | Generación y asistencia generativa contextual. | Paneles laterales de parámetros claros, control de semillas/estilos y previsualización de costes/créditos. | Panel de configuración de IA con selector de proveedor, control de cuota/tokens, y advertencia de privacidad y costo cero ($0/mes). |

---

## 2. Comparativa: Estado Previo vs. Estado Rediseñado Objetivo

| Dimensión | Estado Previo (Fase 5/6A) | Estado Objetivo Rediseñado (Fase 6B+ / 6C) |
|---|---|---|
| **Navegación** | Pestañas superiores rígidas, sin indicación de estado de completitud. | Pestañas unificadas con indicadores de actividad, acceso rápido a IA en cualquier módulo. |
| **Asistencia IA** | Array estático de 2 elementos en `IdeaLab`. | Motor multi-proveedor con inferencia contextual real y motor heurístico offline de respaldo. |
| **Taller de Guion** | Edición destructiva directa de `narrationText`. | Comparador de versiones de locución, métricas de cadencia y sugerencias con 1-clic para aplicar. |
| **Storyboard** | Galería estática sólo lectura. | Acciones directas para reordenar, sugerir encuadres cinemáticos asistidos y vincular medios de la biblioteca. |
| **Dispositivos Móviles** | Controles apretados con desbordamiento potencial en pantallas de < 400px. | Diseño Mobile-First con paneles apilables, touch targets > 44px y drawer colapsable para IA. |
