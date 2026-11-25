# AUDITORÍA DE INTELIGENCIA ARTIFICIAL Y EXPERIENCIA DE USUARIO (UX)
## Estudio Audiovisual Inteligente — Fase 6B+ / 6C

**Fecha:** 31 de Octubre de 2026
**Auditor:** Jules (Software Architect & Lead Engineer)
**Alcance:** Código fuente en `src/modules/`, `src/services/`, experiencia visual, interacción y componentes.

---

## 1. Clasificación del Estado de Inteligencia Artificial (Sección 13)

Conforme a las categorías requeridas:
- **A. IA real y funcional:** Conectada a un modelo activo real con inferencia y retorno dinámico.
- **B. IA parcialmente implementada:** Estructura de llamada existente pero con limitaciones de integración o contexto incompleto.
- **C. IA simulada o demostrativa:** Generación de textos hardcodeados o reglas aleatorias sin inferencia real.
- **D. Funcionalidad de IA inexistente:** Botón o concepto mencionado en interfaz sin código ni manejador asociado.

### Matriz de Auditoría de IA:

| Módulo / Función | Ubicación en Código | Categoría | Detalle Técnico | Riesgo / Deficiencia |
|---|---|:---:|---|---|
| **Sugerencia de Ángulos Narrativos** | `src/modules/IdeaLab.tsx:42-70` (`handleGenerateAISugestion`) | **C (Simulada)** | Retorna 1 de 2 objetos estáticos hardcodeados (`El Paradigma Invertido` o `Análisis de Coste Energético`) mediante `Math.random()`. | No analiza el título, hipótesis ni contexto del proyecto del usuario. |
| **Crítica de Guion (IA Assistant)** | `src/modules/ScriptWorkshop.tsx:140` | **C (Simulada)** | Comprueba heurísticas simples locales de longitud de palabras y repetición estática, sin comprensión semántica profunda. | No detecta incoherencias temporales, tono ni ritmo dramático real. |
| **Generación y Asistencia de Diálogos** | `src/modules/ScriptWorkshop.tsx` | **D (Inexistente)** | No existe función para proponer variantes de locución ni reescritura asistida. | El usuario debe redactar manualmente cada frase sin auxilio creativo. |
| **Descomposición de Preguntas y Síntesis** | `src/modules/ResearchModule.tsx` | **D (Inexistente)** | Módulo puramente CRUD de fuentes con selectores manuales (`Fact`, `Hypothesis`, etc.). | No asiste en detectar contradicciones ni contrastar afirmaciones contra fuentes. |
| **Recomendación de Encuadres y Storyboard** | `src/modules/StoryboardModule.tsx` | **D (Inexistente)** | Módulo de sólo lectura que itera `scenes` y asigna iconos según el valor estático `cameraMotion`. | No sugiere lenguaje cinematográfico según la carga emocional del texto. |
| **Etiquetado y Clasificación Semántica** | `src/modules/MediaLibraryModule.tsx` | **D (Inexistente)** | Subida tradicional de archivos Blob a IndexedDB sin análisis de contenido ni sugerencias semánticas. | Clasificación basada únicamente en el MIME type del navegador. |
| **Jobs de IA en la Nube (`RESEARCH_AI`, `SCRIPT_CRITIC`)** | `src/services/cloud/api.ts:13` | **C (Simulada)** | Enum tipado `RemoteJob['type']` pero el cliente solo crea `job_render` simulado en `localStorage`. | No hay endpoints de inferencia reales configurados en backend. |

**Conclusión de Auditoría IA:**
El proyecto se encontraba en un estado de **demostración conceptual / IA simulada (C y D)**. Es imperativo reemplazar las respuestas fijas por un **Motor Central de IA (Fase 6C)** capaz de conectarse a proveedores reales gratuitos (Google Gemini / OpenAI compatible / Ollama local / WebLLM) y un motor heurístico offline avanzado que opere dinámicamente sobre el contexto del proyecto.

---

## 2. Auditoría UX y de Flujo de Interacción (Sección 17.2)

### Fricciones y Oportunidades Identificadas:

1. **Aislamiento entre Módulos:**
   - Para llevar una idea generada en el *Laboratorio de Ideas* hacia el *Taller de Guion*, el usuario debía copiar y pegar texto manualmente. No existía acción de "Promover idea a escena".
2. **Jerarquía Visual y Densidad en Pantalla:**
   - La cabecera superior y el monitor Canvas 2D ocupaban un espacio predominante, desplazando los controles editoriales hacia áreas inferiores que obligaban a scroll excesivo.
   - Los formularios de entrada (`IdeaLab`, `ResearchModule`) presentaban campos verticales rígidos que saturaban pantallas de laptop y móviles.
3. **Ausencia de Historial y Deshacer en Guion:**
   - En el `ScriptWorkshop`, cualquier edición en la locución sobreescribía inmediatamente el estado en memoria, sin historial de versiones ni comparación lado a lado ("diff" visual de sugerencias de IA).
4. **Retroalimentación en Móvil (Android WebView):**
   - Varios botones de acción (`Exportar Todo`, `Añadir Fuente`) carecían de área táctil optimizada (mínimo 44px) y colapsaban en pantallas angostas.
