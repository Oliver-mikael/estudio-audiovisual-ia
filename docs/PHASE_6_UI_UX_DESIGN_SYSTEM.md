# Fase 6 — Sistema de diseño UI/UX

## 1. Dirección aprobada

- Modo claro, oscuro y automático.
- Selector manual.
- Densidad compacta y profesional.
- Buena legibilidad en móvil y escritorio.
- Menos espacios y elementos gigantes.
- Jerarquía visual clara y consistente.

Este documento define principios y especificaciones; no ordena reconstruir la interfaz sin aprobación.

## 2. Objetivos de experiencia

1. Que el usuario entienda dónde está y cuál es el siguiente paso.
2. Priorizar el contenido de trabajo sobre tarjetas decorativas.
3. Reducir desplazamiento innecesario.
4. Mantener controles táctiles utilizables en Android.
5. Aprovechar pantallas amplias en computadora.
6. Comunicar claramente guardado, sincronización y procesamiento.
7. Mantener una identidad visual consistente entre módulos.

## 3. Tokens visuales

Definir tokens centralizados, no valores dispersos en componentes.

Categorías:
- `color.background`
- `color.surface`
- `color.surfaceRaised`
- `color.textPrimary`
- `color.textSecondary`
- `color.border`
- `color.accent`
- `color.success`
- `color.warning`
- `color.danger`
- `space.1` a `space.6`
- `radius.sm`, `radius.md`, `radius.lg`
- `font.family`, `font.size.*`, `font.weight.*`
- `shadow.subtle`
- `motion.fast`, `motion.normal`

Los valores definitivos deben validarse con prototipos y contraste WCAG. No fijar una paleta sin probarla en los módulos reales.

## 4. Temas

### Claro
Fondo neutro claro, superficies diferenciadas sutilmente, texto oscuro y acento moderado.

### Oscuro
Fondos neutros oscuros, superficies elevadas diferenciadas, texto de alto contraste y acento controlado.

### Automático
Seguir la preferencia del sistema operativo.

El selector manual debe prevalecer hasta que el usuario elija volver a automático. Guardar preferencia local y sincronizarla solo si se define como preferencia de cuenta.

## 5. Densidad y tipografía

- Tipografía legible como Inter o equivalente de sistema.
- Escala tipográfica compacta, sin texto diminuto.
- Botones de altura moderada y área táctil suficiente.
- Evitar márgenes y padding excesivos.
- Una sola escala de espaciado.
- No reducir objetivos táctiles por debajo de recomendaciones de accesibilidad.
- Soportar zoom y tamaño de fuente del sistema.

## 6. Componentes

Especificar variantes y estados para:
- navegación;
- botones primarios/secundarios/terciarios;
- inputs y selectores;
- tabs;
- paneles;
- tarjetas de proyecto;
- tablas/listas;
- diálogos;
- menús;
- reproductor;
- timeline/storyboard;
- indicadores de estado;
- notificaciones y mensajes de error.

Cada componente debe tener estados normal, hover/focus, pressed, disabled, loading y error cuando aplique.

## 7. Navegación propuesta

- Inicio
- Investigación
- Producción
- Biblioteca
- Configuración

En móvil, navegación inferior o menú compacto según número de destinos y espacio. En escritorio, barra lateral compacta y área de trabajo amplia. No duplicar módulos por conveniencia visual: la navegación debe reflejar tareas reales.

## 8. Pantalla Inicio — piloto de rediseño

Propuesta de jerarquía:
1. Cabecera compacta con identidad y estado de cuenta/sync.
2. Acción principal: continuar proyecto o crear proyecto.
3. Proyectos recientes con estado y fecha.
4. Trabajos activos/recientes.
5. Accesos a Investigación y Producción.
6. Biblioteca como acceso secundario.

No usar un dashboard de métricas vacías ni grandes tarjetas sin utilidad.

## 9. Estados de sincronización y jobs

Distinguir:
- Guardado local.
- Pendiente de sincronización.
- Sincronizado.
- Subiendo archivo.
- Trabajo en cola.
- Procesando en servidor.
- Listo para revisar.
- Error con acción de recuperación.

No representar una tarea local como remota.

## 10. Accesibilidad y pruebas

- Contraste WCAG AA como objetivo.
- Navegación por teclado en escritorio.
- Focus visible.
- Etiquetas para controles.
- Texto alternativo donde corresponda.
- Estados no comunicados solo por color.
- Pruebas en ancho móvil estrecho, tablet y escritorio.
- Verificar tema claro/oscuro en todos los módulos.
- Prueba de legibilidad y uso táctil en Android físico.

## 11. Plan de diseño

1. Capturar pantallas actuales.
2. Inventariar componentes y tokens existentes.
3. Diseñar Inicio como piloto en móvil y escritorio.
4. Probar tema claro/oscuro/automático.
5. Evaluar con tareas reales.
6. Aprobar sistema antes de extender a todos los módulos.

## 12. Criterios de aceptación

- Tokens centralizados.
- Temas completos.
- Densidad compacta sin sacrificar accesibilidad.
- Navegación consistente.
- Inicio probado en móvil y escritorio.
- Estados de guardado y sincronización veraces.
- Aprobación del usuario antes de rediseño general.
