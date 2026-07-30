import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { getCategoryIcon, getCategoryColor } from '@/utils/transaction';
import { ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { parseBalance } from '@/utils/wallet';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, transactions } = useApp();

  // Calculate Net Worth
  const totalBalance = accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0);

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const getWalletName = (walletId: string) => {
    return accounts.find((a) => a.id === walletId)?.name || 'Wallet';
  };

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ 
        paddingTop: insets.top + 24, 
        paddingBottom: 120, 
        paddingHorizontal: 20 
      }}
    >
      {/* Welcome Header */}
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-2xl font-semibold text-foreground mt-0.5">SpendSense</Text>
          <Text className="text-muted text-sm font-medium">Spend money more Sensely.</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')}
          className="w-11 h-11 rounded-full bg-surface items-center justify-center border border-gray-100 dark:border-gray-900 shadow-xs"
          activeOpacity={0.7}
        >
          <Text className="font-semibold text-sm text-foreground">AS</Text>
        </TouchableOpacity>
      </View>

      {/* Net Balance Card */}
      <View className="bg-surface rounded-[32px] p-6 mb-6 border border-gray-100 dark:border-gray-900 shadow-xs">
        <Text className="text-muted text-sm font-medium mb-1">Total Balance</Text>
        <Text className="text-3xl font-bold text-foreground mb-4">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        
        {/* Divider */}
        <View className="h-[1px] bg-divider mb-4" />

        {/* Quick Income/Expense Summary */}
        <View className="flex-row">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-income/10 dark:bg-income/20 items-center justify-center">
              <Icon as={ArrowDownLeft} size={18} className="text-income" />
            </View>
            <View>
              <Text className="text-xs text-muted font-medium">Income</Text>
              <Text className="text-sm font-bold text-income mt-0.5">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
          
          <View className="w-[1px] bg-divider mx-4" />

          <View className="flex-1 flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-expense/10 dark:bg-expense/20 items-center justify-center">
              <Icon as={ArrowUpRight} size={18} className="text-expense" />
            </View>
            <View>
              <Text className="text-xs text-muted font-medium">Expenses</Text>
              <Text className="text-sm font-bold text-expense mt-0.5">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Transactions Section */}
      <View className="gap-4">
        <View className="flex-row justify-between items-center px-1">
          <Text className="text-lg font-semibold text-foreground">Recent Activity</Text>
          {transactions.length > 5 && (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/transactions')}
              className="flex-row items-center gap-1.5 bg-surface px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-900 shadow-xs"
              activeOpacity={0.7}
            >
              <Text className="text-xs text-foreground font-semibold">View All</Text>
              <Icon as={ArrowRight} size={12} className="text-foreground" />
            </TouchableOpacity>
          )}
        </View>

        {recentTransactions.length === 0 ? (
          <View className="bg-surface rounded-[32px] py-10 px-6 items-center justify-center border border-gray-100 dark:border-gray-900 shadow-xs">
            <Text className="text-sm text-muted font-semibold">No recent activity</Text>
            <Text className="text-xs text-muted/60 mt-1">Logged transactions will appear here</Text>
          </View>
        ) : (
          <View className="bg-surface rounded-[32px] overflow-hidden px-4 py-2 border border-gray-100 dark:border-gray-900 shadow-xs">
            {recentTransactions.map((tx, idx) => {
              const icon = getCategoryIcon(tx.category);
              const color = getCategoryColor(tx.category);
              const isLast = idx === recentTransactions.length - 1;

              return (
                <View key={tx.id}>
                  <View className="flex-row items-center justify-between py-3.5">
                    <View className="flex-row items-center gap-3.5 flex-1 mr-2">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon as={icon} size={18} color={color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base text-foreground font-semibold" numberOfLines={1}>
                          {tx.title}
                        </Text>
                        <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                          {getWalletName(tx.walletId)} • {tx.category}
                        </Text>
                      </View>
                    </View>
                    
                    <Text className={`text-base font-bold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  {!isLast && (
                    <View className="h-[1px] bg-divider ml-[54px]" />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
