"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ConnectivityContext = createContext({ online: true, checked: false });

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setChecked(true);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const value = useMemo(() => ({ online, checked }), [online, checked]);
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
