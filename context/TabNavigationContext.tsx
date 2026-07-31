import React, { createContext, useContext, useRef, useCallback } from 'react';

type TabNavigateListener = (tabName: string) => void;

interface TabNavigationContextType {
  navigate: (tabName: string) => void;
  addListener: (listener: TabNavigateListener) => () => void;
}

const TabNavigationContext = createContext<TabNavigationContextType>({
  navigate: () => {},
  addListener: () => () => {},
});

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const listenersRef = useRef<TabNavigateListener[]>([]);

  const navigate = useCallback((tabName: string) => {
    listenersRef.current.forEach((listener) => listener(tabName));
  }, []);

  const addListener = useCallback((listener: TabNavigateListener) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
  }, []);

  return (
    <TabNavigationContext.Provider value={{ navigate, addListener }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}
