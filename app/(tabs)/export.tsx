import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Calendar, ChevronDown, Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { ChipSelector } from '@/components/ui/ChipSelector';

import {
  type ExportType,
  type ExportSelection,
  type PeriodMode,
  type ExportedTable,
  buildExportData,
} from '@/lib/export/buildExportData';
import { buildFilename, type ExportFormat } from '@/lib/export/download';
import { exportData } from '@/lib/export/formatters';
import { DATA_TYPES, FORMATS } from '@/lib/export/constants';
import { MAX_TOTAL_ROWS } from '@/lib/import/parse';
import { formatDatePickerDate } from '@/utils/transaction';

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    transactions,
    budgets,
    subscriptions,
    customCategories,
    userProfile,
    categoryOrder,
    deletedDefaultCategories,
    walletOrder,
  } = useApp();
  const { navigate: navigateTab } = useTabNavigation();
  const now = new Date();

  const [selectedTypes, setSelectedTypes] = useState<ExportType[]>(['alldata']);
  const [rangeFrom, setRangeFrom] = useState<Date | null>(null);
  const [rangeTo, setRangeTo] = useState<Date | null>(null);
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
        profile: userProfile,
        categoryOrder,
        deletedDefaultCategories,
        walletOrder,
      }),
    [
      selection,
      transactions,
      accounts,
      budgets,
      subscriptions,
      customCategories,
      userProfile,
      categoryOrder,
      deletedDefaultCategories,
      walletOrder,
    ]
  );

  const totalRows = useMemo(() => tables.reduce((sum, t) => sum + t.rows.length, 0), [tables]);

  const toggleType = useCallback((t: string) => {
    setSelectedTypes((prev) => {
      if (t === 'alldata') {
        return prev.includes('alldata') ? [] : DATA_TYPES.map((d) => d.key);
      }
      const key = t as Exclude<ExportType, 'alldata'>;
      const next = prev.filter((v) => v !== 'alldata');
      if (next.includes(key)) {
        return next.filter((v) => v !== key);
      }
      return [...next, key];
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
    if (totalRows > MAX_TOTAL_ROWS) {
      Toast.show({
        type: 'warning',
        text1: 'Large Export',
        text2: `This export has ${totalRows.toLocaleString()} rows. Importing it back will truncate to the ${MAX_TOTAL_ROWS.toLocaleString()}-row limit.`,
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
      navigateTab('profile');
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
        <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Text className="mb-4 text-sm font-medium text-muted">What to export</Text>
          <ChipSelector items={DATA_TYPES} selected={selectedTypes} onToggle={toggleType} />
        </View>

        {/* ── Time period ── */}
        <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Text className="mb-4 text-sm font-medium text-muted">Time period</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsDatePickerOpen(true)}
            className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Icon as={Calendar} size={18} className="text-foreground" />
              </View>
              <Text className="text-base font-medium text-foreground">{dateLabel}</Text>
            </View>
            <Icon as={ChevronDown} size={16} className="text-muted" />
          </TouchableOpacity>
        </View>

        {/* ── Format ── */}
        <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Text className="mb-4 text-sm font-medium text-muted">Format</Text>
          <ChipSelector
            items={FORMATS}
            selected={[format]}
            onToggle={(k) => setFormat(k as ExportFormat)}
          />
        </View>

        {/* ── Export button ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleExport}
          disabled={exporting || selectedTypes.length === 0}
          className={`mb-4 flex-row items-center justify-center gap-2 rounded-xl py-4 ${
            exporting || selectedTypes.length === 0 ? 'bg-secondary' : 'bg-primary'
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
