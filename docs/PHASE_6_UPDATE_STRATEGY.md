# Fase 6 — Estrategia de actualización y preservación del APK

## 1. Objetivo

Reducir la necesidad de descargar manualmente un APK por cada cambio, permitiendo actualizar recursos web cuando sea técnicamente y normativamente válido, sin poner en riesgo la instalación Android existente.

## 2. Distinción esencial

**Actualización web/remota:** HTML, CSS, JavaScript y recursos compatibles que se entregan dentro de los límites de la plataforma y de las políticas de distribución.

**Actualización nativa:** cambios en código Android, plugins, permisos, manifiesto, SDK, bibliotecas nativas o configuración que requieren una nueva compilación y distribución.

No se debe prometer que todo cambio del APK puede actualizarse silenciosamente desde un servidor.

## 3. Alternativas

| Alternativa | Actualización de UI | Requiere APK para cambios nativos | Observaciones |
|---|---|---|---|
| PWA | Automática mediante service worker y caché | No es APK, aunque puede instalarse como PWA | Buena opción web; límites de integración nativa |
| Capacitor con recursos remotos | Posible si se diseña y distribuye conforme a políticas | Sí | Revisar compatibilidad, políticas y mecanismo seguro |
| Capacitor empaquetado | Recursos incluidos en APK; actualización por nueva versión | Sí | Modelo más controlable y predecible |
| Tauri 2 | Depende de updater/plataforma | Para cambios nativos, sí | Evaluar por separado para escritorio y móvil |

## 4. Preservación del APK instalado

Antes de cualquier nueva compilación:
- registrar `applicationId`/package;
- registrar `versionCode` y `versionName`;
- identificar certificado/fingerprint de firma;
- determinar si es APK debug o release;
- identificar si existe keystore estable y respaldado;
- confirmar que la clave privada no está en GitHub;
- guardar una copia del APK actual;
- registrar datos de prueba y comportamiento de actualización.

Una actualización Android normalmente requiere mismo identificador de aplicación y certificado de firma compatible, además de un `versionCode` válido y superior. Si la firma no coincide, la actualización puede fallar y exigir desinstalar; eso puede poner en riesgo datos locales. No recomendar desinstalar.

El APK compartido anteriormente fue descrito como `app-debug.apk`, paquete `com.estudioaudiovisual.app`, aproximadamente 4.1 MB. Esto es información reportada, no inspección independiente del binario. Una firma debug puede no ser una identidad de publicación estable.

## 5. Mecanismo seguro para recursos remotos

Si se aprueba Capacitor con recursos web remotos:
- permitir solo origen HTTPS de confianza;
- validar versión y manifiesto;
- descargar a ubicación temporal;
- verificar integridad/hash;
- activar de forma atómica después de validar;
- mantener versión anterior para rollback;
- no aceptar scripts arbitrarios de terceros;
- no descargar recursos de un origen editable por cualquiera;
- registrar versión activa y resultado;
- tener una política de compatibilidad entre frontend y API;
- mantener una versión local funcional si falla la actualización.

La aplicabilidad de actualizaciones dinámicas depende de las reglas vigentes de la tienda/canal de distribución y del tipo de cambios. Revisar políticas oficiales antes de habilitarlo.

## 6. Estrategia recomendada

1. Mantener el APK instalado sin tocar.
2. Auditar la firma y el método de distribución.
3. Separar configuración nativa estable del frontend web.
4. Diseñar actualización web versionada y con rollback, solo si cumple las reglas aplicables.
5. Reservar nuevas compilaciones para cambios nativos y actualizaciones requeridas.
6. Probar primero en una instalación secundaria con datos ficticios.
7. Solo actualizar la instalación principal tras prueba de actualización in-place y restauración.

## 7. Coste US$0/mes

El diseño y la prueba local pueden realizarse sin coste recurrente. El hosting de recursos puede mantenerse en un tier gratuito si sus condiciones y límites lo permiten. No se debe asumir que un CDN, almacenamiento, dominio, firma, tienda o servicio de distribución será gratuito indefinidamente.

No comprar dominio, activar hosting de pago ni desplegar un updater remoto sin autorización.

## 8. Criterios de aceptación

- Identidad y firma documentadas.
- Ruta de actualización compatible probada en instalación secundaria.
- Rollback comprobado.
- Datos locales preservados.
- Reglas de distribución revisadas.
- APK principal no alterado durante la investigación.
