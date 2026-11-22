# Estado del proyecto (documento sustituido)

Este archivo describía el proyecto como «🟢 Operativo» en módulos que en realidad eran diseño o
simuladores locales. El estado real y verificado está ahora en [../PROJECT_STATUS.md](../PROJECT_STATUS.md).

Resumen: el flujo local (proyectos en IndexedDB, escenas, imágenes, narración importada y exportación WebM
con WebCodecs) está implementado y probado en Chromium. La IA real, la nube, la sincronización, el
multiusuario y el build de Android **no** existen o no están verificados. El código de nube simulado
(`cloudApi`, `syncEngine`, `jobQueueManager`) fue eliminado del repositorio.

Los informes de auditoría de `docs/` (`CLOUD_INTEGRATION_AUDIT.md`, `CLOUD_ARCHITECTURE.md`,
`STORAGE_AND_SYNC.md`, `CLOUD_RENDERING.md`) se conservan como documentación histórica de diseño.
