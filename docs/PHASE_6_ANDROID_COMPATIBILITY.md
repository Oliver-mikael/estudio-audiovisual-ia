# Auditoría de Compatibilidad Android y Responsividad Móvil

## 1. Verificación del Paquete Android Nativo (APK)
- **Archivo principal**: `app-debug.apk`
- **Copia pública servible**: `public/app-debug.apk`
- **Tamaño**: 4,324,598 bytes (~4.1 MB)
- **Hash SHA-256**: `cba367cce76c2613a59220007ea1eb71f5f9cc43fc6a63c47dd4cbfa871c4b0e`
- **Identificador de aplicación Capacitor**: `com.estudioaudiovisual.app`
- **Configuración de plataforma**:
  - `webDir`: `dist`
  - `bundledWebRuntime`: false

### Enlace de Descarga Directa:
La barra superior del encabezado incluye un botón permanente de descarga directa (`APK (4.1 MB)`) apuntando a `/app-debug.apk`, permitiendo la instalación directa en dispositivos Android sin tiendas de aplicaciones de terceros.

---

## 2. Inspección Visual en Emulador / Dispositivo Móvil
Mediante Playwright se evaluó la interfaz en un viewport representativo de teléfonos móviles Android (Google Pixel 7: 412 x 915 px):
- **Barra de Navegación**: Menú desplazable horizontalmente con soporte para gestos táctiles.
- **Zonas Táctiles (Touch Targets)**: Botones con altura y separación superior a 44x44 px, garantizando accesibilidad ergonómica.
- **Monitor de Producción en Tiempo Real**: Adaptación de escala 16:9 con controles táctiles de reproducción y scrubber accesibles.
- **Modal de Respaldo y Asistente IA**: Ventanas modales centradas, con soporte para scroll interno y descarte táctil.

---

## 3. Resiliencia en Entornos Offline y Restringidos
1. **Fallback de Persistencia de Almacenamiento**:
   - Si `navigator.storage.persist` no está disponible o es rechazado por el navegador/WebView, la aplicación continúa funcionando en modo `Estándar` sin lanzar excepciones no controladas.
2. **Uso de Memoria en Exportación/Importación**:
   - La conversión a Base64 y la validación de paquetes `.eai` procesa activos en fragmentos eficientes, evitando desbordamientos de heap en dispositivos de gama media y baja.
3. **Renderizado Audiovisual en Navegador**:
   - La previsualización de escenas y transiciones utiliza tecnologías de Canvas y AudioContext compatibles con Android Chrome y WebView nativo.
