import { View, BackHandler } from 'react-native';
import { TabBar } from '@/components/layout/tab-bar';
import { AnimatedTabSlot } from '@/components/layout/animated-tab-slot';
import { useState, useCallback, useEffect } from 'react';
import { TabNavigationProvider, useTabNavigation } from '@/context/TabNavigationContext';
import { useApp } from '@/context/AppContext';
import { Redirect } from 'expo-router';

const SUB_TO_PARENT: Record<string, string> = {
  analytics: 'index',
  budgets: 'profile',
  subscriptions: 'profile',
  categories: 'profile',
  currency: 'profile',
  export: 'profile',
  import: 'profile',
};

function TabLayoutInner() {
  const [activeTab, setActiveTab] = useState('index');
  const { addListener, navigate, lastParams } = useTabNavigation();
  const { ready, userProfile } = useApp();

  useEffect(() => {
    const remove = addListener((tabName) => setActiveTab(tabName));
    return remove;
  }, [addListener]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const parent =
        lastParams.current.referrer === 'home'
          ? 'index'
          : SUB_TO_PARENT[activeTab];
      if (parent) {
        navigate(parent);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [activeTab, navigate]);

  const handleTabChange = useCallback((name: string) => {
    navigate(name);
  }, [navigate]);

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
