"use client";

import { createContext, useContext, useState } from "react";

const BalanceVisibilityContext = createContext<{
  hidden: boolean;
  toggle: () => void;
}>({ hidden: false, toggle: () => {} });

export function BalanceVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(true);
  return (
    <BalanceVisibilityContext.Provider value={{ hidden, toggle: () => setHidden((h) => !h) }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  return useContext(BalanceVisibilityContext);
}
