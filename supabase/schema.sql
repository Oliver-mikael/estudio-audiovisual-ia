-- ESTUDIO AUDIOVISUAL INTELIGENTE - BACKEND SCHEMA (SUPABASE / POSTGRESQL)
-- Esquema completo para proyectos, autenticación, escenas, investigaciones, recursos y trabajos cloud.

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE PROYECTOS (projects)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{"fps": 30, "resolution": {"width": 1280, "height": 720}, "aspectRatio": "16:9"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security en Projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proyectos privados por usuario - SELECT"
  ON public.projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Proyectos privados por usuario - INSERT"
  ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Proyectos privados por usuario - UPDATE"
  ON public.projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Proyectos privados por usuario - DELETE"
  ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- 2. TABLA DE ENFOQUES NARRATIVOS (narrative_angles)
CREATE TABLE IF NOT EXISTS public.narrative_angles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hook TEXT NOT NULL,
  perspective TEXT NOT NULL,
  critical_questions JSONB DEFAULT '[]'::jsonb,
  alternative_approach TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.narrative_angles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enfoques privados por usuario - ALL"
  ON public.narrative_angles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = narrative_angles.project_id AND projects.user_id = auth.uid()));

-- 3. TABLA DE FUENTES E INVESTIGACIÓN (source_references)
CREATE TABLE IF NOT EXISTS public.source_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  author TEXT,
  license TEXT NOT NULL DEFAULT 'Public Domain',
  evidence_type TEXT NOT NULL DEFAULT 'Fact',
  notes TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.source_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fuentes privadas por usuario - ALL"
  ON public.source_references FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = source_references.project_id AND projects.user_id = auth.uid()));

-- 4. TABLA DE GUIONES Y ESCENAS (scenes)
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_order INT NOT NULL,
  title TEXT NOT NULL,
  narration_text TEXT NOT NULL,
  visual_intent TEXT NOT NULL,
  camera_motion TEXT NOT NULL DEFAULT 'Zoom In',
  transition TEXT NOT NULL DEFAULT 'Fade',
  duration_seconds INT NOT NULL DEFAULT 15,
  image_url TEXT,
  audio_url TEXT,
  subtitles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escenas privadas por usuario - ALL"
  ON public.scenes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()));

-- 5. TABLA DE TRABAJOS CLOUD (cloud_jobs)
CREATE TABLE IF NOT EXISTS public.cloud_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'RENDER_VIDEO', 'RESEARCH_AI', 'SCRIPT_FEEDBACK'
  status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
  progress_percent INT DEFAULT 0,
  payload JSONB NOT NULL,
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cloud_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trabajos cloud privados por usuario - ALL"
  ON public.cloud_jobs FOR ALL USING (auth.uid() = user_id);
