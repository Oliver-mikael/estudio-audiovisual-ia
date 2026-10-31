# Estrategia y Registro de Pruebas - Estudio Audiovisual Inteligente

## Enfoque de Pruebas

El proyecto implementa pruebas continuas en tres niveles:

1. **Pruebas Unitarias**: Para lógica pura de dominio (cálculo de duraciones, transformadores de guion a escenas, generadores de tiempo de subtítulos).
2. **Pruebas de Componentes**: Verificación de la renderización de la interfaz de usuario.
3. **Pruebas de Integración y Render**: Verificación del motor de reproducción en canvas y generación de blobs de video en el navegador.

## Historial de Pruebas

| Fecha | Entorno | Tipo | Descripción | Resultado |
| :--- | :--- | :--- | :--- | :--- |
| Inicial | Dev | Configuración | Estructura base de documentación | 🟢 Pasó |
| 2026-10-31 | Vitest | Unitarias & Integración | 33 pruebas en 7 suites (Storage, Core, Backup, AI Engine, integrationEAI, aiRestoredFlow) | 🟢 33/33 Pasó |
| 2026-10-31 | TypeScript | Tipado estático | `npx tsc --noEmit` sin advertencias | 🟢 Pasó |
| 2026-10-31 | Playwright | Visual / Responsividad | Auditoría Pixel 7 móvil y 1366x768 desktop | 🟢 Pasó |
| 2026-10-31 | SHA-256 | Integridad Binario APK | Verificación de hash `cba367c...` en `app-debug.apk` | 🟢 Intacto |

## Procedimiento de Verificación de Exportación de Video
Para comprobar que un video generado es válido:
1. Crear proyecto con al menos 2 escenas e imágenes/audio.
2. Hacer clic en "Exportar Video".
3. Verificar la barra de progreso de renderizado.
4. Descargar el archivo `.webm` o `.mp4` resultante.
5. Reproducir localmente en VLC / Reproductor del sistema para confirmar la velocidad de frames (30 FPS), fluidez de animación y sincronización de audio.
