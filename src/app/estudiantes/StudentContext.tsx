"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ExtrasContext = createContext({
  showExtras: false,
  show: () => {
    /* Default implementation */
  },
  hide: () => {
    /* Default implementation */
  },
});

export function ExtrasProvider({ children }: { children: ReactNode }) {
  const [showExtras, setShowExtras] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Duración visible + animación extra (en ms)
  const VISIBLE_TIME = 5000; // tiempo visible real
  const ANIMATION_DURATION = 350; // igual que en el botón
  const SAFETY_MARGIN = 50;

  const show = () => {
    setShowExtras(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => {
        // Solo oculta si sigue visible (previene cortes si show() se llama varias veces)
        setShowExtras((prev) => (prev ? false : prev));
      },
      VISIBLE_TIME + ANIMATION_DURATION + SAFETY_MARGIN,
    );
  };

  // Limpia el timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <ExtrasContext.Provider
      value={{ showExtras, show, hide: () => setShowExtras(false) }}
    >
      {children}
    </ExtrasContext.Provider>
  );
}

export const useExtras = () => useContext(ExtrasContext);
