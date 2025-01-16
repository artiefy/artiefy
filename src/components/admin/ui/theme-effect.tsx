'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ThemeEffect() {
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    // Prevenir el flash de tema incorrecto
    document.documentElement.classList.add('transition-colors');
    document.documentElement.classList.add('duration-200');

    const savedTheme = localStorage.getItem('edudash-theme');
    if (savedTheme) {
      document.documentElement.classList.add(savedTheme);
    } else if (systemTheme) {
      document.documentElement.classList.add(systemTheme);
    }

    return () => {
      document.documentElement.classList.remove('transition-colors');
      document.documentElement.classList.remove('duration-200');
    };
  }, [theme, systemTheme]);

  return null;
}
