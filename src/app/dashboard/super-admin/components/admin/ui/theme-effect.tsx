'use client';

import { useEffect } from 'react';

export const ThemeEffect = () => {
  useEffect(() => {
    const theme = localStorage.getItem('edudash-theme') ?? 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return null;
};
