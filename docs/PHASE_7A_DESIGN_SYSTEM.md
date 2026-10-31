# Sistema de Diseño del Estudio Audiovisual (Fase 7A)

**Documento:** `docs/PHASE_7A_DESIGN_SYSTEM.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Diseñador de Interfaz

---

## 1. Principios Visuales y Ergonomía

El Estudio Audiovisual Inteligente adopta un lenguaje visual inspirado en **estaciones de trabajo de postproducción audiovisual profesional** (como DaVinci Resolve, Avid Media Composer o suites DAW de audio), alejándose de dashboards administrativos genéricos de SaaS.

### Principios Fundamentales:
1. **Contraste Funcional sin Fatiga Visual:** Superficies oscuras con luminancia controlada para largas jornadas de edición, con soporte completo para modo claro cuando se requiera.
2. **Jerarquía Semántica de Acentos:** Colores vivos reservados exclusivamente para estados operativos, puntos de corte, alertas de evidencia y activación de IA.
3. **Tipografía Dual de Precisión:** Tipografía sans-serif para la interfaz y monoespaciada para códigos de tiempo, cadencia de lectura y métricas técnicas.
4. **Ergonomía Táctil Móvil:** Zonas de pulsación de al menos 44x44 píxeles en dispositivos Android, evitando elementos diminutos incompatibles con el uso táctil.

---

## 2. Paleta Cromática y Tokens de Color

### 2.1 Superficies Base (Fondos y Paneles)
| Token | Modo Oscuro (Predeterminado) | Modo Claro | Uso |
|---|---|---|---|
| `surface-ground` | `#020617` (Slate 950) | `#f8fafc` (Slate 50) | Fondo principal de la ventana |
| `surface-panel` | `#0f172a` (Slate 900) | `#ffffff` (White) | Paneles de trabajo, barras laterales |
| `surface-elevated` | `#1e293b` (Slate 800) | `#f1f5f9` (Slate 100) | Tarjetas, contenedores interiores |
| `surface-highlight` | `#334155` (Slate 700) | `#e2e8f0` (Slate 200) | Estados hover y bordes de acento |

### 2.2 Bordes y Separadores
| Token | Modo Oscuro | Modo Claro | Uso |
|---|---|---|---|
| `border-subtle` | `rgba(51, 65, 85, 0.4)` | `rgba(203, 213, 225, 0.6)` | Separadores de listas y tarjetas |
| `border-strong` | `#334155` (Slate 700) | `#cbd5e1` (Slate 300) | Límites de paneles principales |
| `border-focus` | `#6366f1` (Indigo 500) | `#4f46e5` (Indigo 600) | Contornos activos de selección |

### 2.3 Acentos Semánticos
| Acento | Color Base | Uso Funcional |
|---|---|---|
| **Producción / Núcleo** | `#4f46e5` (Indigo 600) | Botones primarios, cursor del timeline, reproducción |
| **Inteligencia Artificial** | `#9333ea` (Purple 600) | Asistente IA, sugerencias creativas, auditoría de ritmo |
| **Verificación / Éxito** | `#10b981` (Emerald 500) | Fuentes verificadas, datos fácticos, APK Android, exportación lista |
| **Alerta / Hipótesis** | `#f59e0b` (Amber 500) | Hipótesis no contrastadas, cadencia excesiva de palabras |
| **Crítico / Destructivo** | `#ef4444` (Rose 500) | Eliminación de escenas, fuentes refutadas, cancelación |

---

## 3. Tipografía

| Rol | Familia | Pesos | Uso |
|---|---|---|---|
| **Interfaz General** | `Inter`, system-ui, -apple-system, sans-serif | Regular (400), Medium (500), SemiBold (600), Bold (700) | Títulos, descripciones, botones, etiquetas de navegación |
| **Métricas y Código** | `JetBrains Mono`, Menlo, monospace | Medium (500), Bold (700) | Códigos de tiempo (`00:01:25`), palabras/segundo (`2.4 w/s`), checksums SHA-256 |

---

## 4. Componentes Clave del Estudio

### 4.1 Monitor de Producción (Canvas 2D Viewport)
- Relación de aspecto fija 16:9 con contorno `border-subtle`.
- Controles de transporte inferiores (Play/Pause, Replay, Timecode, Selector de Resolución y FPS).
- Letrero integrado de intención visual y marca de agua del estudio.

### 4.2 Timeline Multipista
- Cabecera fija con regla de tiempo en segundos.
- Pista V1 (Video/Imágenes con miniaturas).
- Pista A1 (Locución/Voz con indicación de forma de onda o bloques de tiempo).
- Pista T1 (Subtítulos cinemáticos sincronizados).
- Cursor de reproducción interactivo arrastrable (scrubber).

### 4.3 Botones y Controles
- **Primario:** Fondo gradiente Indigo, sombra suave, texto blanco semi-bold.
- **Asistente IA:** Fondo gradiente Purple-Indigo con destello de `Sparkles`.
- **Secundario / Herramienta:** Fondo `surface-elevated`, borde `border-strong`, hover sutil.
- **Móvil:** Padding mínimo `py-3 px-4` para garantizar área táctil de 44px de altura.
