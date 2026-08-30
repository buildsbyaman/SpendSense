import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';

type TabParams = Record<string, string>;

type TabNavigateListener = (tabName: string, params?: TabParams) => void;

interface TabNavigationContextType {
  navigate: (tabName: string, params?: TabParams) => void;
  lastParams: { current: TabParams };
  addListener: (listener: TabNavigateListener) => () => void;
}

const TabNavigationContext = createContext<TabNavigationContextType>({
  navigate: () => {},
  lastParams: { current: {} },
  addListener: () => () => {},
});

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const listenersRef = useRef<TabNavigateListener[]>([]);
  const lastParamsRef = useRef<TabParams>({});

  const navigate = useCallback((tabName: string, params?: TabParams) => {
    lastParamsRef.current = params ?? {};
    listenersRef.current.forEach((listener) => listener(tabName, params));
  }, []);

  const addListener = useCallback((listener: TabNavigateListener) => {
    listenersRef.current.push(listener);
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
  }, []);

  const value = useMemo(
    () => ({ navigate, lastParams: lastParamsRef, addListener }),
    [navigate, addListener]
  );

  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}
