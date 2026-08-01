import { View } from 'react-native';
import { TabBar } from '@/components/layout/tab-bar';
import { AnimatedTabSlot } from '@/components/layout/animated-tab-slot';
import { useState, useCallback, useEffect } from 'react';
import { TabNavigationProvider, useTabNavigation } from '@/context/TabNavigationContext';
import { useApp } from '@/context/AppContext';
import { Redirect } from 'expo-router';

function TabLayoutInner() {
  const [activeTab, setActiveTab] = useState('index');
  const { addListener } = useTabNavigation();
  const { ready, userProfile } = useApp();

  useEffect(() => {
    // Listen for programmatic tab switches from any screen (e.g. categories back button)
    const remove = addListener((tabName) => setActiveTab(tabName));
    return remove;
  }, [addListener]);

  const handleTabChange = useCallback((name: string) => {
    setActiveTab(name);
  }, []);

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
