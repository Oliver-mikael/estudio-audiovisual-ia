# ENTREGABLE 5 — REDISEÑO DEL SISTEMA VISUAL UI/UX
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_UI_UX_DESIGN_SYSTEM.md`
**Fase:** Fase 6 — Sistema de Diseño Visual y Experiencia de Usuario Profesional
**Propósito:** Definir la identidad visual compacta, escalable y sobria del estudio audiovisual, eliminando la sensación de prototipo y optimizando el espacio en pantallas táctiles y escritorios.

---

## 1. PRINCIPIOS Y DIAGNÓSTICO DE LA INTERFAZ ANTERIOR

La auditoría de la interfaz actual reveló varios problemas de usabilidad:
- **Espaciado y Tarjetas Excesivas:** El uso de `gap-6` (24px) y paddings internos `p-6` obligaba al usuario móvil a realizar desplazamientos verticales continuos para ver un solo párrafo del guion.
- **Botones y Tipografías Sobredimensionados:** Botones con alturas de 48px y textos descriptivos largos restaban espacio útil al monitor de previsualización.
- **Falta de Modos de Color Profesionales:** La interfaz estaba anclada exclusivamente a un tema oscuro azulado (`slate-950`), sin soporte para modo claro o adaptación al sistema operativo.

### Los Tres Modos de Apariencia Aprobados:
1. **Modo Oscuro (Dark Mode Pro - Por Defecto):** Diseñado para salas de montaje y trabajo prolongado con bajo cansancio visual. Basado en grises neutros profundos (`neutral-900`/`neutral-950`) en lugar de tonos azules saturados.
2. **Modo Claro (Light Mode Pro):** Diseñado para trabajo en exteriores o ambientes con alta luminosidad ambiental (fondo `neutral-50`, tarjetas `white` con bordes sutiles `neutral-200`).
3. **Modo Automático:** Sincronizado dinámicamente con la preferencia del sistema operativo (`prefers-color-scheme`), editable en cualquier momento mediante un selector manual compacto en el encabezado.

---

## 2. PALETA DE COLORES Y TOKENS DE DISEÑO

### Paleta Neutra y Superficies:
| Nivel de Superficie | Modo Oscuro | Modo Claro | Finalidad |
| :--- | :--- | :--- | :--- |
| **Canvas / Fondo Base** | `#0a0a0c` (`neutral-950`) | `#f8fafc` (`slate-50`) | Fondo estructural de la aplicación |
| **Paneles / Barras Laterales** | `#121215` (`neutral-900`) | `#ffffff` (`white`) | Contenedores de herramientas y listas |
| **Tarjetas / Elevación 1** | `#18181b` (`neutral-900/80`) | `#f1f5f9` (`slate-100`) | Cajas de escenas, notas y citas |
| **Bordes Estructurales** | `#27272a` (`neutral-800`) | `#e2e8f0` (`slate-200`) | Separadores de paneles y cuadrículas |

### Acentos Semánticos Profesionales:
- **Acento Primario (Índigo Cinematográfico):** `#6366f1` / `#4f46e5` (Botones de acción principal y pestañas activas).
- **Éxito / Sincronizado:** `#10b981` (Esmeralda para estado en línea, cambios guardados y exportación completada).
- **Procesamiento / Render en Curso:** `#f59e0b` (Ámbar para colas activas y rendering de frames).
- **Alerta / Conflicto:** `#ef4444` (Rojo sobrio para inconsistencias bibliográficas o fallos de conexión).

---

## 3. TIPOGRAFÍA Y ESCALA DE ESPACIADO COMPACTA

- **Fuente Primaria (UI):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`. Máxima legibilidad en densidades altas.
- **Fuente Técnica / Timecode:** `JetBrains Mono`, `ui-monospace`. Utilizada para tiempos de escena (`00:01:25.10`), recuento de palabras, FPS y porcentaje de renders.

### Escala Tipográfica Optimizada:
- **Títulos de Módulo:** `13px` / `text-xs font-semibold uppercase tracking-wider`
- **Cuerpo de Locución / Guion:** `13px` / `text-[13px] leading-relaxed`
- **Etiquetas y Metadatos:** `11px` / `text-[11px] font-mono text-neutral-400`
- **Timecode y Métricas:** `12px` / `text-xs font-mono font-bold`

### Reducción Drástica de Espaciado:
- **Gap entre Paneles:** Reducido de `24px` a **`10px` (`gap-2.5`)**.
- **Padding de Tarjetas:** Reducido de `24px` a **`12px` (`p-3`)**.
- **Altura de Botones:** Estandarizada a **`32px` (`h-8`)** en escritorio y **`36px` (`h-9`)** en pantallas táctiles móviles.

---

## 4. INDICADORES DE ESTADO GLOBAL Y RETROALIMENTACIÓN

En la barra superior se sitúa un bloque permanente de estado del sistema:
1. **Estado de Sincronización:**
   - 🟢 `En línea • Sincronizado` (Ícono de nube con tilde verde).
   - 🟡 `Sin conexión • Guardado localmente` (Ícono de disco local ámbar).
   - 🔵 `Sincronizando deltas...` (Ícono giratorio sutil).
2. **Estado de Renderizado / Workers:**
   - Si hay un renderizado en la nube en curso, aparece un chip compacto: `⚙️ Renderizando Cap. 2 (45%)`, que al pulsar abre el panel de progreso detallado sin interrumpir la escritura del guion.

---

## 5. ORGANIZACIÓN Y NAVEGACIÓN EN 5 NÚCLEOS DE TRABAJO

Se descarta la proliferación de pestañas redundantes. La aplicación se estructura en 5 espacios de trabajo interconectados:
1. **Inicio & Proyectos:** Vista en cuadrícula o lista compacta con proyectos recientes, fecha de última edición y estado de sincronización.
2. **Investigación:** Tablero de fuentes verificadas, afirmaciones cruzadas con evidencias y notas históricas (CERN, W3C).
3. **Producción (Taller de Guion + Storyboard + Monitor):** Espacio integrado donde el usuario ve simultáneamente el texto de locución, las indicaciones de cámara y la respuesta visual en el Canvas 2D.
4. **Biblioteca Multimedia:** Almacén de activos (audios MP3, capturas de pantalla, ilustraciones vectoriales) con licencias y atribución.
5. **Configuración & Cuenta:** Preferencias de apariencia (claro/oscuro/auto), gestión de sesión de usuario y opciones de exportación/backup local.
