# ENTREGABLE 3 — ESTRATEGIA DE SINCRONIZACIÓN Y PROTECCIÓN DE DATOS
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_DATA_SYNC_AND_RECOVERY.md`
**Fase:** Fase 6 — Diseño de Persistencia, Sincronización y Recuperación
**Propósito:** Definir el modelo de sincronización delta offline-first, resolución de conflictos y migración segura de datos locales desde IndexedDB sin riesgo de pérdida de información.

---

## 1. PRINCIPIO FUNDAMENTAL: PROTECCIÓN ESTRICTA DE DATOS LOCALES

La aplicación cuenta actualmente con proyectos y guiones creados en el almacenamiento del navegador (`EstudioAudiovisualDB` en IndexedDB). Cualquier estrategia de evolución hacia la nube debe regirse por tres reglas de oro:
1. **Regla de No Sobrescritura Ciega:** Una sincronización inicial nunca debe borrar ni sobrescribir los datos locales con un estado vacío o desactualizado proveniente de la nube.
2. **Prioridad Local en Huérfanos:** Los proyectos creados antes de que el usuario inicie sesión pertenecen legítimamente al dispositivo local y deben ser promovidos a la nube bajo la cuenta del usuario autenticado.
3. **Caché Híbrida L1 Permanente:** IndexedDB no es descartable. Debe permanecer como la capa de acceso ultra-rápido en memoria secundaria, permitiendo que la aplicación abra instantáneamente aun sin cobertura de red.

---

## 2. ESTRATEGIA DE SINCRONIZACIÓN INCREMENTAL (DELTA SYNC)

En lugar de transferir el proyecto completo (lo que consumiría ancho de banda excesivo y saturaría la conexión móvil), se implementará un protocolo de **sincronización delta**:

### Estructura de Control de Versiones:
Cada entidad (`projects`, `scenes`, `source_references`) contiene los siguientes metadatos de sincronización:
```typescript
interface SyncMetadata {
  id: string;               // UUID v4 único
  version: number;          // Contador entero incremental (1, 2, 3...)
  updated_at: string;       // ISO 8601 UTC timestamp
  is_deleted: boolean;      // Borrado lógico (Tombstone)
  device_id: string;        // Identificador único de la instalación/navegador
}
```

### Flujo de Sincronización Bidireccional:
1. **Paso 1: Lectura de Deltas Locales Pendientes (Push):**
   - El cliente extrae de la cola local de mutaciones (`estudio_sync_queue`) los cambios realizados sin conexión.
   - Envía a Supabase un lote de mutaciones ordenadas por `updated_at`.
2. **Paso 2: Transacción en Base de Datos y Verificación de Concurrencia:**
   - La base de datos verifica la versión actual de la fila (`server_version`).
   - Si `client_version === server_version + 1`, la mutación se aplica limpiamente y se incrementa la versión.
3. **Paso 3: Descarga de Novedades Remotas (Pull):**
   - El cliente solicita todos los registros modificados después de su `last_synced_at`:
     ```sql
     SELECT * FROM scenes WHERE project_id = :projectId AND updated_at > :lastSyncedAt;
     ```
   - Las filas recibidas se fusionan directamente en IndexedDB y el estado reactivo de React se actualiza.

---

## 3. RESOLUCIÓN DE CONFLICTOS ENTRE DISPOSITIVOS

Cuando un usuario edita el mismo guion o escena simultáneamente en el celular y en la computadora:

### Estrategia de Resolución por Capas:
1. **Nivel de Escena (Granularidad Fina):**
   - Como las escenas están atomizadas en filas independientes en la tabla `scenes`, si el usuario edita la Escena 1 en el celular y la Escena 2 en la computadora, **no hay conflicto**. Ambas actualizaciones se fusionan automáticamente sin intervención humana.
2. **Conflicto en la Misma Escena (Mismo ID, versiones divergentes):**
   - Si ambas terminales modificaron el texto de locución de la Escena 1 sin haberse sincronizado:
     - **Regla Determinista por Defecto:** Se adopta *Last-Write-Wins* (LWW) basado en el timestamp UTC más reciente para no bloquear la reproducción.
     - **Preservación Segura (Bifurcación de Respaldo):** La versión rechazada no se borra. Se almacena automáticamente en una tabla de auditoría (`scene_revisions`) y se muestra un banner sutil: *"Se detectó una edición concurrente en otro dispositivo. Puedes revisar la versión anterior en el historial"*.

---

## 4. MIGRACIÓN TRANSPARENTE DESDE INDEXEDDB A LA NUBE

Cuando un usuario que utilizaba la aplicación localmente decide registrarse o iniciar sesión con correo electrónico:

```
[Usuario inicia sesión en la App]
               |
               v
[Servicio de Migración: Escanea IndexedDB local]
               |
               +---> ¿Existen proyectos locales con user_id = 'local-user'?
                         |
                         +---> NO: Carga directa de proyectos desde la nube.
                         |
                         +---> SÍ: Procedimiento de Fusión y Respaldo:
                                 1. Exporta copia de seguridad JSON a almacenamiento local seguro.
                                 2. Asigna el nuevo UUID de Supabase a los proyectos y escenas locales.
                                 3. Sube los metadatos JSON a PostgreSQL mediante transacción.
                                 4. Lee los Blobs binarios de `assets` en IndexedDB y los sube vía streaming
                                    al bucket S3 privado (`user-assets/${user_id}/`).
                                 5. Actualiza las URLs en IndexedDB apuntando al Storage cloud.
                                 6. Notifica en pantalla: "Tus proyectos locales se han sincronizado en tu cuenta".
```

---

## 5. REINTENTOS ANTE ERRORES DE RED Y SUBIDA DE ARCHIVOS PESADOS

1. **Retroceso Exponencial con Jitter (Backoff):**
   - Si una sincronización falla por pérdida de señal móvil (túnel, avión, desconexión WiFi), el cliente reintenta en intervalos progresivos: 1s, 2s, 4s, 8s, hasta un máximo de 30s, añadiendo una fluctuación aleatoria (*jitter*) para evitar tormentas de peticiones.
2. **Subida de Archivos Multimedia por Partes (TUS / Multipart Upload):**
   - Para pistas de audio o videos de más de 10 MB, se utilizará el protocolo de subida reanudable (estándar en Supabase Storage / S3). Si la conexión se interrumpe al 80%, al reconectarse se sube solo el 20% restante sin reiniciar la transferencia desde cero.
3. **Copias de Seguridad Manuales Descargables:**
   - La aplicación mantendrá siempre visible la función *"Descargar copia de seguridad (.eai)"*, empaquetando todo el proyecto en un único archivo comprimido JSON/Base64 para almacenamiento en el disco duro o pendrive del usuario.
