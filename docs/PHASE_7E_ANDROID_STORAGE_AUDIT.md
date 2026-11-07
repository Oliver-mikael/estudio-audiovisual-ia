# Fase 7E: Auditoría de Almacenamiento en Android y Limitaciones Físicas

**Objetivo:** Analizar el comportamiento del almacenamiento multimedia, IndexedDB y WebView en Android.

---

## 1. Estrategia de Almacenamiento Offline-First
1. **IndexedDB como Data Store Principal:**
   - La estructura de metadatos del proyecto (`Project`, `tracks`, `clips`, `folders`) se almacena como JSON serializado en el almacén de IndexedDB (`estudio_db`).
   - Los datos binarios (Blobs) de video, audio e imágenes se guardan como `Blob` nativo dentro del object store `media_files`.
2. **Generación de Blob URLs en Sesión:**
   - Para la renderización y previsualización se utiliza `URL.createObjectURL(blob)`.
   - Estas URLs temporales residen únicamente en la memoria de la sesión activa y son liberadas adecuadamente para prevenir fugas de memoria.

## 2. Límites de Cuota en Android WebView
- **Cuota de Almacenamiento:** Android Chrome/WebView concede típicamente hasta un 60% del espacio libre de almacenamiento interno del dispositivo (con un tope común de varios gigabytes).
- **Manejo de Errores por Cuota Insuficiente (`QuotaExceededError`):**
  - Si el usuario intenta importar un lote de videos pesados que exceda la cuota disponible en el dispositivo móvil, el API arroja `QuotaExceededError`.
  - El servicio de importación captura este error e interrumpe la carga de forma segura, informando al usuario y preservando los archivos importados con éxito hasta ese momento.
- **Persistencia entre Sesiones:**
  - Los datos persistidos en IndexedDB permanecen intactos tras cerrar y reabrir la aplicación en Android WebView, siempre que el usuario no limpie explícitamente los datos de la app en la configuración del sistema.

## 3. Limitaciones Reales y Puntos Pendientes de Validación en Dispositivos Físicos

1. **Gestión de Memoria Heap con Videos 4K:**
   - En Android de gama media (4GB a 6GB RAM), decodificar múltiples videos pesados simultáneamente en Canvas puede activar el Low Memory Killer (LMK) del sistema operativo. Se recomienda limitar los videos a 1080p a 30 FPS en móviles.
2. **Selector de Archivos (`<input type="file">`):**
   - En Android WebView, el selector depende de los permisos del sistema de archivos y del `WebChromeClient` configurado en Capacitor/Android. Si bien en el navegador funciona inmediatamente, en dispositivos físicos debe verificarse el comportamiento de los filtros MIME compuestos (`video/*,image/*,audio/*`).
3. **Generación de Miniaturas en Videos Extensos:**
   - La búsqueda (`video.currentTime = 0.5`) puede tardar entre 500ms y 1500ms en procesadores móviles de gama de entrada.
