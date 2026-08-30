import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import AnimatedSegment from '@/components/ui/animated-segment';
import type { LucideIcon } from 'lucide-react-native';
import { getWalletTypeColor } from '@/utils/wallet';
import type { Account } from '@/utils/wallet';

export interface FilterState {
  filter: 'all' | 'expense' | 'income' | 'transfer';
  categoryFilter: string | null;
  walletFilter: string | null;
}

interface FilterPopoverProps {
  visible: boolean;
  onClose: () => void;
  active: FilterState;
  categories: { name: string; icon: LucideIcon; color: string }[];
  accounts: Account[];
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  buttonRect: { x: number; y: number; width: number; height: number } | null;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POPOVER_WIDTH = 340;

export default function FilterPopover({
  visible,
  onClose,
  active,
  categories,
  accounts,
  onApply,
  onClear,
  buttonRect,
}: FilterPopoverProps) {
  const [draftFilter, setDraftFilter] = useState(active.filter);
  const [draftCategory, setDraftCategory] = useState(active.categoryFilter);
  const [draftWallet, setDraftWallet] = useState(active.walletFilter);

  useEffect(() => {
    if (visible) {
      setDraftFilter(active.filter);
      setDraftCategory(active.categoryFilter);
      setDraftWallet(active.walletFilter);
    }
  }, [visible, active]);

  const [isRendered, setIsRendered] = useState(visible);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      progress.value = withTiming(1, { duration: 150 });
    } else if (isRendered) {
      progress.value = withTiming(0, { duration: 100 }, (finished) => {
        if (finished) runOnJS(setIsRendered)(false);
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-10, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.94, 1]) },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.4,
  }));

  const handleClear = () => {
    setDraftFilter('all');
    setDraftCategory(null);
    setDraftWallet(null);
  };

  const handleApply = () => {
    onApply({ filter: draftFilter, categoryFilter: draftCategory, walletFilter: draftWallet });
    onClose();
  };

  if (!isRendered || !buttonRect) return null;

  // Position: clamp so popover never extends off-screen
  const SCREEN_MARGIN = 8;
  const rightAlignedLeft = buttonRect.x + buttonRect.width - POPOVER_WIDTH;
  const popoverLeft = Math.max(
    SCREEN_MARGIN,
    Math.min(rightAlignedLeft, SCREEN_WIDTH - POPOVER_WIDTH - SCREEN_MARGIN)
  );
  const popoverTop = buttonRect.y + buttonRect.height + 8;
  const popoverMaxHeight = SCREEN_HEIGHT - popoverTop - SCREEN_MARGIN;

  return (
    <>
      {/* Backdrop — full screen tap to dismiss */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}>
        <Animated.View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
            backdropStyle,
          ]}
        />
      </TouchableOpacity>

      {/* Popover card */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: popoverTop,
            left: popoverLeft,
            width: POPOVER_WIDTH,
            zIndex: 9999,
          },
          animatedStyle,
        ]}
        onStartShouldSetResponder={() => true}>
        <View
          className="rounded-[32px] border border-border bg-surface p-5 shadow-2xl"
          style={{ maxHeight: popoverMaxHeight }}>
          {/* Header */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="h4" className="text-foreground">
              Filters
            </Text>
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
              <Text className="text-xs font-semibold text-muted">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Type selector */}
            <Text className="mb-1.5 text-[10px] font-semibold uppercase text-muted">Type</Text>
            <View className="mb-4">
              <AnimatedSegment<'all' | 'expense' | 'income' | 'transfer'>
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Expense', value: 'expense' },
                  { label: 'Income', value: 'income' },
                  { label: 'Transfer', value: 'transfer' },
                ]}
                selectedValue={draftFilter}
                onChange={(v) => {
                  setDraftFilter(v);
                  if (v !== draftFilter) setDraftCategory(null);
                }}
                paddingVertical={8}
                fontSize={12}
                borderRadius={12}
              />
            </View>

            {/* Category chips */}
            {categories.length > 0 && (
              <>
                <Text className="mb-1.5 text-[10px] font-semibold uppercase text-muted">
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row items-center gap-1.5 py-1">
                    <TouchableOpacity
                      onPress={() => setDraftCategory(null)}
                      activeOpacity={0.7}
                      className={`rounded-full border px-4 py-2 ${
                        draftCategory === null
                          ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                          : 'border-border bg-surface'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          draftCategory === null ? 'text-primary' : 'text-foreground'
                        }`}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {categories.map((cat) => {
                      const isSelected = draftCategory === cat.name;
                      return (
                        <TouchableOpacity
                          key={cat.name}
                          onPress={() => setDraftCategory(isSelected ? null : cat.name)}
                          activeOpacity={0.7}
                          className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                              : 'border-border bg-surface'
                          }`}>
                          <View
                            className="h-5 w-5 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${cat.color}15` }}>
                            <Icon as={cat.icon} size={10} color={cat.color} />
                          </View>
                          <Text
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Wallet chips */}
            {accounts.length > 1 && (
              <>
                <Text className="mb-1.5 text-[10px] font-semibold uppercase text-muted">
                  Wallet
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row items-center gap-1.5 py-1">
                    <TouchableOpacity
                      onPress={() => setDraftWallet(null)}
                      activeOpacity={0.7}
                      className={`rounded-full border px-4 py-2 ${
                        draftWallet === null
                          ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                          : 'border-border bg-surface'
                      }`}>
                      <Text
                        className={`text-xs font-semibold ${
                          draftWallet === null ? 'text-primary' : 'text-foreground'
                        }`}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {accounts.map((wallet) => {
                      const isSelected = draftWallet === wallet.id;
                      const walletColor = getWalletTypeColor(wallet.type);
                      const WalletIcon = wallet.icon;
                      return (
                        <TouchableOpacity
                          key={wallet.id}
                          onPress={() => setDraftWallet(isSelected ? null : wallet.id)}
                          activeOpacity={0.7}
                          className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                            isSelected
                              ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                              : 'border-border bg-surface'
                          }`}>
                          <View
                            className="h-5 w-5 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${walletColor}15` }}>
                            <Icon as={WalletIcon} size={10} color={walletColor} />
                          </View>
                          <Text
                            className={`text-xs font-semibold ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}>
                            {wallet.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}
          </ScrollView>

          {/* Action buttons */}
          <View className="mt-3 flex-row gap-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
              activeOpacity={0.8}>
              <Text className="text-sm font-semibold text-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              className="flex-1 items-center justify-center rounded-full bg-primary py-3"
              activeOpacity={0.8}>
              <Text className="text-sm font-semibold text-white dark:text-black">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
