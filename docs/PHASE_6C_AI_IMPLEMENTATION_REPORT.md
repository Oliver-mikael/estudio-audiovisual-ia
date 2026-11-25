# Reporte de Implementación: Motor de IA Modular (Fase 6C)

## 1. Resumen Ejecutivo
En la Fase 6C se transformó el subsistema de asistencia creativa del Estudio Audiovisual Inteligente, reemplazando simulaciones estáticas previas por una arquitectura de IA modular, multi-proveedor, segura y conectada bidireccionalmente con los datos vivos del proyecto audiovisual activo.

## 2. Principios de Diseño Cumplidos
1. **Costo Cero ($0.00/mes):** El sistema arranca de forma predeterminada con un motor heurístico local y determinista (`offline-heuristic`) que procesa PLN y análisis de guion/fuentes sin llamadas de red ni costos. Soporta además niveles gratuitos de Google Gemini y OpenAI/Groq/Ollama.
2. **Offline-First:** Funciona de forma completa e instantánea en modo avión en escritorio y Android sin depender de servidores externos.
3. **Seguridad Absoluta de Credenciales:** Las claves API introducidas por el usuario se conservan exclusivamente en memoria (`sessionStorage`) y jamás se graban en `localStorage`, archivos `.eai` ni en el repositorio.
4. **Asistente No Destructivo:** Toda sugerencia de IA (ritmo, expansión de texto, ángulos) requiere confirmación humana explícita y almacena puntos de restauración automáticos en el historial de versiones del guion.

## 3. Matriz de Proveedores Implementados

| Proveedor | Identificador | Endpoint / Modo | Costo | Privacidad |
| :--- | :--- | :--- | :--- | :--- |
| **Motor Local Heurístico** | `offline-heuristic` | Ejecución en cliente (TypeScript) | $0 | 100% privada y local |
| **Google Gemini API** | `gemini-free` | `generativelanguage.googleapis.com` (Gemini 1.5 Flash) | Nivel Gratuito (15 RPM) | Sujeto a términos de Google |
| **OpenAI Compatible** | `openai-compatible` | Configurable (Groq Free / Ollama Local / OpenAI) | $0 (Groq/Ollama) | Local en Ollama / Cloud en Groq |

## 4. Capacidades Asistenciales Conectadas por Módulo

### A. Laboratorio de Ideas
- **Generación de ángulos críticos contextuales:** Analiza la temática del proyecto activo y formula hipótesis contrapuestas, ganchos narrativos (hooks) y preguntas difíciles de responder.
- **Flujo A Guion:** Cualquier ángulo formulado o generado puede promoverse directamente a una escena en el Taller de Guion con un solo clic.

### B. Taller de Guion y Métricas de Ritmo
- **Auditoría de Cadencia:** Cálculo en tiempo real de palabras por segundo (~2.5 w/s objetivo de locución). Advierte sobreescenas sobrecargadas o vacías.
- **Expansión y Síntesis:** La IA propone reformulaciones manteniendo la intencionalidad dramática.
- **Historial de Versiones:** Cada modificación asistida genera un punto de restauración ("Antes de expansión IA").

### C. Investigación y Fuentes
- **Diagnóstico de Evidencias:** Auditoría de la proporción entre Hechos verificados, Interpretaciones e Hipótesis no contrastadas.

### D. Storyboard y Dirección Audiovisual
- **Recomendación Cinematográfica:** Sugiere movimientos de cámara (Zoom, Paneo, Paneos inversos) y transiciones coherentes con la densidad del texto de cada escena.

### E. Biblioteca Multimedia
- **Etiquetado Semántico:** Sugerencia inteligente de etiquetas temáticas para categorización y búsqueda rápida en proyectos grandes.

### F. Asistente Global Drawer
- Panel deslizable accesible desde cualquier vista para consultas libres con inyección automática del contexto completo del proyecto (título, descripción, escenas y fuentes).

## 5. Pruebas y Validación
- **Pruebas Unitarias:** 9 tests dedicados en `src/__tests__/aiEngine.test.ts` verificando:
  - Inicialización sin red.
  - Generación de contexto estructurado.
  - Ejecución de tareas con mock / heurística.
  - Cancelación mediante `AbortController`.
  - Auditoría de ritmo y cadencia.
  - Aislamiento de claves en `sessionStorage`.
- **Total de pruebas en Vitest:** 26/26 pruebas pasando.
- **Verificación Visual:** Capturas Playwright en `verification/screenshots/` confirmando el correcto renderizado de todos los componentes rediseñados.
