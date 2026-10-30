# ALMACENAMIENTO Y SINCRONIZACIÓN INCREMENTAL
## ESTUDIO AUDIOVISUAL INTELIGENTE

**Versión:** 1.0.0
**Fecha de Actualización:** 30 de Octubre de 2026

---

## 1. ESTRATEGIA DE SINCRONIZACIÓN INCREMENTAL

Para permitir que el usuario trabaje fluidamente desde un dispositivo móvil o computadora sin depender de conexiones constantes a Internet ni perder cambios, la arquitectura adopta un modelo **Offline-First Incremental**:

1. **Caché Local como Fuente de Verdad Inmediata:** La base de datos IndexedDB local actúa como caché de lectura/escritura ultra-rápida en el cliente.
2. **Cola de Mutaciones Pendientes (Change Queue):** Cada modificación realizada localmente (guardado de escena, actualización de guion, edición de investigación) registra una mutación con timestamp en IndexedDB.
3. **Sincronización Silenciosa en Segundo Plano:** Al detectar conectividad, el servicio `SyncEngine` procesa la cola de mutaciones enviando únicamente deltas incrementales al backend Supabase/PostgreSQL.
4. **Almacenamiento de Archivos Grandes (Object Storage vs Base de Datos):**
   - La base de datos relacional almacena exclusivamente *metadatos* (nombres, tamaños, tipos MIME, URLs firmadas de almacenamiento).
   - Los archivos pesados de video, imágenes de alta resolución y pistas de audio se suben directamente desde el cliente hacia el servicio de almacenamiento de objetos (S3 / Supabase Storage) mediante peticiones HTTP multipart con reanudación.

---

## 2. RESOLUCIÓN DE CONFLICTOS

- **Estrategia "Last-Write-Wins con Timestamp Servidor":** Las actualizaciones incluyen el campo `updated_at`. Si el servidor recibe una versión con timestamp inferior al guardado en la base de datos, conserva la versión más reciente y devuelve la versión consolidada al cliente.
- **Control de Versiones de Proyectos:** Los proyectos conservan un historial de snapshots periódicos en la nube, permitiendo restaurar versiones anteriores en caso de error involuntario.
