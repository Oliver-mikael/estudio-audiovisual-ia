# Auditoría UX y Diagnóstico de Experiencia de Usuario (Fase 7A)

**Documento:** `docs/PHASE_7A_UX_AUDIT.md`
**Fecha:** 31 de Octubre de 2026
**Autor:** Arquitecto de Software & Diseñador de Producto

---

## 1. Diagnóstico Global de UX

El sistema actual ofrece una base visual sólida con una estética oscura moderna (estilo Slate/Indigo). No obstante, la experiencia de usuario presenta fricciones operativas que impiden que se perciba como un entorno de trabajo audiovisual unificado de nivel profesional:

1. **Fragmentación en pestañas aisladas:**
   El usuario debe saltar entre pestañas desconectadas ("Ideas", "Investigación", "Guion", "Storyboard", "Biblioteca") para avanzar en su proyecto, sin tener una visión panorámica de la línea temporal de su producción.
2. **Duplicidad del Monitor de Video:**
   El `VideoPlayer` se encuentra en una columna lateral fija izquierda que ocupa el 42% del ancho en pantallas de escritorio (`lg:col-span-5`). Esto limita el espacio horizontal para redactar guiones o ver tablas de fuentes. En pantallas móviles, el monitor se sitúa arriba y empuja todo el contenido hacia abajo, obligando a realizar scroll vertical constante.
3. **Ausencia de Timeline Temporal Interactivo:**
   El usuario no puede ver cómo se distribuyen las escenas en una línea de tiempo continua, ni arrastrar para ajustar duraciones o puntos de corte.
4. **Falta de Trazabilidad Visual:**
   Cuando el usuario formula una idea o registra una fuente, no visualiza inmediatamente cómo esa evidencia respalda una escena concreta en el monitor.

---

## 2. Auditoría Pantalla por Pantalla

### 2.1 Pantalla de Inicio / Dashboard (`HomeDashboard`)
- **Fortalezas:**
  - Métricas reales consolidadas del estudio (proyectos, escenas, duración, medios).
  - Selector de tema accesible y conmutación ágil.
  - Indicador claro del estado de persistencia de IndexedDB.
  - Diálogo de previsualización de importación con verificación SHA-256.
- **Fricciones detectadas:**
  - La tarjeta de "Proyecto Activo" ocupa un área prominente pero no ofrece acceso directo para editar el título o la descripción sin entrar al taller.
  - El buscador solo filtra por texto simple en título y descripción.
- **Mejoras UX propuestas:**
  - Agregar botón de edición rápida in situ para título y metadatos.
  - Añadir etiquetas de estado del proyecto (Borrador, En Producción, Listo para Exportar).

### 2.2 Laboratorio de Ideas (`IdeaLab`)
- **Fortalezas:**
  - Cuestionamiento crítico socrático que evita fórmulas trilladas.
  - Botón de promoción directa a guion.
- **Fricciones detectadas:**
  - El formulario manual tiene 5 campos que pueden resultar intimidantes para una lluvia de ideas inicial.
  - No hay distinción visual entre ángulos generados por IA y ángulos formulados manualmente por el creador.
- **Mejoras UX propuestas:**
  - Modo "Captura Rápida" (solo gancho y perspectiva) con expansión posterior opcional.
  - Distintivo visual claro del origen del ángulo (humano vs asistido por IA).

### 2.3 Matriz de Investigación (`ResearchModule`)
- **Fortalezas:**
  - Rigor ético al clasificar fuentes por tipo de evidencia (`Fact`, `Hypothesis`, etc.) y licencia.
  - Auditoría global de evidencia mediante IA.
- **Fricciones detectadas:**
  - La lista de fuentes es meramente informativa; no existe una forma intuitiva de vincular una fuente a un párrafo del guion.
- **Mejoras UX propuestas:**
  - Botón "Vincular a Escena #X" en cada tarjeta de fuente.
  - Indicador en el guion de "X fuentes fácticas respaldando este segmento".

### 2.4 Taller de Guion (`ScriptWorkshop`)
- **Fortalezas:**
  - Métricas de cadencia (palabras por segundo) con alertas si se superan los límites de inteligibilidad.
  - Historial de versiones no destructivo antes de cada cambio de IA.
- **Fricciones detectadas:**
  - La lista de escenas en la barra lateral izquierda tiene una altura fija con scroll interno pequeño.
  - No se pueden reordenar las escenas arrastrando y soltando (drag & drop).
- **Mejoras UX propuestas:**
  - Arrastrar y soltar para reordenar escenas.
  - Vista en modo "Lectura Continua de Guion" para evaluar el flujo narrativo completo de principio a fin sin tener que hacer clic en cada escena por separado.

### 2.5 Storyboard (`StoryboardModule`)
- **Fortalezas:**
  - Tarjetas visuales con aspecto 16:9 que reflejan la duración, el movimiento de cámara y la transición.
- **Fricciones detectadas:**
  - La cuadrícula es estática; no permite arrastrar escenas ni cambiar la imagen de portada directamente desde la tarjeta.
- **Mejoras UX propuestas:**
  - Selector de imagen emergente al hacer clic sobre el marco visual de la tarjeta.
  - Soporte de reordenamiento visual.

### 2.6 Biblioteca Multimedia (`MediaLibraryModule`)
- **Fortalezas:**
  - Previsualización rápida de imágenes, audios y videos locales.
  - Almacenamiento directo de blobs sin servidores en la nube.
- **Fricciones detectadas:**
  - No hay reproductor de audio integrado para escuchar un clip de locución antes de usarlo.
  - No se indica qué archivos multimedia están actualmente en uso en el guion y cuáles son huérfanos.
- **Mejoras UX propuestas:**
  - Mini reproductor de audio integrado en cada tarjeta.
  - Badge de "En uso en Escena #X" o "No asignado".

### 2.7 Asistente IA Flotante (`AIAssistantDrawer`)
- **Fortalezas:**
  - Panel lateral deslizante que no interrumpe la pantalla de trabajo.
  - Transparencia absoluta sobre proveedor, modelo, latencia y almacenamiento de claves en memoria volátil.
- **Fricciones detectadas:**
  - El usuario debe seleccionar manualmente qué hacer con el texto generado; falta un selector de destino contextual ("Reemplazar locución", "Añadir a notas", "Crear nueva escena").
- **Mejoras UX propuestas:**
  - Botones de acción contextuales directos al pie de cada resultado de IA.
