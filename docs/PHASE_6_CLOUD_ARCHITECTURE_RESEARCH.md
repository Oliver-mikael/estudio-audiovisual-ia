# ENTREGABLE 2 — INVESTIGACIÓN DE ARQUITECTURAS CLOUD-FIRST
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_CLOUD_ARCHITECTURE_RESEARCH.md`
**Fase:** Fase 6 — Investigación Técnica de Infraestructura Cloud
**Propósito:** Evaluar y justificar la arquitectura en la nube que permita independizar el procesamiento del dispositivo móvil del usuario.

---

## 1. EL PROBLEMA FUNDAMENTAL DEL CÓMPUTO MÓVIL Y CLIENT-SIDE

En la versión actual de la aplicación, el procesamiento audiovisual y los temporizadores de trabajo se ejecutan en el hilo principal del navegador mediante JavaScript. En un dispositivo Android, esto genera los siguientes bloqueos operativos insalvables:
1. **Suspensión por el Sistema Operativo (Doze Mode / App Standby):** En cuanto la pantalla del teléfono se apaga o el usuario cambia a otra aplicación (por ejemplo, para responder un mensaje), el sistema operativo Android suspende el hilo de ejecución de WebView. Los temporizadores `setTimeout`/`setInterval` se detienen, cortando la exportación del video o la cola de trabajos.
2. **Limitaciones Térmicas y de Memoria (OOM Killer):** El renderizado de videos de más de 60 segundos a 720p/1080p satura la memoria RAM del navegador móvil, provocando que Android cierre forzosamente la aplicación por exceso de consumo (*Out of Memory*).
3. **Imposibilidad de Continuidad Multidispositivo:** Un trabajo iniciado en el teléfono móvil no puede ser continuado ni monitoreado en la computadora porque no existe un estado centralizado persistente.

---

## 2. COMPARACIÓN DE ALTERNATIVAS DE INFRAESTRUCTURA CLOUD

Se evaluaron tres enfoques para la plataforma central:

| Dimensión Técnica | Opción 1: Supabase Gestionado (PostgreSQL + Auth + Storage) | Opción 2: Backend Propio (Node.js/FastAPI + PostgreSQL VPS) | Opción 3: Arquitectura Serverless Pura (Cloudflare Workers + D1 + R2) |
| :--- | :--- | :--- | :--- |
| **Autenticación y Sesión** | **Integrada:** Email/Password, confirmación de correo, tokens JWT automáticos y recuperación de cuenta listos para usar sin código backend adicional. | **Requiere Desarrollo:** Implementación manual de endpoints de registro, hash de contraseñas (Argon2/bcrypt), envío de correos SMTP y gestión de refresh tokens. | **Media:** Requiere integrar proveedores externos (Auth0, Clerk, Stytch) o escribir lógica de validación JWT personalizada. |
| **Persistencia y Seguridad** | **PostgreSQL con RLS nativo:** Las reglas de acceso (`auth.uid() = user_id`) se aplican a nivel de base de datos directamente desde el cliente. | **Capa de Controladores API:** Toda la lógica de autorización debe programarse y mantenerse en código backend. | **Bases de datos Edge:** SQLite distribuido (D1). Excelente latencia pero sin el ecosistema relacional robusto de Postgres para transacciones complejas. |
| **Almacenamiento de Archivos** | **Supabase Storage:** Compatible con S3, gestión de URLs firmadas temporales y políticas RLS directas sobre buckets. | **Requiere Integración:** Configuración de S3 o MinIO propio con endpoints de subida presignados. | **Cloudflare R2:** Almacenamiento S3 de ultra-bajo coste con 0$ en costes de transferencia (egress). |
| **Procesamiento Audiovisual Pesado** | **No integrado:** Supabase Edge Functions tienen límites de tiempo (150 segundos) y no admiten binarios pesados como FFmpeg. Requiere un worker externo. | **Integrable en el VPS:** Puede ejecutar FFmpeg directamente, pero compite en recursos de CPU/RAM con la API web. | **Inviable en Edge puro:** Los Workers de Cloudflare no pueden ejecutar procesos de transcodificación FFmpeg de larga duración. Requiere worker externo. |
| **Mantenimiento y DevOps** | **Mínimo:** Plataforma totalmente gestionada, respaldos automáticos, panel web visual y nivel gratuito generoso. | **Alto:** Mantenimiento de servidor Linux, parches de seguridad, renovación de certificados SSL, backups y monitoreo. | **Bajo:** Mantenimiento serverless, pero mayor fragmentación de servicios. |

### Conclusión de la Comparación:
La combinación más eficiente, segura y económica es una **Arquitectura Híbrida Gestionada**:
- **Plataforma Central:** **Supabase** para Base de Datos relacional, Autenticación oficial y almacenamiento de metadatos.
- **Almacenamiento de Objetos Pesados:** **Cloudflare R2** o Supabase Storage para activos de video y exportaciones finales.
- **Workers de Procesamiento:** Contenedores independientes en **Render.com / Modal / Fly.io** dedicados exclusivamente a ejecutar FFmpeg y tareas asíncronas pesadas.

---

## 3. DIAGRAMA DE ARQUITECTURA CLOUD-FIRST PROPUESTA

```
+---------------------------------------------------------------------------------------------------+
|                                        CAPA DE CLIENTES                                           |
|                                                                                                   |
|   +------------------------------------+             +----------------------------------------+   |
|   |         MÓVIL ANDROID (APK)        |             |         ESCRITORIO / NAVEGADOR         |   |
|   |  - Interfaz compacta táctil        |             |  - Suite de edición completa           |   |
|   |  - Caché local IndexedDB           |             |  - Monitor Canvas 2D local             |   |
|   |  - Consulta de progreso vía polling|             |  - Sincronización en tiempo real       |   |
|   +------------------+-----------------+             +-------------------+--------------------+   |
+----------------------|---------------------------------------------------|------------------------+
                       |                                                   |
                       +-------------------------+-------------------------+
                                                 |
                                HTTPS / WSS (Supabase JS SDK)
                                                 |
+------------------------------------------------v--------------------------------------------------+
|                               PLATAFORMA CENTRAL CLOUD (SUPABASE)                                 |
|                                                                                                   |
|   1. SUPABASE AUTH: Gestión de identidades, JWT, recuperación de contraseñas.                     |
|                                                                                                   |
|   2. POSTGRESQL 15 (Con Row Level Security):                                                      |
|      - Tabla `projects`: Metadatos, título, configuración y versionado.                           |
|      - Tabla `scenes`: Orden secuencial, locución, duración y parámetros de cámara.               |
|      - Tabla `source_references`: Fuentes, citas bibliográficas y verificación de hechos.         |
|      - Tabla `cloud_jobs`: Cola persistente de tareas asíncronas.                                 |
|                                                                                                   |
|   3. BUCKETS DE STORAGE (S3 Privado):                                                             |
|      - `user-assets`: Imágenes y pistas de locución subidas por el usuario.                       |
|      - `render-outputs`: Videos finales WebM/MP4 generados por los workers.                       |
+------------------------------------------------+--------------------------------------------------+
                                                 |
                                     Cola de Trabajos en BD
                           (SELECT * FROM cloud_jobs WHERE status = 'QUEUED')
                                                 |
+------------------------------------------------v--------------------------------------------------+
|                              WORKERS INDEPENDIENTES DE PROCESAMIENTO                              |
|                         (Contenedor Docker Node.js + FFmpeg en Render/Fly)                        |
|                                                                                                   |
|   1. Poll & Lock: Bloquea el trabajo con `status = 'PROCESSING'` y timestamp de inicio.           |
|   2. Descarga de Recursos: Descarga el guion JSON y los assets multimedia desde el Storage S3.   |
|   3. Transcodificación: Ejecuta FFmpeg para componer fotogramas, transiciones y audio en AAC/H264|
|   4. Notificación: Actualiza el progreso (0-100%) periódicamente en la tabla `cloud_jobs`.        |
|   5. Finalización: Sube el video resultante al Storage y marca el trabajo como `COMPLETED`.       |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. FLUJO DE COMUNICACIÓN Y PROCESAMIENTO ASÍNCRONO

Para garantizar que un trabajo continúe aunque el usuario cierre la aplicación o apague el teléfono:

1. **Creación del Trabajo:**
   - El cliente no renderiza el video pesado localmente. En su lugar, envía una mutación insertando una fila en la tabla `cloud_jobs`:
     ```sql
     INSERT INTO cloud_jobs (user_id, project_id, job_type, status, progress, payload)
     VALUES (auth.uid(), 'proj-001', 'RENDER_VIDEO', 'QUEUED', 0, '{"resolution":"720p","fps":30}');
     ```
2. **Independencia del Dispositivo:**
   - Una vez confirmado el insert en Postgres, el cliente recibe el `job_id`. El usuario puede cerrar la aplicación, apagar el celular o cambiar de red. El trabajo queda salvaguardado en la nube.
3. **Procesamiento en Worker Remoto:**
   - El worker remoto (que corre en un servidor dedicado 24/7) detecta la tarea pendiente mediante una consulta atómica:
     ```sql
     UPDATE cloud_jobs
     SET status = 'PROCESSING', started_at = NOW()
     WHERE id = (
       SELECT id FROM cloud_jobs WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
     ) RETURNING *;
     ```
   - Al usar `FOR UPDATE SKIP LOCKED`, múltiples workers pueden operar en paralelo sin colisionar ni duplicar tareas.
4. **Seguimiento del Progreso:**
   - El worker actualiza el campo `progress` (ej. 25%, 50%, 75%) conforme FFmpeg avanza en la codificación de fotogramas.
   - Cuando el usuario vuelve a abrir la aplicación en el móvil o en la computadora, el cliente consulta el estado del `job_id` y muestra una barra de progreso exacta o el botón de descarga del video finalizado.
5. **Recuperación ante Caídas:**
   - Si un worker se apaga o falla a mitad del procesamiento, un monitor de tareas huérfanas (*watchdog*) identifica los trabajos que han permanecido en estado `PROCESSING` sin actualizar su timestamp por más de 10 minutos y los devuelve al estado `QUEUED` para su reintento automático (máximo 3 reintentos).
