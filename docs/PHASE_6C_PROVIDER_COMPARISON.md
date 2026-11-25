# COMPARATIVA TÉCNICA DE PROVEEDORES Y MODELOS DE INTELIGENCIA ARTIFICIAL
## Estudio Audiovisual Inteligente — Fase 6C

**Fecha:** 31 de Octubre de 2026
**Requisitos Clave:** Presupuesto base de US$0/mes, funcionamiento offline prioritario, compatibilidad con Android WebView y Desktop, alta calidad en redacción en español, respeto a la privacidad del usuario.

---

## 1. Matriz Técnica Comparativa

| Proveedor / Modelo | Modalidad | Calidad Español | Contexto Máximo | Latencia | Límite Gratuito Real | Coste | Privacidad | Dependencia de Red | Viabilidad Android |
|---|---|:---:|:---:|:---:|---|:---:|:---:|:---:|:---:|
| **Local Heurístico Offline (Nativo)** | En cliente (JS) | Excelente (Determinista) | Ilimitado (Memoria local) | < 5 ms | Ilimitado | **$0** | **100% Local / Privado** | **Ninguna (Offline)** | **Excelente (100%)** |
| **Google Gemini 1.5 Flash** | Cloud API | Excelente (Nativo multilingüe) | 1,000,000 tokens | ~800 ms | **Gratuito:** 15 RPM / 1M TPM / 1,500 RPD en AI Studio | **$0 (en capa gratuita)** | Los datos pueden utilizarse para entrenamiento en free tier | Requiere Internet | Excelente (llamada `fetch` HTTPS estándar) |
| **Groq (Llama 3.3 70B)** | Cloud API | Muy Buena | 128,000 tokens | ~300 ms | **Gratuito:** 30 RPM / 14,400 RPD en Groq Cloud | **$0 (en capa gratuita)** | No entrena con datos en API comercial | Requiere Internet | Excelente (API compatible con OpenAI) |
| **Ollama Local (Desktop)** | Local Server | Muy Buena (según modelo) | 8k - 32k tokens | Variable según GPU/CPU | Ilimitado (Hardware propio) | **$0** | **100% Local / Privado** | **Ninguna (Red local localhost:11434)** | Nula en móvil (diseñado para desktop) |
| **WebLLM / Wasm WebGPU** | Navegador local | Buena (Phi-3 / Gemma 2B) | 2k - 4k tokens | 2-5 seg por prompt | Ilimitado | **$0** | **100% Local** | Descarga inicial de 1-2 GB | Requiere WebGPU (inestable en muchos Android WebView de bajo costo) |

---

## 2. Decisión Arquitectónica y Recomendación

Para cumplir con la premisa de **$0/mes sin comprometer la usabilidad ni la privacidad**:

1. **Proveedor Predeterminado: `offline-heuristic` (Local Autónomo)**
   - Siempre disponible, sin claves API, sin costo, funciona 100% en modo avión y en Android.
   - Aplica algoritmos avanzados de análisis semántico basados en el contexto real del proyecto (analiza sustantivos, verbos, balance de duración de escena, relación de palabras por segundo y detección de contradicciones).
2. **Proveedor Cloud Gratuito Recomendado: `gemini-free` (Google Gemini 1.5 Flash)**
   - Permite al usuario opcionalmente ingresar su API Key personal de Google AI Studio gratuita.
   - Ofrece una ventana de contexto colosal (1M tokens) para procesar guiones enteros y documentos de investigación históricos extensos.
3. **Proveedor Open/Local Compatible: `openai-compatible` (Groq / OpenRouter / Ollama)**
   - Interfaz universal con `endpoint` configurable por el usuario. Permite conectar Ollama (`http://localhost:11434/v1`) en su PC o Groq Cloud en su teléfono sin costo alguno.
4. **Seguridad Absoluta de Credenciales:**
   - Las claves API nunca se compilan en el frontend ni se envían a repositorios.
   - Se guardan en memoria de sesión volátil (`sessionStorage`) o cifrado local temporal por decisión explícita del usuario.
   - Ninguna llamada se realiza a menos que el usuario pulse explícitamente una acción de asistencia.
