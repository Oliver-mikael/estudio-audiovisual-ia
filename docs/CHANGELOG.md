# Registro de Cambios - Estudio Audiovisual Inteligente

## [1.1.0] - Prueba Real de Producción Audiovisual de 60s
### Añadido
- **Prueba Real de Producción de 60s**: Proyecto de producción completo con 6 escenas de 10s sobre soberanía digital y procesamiento local (`src/data/demoProject.ts`).
- **Colección de Recursos Vectoriales CC0**: Diagramas vectoriales SVG Data URIs con procedencia de licencia libre (`src/data/assets.ts`).
- **Mejora del Motor de Audio en Exportación**: Integración de tono ambiental sintético en `MediaStreamDestination` de Web Audio API para asegurar la presencia de pista de audio constante en contenedores WebM/MP4 (`src/engine/exporter.ts`).
- **Informe de Producción Audiovisual**: Documentación detallada en `docs/PRODUCTION_TEST.md`.
- **Pruebas de Unidad Actualizadas**: Cobertura de tests para el proyecto de 60s (1800 fotogramas calculados) en `src/__tests__/`.
