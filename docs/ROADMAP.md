# Roadmap de Desarrollo (documento histórico)

> Este roadmap describía las fases iniciales de 2025 y ya no refleja el estado del proyecto. El roadmap
> vigente, priorizado por lo que falta de verdad, está en [../ROADMAP.md](../ROADMAP.md).

# Roadmap original - Estudio Audiovisual Inteligente

## Fase 1: Inspección, Protección y Documentación Base
- [x] Crear `.gitignore` seguro para evitar subir claves y dependencias.
- [x] Establecer documentos de arquitectura, roadmap, status y changelog en `/docs`.
- [x] Actualizar `README.md` general.

## Fase 2: Configuración del Proyecto y Estructura Modular
- [ ] Configuración de Vite, React, TypeScript y Tailwind CSS.
- [ ] Estructura modular de carpetas en `src/modules/`.
- [ ] Sistema de estado global y persistencia en IndexedDB (`src/services/storage/`).

## Fase 3: Demostración Real del Motor Audiovisual y Exportación
- [ ] Motor de renderizado en HTML5 Canvas con soporte para imágenes, textos kinéticos y voz en off.
- [ ] Sistema de línea de tiempo e hilos de audio sincronizados.
- [ ] Exportador de video en cliente mediante MediaRecorder/Canvas stream (720p 30fps).
- [ ] Interfaz de previsualización con controles de reproducción.

## Fase 4: Módulos Inteligentes de Creación
- [ ] Módulo Laboratorio de Ideas (generador de enfoques y cuestionamiento crítico).
- [ ] Módulo de Investigación (registro de fuentes, hechos, hipótesis y licencias).
- [ ] Módulo Taller de Guion (editor interactivo, análisis de ritmo y división en escenas).
- [ ] Módulo Storyboard & Dirección Audiovisual.
- [ ] Módulo Biblioteca Multimedia (subida de recursos, previsualización, licencias).

## Fase 5: Validación Integral y Pruebas Automáticas
- [ ] Pruebas unitarias para cálculo de tiempos y parsers de guion.
- [ ] Verificación de exportación local sin fugas de memoria.
- [ ] Documentación final y guía de usuario.
