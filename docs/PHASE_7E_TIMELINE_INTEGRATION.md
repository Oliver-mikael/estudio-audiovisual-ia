# Fase 7E: Integración de Recursos Multimedia con la Línea de Tiempo

**Módulo:** `src/services/timeline/timelineEngine.ts`, `src/modules/MediaLibraryModule.tsx`
**Estado:** Implementado y Validado

---

## 1. Flujo de Inserción Asistida
Los recursos catalogados en la biblioteca multimedia pueden enviarse directamente a la línea de tiempo mediante el método:

```typescript
TimelineEngine.insertMediaAssetAsClip(
  timeline: TimelineState,
  asset: MediaAsset,
  targetTrackId?: string,
  startTime?: number
): TimelineState
```

### 1.1 Reglas de Asignación de Pistas
- **Imágenes (`asset.type === 'image'`):**
  - Se dirigen automáticamente a la pista de video primaria `track-v1` (o secundaria `track-v2`).
  - Duración predeterminada: 5.0 segundos (configurable por el usuario).
  - Posicionamiento: inmediatamente después del último clip de la pista elegida, o al inicio (`t=0`) si está vacía.
- **Videos (`asset.type === 'video'`):**
  - Se dirigen a la pista de video `track-v1` o `track-v2`.
  - Duración: toma el valor exacto de `asset.durationSeconds` extraído por `metadataExtractor`. Si no se detectó duración, toma 5.0 segundos por defecto.
- **Audios y Música (`asset.type === 'audio'`):**
  - Se dirigen a la pista de música/efectos `track-a1`.
  - Duración: toma `asset.durationSeconds` obtenido mediante decodificación Web Audio API.
- **Locuciones y Voces (`asset.type === 'voice'`):**
  - Se dirigen a la pista de narración/locución `track-a2`.
  - Duración exacta según el archivo de audio.

### 1.2 Invariabilidad del Recurso Original
- El clip creado en la timeline contiene una referencia `assetId: asset.id`.
- Modificar el clip en la timeline (recortar con `splitClip`, cambiar volumen, desvanecimientos fade-in/fade-out, cambiar velocidad o borrar) **no altera en absoluto** el `MediaAsset` original de la biblioteca.
- Múltiples clips a lo largo del proyecto pueden referenciar al mismo `assetId`, permitiendo reutilizar logos, fondos musicales o jingles sin duplicar espacio en memoria.

## 2. Pruebas Automatizadas
En `src/__tests__/mediaLibrary.test.ts`:
- `inserts media asset into timeline with appropriate track and duration`: Comprueba la inserción de video y audio verificando asignación de pistas, duraciones correctas y no destructividad del asset.
