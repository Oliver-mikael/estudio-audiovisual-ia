# Fase 6 — Auditoría del estado actual
**Proyecto:** Estudio Audiovisual Inteligente
**Fecha de elaboración:** 30 de octubre de 2026 (base documental disponible)
**Estado:** Documento de análisis; no implica inspección nueva del repositorio.

## 1. Propósito y alcance

Establecer una línea base para planificar la transformación Cloud-First y el rediseño UI/UX sin modificar código, datos locales, configuración de firma ni APK instalado.

Esta auditoría utiliza los informes y resultados del proyecto compartidos hasta la fecha. Las afirmaciones técnicas que proceden de informes de Jules se identifican como **reportadas**, no como verificaciones independientes realizadas durante esta entrega.

## 2. Resumen ejecutivo

El proyecto dispone de una aplicación frontend basada en React 18, TypeScript, Vite y Tailwind CSS, con persistencia local mediante IndexedDB y un motor audiovisual Canvas 2D. También existe una configuración Android basada en Capacitor.

La auditoría Cloud-First previamente compartida concluyó que varias capacidades cloud estaban diseñadas, pero simuladas en el cliente: sesión en `localStorage`, réplica remota simulada y cola de trabajos local basada en `localStorage`/`setTimeout`. Por tanto, no debe describirse el sistema actual como una plataforma cloud operativa ni como un renderizador remoto.

La base local y el APK instalado deben considerarse activos que proteger. La Fase 6 documental no debe alterar ninguno de ellos.

## 3. Línea base conocida

| Área | Estado según la información disponible | Implicación |
|---|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind | Conservar y evaluar antes de sustituir |
| Persistencia | IndexedDB local reportada como operativa | Proteger y respaldar antes de migrar |
| Biblioteca multimedia | Blobs locales en IndexedDB reportados | Diseñar subida reanudable y recuperación |
| Investigación y guion | Módulos funcionales reportados | Preservar estructura y datos |
| Storyboard | Editor de escenas y movimientos reportados | No rehacer sin pruebas de valor |
| Render | Canvas 2D, Web Audio API y MediaRecorder | Mantener como ruta local de respaldo |
| Exportación | WebM 720p/30fps reportado; MP4 depende del navegador | No prometer formato universal |
| Auth | Sesión simulada en `localStorage` según auditoría cloud | No es autenticación real |
| Sync | Cola local y réplica simulada según auditoría cloud | No existe sync multidispositivo confirmado |
| Jobs | `localStorage` y `setTimeout` según auditoría cloud | No son workers persistentes |
| Android | Capacitor configurado; APK debug reportado | Firma y compatibilidad de actualización por verificar |
| Pruebas | 8/8 tests, TypeScript y build reportados en informes | Repetir en cada futura fase de implementación |

## 4. Componentes y rutas mencionados

La auditoría anterior identificó, entre otros:

- `src/services/cloud/api.ts`: sesión simulada.
- `src/services/sync/syncEngine.ts`: cola de mutaciones local.
- `src/services/jobs/jobQueue.ts`: trabajos simulados en almacenamiento local y temporizadores.
- `supabase/schema.sql`: esquema y políticas RLS diseñadas, sin prueba de backend desplegado.
- `capacitor.config.json`: configuración Capacitor apuntando a `dist`.
- `src/data/demoProject.ts`: proyecto de demostración reportado.
- `docs/`: documentación funcional y auditorías.

Estos nombres deben verificarse contra la rama y commit actuales antes de cualquier intervención. No se presupone que los archivos sigan idénticos.

## 5. Riesgos y brechas prioritarias

1. **Falsa expectativa de cloud:** interfaz o etiquetas pueden sugerir tareas remotas que realmente se ejecutan localmente.
2. **Pérdida de datos:** IndexedDB contiene proyectos y medios; migrar sin exportación y reconciliación sería peligroso.
3. **Firma Android:** no se conoce aquí la clave con la que se firmó el APK instalado. Una clave distinta puede impedir la actualización sobre la instalación existente.
4. **Trabajos largos:** `setTimeout` en el cliente no sobrevive de forma fiable al cierre de la app.
5. **Audio:** el uso de Web Speech API no garantiza que la voz sintetizada quede incorporada en la pista exportada.
6. **Pruebas de dispositivo:** compatibilidad teórica Android no equivale a pruebas en el TECNO real.
7. **Coste cloud:** workers, almacenamiento, transferencia y render pueden superar el objetivo gratuito.

## 6. Qué debe conservarse

- Aplicación y flujo local actual.
- IndexedDB y sus datos.
- Motor Canvas 2D y exportación local mientras no exista alternativa comprobada.
- Estructura de proyectos, investigación, guion y storyboard.
- Configuración Capacitor existente.
- APK actualmente instalado y su identidad de paquete.
- Historial Git, ramas y puntos de recuperación.

## 7. Verificaciones obligatorias antes de implementar

- Registrar commit, rama y estado limpio del repositorio.
- Confirmar archivos reales y dependencias.
- Ejecutar build y tests sin cambiar código.
- Determinar dónde están almacenados los datos del usuario y cómo exportarlos.
- Identificar `applicationId`, `versionCode`, `versionName` y método de firma.
- Confirmar si existe keystore de publicación, quién lo controla y si está respaldado de forma segura. Nunca subir secretos al repositorio.
- Probar el APK actual y registrar versión instalada.
- Separar evidencia de escritorio, emulador y dispositivo Android físico.

## 8. Criterios de aceptación de esta auditoría

- Cada capacidad se etiqueta como verificada, reportada, simulada, diseñada o pendiente.
- No se afirma que existe backend cloud operativo sin evidencia.
- Se identifica el mecanismo de protección de datos y APK.
- No se modifica código, base local, firma, APK ni configuración.

**Conclusión:** la estrategia correcta es evolucionar por capas. Primero preservar y comprender la aplicación existente; después diseñar autenticación, almacenamiento, sincronización y workers reales. El estado cloud actual debe tratarse como prototipo/simulación hasta que una integración real se demuestre.
