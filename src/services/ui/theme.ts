// Simple, accessible theme manager supporting 'light' | 'dark' | 'auto'
// Persists selection in localStorage and synchronizes with documentElement class and OS preferences

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'estudio_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved;
    }
  }
  return 'dark'; // Dark mode by default for video production suites
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}

export function initTheme(): ThemeMode {
  const current = getStoredTheme();
  applyTheme(current);

  // Listen to OS theme changes if on auto
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const saved = getStoredTheme();
      if (saved === 'auto') {
        applyTheme('auto');
      }
    });
  }

  return current;
}
