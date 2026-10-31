# ENTREGABLE 6 — EXPERIENCIA MULTIDISPOSITIVO (MÓVIL VS. ESCRITORIO)
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_MULTIDEVICE_EXPERIENCE.md`
**Fase:** Fase 6 — Especificación de Flujos de Interacción por Dispositivo
**Propósito:** Definir la experiencia adaptativa especializada para Android móvil y computadora de escritorio, compartiendo idéntico estado de datos sin duplicar esfuerzos.

---

## 1. PRINCIPIO DE ESPECIALIZACIÓN POR DISPOSITIVO

Un teléfono inteligente y una computadora de escritorio no deben intentar mostrar la misma distribución de pantalla:
- **El celular** es una herramienta de captura rápida de ideas, revisión de guiones, grabación de notas de voz y supervisión del progreso de renderizados mientras el usuario se desplaza.
- **La computadora** es el taller principal de composición, donde el usuario dispone de múltiples paneles abiertos, monitor de video de gran tamaño, edición de precisión de la línea de tiempo y atajos de teclado.

Ambos dispositivos acceden a la **misma cuenta de usuario** y a los **mismos proyectos**, pero la interfaz se reconfigura para potenciar las virtudes físicas de cada plataforma.

---

## 2. EXPERIENCIA ANDROID (TELÉFONOS MÓVILES)

### Características de la Experiencia Móvil:
- **Barra de Navegación Inferior Fija (Bottom Navigation Bar):** Ubicada en la zona ergonómica del pulgar, con 4 accesos rápidos:
  1. `Proyectos`: Lista rápida de proyectos recientes con buscador y estado de guardado.
  2. `Guion`: Editor de texto táctil con tarjetas de escena colapsables.
  3. `Monitor`: Reproductor de video en formato panorámico con controles táctiles grandes (Play/Pausa, scrubber de tiempo).
  4. `Trabajos`: Monitor en vivo de tareas pesadas en la nube.
- **Vistas en Pantalla Completa:** Se elimina la división vertical de columnas de la versión web. En el móvil, cada módulo ocupa el 100% del ancho para no apretar el texto.
- **Grabadora de Locución Directa:**
  - Botón flotante para registrar audios de prueba utilizando el micrófono integrado del celular mediante `navigator.mediaDevices.getUserMedia()`, guardándolos directamente como assets de audio en la escena actual.
- **Supervisión de Trabajos Cloud:**
  - Si el usuario solicita exportar un video, el teléfono delega la tarea al worker cloud. La app muestra una notificación o tarjeta flotante: *"Renderizado en curso en la nube: 60%. Puedes cerrar la aplicación cuando quieras"*.
  - Al completarse el trabajo, la app almacena el enlace de descarga o permite reproducir el video terminado en streaming directo.

---

## 3. EXPERIENCIA EN COMPUTADORA (ESCRITORIO / PANTALLAS GRANDES)

### Características de la Experiencia de Escritorio:
- **Entorno de Trabajo Multicolumna (Layout Tipo Suite Profesional):**
  - **Columna Izquierda (20% del ancho):** Navegador de escenas y proyectos. Lista vertical de escenas con indicación de duración (`01 | 16s`, `02 | 18s`), drag-and-drop para reordenar secuencias y acceso a la biblioteca de medios.
  - **Columna Central (45% del ancho):** Monitor Audiovisual Canvas 2D en resolución nativa 16:9 con transporte completo (Play/Pausa, Loop, Mute), scrubber de línea de tiempo con marcadores de escena y pista de subtítulos en vivo.
  - **Columna Derecha (35% del ancho):** Taller de Guion contextual y Crítica de IA. Editor de texto enriquecido, contador de palabras por segundo, análisis de ritmo y panel de evidencias/fuentes históricas vinculadas a la escena seleccionada.
- **Atajos de Teclado Profesionales (NLE Shortcuts):**
  - `Espacio`: Alternar reproducción y pausa del Canvas 2D.
  - `J` / `K` / `L`: Rebobinar a 2x, Pausar, y Reproducir a 2x (estándar en edición audiovisual).
  - `←` / `→`: Retroceder o avanzar 1 segundo exacto en la línea de tiempo.
  - `Ctrl + S` / `Cmd + S`: Forzar sincronización inmediata de cambios a la nube.
  - `Ctrl + B`: Abrir u ocultar la barra lateral de escenas para maximizar el monitor.

---

## 4. MATRIZ COMPARATIVA DE CAPACIDADES POR DISPOSITIVO

| Función / Capacidad | Celular Android | Computadora de Escritorio | Justificación Técnica |
| :--- | :---: | :---: | :--- |
| **Crear y editar guiones** | ✅ Ligera (Ajustes de texto) | ✅ Completa (Escritura intensiva) | La pantalla grande y teclado facilitan la redacción extensa. |
| **Revisar fuentes y evidencias** | ✅ Consulta rápida | ✅ Tablero comparativo | Comparar afirmaciones con citas bibliográficas requiere espacio horizontal. |
| **Previsualización Canvas 2D local** | ✅ Sí (360p / 720p) | ✅ Sí (720p / 1080p a 60 FPS) | Optimizado en móvil para ahorrar batería; máxima fluidez en PC. |
| **Grabación de locución con micro** | ✅ Óptimo (Micrófono nativo) | ✅ Soportado (Micrófono USB) | El teléfono es excelente para notas de voz instantáneas. |
| **Ejecución de Render Pesado** | ❌ Delegado a Cloud | ⚠️ Opcional local / ✅ Cloud | El celular no debe sufrir sobrecalentamiento ni descargas de batería. |
| **Gestión de Archivos / Assets** | Subida selectiva de fotos | Drag-and-drop masivo de archivos | Los flujos de trabajo de producción pesada se centralizan en PC. |
| **Sincronización en Tiempo Real** | ✅ WebSocket / Delta Sync | ✅ WebSocket / Delta Sync | Ambos dispositivos reflejan el cambio en < 500 ms si están conectados. |
