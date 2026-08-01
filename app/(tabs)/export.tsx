import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  Check,
  Wallet,
  Repeat,
  ArrowUpDown,
  PiggyBank,
  Tags,
  FileDown,
  Download,
  CircleDashed,
  Calendar,
  ChevronDown,
  FileJson,
  FileSpreadsheet,
  File,
} from 'lucide-react-native';
import AnimatedSegment from '@/components/ui/animated-segment';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import { MonthYearPickerModal } from '@/components/analytics/MonthYearPickerModal';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { useTabNavigation } from '@/context/TabNavigationContext';

import {
  type ExportType,
  type ExportSelection,
  type PeriodMode,
  type ExportedTable,
  buildExportData,
} from '@/lib/export/buildExportData';
import { buildFilename, type ExportFormat } from '@/lib/export/download';
import { exportData } from '@/lib/export/formatters';

const DATA_TYPES: { key: ExportType; label: string; icon: any }[] = [
  { key: 'transactions', label: 'Transactions', icon: ArrowUpDown },
  { key: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  { key: 'wallets', label: 'Wallets', icon: Wallet },
  { key: 'balances', label: 'Balances', icon: CircleDashed },
  { key: 'budgets', label: 'Budgets', icon: PiggyBank },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'alldata', label: 'All Data', icon: FileDown },
];

const FORMATS: { key: ExportFormat; label: string; ext: string; icon: any }[] = [
  { key: 'pdf', label: 'PDF', ext: '.pdf', icon: File },
  { key: 'json', label: 'JSON', ext: '.json', icon: FileJson },
  { key: 'xlsx', label: 'Excel', ext: '.xlsx', icon: FileSpreadsheet },
];

import { formatDatePickerDate } from '@/utils/transaction';

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, transactions, budgets, subscriptions, customCategories, userProfile } =
    useApp();
  const { navigate: navigateTab } = useTabNavigation();
  const now = new Date();

  const [selectedTypes, setSelectedTypes] = useState<ExportType[]>(['transactions']);
  const [rangeFrom, setRangeFrom] = useState<Date | null>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [rangeTo, setRangeTo] = useState<Date | null>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  });
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(now);

  const selection = useMemo<ExportSelection>(
    () => ({
      types: selectedTypes,
      period: {
        mode: rangeFrom === null && rangeTo === null ? 'all' : 'custom',
        year: now.getFullYear(),
        month: now.getMonth(),
        from: rangeFrom ?? undefined,
        to: rangeTo ?? undefined,
      },
      format,
    }),
    [selectedTypes, rangeFrom, rangeTo, format]
  );

  const tables = useMemo<ExportedTable[]>(
    () =>
      buildExportData(selection, {
        transactions,
        accounts,
        budgets,
        subscriptions,
        customCategories,
      }),
    [selection, transactions, accounts, budgets, subscriptions, customCategories]
  );

  const totalRows = useMemo(() => tables.reduce((sum, t) => sum + t.rows.length, 0), [tables]);

  const toggleType = useCallback((t: ExportType) => {
    setSelectedTypes((prev) => {
      if (t === 'alldata') {
        return prev.includes('alldata') ? [] : DATA_TYPES.map((d) => d.key);
      }
      const next = prev.filter((v) => v !== 'alldata');
      if (next.includes(t)) {
        return next.filter((v) => v !== t);
      }
      return [...next, t];
    });
  }, []);

  let dateLabel = 'All Time';
  if (rangeFrom && rangeTo) {
    if (rangeFrom.toDateString() === rangeTo.toDateString()) {
      dateLabel = formatDatePickerDate(rangeFrom);
    } else {
      dateLabel = `${formatDatePickerDate(rangeFrom)} - ${formatDatePickerDate(rangeTo)}`;
    }
  } else if (rangeFrom) {
    dateLabel = `From ${formatDatePickerDate(rangeFrom)}`;
  } else if (rangeTo) {
    dateLabel = `Until ${formatDatePickerDate(rangeTo)}`;
  }

  const handleExport = useCallback(async () => {
    if (selectedTypes.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Data Selected',
        text2: 'Please select at least one type of data to export.',
      });
      return;
    }
    if (tables.length === 0 || totalRows === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Data',
        text2: 'No data available for the selected types.',
      });
      return;
    }

    setExporting(true);
    try {
      const periodLabel = dateLabel.replace(/[^a-zA-Z0-9]/g, '');
      const typesForName = selectedTypes.includes('alldata') ? ['AllData'] : selectedTypes;
      const filename = buildFilename(typesForName, periodLabel, format);

      await exportData(tables, format, filename, {
        name: userProfile.name,
        currencyCode: userProfile.currencyCode,
      });

      Toast.show({
        type: 'success',
        text1: 'Exported',
        text2: `${totalRows} rows exported as ${filename}`,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setExporting(false);
    }
  }, [selectedTypes, tables, totalRows, dateLabel, format, userProfile]);

  const fmtDateShort = (d: Date | null) =>
    d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="Export" showBack onLeftPress={() => navigateTab('profile')} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled">
        {/* ── What to export ── */}
        <View className="mb-4 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-4 text-sm font-medium text-muted">What to export</Text>
          <View>
            {DATA_TYPES.map((dt, idx) => {
              const active = selectedTypes.includes(dt.key);
              const isLast = idx === DATA_TYPES.length - 1;
              return (
                <View key={dt.key}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleType(dt.key)}
                    className="flex-row items-center gap-3 py-3">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
                      <Icon as={dt.icon} size={18} className="text-foreground" />
                    </View>
                    <Text className="flex-1 text-base font-medium text-foreground">{dt.label}</Text>
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                        active
                          ? 'border-primary bg-primary'
                          : 'border-gray-300 dark:border-gray-700'
                      }`}>
                      {active && (
                        <Icon as={Check} size={12} className="text-white dark:text-black" />
                      )}
                    </View>
                  </TouchableOpacity>
                  {!isLast && <View className="ml-13 h-[1px] bg-divider" />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Time period ── */}
        <View className="mb-4 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-4 text-sm font-medium text-muted">Time period</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsDatePickerOpen(true)}
            className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
                <Icon as={Calendar} size={18} className="text-foreground" />
              </View>
              <Text className="text-base font-medium text-foreground">{dateLabel}</Text>
            </View>
            <Icon as={ChevronDown} size={16} className="text-muted" />
          </TouchableOpacity>
        </View>

        {/* ── Format ── */}
        <View className="mb-4 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-4 text-sm font-medium text-muted">Format</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {FORMATS.map((f) => {
              const active = format === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFormat(f.key)}
                  activeOpacity={0.75}
                  className={`flex-row items-center gap-2 rounded-full border px-4 py-2.5 ${
                    active
                      ? 'border-primary bg-primary'
                      : 'border-gray-200 bg-transparent dark:border-gray-800'
                  }`}>
                  <Icon
                    as={f.icon}
                    size={16}
                    className={active ? 'text-white dark:text-black' : 'text-muted'}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      active ? 'text-white dark:text-black' : 'text-foreground'
                    }`}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Export button ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleExport}
          disabled={exporting || selectedTypes.length === 0}
          className={`mb-4 flex-row items-center justify-center gap-2 rounded-full py-4 ${
            exporting || selectedTypes.length === 0 ? 'bg-gray-200 dark:bg-gray-800' : 'bg-primary'
          }`}>
          <Icon
            as={Download}
            size={18}
            className={
              exporting || selectedTypes.length === 0 ? 'text-muted' : 'text-white dark:text-black'
            }
          />
          <Text
            className={`text-base font-semibold ${
              exporting || selectedTypes.length === 0 ? 'text-muted' : 'text-white dark:text-black'
            }`}>
            {exporting ? 'Exporting…' : 'Export'}
          </Text>
        </TouchableOpacity>

        {totalRows > 0 && (
          <Text className="mb-6 text-center text-xs text-muted">
            {totalRows} rows will be exported
          </Text>
        )}
      </ScrollView>

      <TransactionDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        mode="range"
        initialFrom={rangeFrom}
        initialTo={rangeTo}
        onSelectRange={(range) => {
          setRangeFrom(range.from);
          setRangeTo(range.to);
          setIsDatePickerOpen(false);
        }}
        calendarMonth={calendarMonth}
        onNavigateMonth={(dir) => {
          setCalendarMonth((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
            return d;
          });
        }}
      />
    </KeyboardAvoidingView>
  );
}
