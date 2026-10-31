# ENTREGABLE 8 — HOJA DE RUTA, RIESGOS, COSTES Y DECISIÓN ARQUITECTÓNICA
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_MASTER_ROADMAP.md`
**Fase:** Fase 6 — Síntesis Maestra, Análisis de Riesgos y Presupuesto
**Propósito:** Integrar las conclusiones de los siete entregables anteriores en una hoja de ruta ejecutable, cuantificada y priorizada para la aprobación del usuario.

---

## 1. ARQUITECTURA FINAL RECOMENDADA

Se recomienda una **Arquitectura Híbrida Multiplataforma Cloud-First** sustentada en:
1. **Frontend Unificado (React 18 + TypeScript + Vite + Tailwind CSS):**
   - Sirve como PWA en escritorio/web y como aplicación Android nativa mediante Capacitor JS.
2. **Plataforma Central Gestionada (Supabase):**
   - Autenticación con email/password y recuperación de contraseñas.
   - Base de datos relacional PostgreSQL con políticas RLS de aislamiento estricto por usuario.
   - Buckets de almacenamiento de objetos privados compatibles con S3.
3. **Estrategia de Actualizaciones Silenciosas (Capgo / PWA):**
   - Actualización directa de bundles web y lógica TypeScript sin recompilar ni reinstalar el APK de Android de 4.1 MB.
4. **Cómputo Audiovisual Desacoplado:**
   - Previsualización en tiempo real en el cliente mediante Canvas 2D local a 0 ms de latencia.
   - Procesamiento de video final y tareas pesadas en workers independientes con Docker y FFmpeg en Render/Fly.io.

---

## 2. COMPARACIÓN DE ESCENARIOS PRESUPUESTARIOS

Se evaluaron tres escenarios de costes reales para garantizar la sostenibilidad económica:

| Concepto de Coste | Escenario 1: Nivel Gratuito ($0 / mes) | Escenario 2: Económico Personal (~$5 - $15 / mes) | Escenario 3: Producción Escalable (~$25 - $50 / mes) |
| :--- | :--- | :--- | :--- |
| **Backend (Base de Datos & Auth)** | **$0** (Supabase Free: 500 MB DB, 50k MAU) | **$0** (Se mantiene en cuota gratuita) | **$25/mes** (Supabase Pro: 8 GB DB, backups diarios) |
| **Almacenamiento de Assets y Videos** | **$0** (Cloudflare R2: 10 GB gratis, Egress $0) | **$1 - $3/mes** (R2: $0.015/GB para ~100 GB) | **$5/mes** (R2: ~300 GB de almacenamiento) |
| **Alojamiento Web y PWA** | **$0** (Cloudflare Pages / Vercel Hobby) | **$0** (Suficiente para uso individual) | **$20/mes** (Vercel Pro si se requiere equipo) |
| **Worker Cloud de Renderizado** | **$0** (Render.com Free: 750 horas CPU/mes o Modal $30 crédito gratis) | **$7/mes** (VPS Render/Hetzner 2 vCPU, 4 GB RAM) | **$15 - $20/mes** (Worker dedicado con GPU ligera o cómputo elástico) |
| **Actualizaciones OTA (Capgo)** | **$0** (Capgo Free: hasta 500 actualizaciones activas) | **$0** (O servidor Capgo self-hosted en Supabase) | **$12/mes** (Capgo Pro) |
| **COSTE TOTAL MENSUAL ESTIMADO** | **$0.00 / mes** | **~$8.00 / mes** | **~$52.00 / mes** |

**Conclusión Financiera:** El proyecto puede comenzar, validarse y utilizarse plenamente en el **Escenario Gratuito ($0 / mes)** sin costes ocultos ni requerir tarjeta de crédito bancaria obligatoria para las funciones esenciales.

---

## 3. MATRIZ DE RIESGOS Y MEDIDAS DE MITIGACIÓN

| Riesgo Identificado | Nivel de Severidad | Probabilidad | Medida de Mitigación Obligatoria |
| :--- | :---: | :---: | :--- |
| **Sobrescritura accidental de proyectos locales al sincronizar** | **Crítica** | Media | Migración incremental asistida: exportación previa de backup JSON y fusión por deltas sin borrado ciego. |
| **Fallo en arranque tras actualización OTA en Android** | **Alta** | Baja | Health-check automático de 5 segundos. Si la pantalla no inicializa el DOM, revierte inmediatamente al bundle base del APK. |
| **Pérdida de firma digital del APK al compilar en el futuro** | **Alta** | Baja | Documentar y versionar el `keystore` y credenciales de firma de forma protegida fuera del repositorio público. |
| **Suspensión de proyectos en Supabase Free por inactividad** | **Media** | Media | Supabase pausa proyectos tras 7 días sin peticiones. Se implementará un cron sutil de ping mensual o exportación local periódica. |
| **Agotamiento de cuota de almacenamiento por videos pesados** | **Media** | Media | Política de retención: los videos exportados en la nube expiran a los 30 días si el usuario no los marca como favoritos o los descarga a su disco. |

---

## 4. FASES DE IMPLEMENTACIÓN SECUENCIAL PROPUESTAS

Para garantizar que el proyecto permanezca siempre funcional y con su historial íntegro:

- **Etapa 6.1 — Rediseño Visual Compacto y Navegación Adaptativa:**
  - Implementar el nuevo sistema visual (modos claro/oscuro/auto) y la navegación especializada móvil vs. escritorio en React/Tailwind.
- **Etapa 6.2 — Capa de Autenticación Real con Supabase Auth:**
  - Añadir pantalla de login/registro no invasiva, manteniendo la posibilidad de trabajar como invitado local.
- **Etapa 6.3 — Sincronización Remota y Migración de IndexedDB:**
  - Conectar el motor de sincronización a PostgreSQL con RLS y migrar proyectos locales de forma segura.
- **Etapa 6.4 — Actualizaciones Silenciosas OTA (Capgo / PWA):**
  - Habilitar la recepción de actualizaciones web sin modificar el APK instalado.
- **Etapa 6.5 — Worker Cloud de Renderizado Asíncrono (FFmpeg):**
  - Desplegar el microservicio de transcodificación para generar videos 1080p MP4 de alta calidad.

---

## 5. CRITERIOS DE ACEPTACIÓN PARA LA IMPLEMENTACIÓN

Cada etapa se considerará completada únicamente cuando cumpla los siguientes criterios:
1. **Cero Pérdida de Datos:** Ningún proyecto preexistente en IndexedDB puede ser eliminado o corrompido durante las pruebas.
2. **Cero Regresiones en Pruebas:** La suite de pruebas unitarias (`npm test`) debe pasar al 100% en todo momento.
3. **No Dependencias de Pago Forzosas:** La aplicación debe ser completamente operable bajo el escenario presupuestario de $0/mes.
4. **Verificación Visual:** Cada cambio de interfaz debe ser auditado mediante capturas de pantalla y videos en resoluciones móviles (360x780) y de escritorio (1280x720).

---

## 6. DECISIÓN FINAL Y ACCIONES RECOMENDADAS

- **Qué Conviene Implementar Primero:** La **Etapa 6.1 (Rediseño visual compacto y navegación responsiva)**, ya que mejora de inmediato la experiencia del usuario tanto en el celular como en la computadora sin alterar la arquitectura de datos ni requerir servicios externos.
- **Qué Debe Conservarse:** El motor Canvas 2D local, el exportador WebM para uso rápido y la persistencia IndexedDB como capa de respaldo offline.
- **Qué Requiere Autorización Explícita:** La creación de cuentas en proveedores externos (Supabase, Cloudflare, Render) y el despliegue de workers remotos.
