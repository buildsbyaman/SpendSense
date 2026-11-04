import { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
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
import Toast from 'react-native-toast-message';
import type { Subscription } from '@/utils/subscription';

export default function SubscriptionsScreen({ referrer }: { referrer?: string }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { subscriptions, deleteSubscription } = useApp();
  const scrollRef = useRef<FlashListRef<Subscription>>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'subscriptions') {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    });
  }, [addListener]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'expired'>('current');
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);

  const handleTabChange = (tab: 'current' | 'expired') => {
    setActiveTab(tab);
    setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const isExpired = sub.end_date
      ? new Date().getTime() >= new Date(sub.end_date).getTime()
      : false;
    return activeTab === 'current' ? !isExpired : isExpired;
  });
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => b.amount - a.amount);

  const confirmDelete = () => {
    if (subscriptionToDelete) {
      deleteSubscription(subscriptionToDelete);
      Toast.show({
        type: 'success',
        text1: 'Subscription Deleted',
        text2: 'Subscription has been removed.',
      });
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
          onLeftPress={() => navigateTab(referrer === 'home' ? 'index' : 'profile')}
          rightIcon={Plus}
          onRightPress={() => router.push('/add-subscription')}
        />
        <View className="mb-4 mt-2 items-center justify-center">
          <AnimatedSegment<'current' | 'expired'>
            width={140}
            options={[
              { label: 'Current', value: 'current' },
              { label: 'Expired', value: 'expired' },
            ]}
            selectedValue={activeTab}
            onChange={handleTabChange}
          />
        </View>
      </View>

      <FlashList
        ref={scrollRef}
        data={sortedSubscriptions}
        keyExtractor={(sub) => sub.id}
        ListEmptyComponent={
          <EmptyState
            icon={Repeat}
            title={`No ${activeTab === 'expired' ? 'Expired' : 'Current'} Subscriptions`}
            description={
              activeTab === 'expired'
                ? "You don't have any past subscriptions."
                : 'Track and manage your recurring subscriptions like Netflix, Spotify, and more.'
            }
            buttonText={activeTab === 'current' ? 'Add Subscription' : undefined}
            onButtonPress={
              activeTab === 'current' ? () => router.push('/add-subscription') : undefined
            }
          />
        }
        renderItem={({ item: sub }) => (
          <View style={{ opacity: activeTab === 'expired' ? 0.6 : 1 }}>
            <SubscriptionItem
              subscription={sub}
              isExpanded={expandedId === sub.id}
              onToggleExpand={() => toggleExpand(sub.id)}
              onDelete={() => setSubscriptionToDelete(sub.id)}
            />
          </View>
        )}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />

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
