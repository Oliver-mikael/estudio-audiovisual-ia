# MODELO DE SEGURIDAD Y AISLAMIENTO
## ESTUDIO AUDIOVISUAL INTELIGENTE

**Versión:** 1.0.0
**Fecha de Actualización:** 30 de Octubre de 2026

---

## 1. PRINCIPIOS DE SEGURIDAD

1. **Principio de Permisos Mínimos:** Ningún componente o servicio tiene más privilegios de los estrictamente necesarios para su función.
2. **Cero Secretos en el Frontend:** Las credenciales administrativas (Service Role Keys, AWS Secret Keys, API Keys de IA) residen únicamente en variables de entorno seguras en los servicios del Backend Cloud y Workers.
3. **Aisle por Usuario (Row Level Security):** La base de datos relacional aplica políticas RLS en PostgreSQL, garantizando que un usuario no pueda leer ni modificar datos o archivos de otro usuario.
4. **Validación de Entradas y Tareas:** Todas las peticiones HTTP y definiciones de escena/guion son validadas con esquemas estrictos (Zod / TypeScript) antes de enviarse a la cola de trabajos.

---

## 2. ARQUITECTURA DE AUTENTICACIÓN Y AUTORIZACIÓN

### A. Flujo de Identidad (JWT Tokens)
- El usuario se autentica con Correo + Contraseña mediante `Supabase Auth`.
- El cliente almacena en forma segura el `access_token` (JWT corta duración, 1 hora) y el `refresh_token` (almacenado de forma segura en `Capacitor Secure Storage` en móvil o `Tauri Store` en escritorio).
- Todas las llamadas a las API Gateway o Supabase REST incluyen el encabezado `Authorization: Bearer <token>`.

### B. Políticas de Seguridad RLS en PostgreSQL

```sql
-- Ejemplo de RLS para la tabla de Proyectos
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios solo ven sus propios proyectos"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo crean proyectos propios"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo actualizan proyectos propios"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios solo eliminan proyectos propios"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 3. AISLAMIENTO DE TAREAS Y WORKERS DE RENDERIZADO

Los trabajadores cloud (*Cloud Workers*) encargados del renderizado audiovisual y análisis de IA ejecutan procesos potencialmente intensivos:

1. **Entorno Contenerizado Aislado:** Cada tarea de renderizado de video o procesamiento pesado se ejecuta dentro de un contenedor Docker / MicroVM con recursos limitados (máximo 2 vCPU, 4 GB RAM, 10 GB espacio temporal).
2. **Acceso Limitado al Almacenamiento:** El worker no tiene acceso directo a la base de datos completa. Recibe un token temporal de solo lectura para descargar los recursos multimedia específicos de la escena y un URL firmado (*Signed Upload URL*) exclusivo para subir el video final renderizado.
3. **Limpieza Automática:** Tras completar o fallar la tarea, el sistema de archivos temporal del worker se destruye automáticamente.
