# Fase 6 — Hoja de ruta maestra y decisión arquitectónica

## 1. Resumen ejecutivo

La recomendación es transformar el proyecto por etapas y mantener una ruta local funcional. El objetivo de US$0/mes es razonable para investigación, documentación, prototipos locales y pruebas limitadas. No debe interpretarse como garantía de un servicio cloud de producción con almacenamiento y render ilimitados.

La aplicación actualmente conocida tiene persistencia local y motor Canvas 2D. Los componentes cloud descritos en la auditoría previa son simulados o no desplegados. La primera tarea de implementación no es “activar todo cloud”: es asegurar datos, firma Android, contratos y pruebas.

## 2. Decisión arquitectónica provisional

**Cliente:** React/Vite existente, con Capacitor para Android mientras siga siendo compatible.
**Persistencia local:** IndexedDB se conserva como caché y modo offline.
**Backend:** evaluar Supabase como candidato inicial para Auth/PostgreSQL/Storage, sujeto a verificación de cuotas y límites gratuitos actuales.
**API:** capa server-side para permisos, creación de jobs y URLs firmadas.
**Jobs:** cola persistente y worker separado; no `setTimeout` en el cliente.
**Medios:** object storage privado con cargas controladas.
**Render:** conservar Canvas local; evaluar FFmpeg/worker remoto con prueba pequeña.
**UI:** sistema de diseño centralizado, piloto de Inicio, luego expansión aprobada.
**Updates:** separar recursos web de componentes nativos; no cambiar APK hasta verificar firma.

## 3. Matriz de alternativas

| Decisión | Opción preferida provisional | Alternativa | Motivo |
|---|---|---|---|
| UI | Mantener React/Vite | Reescritura | Menor riesgo y reutilización |
| Android | Capacitor existente | Tauri/React Native | Evitar migración sin beneficio medido |
| Auth/DB | Supabase candidato | Backend propio | Reduce trabajo inicial |
| Archivos | Storage privado | Servidor propio | Separación de binarios y metadatos |
| Jobs | Cola + worker independiente | Funciones serverless cortas | Render requiere proceso separado |
| Sync | Outbox + revisiones | Sync genérico “last write wins” | Mejor control de conflictos |
| Render | Canvas local + worker experimental | Reemplazo inmediato | Mantiene respaldo funcional |
| Updates | Recursos web versionados, si permitido | APK por cada cambio | Menor fricción sin prometer cambios nativos remotos |

## 4. Presupuesto y escenarios

### Escenario A — US$0/mes (objetivo inicial)

Incluye:
- desarrollo e investigación local;
- documentación;
- pruebas con datos ficticios;
- IndexedDB local;
- prototipos de API/worker;
- pruebas de UI y build;
- uso limitado de tiers gratuitos solo después de verificar condiciones.

No incluye garantía de:
- almacenamiento remoto permanente;
- backups gestionados;
- transferencia ilimitada;
- workers de render;
- alta disponibilidad;
- dominio propio;
- notificaciones push a escala.

### Escenario B — económico

Activar únicamente servicios que resuelvan una necesidad demostrada: backend gestionado, almacenamiento y worker bajo demanda. El coste real depende de uso, región, transferencia, CPU/RAM, retención y cuotas. No se asigna una cifra inventada; obtener cotizaciones/calculadoras oficiales antes de habilitar facturación.

### Escenario C — escalable

Separar base de datos, object storage, cola y workers con observabilidad, backups y límites. Presupuestar por usuario activo, GB almacenados, GB transferidos y minutos de render. Requiere autorización explícita y previsión de gasto.

## 5. Política de coste

Antes de desplegar cualquier servicio:
1. verificar plan y precio oficial vigente;
2. identificar qué pasa al agotar cuota;
3. comprobar si existe suspensión automática o cobro por exceso;
4. fijar presupuesto máximo;
5. establecer alertas y límites;
6. probar apagado/eliminación;
7. solicitar aprobación del propietario.

No introducir tarjeta de pago ni habilitar facturación por defecto.

## 6. Orden de implementación recomendado

### Fase 6A — Protección y línea base
- congelar referencia Git;
- exportar datos locales;
- respaldar APK actual;
- verificar firma;
- pruebas base de build y funcionalidad.

**Puerta de aprobación:** datos y APK protegidos.

### Fase 6B — UI/UX piloto
- inventario de componentes;
- tokens y temas;
- Inicio móvil/escritorio;
- pruebas responsive y accesibilidad.

**Puerta:** aprobación visual antes de extender el rediseño.

### Fase 6C — Autenticación real
- proveedor elegido;
- login/registro/recuperación;
- RLS y pruebas de aislamiento;
- sesiones y cierre seguro.

**Puerta:** pruebas de seguridad superadas.

### Fase 6D — Persistencia y almacenamiento cloud
- modelo de datos;
- storage privado;
- upload/download;
- migración piloto con copias;
- restauración.

**Puerta:** recuperación verificada antes de migrar proyectos reales.

### Fase 6E — Sincronización
- outbox;
- revisiones;
- conflictos;
- modo offline;
- pruebas en dos dispositivos.

**Puerta:** ningún cambio se pierde en pruebas de desconexión/conflicto.

### Fase 6F — Cola y workers
- jobs durables;
- worker independiente;
- estados y logs;
- límites y reintentos;
- prueba de continuidad al cerrar app.

**Puerta:** job termina y se recupera desde otro dispositivo.

### Fase 6G — Actualizaciones
- confirmar firma;
- probar recursos web versionados;
- rollback;
- probar actualización in-place en dispositivo secundario.

**Puerta:** no actualizar APK principal hasta prueba satisfactoria.

### Fase 6H — Motor audiovisual
- comparar calidad y coste;
- validar audio;
- prototipo remoto;
- decisión de integración.

**Puerta:** demostrar ventaja técnica y económica.

### Fase 6I — Pruebas integrales
- seguridad;
- pérdida de red;
- restauración;
- Android físico;
- escritorio;
- exportación audiovisual;
- actualización y rollback.

## 7. Matriz de riesgos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Pérdida de IndexedDB | Crítica | Exportación, backup y restauración antes de migrar |
| Firma APK incompatible | Crítica | Identificar certificado y probar actualización secundaria |
| Falsa sincronización | Alta | Confirmación server-side y estados explícitos |
| Worker no persistente | Alta | Cola duradera y proceso independiente |
| Acceso cruzado a proyectos | Crítica | RLS, pruebas negativas y permisos mínimos |
| Coste inesperado | Alta | Cuotas, alertas, presupuesto y desactivación |
| Vendor lock-in | Media | Exportación y formatos abiertos |
| Render móvil inestable | Alta | Worker remoto; mantener fallback local |
| Update remoto inseguro | Alta | HTTPS, hashes, rollback y revisión de políticas |
| Audio ausente/desincronizado | Alta | Prueba de reproducción del archivo final |

## 8. Métricas de éxito

- 0 pérdida de proyectos durante migración de prueba.
- 100% de operaciones de sync confirmadas o presentadas como pendientes/error.
- 0 acceso cruzado en pruebas de seguridad.
- Un job de prueba termina con app cerrada.
- Proyecto visible desde dos dispositivos.
- APK instalado permanece intacto durante investigación.
- Actualización secundaria probada con firma compatible y rollback.
- Archivo audiovisual final contiene pistas de audio/video verificadas.
- Coste mensual real no supera el presupuesto autorizado.

## 9. Decisiones pendientes del propietario

1. Autorizar proveedor cloud y, si aplica, creación de cuenta.
2. Autorizar cualquier gasto y fijar tope.
3. Elegir si la app de escritorio será web instalable, Tauri u otra opción.
4. Aprobar el diseño visual piloto.
5. Decidir política de retención y backup.
6. Aprobar cualquier cambio de distribución Android.
7. Aprobar uso de servicios externos de IA/render.

## 10. Qué no implementar todavía

- No reemplazar Canvas 2D.
- No migrar ni borrar IndexedDB.
- No activar workers 24/7.
- No incorporar todas las herramientas audiovisuales.
- No implementar updater remoto antes de verificar firma y políticas.
- No desplegar con datos reales antes de probar RLS y recuperación.
- No convertir una simulación en una etiqueta de “cloud activo”.

## 11. Decisión final

La ruta más prudente es **preservar el producto local, aprobar un rediseño UI/UX piloto, después construir autenticación y persistencia cloud, y solo entonces sincronización y workers remotos**. Las actualizaciones web y el procesamiento audiovisual deben tratarse como líneas técnicas independientes.

**Estado:** investigación y arquitectura propuestas; implementación pendiente de aprobación explícita.
