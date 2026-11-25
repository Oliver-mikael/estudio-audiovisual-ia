# FASE 6 — TRANSFORMACIÓN EN PLATAFORMA CLOUD-FIRST
## Estudio Audiovisual Inteligente: Plan Maestro de Arquitectura, UI/UX y Plataforma Central

**Fecha:** Octubre de 2026
**Documento:** Propuesta Técnica de Investigación, Diseño y Planificación
**Rol:** Arquitecto de Software y Responsable Técnico
**Estado:** PENDIENTE DE APROBACIÓN (Fase 100% de Diseño y Especificación Técnica — Sin Modificación de Código Instalado)

---

## ÍNDICE DE ENTREGABLES
1. [Entregable 1: Auditoría de la Arquitectura Actual (Real vs. Simulado)](#1-auditoría-de-la-arquitectura-actual)
2. [Entregable 2: Comparación Técnica: PWA vs. Capacitor OTA vs. Arquitectura Híbrida](#2-comparación-técnica-pwa-vs-capacitor-ota-vs-arquitectura-híbrida)
3. [Entregable 3: Propuesta de Arquitectura Cloud-First Real](#3-propuesta-de-arquitectura-cloud-first-real)
4. [Entregable 4: Sistema de Diseño Visual Profesional (UI/UX)](#4-sistema-de-diseño-visual-profesional-uiux)
5. [Entregable 5: Propuesta de Navegación Adaptativa (Android Móvil vs. Escritorio)](#5-propuesta-de-navegación-adaptativa)
6. [Entregable 6: Plan de Migración y Protección de Datos Locales](#6-plan-de-migración-y-protección-de-datos-locales)
7. [Entregable 7: Estimación de Costes y Límites del Nivel Gratuito (Free Tier)](#7-estimación-de-costes-y-límites-del-nivel-gratuito)
8. [Entregable 8: Plan de Implementación por Etapas Secuenciales](#8-plan-de-implementación-por-etapas-secuenciales)

---

## 1. AUDITORÍA DE LA ARQUITECTURA ACTUAL

Un diagnóstico riguroso del código existente muestra que la aplicación dispone de una base local offline sólida, pero sus capacidades distribuidas se encuentran en estado de especificación y simulación en cliente:

### Matriz de Estado Real vs. Simulado

| Subsistema / Módulo | Implementación Actual en Código | Estado Real | Comportamiento si la App se Cierra |
| :--- | :--- | :--- | :--- |
| **Persistencia de Proyectos** | `src/services/storage/db.ts` (IndexedDB `EstudioAudiovisualDB`) | **100% Real Local** | Datos intactos; recuperados al abrir. |
| **Persistencia de Assets** | `src/services/storage/db.ts` (Store `assets` con Blobs/ArrayBuffers) | **100% Real Local** | Los blobs guardados en IndexedDB persisten. |
| **Motor de Renderizado** | `src/engine/renderEngine.ts` (HTML5 Canvas 2D a 720p @ 30 FPS) | **100% Real Local** | Ejecución en memoria; si se cierra, el frame actual se pierde. |
| **Exportador de Video** | `src/engine/exporter.ts` (`MediaRecorder` + Web Audio API WebM) | **100% Real Local** | Si se cierra la app, la grabación se aborta inmediatamente. |
| **Autenticación** | `src/services/cloud/api.ts` (`localStorage['estudio_cloud_session']`) | **Simulado en Cliente** | Token falso; no hay comprobación criptográfica ni servidor real. |
| **Seguridad / RLS** | `supabase/schema.sql` (Políticas `auth.uid() = user_id`) | **Diseñado / No Desplegado** | El SQL existe pero no hay una base Postgres remota conectada. |
| **Sincronización Cloud** | `src/services/sync/syncEngine.ts` (Cola `estudio_sync_queue`) | **Local Real / Red Simulada** | Encola mutaciones reales en cliente, pero el envío a la nube es simulado. |
| **Cola de Trabajos (Jobs)** | `src/services/jobs/jobQueue.ts` (`setTimeout` progresivo) | **Simulado en Cliente** | Si el usuario cierra la app, el `setTimeout` muere y el render falla. |
| **Worker Remoto FFmpeg** | `docs/CLOUD_RENDERING.md` (Docker FFmpeg) | **Diseñado / Sin Servidor** | No hay servidor ejecutando transcodificación externa en la nube. |
| **Instalación Android** | `capacitor.config.json` + `app-debug.apk` (4.1 MB) | **100% Real Empaquetado** | Abre la app en Android WebView; requiere reinstalar APK para actualizar. |

### Diagnóstico de Vulnerabilidad Actual
1. **Pérdida de trabajos en segundo plano:** El renderizado actual es dependiente de que la pestaña del navegador o la pantalla de Android permanezca encendida y en primer plano.
2. **Aislamiento de datos:** Un proyecto creado en el celular no aparece en la computadora porque no existe un almacén centralizado ni sincronización remota real.
3. **Rigidez de despliegue:** Cualquier mejora de código requiere compilar un nuevo APK de 4.1 MB y hacer que el usuario lo descargue e instale manualmente.

---

## 2. COMPARACIÓN TÉCNICA: PWA vs. CAPACITOR OTA vs. ARQUITECTURA HÍBRIDA

El usuario no debe descargar un nuevo APK cada vez que se actualiza el código. Se analizaron las 3 rutas técnicas principales:

| Criterio | Opción A: PWA Instalable (Web Manifest + Service Worker) | Opción B: Capacitor + Actualizaciones OTA (Live Updates / Capgo / Appflow) | Opción C: Arquitectura Híbrida Web Remota (Capacitor apuntando a URL) |
| :--- | :--- | :--- | :--- |
| **Mecanismo de Actualización** | Inmediata y transparente mediante caché de Service Worker (HTTP/Cache API). | Descarga silenciosa en segundo plano de un zip con el nuevo build web; se activa al reiniciar la app. | Carga directa desde la URL HTTPS remota cada vez que abre la app (con caché HTTP local). |
| **¿Requiere nuevo APK?** | **Nunca** para funciones web/lógicas. | **No** para JS/CSS/Assets. **Sí** únicamente si se cambia una librería nativa Java/Kotlin. | **Nunca** para la interfaz web. **Sí** solo si cambia el contenedor nativo. |
| **Acceso a APIs Nativas** | Limitado al estándar Web (Canvas, Web Audio, IndexedDB, MediaRecorder). | **Total:** Plugins nativos de Capacitor (Notificaciones push, FS nativo, Background Tasks). | **Total:** Inyecta `Capacitor.js` en la página remota vía puente nativo. |
| **Cumplimiento Directivas Google Play** | 100% conforme (las PWAs no violan políticas si operan como sitios web). | **100% conforme** bajo la directiva de Google Play siempre que el propósito principal de la app no cambie y no se descargue código binario nativo ejecutable (`.so`/`.dex`). | Puede presentar objeciones en revisión de Google Play si la web remota cambia drásticamente sin aviso ("Empty Webview wrapper rule"). |
| **Rendimiento Offline** | Excelente con Service Worker `Cache-First` / `Stale-While-Revalidate`. | **Inmejorable:** Todo el bundle corre desde `file://` o `https://localhost` local en el móvil. | Pobre o frágil si no hay conexión a internet al abrir la app. |
| **Complejidad y Coste** | Muy baja. 100% gratuita y sin infraestructura externa. | Baja / Media. Se puede usar **Capgo** (open-source / self-hosted o plan gratuito) o manifest de versión propio en Supabase. | Muy baja, pero requiere alta disponibilidad del servidor web de hosting. |

### Recomendación Arquitectónica: Modelo Híbrido Dual (Capacitor OTA + PWA Unificada)
1. **Para la Web / Escritorio / Navegador móvil:** Desplegar como **PWA instalable** con Service Worker. Se actualiza automáticamente cada vez que se despliega una nueva versión en Vercel, Netlify o Cloudflare Pages.
2. **Para el APK Android:** Mantener el contenedor Capacitor con un sistema de **Live Update Seguro** (vía Capgo o endpoint propio en Supabase Storage). El APK de 4.1 MB se instala **una sola vez**. En cada inicio, Capacitor consulta a Supabase si existe un bundle JS más reciente (`bundle_version > local_version`); si existe, lo descarga en segundo plano en el almacenamiento de la app y lo aplica limpiamente.
3. **Mecanismo de Rollback:** Si el bundle descargado genera un fallo crítico al iniciar (pantalla blanca detectada tras 5 segundos), la app nativa descarta la actualización y vuelve automáticamente al bundle original empaquetado en el APK.

---

## 3. PROPUESTA DE ARQUITECTURA CLOUD-FIRST REAL

Transformación de la arquitectura actual mediante servicios gestionados estándar de bajo coste:

```
+---------------------------------------------------------------------------------------+
|                                    CLIENTES (UI/UX)                                    |
|   +------------------------------------+    +-------------------------------------+   |
|   |         Móvil Android (APK)        |    |         Escritorio / Web PWA        |   |
|   |  - Vista optimizada de supervisión |    |  - Editor multicapa completo        |   |
|   |  - Edición ligera de guion/ideas   |    |  - Canvas 2D & Monitor extendido    |   |
|   |  - Capgo OTA Live Updater          |    |  - Service Worker Auto-update       |   |
|   +------------------------------------+    +-------------------------------------+   |
+-------------------------------------------+-------------------------------------------+
                                            |
                         HTTPS / WSS (Supabase Client SDK)
                                            |
+-------------------------------------------v-------------------------------------------+
|                              PLATAFORMA CLOUD (SUPABASE)                              |
|                                                                                       |
|   1. AUTENTICACIÓN: Supabase Auth (Email + Password + Magic Links + Reset Passwords)   |
|                                                                                       |
|   2. BASE DE DATOS: PostgreSQL 15 + Row Level Security (RLS)                          |
|      - `users`, `projects`, `scenes`, `source_references`, `cloud_jobs`               |
|      - Versionado semántico de proyectos y bloqueos de edición concurrente            |
|                                                                                       |
|   3. STORAGE: S3-Compatible Buckets Privados                                          |
|      - `project-assets` (Imágenes, locuciones de voz .mp3, videos de referencia)       |
|      - `render-outputs` (Videos WebM/MP4 finales exportados)                          |
|      - `app-updates` (Zips de actualización OTA para Capacitor)                       |
|                                                                                       |
|   4. REALTIME ENGINE: Sincronización de eventos (Push a clientes conectados)          |
+-------------------------------------------+-------------------------------------------+
                                            |
                      Cola de Tareas en Postgres (`cloud_jobs`)
                                            |
+-------------------------------------------v-------------------------------------------+
|                          WORKERS INDEPENDIENTES (RENDER & AI)                         |
|                                                                                       |
|   - Contenedor Docker Node.js + FFmpeg (Desplegado en Render.com / Modal / Fly.io)     |
|   - Tareas pesadas: Renderizado por lotes, escalado 1080p, transcripciones Whisper,    |
|     síntesis de voz neural y llamadas a APIs de IA avanzadas.                          |
|   - Los trabajos avanzan aunque el móvil esté apagado. Al terminar, notifica por      |
|     Webhook/Supabase Realtime y el video queda disponible en la app.                  |
+---------------------------------------------------------------------------------------+
```

### Componentes Clave:
1. **Autenticación Real:**
   - Flujo de registro, confirmación de correo y restablecimiento de contraseña mediante `supabase.auth.signUp()`, `signInWithPassword()` y `resetPasswordForEmail()`.
   - Soporte para trabajo Offline: Si no hay conexión, la app permite acceder a los proyectos cacheados localmente en IndexedDB.
2. **Sincronización Bidireccional (Delta Sync Engine):**
   - Cada entidad posee campos: `version: integer`, `updated_at: timestamp` y `is_deleted: boolean`.
   - Cuando el cliente se conecta, envía su último timestamp de sincronización y descarga únicamente los deltas modificados.
   - Resolución de conflictos: Estrategia *Last-Write-Wins* a nivel de campo o bifurcación en copia de seguridad ante colisión de guiones.
3. **Cola de Trabajos Persistente:**
   - Sustituir el `setTimeout` de `jobQueue.ts` por inserciones reales en la tabla `cloud_jobs` (`status = 'QUEUED'`).
   - El Worker consulta la cola periódicamente (`SELECT FOR UPDATE SKIP LOCKED`), actualiza el progreso (0% -> 100%) y sube el archivo de salida a `render-outputs`.

---

## 4. SISTEMA DE DISEÑO VISUAL PROFESIONAL (UI/UX)

La auditoría de la interfaz actual reveló que los componentes eran demasiado altos, con paddings generosos pensados para tablets o monitores 4K, lo que producía saturación vertical en pantallas de celular y sensación de prototipo.

### 4.1 Principios del Nuevo Sistema de Diseño
1. **Densidad de Información Profesional:** Componentes compactos, inspirados en DAWs y suites de edición profesionales (como DaVinci Resolve, Logic Pro o Figma), maximizando el área útil de trabajo.
2. **Jerarquía Visual Rigurosa:** Diferenciación nítida entre barras de estado primarias, selectores de herramientas, área de trabajo contextual y monitores de salida.
3. **Sobriedad Cinematográfica:** Paleta de contraste profundo (Deep Slate / Neutral Dark) con toques de acento sutiles (cian/esmeralda para estados sincronizados, ámbar para renderizados en curso, violeta sobrio para la marca).

### 4.2 Especificaciones de Diseño
- **Tipografía:**
  - Sistema: Inter o Geist Sans como fuente principal para legibilidad en pantallas compactas.
  - Monoespaciada: JetBrains Mono para códigos de tiempo (`00:01:25.10`), métricas de FPS, resoluciones y duración de escenas.
  - Escala: Textos principales reducidos de `text-base` a `text-xs` (12px) y `text-sm` (14px). Etiquetas técnicas a `text-[10px]` o `text-[11px]`.
- **Escala de Espaciado:**
  - Reducción del espaciado entre paneles de `gap-6` (24px) a `gap-2.5` (10px) o `gap-3` (12px).
  - Paddings de tarjetas reducidos de `p-6` a `p-3` o `p-3.5`.
- **Botones y Controles Compactos:**
  - Altura estandarizada de botones a `h-8` (32px) en escritorio y `h-9` (36px) en pantallas táctiles.
  - Iconos reducidos de `w-5 h-5` a `w-3.5 h-3.5` o `w-4 h-4`.
- **Indicadores de Estado Global:**
  - Píldora de estado en el header que muestra: `En línea • Sincronizado` (verde), `Sin conexión • Guardado local` (ámbar), o `Sincronizando...` (azul giratorio).

---

## 5. PROPUESTA DE NAVEGACIÓN ADAPTATIVA

La experiencia debe adaptarse radicalmente según el dispositivo del usuario:

### 5.1 Experiencia Móvil (Android / Smartphones)
En pantallas de 360px a 430px de ancho:
- **Barra de Navegación Inferior Fija (Bottom Navigation Bar):**
  1. **Proyectos:** Listado rápido, búsqueda y creación de proyectos.
  2. **Guion / Ideas:** Edición ágil de textos, tarjetas de ideas y notas de voz.
  3. **Monitor / Review:** Reproductor minimalista con scrubber táctil para revisar el montaje.
  4. **Trabajos:** Monitor de renderizados en la nube con notificación de finalización.
- **Vistas en Pantalla Completa:** Cada módulo se abre en vista completa sin dividir la pantalla verticalmente.
- **Acceso Directo a Grabación de Audio:** Botón para registrar notas de locución directamente con el micrófono del celular y subirlas al proyecto.

### 5.2 Experiencia de Escritorio (Computadora / Pantallas Grandes)
En pantallas de 1024px en adelante:
- **Disposición de 3 Columnas Tipo Suite:**
  - **Columna Izquierda (20%):** Árbol de navegación del proyecto, lista de escenas numeradas y biblioteca de medios con vista en miniatura.
  - **Columna Central (45%):** Monitor de previsualización Canvas 2D en tiempo real (16:9), línea de tiempo (Timeline) con pistas de video, audio y subtítulos, y controles de transporte.
  - **Columna Derecha (35%):** Inspector contextual activo (Taller de Guion con crítica de IA, Editor de Storyboard o Laboratorio de Investigación).
- **Atajos de Teclado Profesionales:** Espacio (Play/Pausa), J-K-L (rebobinar/pausa/avance rápido), Flechas (fotograma anterior/siguiente).

---

## 6. PLAN DE MIGRACIÓN Y PROTECCIÓN DE DATOS LOCALES

La transición a la nube debe garantizar que ningún proyecto previamente creado en IndexedDB se pierda o sobreescriba:

### Estrategia de Migración Transparente:
1. **Detección Automática de Proyectos Locales:**
   - Al iniciar sesión por primera vez con una cuenta cloud, un servicio asistente escanea IndexedDB (`EstudioAudiovisualDB`).
2. **Asociación de Identidad:**
   - Si existen proyectos huérfanos locales (creados sin cuenta), se les asigna el nuevo `user_id` de la sesión iniciada.
3. **Subida en Segundo Plano (Sin Bloqueo de UI):**
   - El cliente sube secuencialmente los proyectos y metadatos a PostgreSQL.
   - Los archivos binarios (imágenes y audios guardados en IndexedDB) se suben al bucket S3 `project-assets`.
4. **Caché Híbrida Permanente:**
   - La base local IndexedDB no se destruye. Continúa funcionando como capa de caché local ultra-rápida (L1 Cache), permitiendo que la aplicación se abra instantáneamente incluso sin conexión a internet.
5. **Copias de Seguridad (Exportación JSON Completa):**
   - Se mantiene la opción de "Exportar Proyecto a Archivo Local (.eai / JSON)", permitiendo al usuario descargar una copia manual de seguridad de sus proyectos en cualquier momento.

---

## 7. ESTIMACIÓN DE COSTES Y LÍMITES DEL NIVEL GRATUITO

Para asegurar la viabilidad económica y que no se requieran dependencias de pago obligatorias:

| Proveedor / Servicio | Nivel Gratuito (Free Tier) Incluido | Capacidad en el Estudio Audiovisual | Coste Si Se Excede |
| :--- | :--- | :--- | :--- |
| **Supabase (Backend)** | • 500 MB de base de datos Postgres.<br>• 1 GB de Storage de archivos.<br>• 50,000 usuarios activos mensuales.<br>• 2 GB de ancho de banda. | Suficiente para ~10,000 guiones, storyboards y metadatos, y ~150-300 imágenes/audios de proyectos activos. | $25/mes (Plan Pro: 8 GB DB, 100 GB Storage, 250 GB Egress). |
| **Cloudflare R2 (Storage Alternativo)** | • 10 GB de almacenamiento mensual.<br>• 1,000,000 operaciones de escritura.<br>• **$0 por ancho de banda de salida (Egress gratuito)**. | Ideal para almacenar los videos finales exportados y paquetes OTA de actualización sin coste de tráfico. | $0.015 por GB adicional al mes (extremadamente económico). |
| **Vercel / Cloudflare Pages (Frontend Web & PWA)** | • Despliegues ilimitados.<br>• 100 GB de ancho de banda al mes. | Soporta miles de visitas diarias y actualizaciones web instantáneas. | $20/mes (Team). |
| **Render.com / Modal / Fly.io (Cloud Workers)** | • Render: 750 horas de cómputo gratuitas al mes (servicios web/workers ligeros).<br>• Modal: $30 de crédito gratis al mes. | Permite procesar ~300 a 500 renders de video de prueba y tareas de IA mensuales. | Cómputo por segundo (~$0.000016 por segundo de CPU). |
| **Capgo (Capacitor OTA Updates)** | • Plan gratuito: 1 app, hasta 500 actualizaciones activas al mes. | Suficiente para desarrollo, pruebas y uso personal continuo. | $12/mes o auto-hospedado (Open Source gratuito en Supabase). |

**Conclusión Financiera:** El estudio audiovisual puede operar de forma **100% gratuita** en su fase de lanzamiento y uso personal/profesional moderado, sin generar cargos inesperados.

---

## 8. PLAN DE IMPLEMENTACIÓN POR ETAPAS SECUENCIALES

Para mantener el proyecto en un estado funcional continuo sin realizar cambios destructivos:

### Etapa 6.1 — Rediseño Visual Compacto y Navegación Adaptativa
- Reorganizar la interfaz actual (`App.tsx` y módulos) adoptando la escala de espaciado sobria, tipografía profesional y navegación inferior para móviles sin tocar la lógica de negocio ni el almacenamiento.
- Validar visualmente con capturas y grabaciones en escritorio y móvil.

### Etapa 6.2 — Capa de Autenticación y Perfil de Usuario
- Integrar la interfaz de inicio de sesión / registro (modal no invasivo) con soporte para modo anónimo (local) o cuenta Supabase.
- Configurar cliente Supabase real mediante variables de entorno respetando la regla de no quemar claves en el repositorio.

### Etapa 6.3 — Sincronización Real y Migración de Datos Locales
- Conectar `syncEngine.ts` a la instancia de Supabase PostgreSQL.
- Implementar la migración transparente de proyectos desde IndexedDB a la nube.

### Etapa 6.4 — Actualizaciones Silenciosas OTA en Android (Capgo / PWA)
- Configurar el Service Worker para la PWA de escritorio y la biblioteca de actualización en segundo plano para Capacitor Android.
- Verificar que las actualizaciones de código web no requieran compilar un nuevo APK.

### Etapa 6.5 — Worker Cloud de Renderizado y Tareas Asíncronas
- Desplegar el micro-worker Node.js/FFmpeg para procesamiento de video remoto.
- Sustituir la simulación de `jobQueue.ts` por procesamiento en cola remota real.

---

## RESUMEN DE LA PROPUESTA PARA APROBACIÓN

Esta propuesta técnica responde a todas las necesidades de la **FASE 6**:
1. El usuario no tendrá que descargar otro APK para recibir mejoras en la aplicación.
2. Los datos y proyectos estarán respaldados en una plataforma cloud real con sincronización multidispositivo y persistencia local de respaldo.
3. La interfaz se transformará en una suite profesional, compacta y adaptada específicamente tanto para móvil como para escritorio.
4. Se garantiza la viabilidad económica en niveles gratuitos oficiales y la total protección de los datos y el historial existente.
