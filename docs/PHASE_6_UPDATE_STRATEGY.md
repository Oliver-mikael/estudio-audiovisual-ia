# ENTREGABLE 4 — INVESTIGACIÓN DE ACTUALIZACIONES AUTOMÁTICAS
## Estudio Audiovisual Inteligente

**Fecha:** Octubre de 2026
**Documento:** `docs/PHASE_6_UPDATE_STRATEGY.md`
**Fase:** Fase 6 — Estrategia de Actualización Continua sin Reinstalación de APK
**Propósito:** Definir el mecanismo técnico para distribuir mejoras de interfaz y lógica de negocio directamente desde la nube, cumpliendo las directivas de Google Play y preservando la firma digital del instalador.

---

## 1. EL DILEMA DEL APK MANUAL VS. ACTUALIZACIÓN TRANSPARENTE

El usuario no debe estar obligado a descargar e instalar manualmente un nuevo APK cada vez que se publica una corrección o una nueva funcionalidad.

Se evaluaron cuatro alternativas para actualizar la aplicación:

| Mecanismo de Actualización | ¿Requiere Descarga de APK? | ¿Interrumpe al Usuario? | ¿Cumple Políticas de Google Play? | Complejidad Técnica |
| :--- | :---: | :---: | :---: | :---: |
| **A. PWA (Progressive Web App)** | **Nunca** | No (actualización silenciosa vía Service Worker al recargar) | 100% conforme | Mínima |
| **B. Capacitor con Live Updates (Capgo)** | **No** (para cambios web/JS/CSS) | No (descarga en segundo plano y se activa al reiniciar) | **100% conforme** (siempre que no descargue código nativo binario) | Baja |
| **C. Compilación Tradicional de APK** | **Siempre** | Sí (descargar, autorizar orígenes desconocidos, reinstalar) | Conforme | Alta / Manual |
| **D. Tauri 2 (Desktop)** | **No** (usa autoupdater binario integrado) | Mínima (solicita reiniciar app) | N/A (Distribución directa / Stores) | Media |

---

## 2. QUÉ PUEDE ACTUALIZARSE DESDE LA NUBE Y QUÉ REQUIERE NUEVO APK

Es fundamental delimitar taxativamente el alcance técnico de las actualizaciones remotas:

### Categoría 1: Actualizable 100% desde la Nube (Sin Tocar el APK)
- **Interfaz de Usuario (UI/UX):** Nuevos estilos CSS, temas claro/oscuro, rediseño de tarjetas, botones compactos y barras de navegación adaptativas.
- **Lógica de Negocio en TypeScript:** Algoritmos de crítica de guion, parsers de texto, cálculo de duraciones, validación de fuentes bibliográficas.
- **Motor Audiovisual Web:** Modificaciones en `renderEngine.ts` (nuevas transiciones, efectos cinéticos de texto, mejoras de rendimiento Canvas 2D).
- **Controladores de Sincronización:** Actualizaciones en `syncEngine.ts`, clientes de API y llamadas a Supabase.
- **Plantillas y Recursos:** Nuevos assets SVG, iconos y datos del documental.

### Categoría 2: Requiere Compilación y Reinstalación de APK
- **Plugins Nativos de Android:** Si se agrega una nueva librería Java/Kotlin que no estaba en el APK (por ejemplo, un plugin nativo de Bluetooth o cámara avanzada).
- **Permisos del Manifiesto Android:** Si se solicitan nuevos permisos en `AndroidManifest.xml` (por ejemplo, permiso de grabación en segundo plano `FOREGROUND_SERVICE_MEDIA_PROCESSING`).
- **Configuración Base de Capacitor:** Modificaciones en `capacitor.config.json` que alteren el `appId` o el esquema nativo de la app.

---

## 3. CUMPLIMIENTO ESTRICTO DE POLÍTICAS DE GOOGLE PLAY Y SEGURIDAD

### Directiva Oficial de Google Play (Sección de Código Malicioso y Ejecutable):
> *"Una aplicación distribuida a través de Google Play no puede modificar, reemplazar ni actualizar su propio código binario utilizando ningún método que no sea el mecanismo de actualización de Google Play. No obstante, se permite la ejecución de código interpretado (como JavaScript) siempre que no infrinja las políticas del programa ni modifique de forma engañosa el propósito principal de la aplicación."*

### Garantías de Seguridad Implementadas:
1. **Firma Criptográfica de Bundles Web:** Cada archivo `.zip` de actualización web se firma con una clave privada (RSA/ECDSA). La app Capacitor verifica la firma antes de descomprimir el bundle en el almacenamiento local. Si la firma no coincide, el paquete se descarta inmediatamente.
2. **Rollback Automático en Caso de Pantalla Blanca:**
   - La aplicación incorpora un temporizador de arranque seguro (*Health Check*): Si tras aplicar una actualización la pantalla no dispara el evento `DOMContentLoaded` y el renderizado en menos de 5 segundos, la app revierte automáticamente al bundle de fábrica empaquetado originalmente en el APK.
3. **Preservación de la Identidad Android (`keystore`):**
   - El archivo de almacén de claves (*keystore*) y los alias de firma de depuración/producción se mantienen inalterados.
   - El `versionCode` entero de Android solo se incrementará cuando sea estrictamente obligatorio recompilar el contenedor nativo.

---

## 4. ESTRATEGIA DE DISTRIBUCIÓN RECOMENDADA (MODELO DUAL)

1. **Para Celular (Android):**
   - El usuario conserva su instalación actual del APK de 4.1 MB.
   - Se integra la librería de actualización remota abierta (**Capgo** o endpoint propio en Supabase Storage).
   - Al iniciar la app, comprueba silenciosamente:
     ```json
     GET /api/v1/app-versions/latest
     { "version": "1.1.0", "url": "https://storage.estudio.cloud/updates/v1.1.0.zip", "checksum": "sha256:..." }
     ```
   - Si hay una versión más reciente, la descarga en segundo plano y la deja lista para la próxima vez que el usuario abra la aplicación.
2. **Para Computadora / Web:**
   - Se sirve directamente como **PWA instalable**. El navegador actualiza el Service Worker y el bundle Vite al instante tras cada despliegue en Vercel/Cloudflare.
