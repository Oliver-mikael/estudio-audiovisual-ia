# ARQUITECTURA CLOUD-FIRST Y MULTIPLATAFORMA
## ESTUDIO AUDIOVISUAL INTELIGENTE

**Versión:** 2.0.0 (Evolución Cloud-First)
**Fecha de Actualización:** 30 de Octubre de 2026
**Autor:** Arquitecto de Software & Responsable Técnico

---

## 1. VISIÓN Y PRINCIPIOS DE ARQUITECTURA

El **Estudio Audiovisual Inteligente** evoluciona de una PWA cliente pura en el navegador hacia una **aplicación multiplataforma profesional cloud-first** (Android, Windows, macOS, Linux, Web).

### Principios Fundamentales:
1. **El Dispositivo del Usuario como Interfaz de Control:** Los dispositivos móviles (Android/iOS) y de escritorio (PC/Mac) funcionan como paneles de control, previsualización, revisión narrativa y supervisión.
2. **Cómputo y Procesamiento Pesado en la Nube:** Las tareas intensivas (renderizado de video 720p/1080p, composición de audio, análisis e investigación asistida por IA, empaquetado de exportables) se ejecutan de forma asíncrona en la infraestructura cloud sin bloquear la CPU/RAM del cliente móvil ni agotar la batería.
3. **Persistencia Unificada e Incremental:** El usuario inicia sesión en cualquier dispositivo y accede exactamente a los mismos proyectos, investigaciones, guiones y recursos multimedia.
4. **Resiliencia Offline-First con Caché Local:** La aplicación conserva la base de datos IndexedDB local como capa de caché inteligente. Las ediciones realizadas sin conexión se guardan localmente y se sincronizan incrementalmente al restablecer la conectividad.
5. **Aislamiento y Seguridad con Permisos Mínimos:** Los trabajos de renderizado y tareas de procesamiento cloud se ejecutan en entornos aislados (workers/contenedores de un solo uso) con tokens JWT con alcance y caducidad limitada.

---

## 2. COMPONENTES PRINCIPALES DEL SISTEMA

```
+-----------------------------------------------------------------------------------+
|                            CLIENTE MULTIPLATAFORMA                               |
|        (Capacitor para Android/iOS | Tauri 2 para Escritorio | Web PWA)           |
|                                                                                   |
|  +------------------+  +-------------------+  +--------------------------------+  |
|  | Interfaz React   |  | Servicio Auth     |  | Motor Canvas 2D / Previews     |  |
|  | (Lucide + Tail)  |  | (Supabase Client) |  | (Previsualización Local)       |  |
|  +--------+---------+  +---------+---------+  +---------------+----------------+  |
|           |                      |                            |                   |
|           +----------------------+----------------------------+                   |
|                                  |                                                |
|                   Sincronización Offline-First (IndexedDB Cache)                 |
+----------------------------------+------------------------------------------------+
                                   | HTTP REST / WebSocket / SSE
                                   v
+-----------------------------------------------------------------------------------+
|                              BACKEND CLOUD SERVICES                               |
|                                                                                   |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  |   API Gateway REST    |  |   Supabase Auth /     |  |  Object Storage       |  |
|  |   (FastAPI/Node API)  |  |   PostgreSQL Database |  |  (S3 / Supabase)      |  |
|  +-----------+-----------+  +-----------+-----------+  +-----------+-----------+  |
|              |                          |                          |              |
+--------------|--------------------------|--------------------------|--------------+
               |                          |                          |
               +--------------------------+--------------------------+
                                          |
                                 Cola de Tareas (Postgres Queue / Redis)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        WORKERS CLOUD DE PRODUCCIÓN AUDIOVISUAL                    |
|                                                                                   |
|  +---------------------------+   +---------------------------+                    |
|  | Worker FFmpeg / Remotion  |   | Worker de IA / Script     |                    |
|  | (Renderizado 720p/1080p)  |   | (Análisis & Investigación) |                    |
|  +---------------------------+   +---------------------------+                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. COMPONENTES TECNOLÓGICOS SELECCIONADOS

### A. Cliente Multiplataforma (Mobile & Desktop)
- **Framework UI:** React 18 + TypeScript + Vite.
- **Envoltorio Móvil (Android/iOS):** Capacitor JS (`@capacitor/core`). Reutiliza el 100% del código Web y da acceso nativo al sistema de archivos local, notificaciones push y almacenamiento seguro.
- **Envoltorio Escritorio (Windows/Linux/macOS):** Tauri 2.0 (Rust backend + Webview2/WebKit frontend) garantizando un ejecutable ligero (< 15 MB) con bajo consumo de memoria RAM.

### B. Autenticación y Gestión de Identidad
- **Proveedor:** Supabase Auth (Postgres Row Level Security) o Firebase Auth.
- **Mecanismos:** Correo electrónico/contraseña, verificación de email, tokens de refresco (JWT) y recuperación de contraseña.
- **Políticas de Seguridad (RLS):** Cada usuario solo puede consultar o modificar filas donde `user_id = auth.uid()`.

### C. Base de Datos Relacional Persistente
- **Motor:** PostgreSQL (Supabase / AWS RDS).
- **Estructura de Datos:** Tablas relacionales para `users`, `projects`, `chapters`, `scenes`, `sources`, `claims`, `jobs` y `media_metadata`.

### D. Almacenamiento de Objetos Multimedia (Object Storage)
- **Motor:** S3 Compatible (Supabase Storage / Cloudflare R2 / AWS S3).
- **Organización:**
  - `media-assets/{user_id}/{project_id}/raw/` (imágenes, audios importados).
  - `media-assets/{user_id}/{project_id}/previews/` (frames y miniaturas).
  - `renders/{user_id}/{project_id}/final/` (videos WebM / MP4 exportados).

### E. Cola de Trabajos y Renderizado Cloud
- **Cola de Tareas:** Postgres Job Queue (`pgmq` / BullMQ).
- **Motores de Renderizado Evaluados:**
  - **FFmpeg Worker:** Transcodificación y stitching rápido de audio y video.
  - **Remotion / Headless Canvas Worker:** Renderizado sin cabeza para composiciones cinemáticas complejas.
