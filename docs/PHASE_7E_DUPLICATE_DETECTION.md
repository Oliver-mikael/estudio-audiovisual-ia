# Fase 7E: Sistema de Detección y Prevención de Duplicados (SHA-256)

**Módulo:** `src/services/media/metadataExtractor.ts`, `src/services/media/mediaImporter.ts`, `src/services/media/mediaStore.ts`
**Estado:** Implementado y Validado

---

## 1. Fundamento Técnico
En la edición no lineal profesional, los creadores frecuentemente arrastran recursos con nombres idénticos o renombrados. El sistema implementa una verificación basada en hash criptográfico **SHA-256** (`crypto.subtle.digest`) para garantizar que el almacenamiento IndexedDB no se sobrecargue con copias redundantes del mismo Blob.

## 2. Estrategia de Hashing y Detección
1. **Extracción del Digest:**
   - Para archivos de tamaño estándar (< 50 MB), se calcula el hash SHA-256 sobre el buffer binario íntegro.
   - Para archivos grandes (> 50 MB) en dispositivos móviles, se utiliza una estrategia segmentada (primeros 4MB + últimos 4MB + tamaño) para evitar agotar la memoria heap en navegadores Android/Chromium.
2. **Validación durante la Importación (`batchImportMediaFiles`):**
   - Antes de persistir un nuevo archivo, se consulta el almacén de activos del proyecto.
   - Si un archivo entrante presenta un hash SHA-256 coincidente con uno existente:
     - El archivo se marca como duplicado (`duplicateCount++`).
     - No se crea un nuevo Blob redundante.
     - Se devuelve la referencia del activo ya existente para que el usuario pueda usarlo directamente.
3. **Casos Especiales:**
   - **Mismo nombre, diferente contenido:** Tienen distintos hashes SHA-256. Ambos se conservan y se les asigna un identificador único.
   - **Distinto nombre, idéntico contenido:** Tienen el mismo hash SHA-256. El sistema detecta la duplicidad y preserva el nombre original del primer activo registrado, o permite actualizar alias sin duplicar bytes.

## 3. Pruebas Automatizadas
En `src/__tests__/mediaLibrary.test.ts`:
- `detects duplicate media asset by sha256 hash`: Comprueba que dos archivos con diferente nombre pero mismo hash son consolidados sin duplicación.
- `handles batch import with duplicates`: Verifica que en una carga por lotes de 4 archivos (con 2 duplicados), sólo 2 registros netos se añaden al catálogo.
