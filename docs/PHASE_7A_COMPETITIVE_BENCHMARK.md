# Benchmarking Competitivo Profesional (Fase 7A)

**Documento:** `docs/PHASE_7A_COMPETITIVE_BENCHMARK.md`
**Fecha:** 31 de Octubre de 2026
**Fuentes Consultadas:** Documentación oficial y especificaciones de Blackmagic Design DaVinci Resolve 21, Adobe Premiere Pro, Descript y Runway ML.

---

## 1. DaVinci Resolve 21 (Blackmagic Design)

### 1.1 Problema que Resuelve
Unifica en una única suite profesional todo el ciclo de postproducción audiovisual (corte rápido, edición de precisión, etalonaje de color, composición visual VFX y postproducción de audio DAW con Fairlight), evitando exportaciones intermedias entre aplicaciones independientes.

### 1.2 Qué hace especialmente bien
- **Arquitectura de Páginas Especializadas:** La barra inferior fija permite alternar con un solo clic entre entornos optimizados para tareas específicas (`Media`, `Cut`, `Edit`, `Fusion`, `Color`, `Fairlight`, `Deliver`).
- **Página "Cut" para Montaje Rápido:** Timeline dual donde una pista superior muestra la totalidad del proyecto para navegación rápida y una pista inferior muestra la zona de trabajo ampliada para cortes de precisión.
- **Fairlight Audio Core:** Procesamiento de audio en tiempo real con latencia ultra-baja y mezcla multicanal.
- **DaVinci AI Neural Engine:** Aceleración de tareas de reconocimiento y encuadre mediante modelos de inferencia local en GPU.

### 1.3 Patrones UX a Adaptar
- **Navegación por Espacios de Trabajo Especializados:** Mantener una barra de navegación clara por etapas de producción en lugar de una interfaz abarrotada.
- **Doble Nivel de Timeline:** En pantallas de edición, contar con un mini-mapa general de la pieza audiovisual y una vista detallada de la escena activa.
- **Entrega Dedicada (`Deliver`):** Panel claro para configuración de resolución, códec y exportación con estimación de tiempo.

### 1.4 Qué NO debemos copiar
- Complejidad masiva de miles de controles por pantalla que saturan la experiencia en dispositivos móviles Android o en pantallas de portátiles modestas.
- Dependencia de tarjetas aceleradoras de hardware propietarias.

---

## 2. Adobe Premiere Pro

### 2.1 Problema que Resuelve
Estándar de la industria para edición no lineal (NLE), organización de proyectos complejos con miles de clips y colaboración editorial flexible.

### 2.2 Qué hace especialmente bien
- **Edición Basada en Texto (Text-Based Editing):** Transcribe automáticamente los clips de voz y permite editar el video simplemente cortando, copiando y pegando fragmentos de texto en la ventana del transcript.
- **Organización por Bins y Metadatos:** Jerarquía de carpetas inteligentes, etiquetas de color y búsqueda contextual de recursos.
- **Espacios de Trabajo Reconfigurables:** Paneles acoplables que el usuario puede redimensionar libremente.

### 2.3 Patrones UX a Adaptar
- **Edición Basada en Texto:** Vincular bidireccionalmente el texto de la locución con la duración y corte de la escena. Modificar el texto ajusta automáticamente el tiempo estimado de la escena.
- **Etiquetado Semántico de Medios:** Clasificación por colores de clips de voz, música y recursos gráficos.

### 2.4 Qué NO debemos copiar
- Interfaz pesada basada en decenas de ventanas modales flotantes.
- Modelo de suscripción forzoso y telemetría invasiva.

---

## 3. Descript

### 3.1 Problema que Resuelve
Democratiza la producción de video y podcasts eliminando la curva de aprendizaje de las líneas de tiempo tradicionales mediante un paradigma centrado en documentos de texto.

### 3.2 Qué hace especialmente bien
- **Metáfora "Video como Documento":** El guion es la fuente de la verdad; borrar una palabra o frase en el texto corta automáticamente el segmento audiovisual asociado.
- **Asistente "Underlord":** Asistente IA que analiza ritmo, elimina muletillas y propone transiciones manteniendo siempre al creador en control de aceptar o descartar cambios.
- **Studio Sound y Limpieza Vocal:** Procesamiento de audio para claridad de voz sin necesidad de micrófonos de estudio.

### 3.3 Patrones UX a Adaptar
- **Sincronización Texto-Tiempo:** El guion no es un campo de notas pasivo, sino el eje cronológico de la producción.
- **Control Socrático y Asistencial:** La IA sugiere ajustes de ritmo y cadencia pero nunca sobreescribe el guion sin una confirmación explícita con historial de versiones para deshacer.

### 3.4 Qué NO debemos copiar
- Procesamiento forzoso en la nube con cobro recurrente por minuto de transcripción o créditos de IA. Nuestro estudio debe garantizar funcionamiento local offline a costo $0/mes.

---

## 4. Runway ML

### 4.1 Problema que Resuelve
Integración de modelos generativos de video e imagen (Gen-2, Gen-3 Alpha) con controles direccionales para cineastas y creadores de contenido.

### 4.2 Qué hace especialmente bien
- **Control Cinemático de Cámara:** Parámetros intuitivos para definir movimientos (Zoom In/Out, Pan, Tilt, Roll) con previsualización de intenciones.
- **Workflows por Etapas:** Canalizaciones donde una salida de investigación o guion alimenta directamente los parámetros del generador visual.

### 4.3 Patrones UX a Adaptar
- **Metadatos de Intención Visual:** En lugar de dejar la pantalla en negro si no hay imagen, definir explícitamente la intención cinematográfica de la escena y el movimiento de cámara programado.
- **Transiciones Declarativas:** El usuario escoge la transición (`Cut`, `Fade`, `Slide`, `Zoom`) y el motor la interpola automáticamente.

### 4.4 Qué NO debemos copiar
- Dependencia de clusters de GPUs en la nube para renderizar cada segundo de video con costo prohibitivo. El Estudio Audiovisual Inteligente renderiza localmente con Canvas 2D en cualquier navegador o teléfono Android.

---

## 5. Cuadro Comparativo de Adaptación

| Herramienta | Fortaleza Principal | Qué Adoptamos en Estudio Híbrido | Qué Rechazamos / Evitamos |
|---|---|---|---|
| **DaVinci Resolve** | Flujo unificado por páginas y timeline dual | Navegación limpia por etapas de producción y monitor siempre visible | Saturación de controles y complejidad innecesaria |
| **Premiere Pro** | Text-based editing y metadatos de medios | Edición de video sincronizada con el texto del guion | Modelo de suscripción y sobrecarga de memoria |
| **Descript** | Guion interactivo y asistente co-editor | Auditoría de ritmo por palabras/segundo y reversibilidad estricta | Dependencia de nube de pago y servidores remotos |
| **Runway** | Controles cinemáticos de cámara y estética pro | Definición de intenciones visuales, paneos y zooms automáticos | Costos de renderizado en GPU remota |
