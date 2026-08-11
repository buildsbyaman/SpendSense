import { View, BackHandler } from 'react-native';
import { TabBar } from '@/components/layout/tab-bar';
import { AnimatedTabSlot } from '@/components/layout/animated-tab-slot';
import { useState, useCallback, useEffect } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { TabNavigationProvider, useTabNavigation } from '@/context/TabNavigationContext';
import { useApp } from '@/context/AppContext';
import { Redirect, usePathname } from 'expo-router';

const SUB_TO_PARENT: Record<string, string> = {
  analytics: 'index',
  budgets: 'profile',
  subscriptions: 'profile',
  categories: 'profile',
  currency: 'profile',
  export: 'profile',
  import: 'profile',
  backup: 'profile',
};

// Routes that live inside the state-driven tabs group. The focused pathname
// only changes from these when a pushed route (add-*, backup, onboarding) is
// presented on top, so the hardware-back handler must not intercept those.
const TABS_PATHS = ['/', '/transactions', '/wallets', '/profile'];

function TabLayoutInner() {
  const [activeTab, setActiveTab] = useState('index');
  const { addListener, navigate, lastParams } = useTabNavigation();
  const { ready, userProfile } = useApp();
  const pathname = usePathname();

  useEffect(() => {
    const remove = addListener((tabName) => setActiveTab(tabName));
    return remove;
  }, [addListener]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // A pushed route (add-*, backup, …) is focused on top of the tabs
      // group — let the native stack handle the back press.
      if (!TABS_PATHS.includes(pathname)) return false;
      const parent = lastParams.current.referrer === 'home' ? 'index' : SUB_TO_PARENT[activeTab];
      if (parent) {
        navigate(parent);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [activeTab, navigate, pathname]);

  // When the app returns from the background, always reset to the home tab.
  // This ensures activeTab state is never stale after a resume, which cascades
  // correctly to the TabBar highlight and AnimatedTabSlot animation.
  useAppState(undefined, useCallback(() => {
    navigate('index');
  }, [navigate]));

  const handleTabChange = useCallback(
    (name: string) => {
      navigate(name);
    },
    [navigate]
  );

  if (!ready) return null;
  if (!userProfile.hasOnboarded) return <Redirect href="/onboarding" />;

  return (
    <View className="flex-1">
      <AnimatedTabSlot activeTab={activeTab} />
      <TabBar onTabChange={handleTabChange} activeTab={activeTab} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <TabNavigationProvider>
      <TabLayoutInner />
    </TabNavigationProvider>
  );
}
