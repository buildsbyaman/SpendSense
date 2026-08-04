import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FileUp, AlertTriangle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AnimatedSegment from '@/components/ui/animated-segment';
import { LabeledSegment } from '@/components/ui/LabeledSegment';
import { ImportButton } from '@/components/import/ImportButton';
import { DataTypeChips } from '@/components/import/DataTypeChips';
import { FilePickerRow } from '@/components/import/FilePickerRow';
import * as DocumentPicker from 'expo-document-picker';

import { type ExportedTable } from '@/lib/export/buildExportData';
import { type ExportFormat } from '@/lib/export/download';
import { parseDocumentFile, MAX_IMPORT_FILE_SIZE } from '@/lib/import/parseFile';
import {
  buildImportPlan,
  type ImportMode,
  type ConflictPolicy,
  type ImportPlan,
} from '@/lib/import/merge';
import { applyImportPlan } from '@/lib/import/apply';
import { getPlanTotalRecords, formatPlanSummary } from '@/lib/import/planStats';
import { DATA_TYPES, FORMATS, IMPORT_MODES, CONFLICT_POLICIES, MIME_MAP, type ImportType } from '@/lib/import/constants';

export default function ImportScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    transactions,
    budgets,
    subscriptions,
    customCategories,
    deletedDefaultCategories,
    userProfile,
    categoryOrder,
    walletOrder,
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

  useEffect(() => {
    if (!parsedData) {
      setPendingPlan(null);
      return;
    }

    try {
      const plan = buildImportPlan(
        parsedData.tables,
        {
          accounts,
          transactions,
          budgets,
          subscriptions,
          customCategories,
          categoryOrder,
          walletOrder,
          hiddenCategories: deletedDefaultCategories,
        },
        userProfile.currencyCode,
        parsedData.meta.currency ?? null,
        selectedTypes,
        importMode,
        conflictPolicy
      );
      setPendingPlan(plan);
    } catch (err) {
      console.error('Failed to build import plan:', err);
      setPendingPlan(null);
      setSelectedFile(null);
      Toast.show({
        type: 'error',
        text1: 'Invalid File',
        text2: err instanceof Error ? err.message : 'Could not process the selected file.',
      });
    }
  }, [
    parsedData,
    accounts,
    transactions,
    budgets,
    subscriptions,
    customCategories,
    deletedDefaultCategories,
    categoryOrder,
    walletOrder,
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
      if (asset.size && asset.size > MAX_IMPORT_FILE_SIZE) {
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
        const parsed = await parseDocumentFile(asset.uri, format);
        setParsedData(parsed);
        if (parsed.meta.truncated) {
          Toast.show({
            type: 'info',
            text1: 'Large File',
            text2: 'Rows were limited to 10,000 per table / 50,000 total. Extra rows were skipped.',
          });
        }
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

  const formatSummary = useCallback((plan: ImportPlan) => formatPlanSummary(plan), []);

  const importBtnDisabled =
    importing ||
    parsing ||
    selectedTypes.length === 0 ||
    !selectedFile ||
    !pendingPlan ||
    getPlanTotalRecords(pendingPlan) === 0;

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
        <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Text className="mb-4 text-sm font-medium text-muted">What to import</Text>
          <DataTypeChips selected={selectedTypes} onToggle={toggleType} />
        </View>

        {/* ── Configuration ── */}
        <View className="mb-4 gap-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <LabeledSegment
            label="Format"
            options={FORMATS.map((f) => ({ value: f.key, label: f.label }))}
            value={format}
            onChange={(v) => setFormat(v)}
          />
          <LabeledSegment
            label="Import mode"
            options={IMPORT_MODES.map((m) => ({ value: m.key, label: m.label }))}
            value={importMode}
            onChange={(v) => setImportMode(v)}
          />
          <LabeledSegment
            label="If data already exists"
            options={CONFLICT_POLICIES.map((cp) => ({ value: cp.key, label: cp.label }))}
            value={conflictPolicy}
            onChange={(v) => setConflictPolicy(v)}
          />
        </View>

        {/* ── Attach File ── */}
        <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <Text className="mb-4 text-sm font-medium text-muted">Data Source</Text>
          <FilePickerRow file={selectedFile} onPress={handlePickFile} />
        </View>

        {/* ── Import button ── */}
        <ImportButton
          disabled={importBtnDisabled}
          parsing={parsing}
          importing={importing}
          noData={selectedFile !== null && pendingPlan !== null && getPlanTotalRecords(pendingPlan) === 0}
          onPress={handleImportAction}
        />
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
