# ARQUITECTURA DEL MOTOR DE INTELIGENCIA ARTIFICIAL MODULAR
## Estudio Audiovisual Inteligente — Fase 6C

**Fecha:** 31 de Octubre de 2026
**Ubicación de Implementación:** `src/services/ai/`

---

## 1. Principios de Diseño

1. **Agnóstico al Proveedor (`AIProvider` Interface):**
   - El código de la UI nunca invoca directamente a `fetch('https://api.openai.com/...')` ni `fetch('https://generativelanguage.googleapis.com/...')`.
   - Toda interacción pasa por el singleton `aiEngine.executePrompt(task, context, options)`.

2. **Tipado Estricto de Salida:**
   - La IA genera resultados estructurados (`StructuredAIResult`), con campos normalizados para cada módulo del estudio:
     - `IdeaLab`: Generación de `NarrativeAngle`.
     - `Research`: Detección de evidencias, contradicciones y síntesis.
     - `ScriptWorkshop`: Crítica de ritmo, alternativas de locución y comparación de guion.
     - `Storyboard`: Recomendaciones de movimiento de cámara, encuadres cinemáticos y transiciones.
     - `MediaLibrary`: Recomendación de etiquetas y búsqueda semántica local.

3. **Control Total de Ejecución y Cancelación:**
   - Cada solicitud recibe un `AbortSignal` a través de un `AbortController`. El usuario puede detener la inferencia instantáneamente pulsando "Cancelar".
   - Soporte para callbacks de progreso (`onProgress?: (chunk: string) => void`).

4. **Gestión de Memoria y Contexto:**
   - `buildProjectContext(project)` extrae únicamente la información pertinente para reducir el consumo de tokens y maximizar la relevancia en modelos con ventanas acotadas.
