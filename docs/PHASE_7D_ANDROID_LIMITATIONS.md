# LIMITACIONES FÍSICAS DE AUDIO EN DISPOSITIVOS ANDROID (FASE 7D)

## 1. Permisos de Hardware y Políticas de Sistema Operativo
- **Permiso de Micrófono en Tiempo de Ejecución**: En Android 11+ (API 30+), el permiso `RECORD_AUDIO` requiere consentimiento explícito del usuario. Si el usuario selecciona "Solo esta vez", el estado del permiso puede revocarse si la app pasa a segundo plano.
- **Acceso en Navegador vs. WebView**: En navegadores Android (Chrome, Firefox), el diálogo de permisos es manejado por el navegador. En el APK nativo (Capacitor), debe asegurarse que el WebView reciba la autorización de la actividad nativa a través del WebChromeClient (`onPermissionRequest`).

## 2. Gestión de Energía y Suspensión de AudioContext
- **Autoplay / AudioContext Suspension**: Android suspende agresivamente cualquier instancia de `AudioContext` que no haya sido originada directamente por un toque de usuario (`touchstart` o `click`). En `AudioEngine.initContext()`, se debe invocar `resume()` tras la interacción táctil.
- **Doze Mode y Ahorro de Batería**: Durante exportaciones de video prolongadas en segundo plano o si la pantalla se apaga, el temporizador del navegador (`setInterval` / `requestAnimationFrame`) puede ralentizarse drásticamente o ser pausado por el sistema operativo, lo que requerirá activar un WakeLock (`navigator.wakeLock.request('screen')`) en fases futuras.

## 3. Latencia Acústica y Variabilidad de Hardware
- **Latencia de Entrada (Input Latency)**: Los dispositivos Android de gama media/baja pueden presentar retardos de entre 30 ms y 120 ms en la captura de audio por micrófono bluetooth o altavoz integrado.
- **Supresión de Eco y Ruido de Fondo**: La captura nativa por `getUserMedia` depende de los filtros DSP integrados en el SoC del fabricante móvil (Qualcomm, MediaTek, Exynos).

## 4. Cuota y Límites de Almacenamiento en Memoria RAM
- **Decodificación de Buffers en Memoria**: Dispositivos Android con 3 GB o menos de RAM pueden sufrir presión de memoria (`OutOfMemoryError`) si se cargan múltiples pistas de audio de más de 10 minutos sin fragmentar. Por ello, la Fase 7D utiliza almacenamiento temporal en IndexedDB y recicla los buffers activos al detener la reproducción.
