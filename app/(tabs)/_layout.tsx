import { View, BackHandler } from 'react-native';
import { TabBar } from '@/components/layout/tab-bar';
import { AnimatedTabSlot } from '@/components/layout/animated-tab-slot';
import { useState, useCallback, useEffect } from 'react';
import { TabNavigationProvider, useTabNavigation } from '@/context/TabNavigationContext';
import { useAppSelector } from '@/context/store';
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
  const ready = useAppSelector((state) => state.ready);
  const hasOnboarded = useAppSelector((state) => state.userProfile.hasOnboarded);

  useEffect(() => {
    const remove = addListener((tabName) => setActiveTab(tabName));
    return remove;
  }, [addListener]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (lastParams.current?.referrer) {
        const rawTarget = lastParams.current.referrer;
        const target = rawTarget === 'home' ? 'index' : rawTarget;
        lastParams.current = {};
        navigate(target);
        return true;
      }
      if (SUB_TO_PARENT[activeTab]) {
        navigate(SUB_TO_PARENT[activeTab]);
        return true;
      }
      if (activeTab !== 'index') {
        navigate('index');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [activeTab, navigate, lastParams]);

  const handleTabChange = useCallback(
    (name: string) => {
      navigate(name);
    },
    [navigate]
  );
  
  if (!ready) return <View className="flex-1 bg-background" />;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;

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
