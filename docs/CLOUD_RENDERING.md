# ARQUITECTURA DE RENDERIZADO Y COSTOS EN LA NUBE
## ESTUDIO AUDIOVISUAL INTELIGENTE

**Versión:** 1.0.0
**Fecha de Actualización:** 30 de Octubre de 2026

---

## 1. COMPARATIVA DE MOTORES DE RENDERIZADO CLOUD

Se han evaluado tres alternativas tecnológicas para ejecutar la renderización de video en la nube:

| Criterio | FFmpeg Worker (CLI Native) | Remotion Cloud Worker | Canvas 2D Headless Worker |
| :--- | :--- | :--- | :--- |
| **Calidad y Códecs** | Excelente (H.264 / VP8 / VP9 / AAC / Opus) | Excelente (H.264 / ProRes) | Buena (WebM VP8 / VP9) |
| **Consumo RAM/CPU** | Muy Bajo (~150 MB RAM, uso eficiente de vCPU) | Medio/Alto (~1.5 GB RAM por instancia de Chromium) | Medio (~500 MB RAM por Node/Canvas) |
| **Tiempo por Minuto**| ~8-12 segundos por minuto de video 720p | ~25-40 segundos por minuto | ~15-20 segundos por minuto |
| **Licencias & Costos**| 100% Gratis / LGPL v2.1+ | Requiere Licencia Comercial en SaaS de pago | 100% Gratis / MIT |
| **Dictamen** | **RECOMENDADO PARA STITCHING Y AUDIO** | OPCIONAL PARA COMPOSICIONES COMPLEJAS | **RECOMENDADO PARA WORKERS LIVIANOS** |

---

## 2. ESTIMACIÓN EXPLÍCITA DE COSTOS INFRAESTRUCTURA CLOUD

### Supuestos del Modelo:
- **Proyectos:** 1 usuario personal (ampliable a equipo pequeño).
- **Producción:** 4 a 6 capítulos documentales por mes (~80-90 segundos por capítulo = ~10 minutos mensuales de video final).
- **Almacenamiento de Objetos:** ~10 GB de archivos originales de B-roll e imágenes + ~2 GB de exportaciones finales.

| Componente Cloud | Proveedor Evaluado | Nivel Gratuito (Free Tier) | Costo Estimado Escenario Personal |
| :--- | :--- | :--- | :---: |
| **Base de Datos & Auth** | Supabase Free Tier | 500 MB Postgres, 50,000 MAU, RLS habilitado | **$0.00 / mes** |
| **Almacenamiento Objetos**| Supabase / Cloudflare R2 | 10 GB almacenamiento gratis (Cloudflare R2: 0$ por egreso) | **$0.00 / mes** |
| **Worker Cómputo Cloud** | Render.com / Railway / Cloud Run | 750 horas gratis de CPU/RAM en Render/Cloud Run | **$0.00 / mes** |
| **Análisis e IA** | APIs Locales / Mistral / OpenAI | Créditos bajo demanda ($0.001 por 1k tokens) | **<$0.50 / mes** |
| **COSTO TOTAL ESTIMADO** | | | **~$0.00 - $0.50 / mes** |

---

## 3. MECANISMOS DE OPTIMIZACIÓN Y EFICIENCIA

1. **Apagado Automático de Workers:** El worker cloud de renderizado se activa al recibir una tarea en la cola `cloud_jobs` y se apaga automáticamente tras 5 minutos de inactividad (*Scale to Zero*).
2. **Reutilización de Renderizados (Caching):** Si los datos de la escena y los archivos de audio/imagen no han cambiado, el sistema reutiliza los segmentos de video pre-renderizados en lugar de procesar la escena desde cero.
3. **Control de Concurrencia Máxima:** Se limita a máximo 2 renderizados simultáneos por usuario para evitar picos inesperados de consumo de memoria y CPU.
