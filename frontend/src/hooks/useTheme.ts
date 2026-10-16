import { useCallback, useEffect, useRef, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'vantora-theme';

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): ResolvedTheme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

export function useTheme(defaultTheme: ThemePreference) {
  const [theme, setTheme] = useState<ResolvedTheme>(() => readStored() ?? resolve(defaultTheme));
  const isFirstRun = useRef(true);

  // When the default changes (e.g. from the Controls panel), it takes over.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setTheme(resolve(defaultTheme));
  }, [defaultTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {

        /* storage unavailable */}
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}