import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Repeat, Plus } from 'lucide-react-native';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { useApp } from '@/context/AppContext';
import { SubscriptionItem } from '@/components/subscriptions/SubscriptionItem';
import { router } from 'expo-router';
import AnimatedSegment from '@/components/ui/animated-segment';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { subscriptions, deleteSubscription } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'subscriptions') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'expired'>('current');
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);

  const handleTabChange = (tab: 'current' | 'expired') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const isExpired = sub.end_date ? new Date().getTime() >= new Date(sub.end_date).getTime() : false;
    return activeTab === 'current' ? !isExpired : isExpired;
  });

  const confirmDelete = () => {
    if (subscriptionToDelete) {
      deleteSubscription(subscriptionToDelete);
      setSubscriptionToDelete(null);
      setExpandedId(null);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header 
          title="Subscriptions" 
          showBack={true} 
          onLeftPress={() => navigateTab('profile')} 
          rightIcon={Plus}
          onRightPress={() => router.push('/add-subscription')}
        />
        <View className="mt-6 mb-2">
          <AnimatedSegment<'current' | 'expired'>
            options={[
              { label: 'Current', value: 'current' },
              { label: 'Expired', value: 'expired' },
            ]}
            selectedValue={activeTab}
            onChange={handleTabChange}
          />
        </View>
      </View>
      
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}>
        {filteredSubscriptions.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title={`No ${activeTab === 'expired' ? 'Expired' : 'Current'} Subscriptions`}
            description={
              activeTab === 'expired'
                ? "You don't have any past subscriptions."
                : "Track and manage your recurring subscriptions like Netflix, Spotify, and more."
            }
            buttonText={activeTab === 'current' ? 'Add Subscription' : undefined}
            onButtonPress={activeTab === 'current' ? () => router.push('/add-subscription') : undefined}
          />
        ) : (
          <View>
            {[...filteredSubscriptions]
              .sort((a, b) => b.amount - a.amount)
              .map((sub) => (
                <View key={sub.id} style={{ opacity: activeTab === 'expired' ? 0.6 : 1 }}>
                  <SubscriptionItem
                    subscription={sub}
                    isExpanded={expandedId === sub.id}
                    onToggleExpand={() => toggleExpand(sub.id)}
                    onDelete={() => setSubscriptionToDelete(sub.id)}
                  />
                </View>
              ))}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={subscriptionToDelete !== null}
        title="Delete Subscription"
        message="Are you sure you want to delete this subscription? This action cannot be undone."
        destructive={true}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setSubscriptionToDelete(null)}
      />
    </View>
  );
}
