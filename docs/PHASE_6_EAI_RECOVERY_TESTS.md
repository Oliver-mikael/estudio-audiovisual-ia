# Pruebas de Respaldo, Integridad y Recuperación .EAI (Fase 6A)

## 1. Propósito de las Pruebas
Verificar que la exportación física y la importación de proyectos en formato `.eai` (Estudio Audiovisual Inteligente Package) funcione de manera confiable, no destructiva, resistente a manipulaciones y completamente compatible con navegadores de escritorio y entornos móviles Android / WebView.

---

## 2. Especificación del Paquete `.eai`
El paquete `.eai` es un formato serializado en JSON que encapsula:
1. **Cabecera de formato y versión**: `ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE` v1.0.0.
2. **Entidad del proyecto**: Título, descripción, configuración técnica (FPS, resolución), ángulos narrativos, fuentes documentadas y guion detallado por escenas.
3. **Activos multimedia empaquetados (`bundledAssets`)**: Activos multimedia codificados en Base64 con tipos MIME preservados (`image/png`, `audio/mpeg`, etc.).
4. **Firma criptográfica SHA-256**: Hash computado sobre la carga útil normalizada para garantizar la autenticidad y detectar manipulaciones en reposo o en tránsito.

---

## 3. Pruebas Ejecutadas y Resultados

### Prueba 3.1: Exportación Completa y Criptografía
- **Objetivo**: Garantizar que el paquete serialice metadatos, escenas, fuentes, ángulos y blobs en Base64 con firma SHA-256.
- **Resultado**: **Aprobado**. El paquete genera un checksum hexadecimal válido y contiene la estructura completa.

### Prueba 3.2: Detección de Manipulación y Corrupción
- **Objetivo**: Confirmar que cualquier alteración en el JSON exportado (por ejemplo, modificación del texto de locución o inyección de código) invalide la firma SHA-256.
- **Resultado**: **Aprobado**. Al alterar un solo carácter en la escena, `validateAndParseEAIPackage` devuelve `checksumValid: false` y rechaza la importación ciega.

### Prueba 3.3: Prevención de Sobrescritura Silenciosa (`create_copy`)
- **Objetivo**: Asegurar que al importar un proyecto con un ID idéntico a uno existente en IndexedDB, la estrategia predeterminada `create_copy` genere un nuevo UUID y un título distintivo `(Copia importada)`, preservando el proyecto original intacto.
- **Resultado**: **Aprobado**. Ambos proyectos coexisten en la base de datos sin colisión de claves ni pérdida de datos.

### Prueba 3.4: Reconstrucción Binaria de Blobs
- **Objetivo**: Verificar que los activos binarios (imágenes, audios) se reconstruyan fielmente con sus tipos MIME y tamaño exacto desde Base64 a `Blob`.
- **Resultado**: **Aprobado**. Verificado para formatos de imagen y audio, y para payloads grandes de 1 MB.

### Prueba 3.5: Rendimiento de Codificación / Decodificación
- **Objetivo**: Validar que la transformación Base64 de archivos binarios de 1 MB o superiores tome menos de 1000 ms sin provocar bloqueos de memoria.
- **Resultado**: **Aprobado** (<80 ms de procesamiento).
