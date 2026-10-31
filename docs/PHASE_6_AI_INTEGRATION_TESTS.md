# Pruebas de Integración del Motor de Inteligencia Artificial (Fase 6C)

## 1. Alcance y Arquitectura del Asistente
El motor central de asistencia inteligente (`CentralAIEngine`) provee soporte cognitivo en las distintas etapas de la producción audiovisual sin depender de pagos obligatorios ni vulnerar la privacidad del usuario.

### Modos de Operación Soportados:
1. **Local Rules / Offline Heuristic Engine (Predeterminado)**: Algoritmos internos de procesamiento de lenguaje natural y análisis de estructura que operan 100% offline en el cliente sin requerir red ni credenciales.
2. **Local Model (WebLLM / Wasm / Ollama / Localhost)**: Integración con modelos locales en el dispositivo.
3. **Custom Endpoint (BYOK - Bring Your Own Key)**: Permite conectar endpoints compatibles con la API de OpenAI/Anthropic bajo el control exclusivo del usuario, almacenando la clave en el almacenamiento local del dispositivo.

---

## 2. Tareas Críticas Auditadas

### Tarea 1: Generación y Cuestionamiento de Ángulos Narrativos (`generate_angles`)
- **Evaluación**: El motor propone ganchos narrativos, preguntas críticas y enfoques alternativos a partir de un tema de investigación.
- **Resultado**: Respuestas estructuradas con al menos dos ángulos divergentes y preguntas socráticas.

### Tarea 2: Análisis de Fuentes y Verificación de Hechos (`analyze_sources`)
- **Evaluación**: Detecta afirmaciones sin respaldo, separa hechos de hipótesis y señala contradicciones potenciales.
- **Resultado**: Clasificación rigurosa de fuentes con alertas sobre evidencias no verificadas.

### Tarea 3: Crítica de Ritmo y Guion (`critique_script`)
- **Evaluación**: Analiza el equilibrio de duración entre escenas, detecta monotonía o disparidades de ritmo y propone ajustes dinámicos.
- **Resultado**: Proporciona recomendaciones precisas basadas en la velocidad de locución y la intención visual.

### Tarea 4: Expansión de Guion (`expand_script`)
- **Evaluación**: Enriquece descripciones visuales y genera textos de locución manteniendo la voz y tono del proyecto.
- **Resultado**: Salida estructurada de escenas con instrucciones de cámara y transiciones.

---

## 3. Prueba de Integración Cruzada: Proyecto Restaurado + Asistencia IA
En el archivo de prueba `src/__tests__/aiRestoredFlow.test.ts`, se validó el siguiente flujo completo:
1. Creación de un proyecto documental inicial en IndexedDB.
2. Generación asistida de ángulos narrativos mediante IA.
3. Exportación completa a archivo `.eai` con firma SHA-256.
4. Simulación de recuperación en un nuevo dispositivo mediante `restoreProjectFromEAI(pkg, 'create_copy')`.
5. Construcción de contexto enriquecido desde el proyecto restaurado (`buildContextFromProject`).
6. Ejecución de crítica de ritmo y expansión de guion por parte de la IA sobre el proyecto restaurado.
7. Comprobación de que el proyecto original permanece inalterado en el almacenamiento local.

**Resultado**: Ejecución exitosa sin errores de sincronización ni pérdida de contexto narrativo.
