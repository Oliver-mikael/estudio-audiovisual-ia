# Fase 7E: Sistema de Carpetas Virtuales y Organización de Medios

**Módulo:** `src/types/index.ts`, `src/services/media/mediaStore.ts`, `src/modules/MediaLibraryModule.tsx`
**Estado:** Implementado y Validado

---

## 1. Modelo de Datos de Carpetas
Cada proyecto contiene una colección de carpetas virtuales representada por la interfaz:

```typescript
export interface MediaFolder {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  createdAt: number;
}
```

Cada `MediaAsset` almacena una referencia opcional:
```typescript
folderId?: string;
```

## 2. Operaciones Soportadas
1. **Creación de Carpetas:** Creación inmediata con identificador único UUIDv4 (`folder-xxxx`) y marca de tiempo ISO.
2. **Filtrado por Carpeta:** El usuario puede seleccionar ver "Todas las Carpetas", activos "Sin Carpeta" o una carpeta específica.
3. **Mover Recursos:** Reasignación de `folderId` sobre uno o varios recursos seleccionados sin alterar su contenido físico ni su posición en la línea de tiempo.
4. **Eliminación de Carpetas:** Al eliminar una carpeta, los recursos no se destruyen; automáticamente se les desvincula la referencia (`folderId = undefined`), pasando a la vista general sin carpeta.

## 3. Pruebas Automatizadas
En `src/__tests__/mediaLibrary.test.ts`:
- `creates, updates, and deletes folders without losing assets`: Valida la creación, renombramiento y eliminación segura de carpetas preservando los recursos hijos.
- `filters assets by folder`: Comprueba que el selector de carpetas aisla únicamente los activos correspondientes.
