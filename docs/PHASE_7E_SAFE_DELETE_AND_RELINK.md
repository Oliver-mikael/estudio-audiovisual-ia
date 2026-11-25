# Fase 7E: Eliminación Segura y Reconexión de Medios Ausentes (Relink)

**Módulo:** `src/services/media/mediaStore.ts`, `src/services/media/missingMediaManager.ts`
**Estado:** Implementado y Validado

---

## 1. Prevención de Eliminación Accidental (Safe Delete)
En los sistemas NLE tradicionales (Premiere, DaVinci, Final Cut), eliminar un recurso de la bandeja de entrada cuando está montado en la línea de tiempo causa que la pantalla muestre "Media Offline".

Para prevenir este fallo operativo:
1. **Inspección de Referencias Activas:**
   - La función `canDeleteAsset(assetId, project)` audita exhaustivamente todas las pistas (`tracks`) del proyecto (`V1`, `V2`, `A1`, `A2`, `T1`).
   - Comprueba tanto `clip.assetId` directo como referencias en efectos o generadores.
2. **Bloqueo Preventivo:**
   - Si `canDeleteAsset` devuelve `canDelete: false`, la función `safeDeleteAsset` rechaza la solicitud arrojando un error descriptivo con la lista de clips que dependen del recurso.
   - En la UI, el botón de eliminar muestra un diálogo de advertencia explícito y no permite la eliminación a menos que el usuario elimine previamente los clips de la timeline.
3. **Eliminación Segura:**
   - Cuando ningún clip referencia al recurso, se procede a su remoción del catálogo del proyecto y posterior desasignación de memoria Blob en IndexedDB.

## 2. Gestión de Medios Huérfanos y Reconexión (Relink)
Si por alguna razón externa (ej. migración de proyecto o importación parcial) existen clips en la timeline cuyo `assetId` no se encuentra en `project.mediaAssets`:
1. **Detección Automática:**
   - `detectMissingMedia(project)` genera una lista de `MissingMediaRef` especificando pista, clip ID, nombre esperado y tipo de medio requerido.
2. **Reconexión Asistida:**
   - `reconnectMissingMedia(project, missingRef, replacementAsset)` valida la concordancia de tipo (no permite reemplazar un clip de audio con una imagen, ni viceversa).
   - Actualiza el `clip.assetId` preservando íntegramente la posición temporal (`start`), duración (`duration`), puntos de entrada/salida (`inPoint`, `outPoint`), volumen, faders y efectos.

## 3. Pruebas Automatizadas
En `src/__tests__/mediaLibrary.test.ts`:
- `prevents deletion of media assets currently in use on timeline`: Verifica el rechazo de borrado de recursos con clips activos.
- `detects missing media clips on timeline`: Comprueba la auditoría de referencias huérfanas.
- `relinks missing media clip to replacement asset`: Valida la reconexión exitosa y preservación de propiedades del clip.
