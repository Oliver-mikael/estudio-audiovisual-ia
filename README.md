# Estudio Audiovisual Inteligente

Un estudio audiovisual personal autónomo asistido por inteligencia artificial para la investigación, creación narrativa, guionización, storyboard, biblioteca de medios, renderizado y exportación de videos profesionales.

## 🚀 Características Principales

- **Laboratorio de Ideas & Investigación**: Formulación de ángulos narrativos originales, separación entre evidencia e hipótesis y registro de fuentes con licencias y procedencia.
- **Taller de Guion**: Edición de guiones con análisis crítico automático de tono, ritmo, muletillas y ganchos narrativos.
- **Dirección Audiovisual & Storyboard**: Desglose automático de escenas con asignación de intención narrativa, tipo de plano, movimiento de cámara y composición visual.
- **Biblioteca Multimedia**: Gestión de recursos de imágenes, audio y video con metadatos de procedencia y licencias. Sustitución no destructiva.
- **Motor de Renderizado Audiovisual (Client-side)**: Reproductor de línea de tiempo multi-escena con tipografía cinética animada, imágenes, voz en off y transiciones en tiempo real.
- **Exportador de Video Local**: Renderizado de alta definición (720p/1080p @ 30fps) a WebM/MP4 utilizando capacidades nativas del navegador, 100% offline y sin costes de API.

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Build Tool**: Vite
- **Almacenamiento Local**: IndexedDB / LocalStorage
- **Render & Export**: HTML5 Canvas, Web Audio API, MediaRecorder / WebM Encoder
- **Testing**: Vitest

## 📋 Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0

## 🔧 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar pruebas
npm test
```

## 📄 Licencia y Uso

Proyecto diseñado para uso personal e investigación. Todas las dependencias utilizadas son de código abierto permisivo (MIT/Apache 2.0).
