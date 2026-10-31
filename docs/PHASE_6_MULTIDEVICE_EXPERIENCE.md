# Fase 6 — Experiencia multidispositivo

## 1. Objetivo

Definir una experiencia coherente en Android y computadora, compartiendo proyectos y estados a través de una cuenta, sin convertir al teléfono en el equipo que mantiene procesos pesados.

## 2. Principios

- Misma identidad y proyectos; interacción adaptada al dispositivo.
- El teléfono es una interfaz de control, revisión y trabajo ligero.
- La computadora ofrece un espacio de edición y organización más amplio.
- El backend cloud conserva el estado compartido.
- El modo offline mantiene acceso a datos descargados y cambios pendientes.
- Ningún dispositivo debe asumir que otro terminó una tarea hasta recibir estado del servidor.

## 3. Android

Prioridades:
- navegación táctil compacta;
- abrir/crear/continuar proyecto;
- revisar fuentes, guion y storyboard;
- añadir notas y cambios ligeros;
- subir medios de manera controlada;
- supervisar jobs remotos;
- pausar/cancelar cuando el worker lo permita;
- ver resultados y notificaciones.

Evitar:
- render largo como única ruta;
- descarga automática de toda la biblioteca;
- operaciones que bloqueen la interfaz;
- pérdida de edición al pasar a segundo plano.

## 4. Computadora

Prioridades:
- paneles de investigación;
- edición de guion y escenas;
- timeline/storyboard;
- gestión de biblioteca;
- previsualización;
- comparación de versiones;
- supervisión de tareas;
- revisión y descarga de resultados.

La interfaz puede usar más columnas y paneles, pero debe conservar los mismos conceptos y nombres que el móvil.

## 5. Contrato compartido

Cada cliente debe mostrar:
- usuario y sesión;
- proyecto y revisión;
- estado de sync;
- versión de datos;
- estado de jobs;
- resultados disponibles;
- errores recuperables.

Los estados autoritativos de jobs provienen del servidor. El estado local de edición debe mostrarse separado del estado remoto.

## 6. Flujos principales

### Continuar un proyecto en otro dispositivo
1. Guardar cambios localmente.
2. Sincronizar y recibir confirmación.
3. Abrir sesión en el segundo dispositivo.
4. Descargar metadatos y medios necesarios.
5. Mostrar revisión sincronizada.

### Solicitar un render desde móvil
1. Validar que el proyecto esté sincronizado.
2. Crear job con parámetros y versión del proyecto.
3. Backend registra job.
4. Worker lo procesa independientemente.
5. App consulta/recibe estado.
6. Resultado se muestra cuando está listo.

### Trabajo sin conexión
1. Usuario edita proyecto disponible localmente.
2. Cambios quedan pendientes.
3. App muestra estado offline.
4. Al reconectar, sincroniza y resuelve conflictos.
5. No enviar render si la revisión requerida aún no está sincronizada.

## 7. Notificaciones

Notificaciones push o del sistema son opcionales y dependen de plataforma, permisos, infraestructura y cuotas. La app también debe ofrecer un historial de trabajos para que el usuario no dependa de una notificación perdida.

## 8. Pruebas de aceptación

- Crear proyecto en un dispositivo y abrirlo en otro.
- Editar offline y sincronizar después.
- Simular conflicto de dos dispositivos.
- Cerrar la app móvil mientras un worker ficticio/probado continúa.
- Consultar progreso al volver a abrir.
- Verificar que el proyecto y los medios no se descargan todos innecesariamente.
- Probar pantallas pequeñas y grandes.

## 9. Coste US$0/mes

Diseño, pruebas locales y sincronización simulada no requieren infraestructura recurrente. La experiencia multidispositivo real sí necesita backend, almacenamiento y transferencia. El objetivo de cero dólares solo puede mantenerse con límites estrictos, datos de prueba pequeños y tiers gratuitos vigentes.

## 10. Criterio de aceptación

La misma cuenta puede consultar un proyecto sincronizado desde dos dispositivos; las ediciones y estados se distinguen correctamente; los trabajos remotos continúan sin depender de la sesión del cliente.
