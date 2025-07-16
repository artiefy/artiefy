'use client';


import { createContext, useContext, useState } from "react";

const ExtrasContext = createContext({
  showExtras: false,
  show: () => {},
  hide: () => {},
});

import { ReactNode } from "react";

export function ExtrasProvider({ children }: { children: ReactNode }) {
  const [showExtras, setShowExtras] = useState(false);

  const show = () => {
    setShowExtras(true);
    setTimeout(() => setShowExtras(false), 5000);
  };

  return (
    <ExtrasContext.Provider value={{ showExtras, show, hide: () => setShowExtras(false) }}>
      {children}
    </ExtrasContext.Provider>
  );
}

export const useExtras = () => useContext(ExtrasContext);