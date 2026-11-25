# Diseño de Experiencia de IA Contextual (Fase 7A)

**Documento:** `docs/PHASE_7A_AI_EXPERIENCE.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Especialista en IA

---

## 1. Principios Rectores de la IA en el Estudio

La inteligencia artificial en el Estudio Audiovisual Inteligente no es un generador de contenido genérico que sustituye el criterio humano, sino un **asistente de investigación socrático, editor crítico y asistente de dirección audiovisual**.

### Invariantes Éticas y Operativas:
1. **La IA propone, el humano decide:** Ninguna respuesta de IA modifica automáticamente el guion, el storyboard ni las fuentes sin que el usuario haga clic en un botón de confirmación explícito.
2. **Historial de versiones no destructivo:** Cada aplicación de un texto de IA crea automáticamente un snapshot en el historial del guion con etiqueta "Antes de aplicar IA", permitiendo restaurar el estado previo en cualquier momento.
3. **No inventar fuentes bibliográficas:** En el módulo de investigación, el motor heurístico local y los prompts de IA tienen prohibido inventar autores o enlaces ficticios. Si no hay evidencia, deben declarar explícitamente: "Información pendiente de verificación documental".
4. **Separación estricta Hecho vs Hipótesis:** La IA debe categorizar siempre las afirmaciones como hechos contrastados o interpretaciones hipotéticas.
5. **Autonomía y Costo $0/mes:** El modo predeterminado `offline-heuristic` opera 100% en cliente sin internet ni costos.
6. **Aislamiento absoluto de claves (BYOK):** Las claves API de proveedores externos se guardan únicamente en `sessionStorage`. Nunca se transmiten a servidores propios ni se guardan en el archivo `.eai` ni en IndexedDB.

---

## 2. Inyección Contextual y Capacidades por Etapa

El motor central `CentralAIEngine` construye dinámicamente un payload contextual a partir del proyecto activo (`AIContextPayload`):

```typescript
export interface AIContextPayload {
  projectTitle: string;
  projectDescription: string;
  currentScene?: Scene;
  existingScenes?: Scene[];
  narrativeAngles?: NarrativeAngle[];
  sources?: SourceReference[];
}
```

### 2.1 En el Laboratorio de Ideas: Cuestionador Socrático
- **Tarea:** `SUGGEST_NARRATIVE_ANGLES`
- **Comportamiento:** Lee el tema y formula al menos 2 ángulos divergentes con preguntas críticas y enfoques alternativos.
- **Acción del creador:** Puede desechar, editar manualmente o hacer clic en "A Guion" para convertirlo en escena de montaje.

### 2.2 En la Matriz de Investigación: Auditor de Rigor
- **Tarea:** `ANALYZE_RESEARCH_EVIDENCE`
- **Comportamiento:** Examina la proporción de hechos verificados frente a hipótesis, alertando si el guion depende de premisas sin sustento fáctico o si faltan licencias comerciales.

### 2.3 En el Taller de Guion: Auditor de Cadencia y Ritmo
- **Tarea:** `CRITIQUE_SCRIPT` y `EXPAND_SCENE_NARRATION`
- **Comportamiento:** Analiza el conteo de palabras de cada escena y su duración en segundos. Si la velocidad excede 2.8 palabras/segundo (riesgo de locución atropellada) o es inferior a 1.0 palabra/segundo (pausa excesiva), emite una recomendación de ajuste.

### 2.4 En Storyboard y Dirección: Asistente Cinemático
- **Tarea:** `RECOMMEND_CAMERA_AND_VISUALS`
- **Comportamiento:** Evalúa la carga semántica de la locución y sugiere un movimiento de cámara (`Zoom In` para momentos de tensión fáctica, `Zoom Out` para contexto histórico, `Kinetic Text` para cifras y código) y transiciones adecuadas.

### 2.5 En Biblioteca Multimedia: Etiquetador Semántico
- **Tarea:** `CATEGORIZE_MEDIA_ASSET`
- **Comportamiento:** Sugiere etiquetas contextuales para organizar imágenes, audios y clips según la temática del documental.

---

## 3. Matriz de Proveedores Soportados

| Proveedor | Entorno | Conexión Requerida | Costo | Privacidad | Soporte de Cancelación |
|---|---|---|---|---|---|
| **Motor Local Autónomo** | Local en cliente | **No (100% Offline)** | **$0/mes** | Total (Sin salida a red) | Inmediata |
| **Google Gemini 1.5 Flash** | Cloud Google AI Studio | Sí | Cuota Gratuita (Free Tier) | Clave en `sessionStorage` | Sí (`AbortController`) |
| **OpenAI / Groq / Ollama** | Endpoint Compatible | Sí (Salvo Ollama local) | Gratis en Groq / Local en Ollama | Clave en `sessionStorage` | Sí (`AbortController`) |
