# FASE 7D: MANUAL Y MATRIZ DE COMPATIBILIDAD CON ANDROID MÓVIL

## 1. Permisos y Acceso al Hardware de Micrófono
- En Android Chrome / Firefox: Se utiliza la API estándar `navigator.mediaDevices.getUserMedia({ audio: true })` con cuadro de diálogo nativo de permisos.
- En Capacitor / APK Nativo: La aplicación solicita automáticamente `android.permission.RECORD_AUDIO` y `android.permission.MODIFY_AUDIO_SETTINGS`.

## 2. Suspensión de AudioContext y Gestión de Energía
- Los navegadores móviles en Android suspenden de forma agresiva cualquier `AudioContext` que no haya sido iniciado tras una interacción táctil del usuario.
- `AudioEngine.initContext()` implementa la reanudación segura (`audioCtx.resume()`) dentro del evento `onClick` del botón de reproducción y grabación.

## 3. Limitaciones de Memoria en Dispositivos de Gama Baja
- Para pistas de larga duración (> 15 minutos), los buffers de audio en memoria se reciclan y limpian tras la detención.
- La persistencia duradera se apoya en IndexedDB y OPFS para evitar saturación de la RAM del dispositivo Android.
