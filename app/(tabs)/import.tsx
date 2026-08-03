import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';
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
  FileUp,
  FileDown,
  FileJson,
  FileSpreadsheet,
  File,
  Shuffle,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  UserRound,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AnimatedSegment from '@/components/ui/animated-segment';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { type ExportType, type ExportedTable } from '@/lib/export/buildExportData';
import { type ExportFormat } from '@/lib/export/download';
import { parseXlsx, parseJson, parsePdf } from '@/lib/import/parse';
import {
  buildImportPlan,
  type ImportMode,
  type ConflictPolicy,
  type ImportPlan,
} from '@/lib/import/merge';
import { applyImportPlan } from '@/lib/import/apply';

type ImportType = ExportType;

const DATA_TYPES: { key: ImportType; label: string; icon: any }[] = [
  { key: 'transactions', label: 'Transactions', icon: ArrowUpDown },
  { key: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  { key: 'wallets', label: 'Wallets', icon: Wallet },
  { key: 'budgets', label: 'Budgets', icon: PiggyBank },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'alldata', label: 'All Data', icon: FileDown },
];

const FORMATS: { key: ExportFormat; label: string; icon: any }[] = [
  { key: 'pdf', label: 'PDF', icon: File },
  { key: 'json', label: 'JSON', icon: FileJson },
  { key: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
];

const IMPORT_MODES: { key: ImportMode; label: string; icon: any; destructive?: boolean }[] = [
  { key: 'merge', label: 'Merge', icon: Shuffle },
  { key: 'replace', label: 'Replace', icon: RotateCcw, destructive: true },
];

const CONFLICT_POLICIES: { key: ConflictPolicy; label: string; icon: any }[] = [
  { key: 'skip', label: 'Skip Existing', icon: ShieldCheck },
  { key: 'overwrite', label: 'Overwrite', icon: AlertTriangle },
];

const MIME_MAP: Record<ExportFormat, string> = {
  json: 'application/json',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    transactions,
    budgets,
    subscriptions,
    customCategories,
    userProfile,
    categoryOrder,
    refreshAllData,
  } = useApp();
  const { navigate: navigateTab } = useTabNavigation();

  const [selectedTypes, setSelectedTypes] = useState<ImportType[]>(['alldata']);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('skip');
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [parsedData, setParsedData] = useState<{ meta: any; tables: ExportedTable[] } | null>(null);
  const [pendingPlan, setPendingPlan] = useState<ImportPlan | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const getPlanTotalRecords = useCallback((plan: ImportPlan | null): number => {
    if (!plan) return 0;
    return (
      plan.wallets.insert.length +
      plan.wallets.update.length +
      plan.transactions.insert.length +
      plan.transactions.update.length +
      plan.subscriptions.insert.length +
      plan.subscriptions.update.length +
      plan.budgets.insert.length +
      plan.budgets.update.length +
      plan.categories.insert.length +
      plan.categories.update.length +
      (plan.profile.apply ? 1 : 0) +
      (plan.categoryOrder
        ? plan.categoryOrder.expense.length + plan.categoryOrder.income.length
        : 0) +
      (plan.hiddenCategories ? plan.hiddenCategories.length : 0)
    );
  }, []);

  const toggleType = useCallback((t: ImportType) => {
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

  const readFileAsText = async (uri: string): Promise<string> => {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      return await response.text();
    }
    // @ts-ignore - readAsStringAsync is deprecated in newer Expo versions, but the new File API fails on Android content:// URIs
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
  };

  const readFileAsBytes = async (uri: string): Promise<Uint8Array> => {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
    // @ts-ignore - readAsStringAsync is deprecated in newer Expo versions, but the new File API fails on Android content:// URIs
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  useEffect(() => {
    if (!parsedData) {
      setPendingPlan(null);
      return;
    }

    const plan = buildImportPlan(
      parsedData.tables,
      { accounts, transactions, budgets, subscriptions, customCategories, categoryOrder },
      userProfile.currencyCode,
      parsedData.meta.currency ?? null,
      selectedTypes,
      importMode,
      conflictPolicy
    );
    setPendingPlan(plan);
  }, [
    parsedData,
    accounts,
    transactions,
    budgets,
    subscriptions,
    customCategories,
    categoryOrder,
    userProfile.currencyCode,
    selectedTypes,
    importMode,
    conflictPolicy,
  ]);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [MIME_MAP[format], '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      // Reject files larger than 5MB to prevent memory exhaustion / DoS
      const MAX_SIZE = 5 * 1024 * 1024;
      if (asset.size && asset.size > MAX_SIZE) {
        Toast.show({
          type: 'error',
          text1: 'File Too Large',
          text2: 'Please select a file under 5MB.',
        });
        return;
      }

      setSelectedFile(asset);
      setParsing(true);
      setParsedData(null);
      setPendingPlan(null);

      try {
        let parsed;
        if (format === 'json') {
          const text = await readFileAsText(asset.uri);
          parsed = parseJson(text);
        } else if (format === 'pdf') {
          const text = await readFileAsText(asset.uri);
          parsed = parsePdf(text);
        } else {
          const bytes = await readFileAsBytes(asset.uri);
          parsed = await parseXlsx(bytes);
        }
        setParsedData(parsed);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Invalid File Format',
          text2: err instanceof Error ? err.message : 'Could not parse the selected file.',
        });
        setSelectedFile(null);
      } finally {
        setParsing(false);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to pick file',
      });
    }
  }, [format]);

  const handleImportAction = useCallback(() => {
    if (!pendingPlan) return;
    setShowConfirm(true);
  }, [pendingPlan]);

  const handleConfirmImport = useCallback(async () => {
    if (!pendingPlan) return;
    setShowConfirm(false);
    setImporting(true);

    try {
      const result = await applyImportPlan(pendingPlan);
      await refreshAllData();

      const totalAdded =
        result.walletsAdded +
        result.transactionsAdded +
        result.subscriptionsAdded +
        result.budgetsAdded +
        result.categoriesAdded +
        (result.profileImported ? 1 : 0);
      const totalSkipped =
        pendingPlan.wallets.skip +
        pendingPlan.transactions.skip +
        pendingPlan.subscriptions.skip +
        pendingPlan.budgets.skip +
        pendingPlan.categories.skip;

      Toast.show({
        type: 'success',
        text1: 'Import Complete',
        text2: `${totalAdded} added, ${totalSkipped} skipped`,
      });

      // Reset file selection
      setSelectedFile(null);
      setParsedData(null);

      // Auto-navigate back to home
      navigateTab('profile');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Import Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setImporting(false);
      setPendingPlan(null);
    }
  }, [pendingPlan, refreshAllData, navigateTab]);

  const formatSummary = (plan: ImportPlan): string => {
    const parts: string[] = [];
    if (plan.profile.apply && plan.profile.value) {
      parts.push(`Profile: ${plan.profile.value.name}`);
    }
    if (plan.wallets.insert.length > 0) parts.push(`${plan.wallets.insert.length} wallet(s)`);
    if (plan.transactions.insert.length > 0)
      parts.push(`${plan.transactions.insert.length} transaction(s)`);
    if (plan.subscriptions.insert.length > 0)
      parts.push(`${plan.subscriptions.insert.length} subscription(s)`);
    if (plan.budgets.insert.length > 0) parts.push(`${plan.budgets.insert.length} budget(s)`);
    if (plan.categories.insert.length > 0)
      parts.push(`${plan.categories.insert.length} category(ies)`);
    if (plan.categoryOrder) parts.push('category order');
    if (plan.hiddenCategories) parts.push(`${plan.hiddenCategories.length} hidden default(s)`);
    const totalSkip =
      plan.wallets.skip +
      plan.transactions.skip +
      plan.subscriptions.skip +
      plan.budgets.skip +
      plan.categories.skip;
    const totalDropped =
      plan.wallets.dropped +
      plan.transactions.dropped +
      plan.subscriptions.dropped +
      plan.budgets.dropped +
      plan.categories.dropped;
    const totalUpdate =
      plan.wallets.update.length +
      plan.transactions.update.length +
      plan.subscriptions.update.length +
      plan.budgets.update.length +
      plan.categories.update.length;
    if (parts.length === 0 && totalSkip === 0 && totalDropped === 0)
      return 'No importable data found.';
    let summary = parts.length > 0 ? `Add: ${parts.join(', ')}` : 'Nothing to add';
    if (totalSkip > 0) summary += ` | Skip: ${totalSkip} existing`;
    if (totalUpdate > 0) summary += ` | Overwrite: ${totalUpdate}`;
    if (totalDropped > 0) summary += ` | Dropped: ${totalDropped} invalid`;
    if (plan.replace) summary = `Replace all data → ${summary}`;
    if (plan.currencyWarning) summary += ` | ${plan.currencyWarning}`;
    return summary;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="Import" showBack onLeftPress={() => navigateTab('profile')} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled">
        {/* ── What to import ── */}
        <View className="mb-4 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-4 text-sm font-medium text-muted">What to import</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {DATA_TYPES.map((dt) => {
              const active = selectedTypes.includes(dt.key);
              return (
                <TouchableOpacity
                  key={dt.key}
                  onPress={() => toggleType(dt.key)}
                  activeOpacity={0.75}
                  className={`flex-row items-center gap-2 rounded-full border px-4 py-2.5 ${
                    active
                      ? 'border-primary bg-primary'
                      : 'border-gray-200 bg-transparent dark:border-gray-800'
                  }`}>
                  <Icon
                    as={dt.icon}
                    size={16}
                    className={active ? 'text-white dark:text-black' : 'text-muted'}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      active ? 'text-white dark:text-black' : 'text-foreground'
                    }`}>
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Configuration ── */}
        <View className="mb-4 gap-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <View>
            <Text className="mb-3 text-sm font-medium text-muted">Format</Text>
            <AnimatedSegment
              options={FORMATS.map((f) => ({ value: f.key, label: f.label }))}
              selectedValue={format}
              onChange={(v) => setFormat(v as ExportFormat)}
            />
          </View>

          <View>
            <Text className="mb-3 text-sm font-medium text-muted">Import mode</Text>
            <AnimatedSegment
              options={IMPORT_MODES.map((m) => ({ value: m.key, label: m.label }))}
              selectedValue={importMode}
              onChange={(v) => setImportMode(v as ImportMode)}
            />
          </View>

          <View>
            <Text className="mb-3 text-sm font-medium text-muted">If data already exists</Text>
            <AnimatedSegment
              options={CONFLICT_POLICIES.map((cp) => ({ value: cp.key, label: cp.label }))}
              selectedValue={conflictPolicy}
              onChange={(v) => setConflictPolicy(v as ConflictPolicy)}
            />
          </View>
        </View>

        {/* ── Attach File ── */}
        <View className="mb-4 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-4 text-sm font-medium text-muted">Data Source</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePickFile}
            className="flex-row items-center gap-3 py-1">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
              <Icon as={FileUp} size={18} className="text-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {selectedFile ? selectedFile.name : 'Select a file to import'}
              </Text>
              <Text className="text-sm font-medium text-muted">
                {selectedFile ? 'Tap to change file' : 'Browse your device'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Import button ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleImportAction}
          disabled={
            importing ||
            parsing ||
            selectedTypes.length === 0 ||
            !selectedFile ||
            !pendingPlan ||
            getPlanTotalRecords(pendingPlan) === 0
          }
          className={`mb-4 flex-row items-center justify-center gap-2 rounded-full py-4 ${
            importing ||
            parsing ||
            selectedTypes.length === 0 ||
            !selectedFile ||
            !pendingPlan ||
            getPlanTotalRecords(pendingPlan) === 0
              ? 'bg-gray-200 dark:bg-gray-800'
              : 'bg-primary'
          }`}>
          <Icon
            as={FileUp}
            size={18}
            className={
              importing ||
              parsing ||
              selectedTypes.length === 0 ||
              !selectedFile ||
              !pendingPlan ||
              getPlanTotalRecords(pendingPlan) === 0
                ? 'text-muted'
                : 'text-white dark:text-black'
            }
          />
          <Text
            className={`text-base font-semibold ${
              importing ||
              parsing ||
              selectedTypes.length === 0 ||
              !selectedFile ||
              !pendingPlan ||
              getPlanTotalRecords(pendingPlan) === 0
                ? 'text-muted'
                : 'text-white dark:text-black'
            }`}>
            {parsing
              ? 'Parsing file...'
              : importing
                ? 'Importing...'
                : selectedFile && pendingPlan && getPlanTotalRecords(pendingPlan) === 0
                  ? 'No Data to Import'
                  : 'Import'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={showConfirm}
        icon={getPlanTotalRecords(pendingPlan) === 0 ? AlertTriangle : FileUp}
        title={getPlanTotalRecords(pendingPlan) === 0 ? 'No Data Found' : 'Confirm Import'}
        message={pendingPlan ? formatSummary(pendingPlan) : ''}
        confirmText={
          getPlanTotalRecords(pendingPlan) === 0
            ? 'Got it'
            : importMode === 'replace'
              ? 'Replace All'
              : 'Import'
        }
        cancelText="Cancel"
        destructive={importMode === 'replace'}
        hideCancel={getPlanTotalRecords(pendingPlan) === 0}
        onConfirm={
          getPlanTotalRecords(pendingPlan) === 0
            ? () => {
                setShowConfirm(false);
                setPendingPlan(null);
              }
            : handleConfirmImport
        }
        onCancel={() => {
          setShowConfirm(false);
          setPendingPlan(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}
