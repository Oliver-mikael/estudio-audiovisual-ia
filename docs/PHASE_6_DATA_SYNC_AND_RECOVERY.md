# Fase 6 — Sincronización, migración y recuperación de datos

## 1. Objetivo

Permitir que proyectos y materiales estén disponibles en Android y computadora sin perder el funcionamiento local actual. IndexedDB se conserva como almacenamiento local y caché hasta que una migración probada demuestre que puede evolucionar de forma segura.

## 2. Modelo de datos y autoridad

Separar tres clases:

1. **Datos de proyecto:** títulos, guion, escenas, investigación, referencias, metadatos.
2. **Activos binarios:** imágenes, audio, video, exportaciones y documentos.
3. **Estado de ejecución:** jobs, progreso, logs, resultados y errores.

La autoridad debe definirse por entidad. Propuesta:
- sin conexión: el dispositivo conserva cambios pendientes;
- al sincronizar: el servidor acepta operaciones validadas y asigna versión;
- el cliente no sobrescribe silenciosamente una versión remota más reciente.

## 3. Identificadores y versiones

Cada proyecto, escena y activo necesita ID estable (UUID). No depender del nombre o posición de un elemento.

Campos recomendados:
- `id`
- `project_id`
- `owner_id`
- `created_at`
- `updated_at`
- `revision`
- `deleted_at` para borrado lógico cuando corresponda
- `schema_version`

Las operaciones deben incluir `operation_id` idempotente, revisión base y dispositivo origen.

## 4. Sincronización incremental

Flujo:
1. El cliente guarda inmediatamente en IndexedDB.
2. Registra una operación pendiente en una outbox local.
3. Cuando hay conexión, envía operaciones en orden y con idempotency key.
4. El servidor valida permisos, revisión y esquema.
5. Devuelve aceptación o conflicto.
6. El cliente actualiza checkpoint y descarga cambios posteriores.
7. La operación se marca sincronizada solo tras confirmación del servidor.

No borrar la outbox hasta confirmar persistencia remota.

## 5. Resolución de conflictos

No aplicar “última escritura gana” a todo el proyecto.

Política inicial:
- campos simples no críticos: resolver por revisión y mostrar conflicto cuando ambas ediciones sean concurrentes;
- escenas: tratar cada escena como entidad independiente;
- guion: conservar versiones y permitir comparar;
- archivos: nunca reemplazar por nombre; usar ID y checksum;
- eliminaciones: tombstones/versionado, con período de recuperación;
- cambios incompatibles: bloquear sincronización y pedir intervención.

La resolución automática solo se habilita para operaciones con semántica clara.

## 6. Migración de IndexedDB

Antes de activar migración:
- exportar proyectos y blobs;
- calcular cantidad y tamaño total;
- validar que los archivos exportados se abren;
- crear copia de seguridad fuera del almacenamiento primario;
- probar importación en un perfil limpio;
- registrar recuentos y checksums;
- ejecutar migración piloto con datos duplicados/de prueba;
- comparar origen y destino;
- obtener confirmación explícita antes de cambiar autoridad.

Durante el piloto, IndexedDB sigue siendo fuente local recuperable. No borrar stores, no cambiar esquema destructivamente y no limpiar datos por “migración exitosa” hasta que se hayan validado restauración y uso real en dos dispositivos.

## 7. Archivos multimedia

- Metadatos en PostgreSQL; bytes en object storage.
- Carga reanudable cuando el proveedor lo soporte.
- Checksum SHA-256 para integridad.
- MIME y extensión validados.
- Estados `local_only`, `uploading`, `remote_ready`, `downloaded`, `error`.
- Descargas bajo demanda y caché local con política explícita.
- No descargar toda la biblioteca automáticamente al móvil.
- URLs firmadas no se almacenan como identificadores permanentes.

## 8. Copias de seguridad y recuperación

Definir:
- backup de base de datos;
- versionado o protección de objetos;
- exportación independiente del proveedor;
- retención y frecuencia;
- cifrado;
- prueba periódica de restauración;
- RPO/RTO realistas según el plan gratuito.

Un backup no se considera válido hasta restaurarlo en un entorno aislado y comprobar registros y archivos.

## 9. Experiencia del usuario

Mostrar estados comprensibles:
- Guardado en este dispositivo.
- Pendiente de sincronización.
- Sincronizado.
- Conflicto que requiere revisión.
- Error de carga.
- Almacenamiento casi lleno.

Nunca mostrar “Guardado en la nube” antes de la confirmación del servidor.

## 10. Coste US$0/mes

Para mantenerse en cero:
- conservar IndexedDB;
- sincronizar primero metadatos y proyectos de texto pequeños;
- limitar el piloto a pocos proyectos y archivos pequeños;
- no activar backup/retención premium sin autorización;
- establecer cuota por usuario y alertas antes de llegar al límite.

Los tiers gratuitos cambian y pueden limitar almacenamiento, transferencia, backups o disponibilidad. Comprobar los términos vigentes antes de desplegar.

## 11. Criterios de aceptación

- Exportación y restauración local verificadas.
- Operaciones idempotentes.
- Conflictos visibles, no sobrescritos silenciosamente.
- Sincronización reanudable.
- Integridad de blobs comprobada.
- Proyecto recuperable desde un segundo dispositivo.
- Datos locales no eliminados por fallos de red.
