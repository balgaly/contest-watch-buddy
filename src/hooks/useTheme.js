import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const applyTheme = useCallback((t) => {
    const html = document.documentElement;
    if (t === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', t);
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    if (t === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', t);
    }
  }, []);

  const toggle = useCallback(() => {
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(isDark ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
};
