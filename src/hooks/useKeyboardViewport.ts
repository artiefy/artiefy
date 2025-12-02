import { useEffect, useState } from 'react';

// Hook robusto para detectar altura del teclado en móviles usando visualViewport.
// Devuelve keyboardHeight (>0 cuando teclado visible) y flag isKeyboardOpen.
export function useKeyboardViewport(threshold = 80) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const hasVV = typeof window !== 'undefined' && 'visualViewport' in window;
    if (!hasVV) return; // En desktop o navegadores sin visualViewport no hacer nada

    const handleResize = () => {
      try {
        const vv = window.visualViewport!;
        // Diferencia entre innerHeight y altura actual del viewport visual.
        const full = window.innerHeight;
        const overlap = Math.max(0, full - vv.height - vv.offsetTop);
        const open = overlap > threshold;
        setKeyboardHeight(open ? overlap : 0);
        setIsKeyboardOpen(open);
      } catch {
        // Ignorar errores silenciosamente
      }
    };

    handleResize();
    window.visualViewport!.addEventListener('resize', handleResize);
    window.visualViewport!.addEventListener('scroll', handleResize); // Safari puede usar scroll del viewport
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [threshold]);

  return { keyboardHeight, isKeyboardOpen } as const;
}
