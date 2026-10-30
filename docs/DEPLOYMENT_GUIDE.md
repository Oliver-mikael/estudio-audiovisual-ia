# GUÍA DE DESPLIEGUE E INFRAESTRUCTURA
## ESTUDIO AUDIOVISUAL INTELIGENTE

**Versión:** 1.0.0
**Fecha de Actualización:** 30 de Octubre de 2026

---

## 1. INFRAESTRUCTURA Y ENTORNOS DE DESPLIEGUE

Para garantizar una operación eficiente y de bajo costo, la infraestructura del **Estudio Audiovisual Inteligente** se organiza en 4 entornos diferenciados:

| Componente | Entorno / Tecnología | Función Principal |
| :--- | :--- | :--- |
| **1. Entorno Dev Cloud** | Workspace en Sandbox | Compilación, ejecución de tests unitarios y generación de artefactos. |
| **2. App Multiplataforma** | Capacitor (Android) / Tauri (Desktop) | Interfaz de control, edición de guiones, previsualización local y monitoreo. |
| **3. Backend & Database** | Supabase (PostgreSQL + Auth + Storage) | Gestión de identidades, almacenamiento de proyectos y repositorio de archivos multimedia. |
| **4. Cloud Workers** | Node.js Worker / Docker / Cloud Run | Procesamiento asíncrono de colas de renderizado de video (FFmpeg/Remotion) e IA. |

---

## 2. INSTRUCCIONES DE COMPILACIÓN MULTIPLATAFORMA

### A. Compilación Web / PWA
```bash
# Instalación de dependencias
npm install

# Verificación de tipos TypeScript
npx tsc --noEmit

# Ejecución de pruebas unitarias
npm test

# Compilación de producción Web
npm run build
```

### B. Compilación para Android (Capacitor)
```bash
# Sincronizar compilación Web con el proyecto nativo Android
npx cap sync android

# Abrir el proyecto en Android Studio para generar el APK/AAB
npx cap open android
```

---

## 3. VARIABLES DE ENTORNO REQUERIDAS

```env
# Configuración del Cliente Frontend
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Configuración del Backend Cloud & Workers (Público/Privado separado)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Solo en servidores/workers
RENDER_WORKER_CONCURRENCY=2
MAX_RENDER_DURATION_SECONDS=600
```
