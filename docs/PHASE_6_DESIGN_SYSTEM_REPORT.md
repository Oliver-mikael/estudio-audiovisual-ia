# SISTEMA DE DISEÑO CONSOLIDADO Y DIRECTRICES VISUALES
## Estudio Audiovisual Inteligente — Fase 6B+

**Fecha:** 31 de Octubre de 2026
**Tokens:** Tailwind CSS v3 / Modo Oscuro Primario + Modo Claro Integrado

---

## 1. Tokens de Color y Tematización

- **Fondo Base (Dark):** `bg-slate-950` (#020617) / `bg-slate-900` (#0f172a)
- **Fondo Base (Light):** `bg-slate-50` (#f8fafc) / `bg-white` (#ffffff)
- **Bordes y Delimitadores:** `border-slate-800` (Dark) / `border-slate-200` (Light)
- **Acentos Primarios (Audiovisual & Estudio):** `indigo-600` (#4f46e5), `indigo-500` (#6366f1), `indigo-400` (#818cf8)
- **Acentos de Estado:**
  - *Éxito / Verificado:* `emerald-500` / `emerald-400`
  - *Atención / Hipótesis / Cuota:* `amber-500` / `amber-400`
  - *Peligro / Destructivo:* `rose-500` / `rose-400`
  - *Inteligencia Artificial:* `purple-500` / `purple-400` con `indigo-500`

---

## 2. Tipografía y Jerarquía

- **Títulos de Módulo:** `text-lg md:text-xl font-bold tracking-tight text-slate-100`
- **Subtítulos y Metadatos:** `text-xs md:text-sm text-slate-400 font-medium`
- **Etiquetas de Código y Telemetría:** `font-mono text-xs uppercase tracking-wider`
- **Locución y Diálogos:** `text-sm text-slate-200 leading-relaxed font-sans`

---

## 3. Componentes Estandarizados

1. **Botones de Acción:**
   - *Primario Estudio:* `px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]`
   - *Secundario / Outline:* `px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors`
   - *Acción de IA:* `px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center gap-1.5`

2. **Paneles Contenedores:**
   - `bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg`

3. **Insignias (Badges):**
   - `px-2 py-0.5 rounded text-[11px] font-mono border font-medium`
