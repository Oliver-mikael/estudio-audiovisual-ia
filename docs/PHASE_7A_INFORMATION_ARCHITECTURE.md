# Arquitectura de Información y Mapa de Navegación (Fase 7A)

**Documento:** `docs/PHASE_7A_INFORMATION_ARCHITECTURE.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Diseñador de Interacción

---

## 1. Estructura y Áreas de la Plataforma

Para transformar la experiencia fragmentada en un **Estudio Híbrido Profesional**, se establece una arquitectura de información unificada dividida en 9 áreas funcionales:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BARRA SUPERIOR GLOBAL                           │
│  [Logo/Título]  [Copia .eai]  [Asistente IA]  [APK 4.1MB]  [Exportar]  │
├────────────────────────────────────────────────────────────────────────┤
│                       BARRA DE ESTADO GLOBAL                           │
│  Proyecto Activo • Guardado en IndexedDB • Storage: Persistente • IA   │
├────────────────────────────────────────────────────────────────────────┤
│                      NAVEGACIÓN POR ESPACIOS                           │
│  [1.Inicio] [2.Ideas] [3.Investigación] [4.Guion] [5.Storyboard]       │
│  [6.Producción] [7.Biblioteca] [8.Configuración]                       │
├────────────────────────────────────────────────────────────────────────┤
│                         ÁREA DE TRABAJO ACTIVA                         │
│  (Vista de la etapa seleccionada con Monitor Acoplable/Desacoplable)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Mapa Detallado de Espacios de Trabajo

### 1. Inicio (`Home`)
- **Finalidad:** Panel maestro de control de proyectos locales, respaldos físicos y salud del almacenamiento.
- **Subsecciones:**
  - Métricas consolidadas del estudio.
  - Proyectos locales en IndexedDB (búsqueda, duplicación, eliminación no destructiva).
  - Centro de respaldo (exportación .eai individual y por lotes, importador con validación SHA-256).
  - Diagnóstico de persistencia y cuota de almacenamiento.

### 2. Laboratorio de Ideas (`Ideas`)
- **Finalidad:** Generación de tesis originales, preguntas socráticas y formulación de ángulos críticos.
- **Acciones principales:**
  - Registro de ángulos narrativos manuales.
  - Generación de ángulos alternativos con IA contextual.
  - Promoción instantánea ("A Guion") hacia la estructura de escenas.

### 3. Matriz de Investigación (`Research`)
- **Finalidad:** Trazabilidad fáctica de fuentes, afirmaciones y licencias de uso.
- **Acciones principales:**
  - Registro de referencias bibliográficas, enlaces y citas.
  - Clasificación de evidencias (`Fact`, `Hypothesis`, `Interpretation`, `Debunked`).
  - Auditoría de evidencias mediante IA.
  - Vinculación directa de evidencias a escenas específicas.

### 4. Taller de Guion (`Script`)
- **Finalidad:** Redacción de la locución escena por escena con sincronización temporal y auditoría de cadencia.
- **Acciones principales:**
  - Editor interactivo de texto sincronizado con el contador de tiempo.
  - Monitor en vivo de cadencia (palabras por segundo).
  - Expansión y mejora de estilo asistida por IA.
  - Historial de versiones para deshacer con un solo clic.

### 5. Dirección y Storyboard (`Storyboard`)
- **Finalidad:** Orquestación visual de encuadres, intenciones narrativas y transiciones.
- **Acciones principales:**
  - Cuadrícula visual de fotogramas clave 16:9.
  - Asignación de intenciones visuales y directivas de cámara (Zoom In, Pan Left, etc.).
  - Reordenamiento visual de escenas.

### 6. Producción y Montaje (`Production`)
- **Finalidad:** Vista unificada de montaje con timeline multipista (Video, Locución, Música, Subtítulos) y sincronización con el monitor de video.
- **Acciones principales:**
  - Timeline interactivo con scrubber de reproducción.
  - Control de pistas y niveles de audio.
  - Previsualización en tiempo real con Canvas 2D.

### 7. Biblioteca Multimedia (`Media`)
- **Finalidad:** Repositorio local de archivos binarios (imágenes, clips, grabaciones de voz).
- **Acciones principales:**
  - Carga masiva en IndexedDB.
  - Filtrado por tipo (imagen, audio, video).
  - Reproductor rápido de clips y asignación a escenas.
  - Etiquetado semántico inteligente.

### 8. Configuración (`Settings`)
- **Finalidad:** Preferencias del estudio y proveedores de inteligencia artificial.
- **Acciones principales:**
  - Selector de temas (`dark`, `light`, `auto`).
  - Configuración de resolución predeterminada (720p / 1080p, 16:9 / 9:16).
  - Gestión de credenciales de IA seguras en `sessionStorage`.

---

## 3. Barra de Estado Global Persistente

Para garantizar que el usuario nunca pierda la orientación de su sesión, la barra de estado inferior o superior siempre informa:
1. **Proyecto Activo:** Título del proyecto actual.
2. **Estado de Persistencia:** `Guardado en IndexedDB (hace 2s)` o `Guardando...`
3. **Salud de Almacenamiento:** `Persistente (45MB / 2GB)`
4. **Proveedor de IA:** `Local Autónomo ($0/mes)` o `Gemini Flash (Online)`
5. **Conectividad:** `Offline (100% Funcional)` u `Online`
