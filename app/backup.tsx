import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  Cloud,
  CloudUpload,
  RefreshCw,
  Trash2,
  Lock,
  LogOut,
  ShieldCheck,
  Info,
  Download,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PasswordModal } from '@/components/backup/PasswordModal';

import { buildExportData, type ExportedTable } from '@/lib/export/buildExportData';
import { type ExportSelection } from '@/lib/export/buildExportData';
import { buildBackupContent } from '@/lib/backup/build';
import { detectBackup, type BackupParseResult } from '@/lib/backup/format';
import { isDriveConfigured } from '@/lib/backup/config';
import {
  signInToDrive,
  getDriveAccount,
  isSignedInToDrive,
  signOutOfDrive,
  type DriveAccount,
} from '@/lib/drive/client';
import {
  listDriveBackups,
  uploadDriveBackup,
  downloadDriveBackup,
  deleteDriveBackup,
  type DriveBackupFile,
} from '@/lib/drive/backup';
import { parseJson } from '@/lib/import/parse';
import { buildImportPlan, type ImportPlan } from '@/lib/import/merge';
import { applyImportPlan } from '@/lib/import/apply';
import { getPlanTotalRecords, formatPlanSummary } from '@/lib/import/planStats';

interface PendingRestore {
  plan: ImportPlan;
  file: DriveBackupFile;
}

interface RestoreSource {
  file: DriveBackupFile;
  detected: Extract<BackupParseResult, { encrypted: true }>;
}

function formatBackupDate(createdTime: string | null): string {
  if (!createdTime) return 'Unknown date';
  const d = new Date(createdTime);
  if (isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleString();
}

function formatBytes(size: string | null): string {
  const n = parseInt(size ?? '', 10);
  if (!isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const BACKUP_SELECTION: ExportSelection = {
  types: ['alldata'],
  period: { mode: 'all' },
  format: 'json',
};

// Restore always replaces the full database. The concrete list (rather than
// 'alldata') is deliberate: buildImportPlan strips 'alldata' from replaceTypes,
// and applyImportPlan only clears tables when replaceTypes is non-empty.
const RESTORE_TYPES = ['wallets', 'transactions', 'subscriptions', 'budgets', 'categories', 'profile'];

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { navigate: navigateTab } = useTabNavigation();
  const {
    accounts,
    transactions,
    budgets,
    subscriptions,
    customCategories,
    deletedDefaultCategories,
    categoryOrder,
    walletOrder,
    userProfile,
    refreshAllData,
  } = useApp();

  const configured = isDriveConfigured();

  const [account, setAccount] = useState<DriveAccount | null>(null);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [listing, setListing] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordMode, setPasswordMode] = useState<'create' | 'enter'>('create');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [encryptTarget, setEncryptTarget] = useState<string | null>(null);

  const [restoreSource, setRestoreSource] = useState<RestoreSource | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DriveBackupFile | null>(null);

  const tables = useMemo<ExportedTable[]>(
    () =>
      buildExportData(BACKUP_SELECTION, {
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

  const loadBackups = useCallback(async () => {
    setListing(true);
    try {
      const files = await listDriveBackups();
      setBackups(files);
    } catch {
      setBackups([]);
    } finally {
      setListing(false);
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setListing(false);
      return;
    }
    (async () => {
      setListing(true);
      try {
        if (await isSignedInToDrive()) {
          setAccount(await getDriveAccount());
          try {
            const files = await listDriveBackups();
            setBackups(files);
          } catch {
            setAccount(null);
          }
        }
      } catch {
        setAccount(null);
      } finally {
        setListing(false);
      }
    })();
  }, [configured]);

  const handleConnect = useCallback(async () => {
    setSigningIn(true);
    try {
      await signInToDrive();
      const acct = await getDriveAccount();
      setAccount(acct);
      await loadBackups();
      Toast.show({
        type: 'success',
        text1: 'Google Drive Connected',
        text2: acct?.email ? `Signed in as ${acct.email}` : 'Backups will be saved to your Drive.',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2: err instanceof Error ? err.message : 'Could not connect to Google Drive.',
      });
    } finally {
      setSigningIn(false);
    }
  }, [loadBackups]);

  const runBackup = useCallback(
    async (password: string | null) => {
      setBackingUp(true);
      try {
        if (totalRows === 0) {
          Toast.show({
            type: 'error',
            text1: 'No Data',
            text2: 'There is no data to back up yet.',
          });
          return;
        }
        const content = await buildBackupContent(
          tables,
          { name: userProfile.name, currencyCode: userProfile.currencyCode },
          password ?? undefined
        );
        await uploadDriveBackup(content);
        await loadBackups();
        Toast.show({
          type: 'success',
          text1: 'Backup Complete',
          text2: password
            ? 'Encrypted backup saved to Google Drive.'
            : `${content.filename} saved to Google Drive.`,
        });
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Backup Failed',
          text2: err instanceof Error ? err.message : 'Something went wrong.',
        });
      } finally {
        setBackingUp(false);
      }
    },
    [tables, totalRows, userProfile, loadBackups]
  );

  const handleBackupNow = useCallback(() => {
    void runBackup(null);
  }, [runBackup]);

  const handleEncryptedBackup = useCallback(() => {
    setPasswordMode('create');
    setPasswordError(null);
    setEncryptTarget('backup');
    setPasswordVisible(true);
  }, []);

  const handleBackupPasswordSubmit = useCallback(
    (password: string) => {
      if (encryptTarget === 'backup') {
        setPasswordVisible(false);
        void runBackup(password);
      }
    },
    [encryptTarget, runBackup]
  );

  const buildRestorePlan = useCallback(
    (innerJson: string, file: DriveBackupFile) => {
      try {
        const parsed = parseJson(innerJson);
        if (parsed.meta.truncated) {
          Toast.show({
            type: 'info',
            text1: 'Large Backup',
            text2:
              'Rows were limited to 100,000 per table / 500,000 total. Extra rows were skipped.',
          });
        }
        const plan = buildImportPlan(
          parsed.tables,
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
          parsed.meta.currency ?? null,
          RESTORE_TYPES,
          'replace',
          'skip'
        );
        if (getPlanTotalRecords(plan) === 0) {
          Toast.show({
            type: 'error',
            text1: 'No Data Found',
            text2: 'This backup does not contain any importable data.',
          });
          return;
        }
        setPendingRestore({ plan, file });
        setShowRestoreConfirm(true);
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Invalid Backup',
          text2: 'This file does not appear to be a valid SpendSense backup.',
        });
      }
    },
    [
      accounts,
      transactions,
      budgets,
      subscriptions,
      customCategories,
      categoryOrder,
      walletOrder,
      deletedDefaultCategories,
      userProfile.currencyCode,
    ]
  );

  const startRestore = useCallback(
    async (file: DriveBackupFile) => {
      setBusyAction(`restore-${file.id}`);
      try {
        const content = await downloadDriveBackup(file.id);
        const detected = detectBackup(content);
        if (detected.encrypted) {
          setRestoreSource({ file, detected });
          setPasswordMode('enter');
          setPasswordError(null);
          setEncryptTarget('restore');
          setPasswordVisible(true);
        } else {
          buildRestorePlan(detected.innerJson, file);
        }
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Download Failed',
          text2: err instanceof Error ? err.message : 'Could not download the backup.',
        });
      } finally {
        setBusyAction(null);
      }
    },
    [buildRestorePlan]
  );

  const handleRestorePasswordSubmit = useCallback(
    async (password: string) => {
      if (!restoreSource) return;
      setPasswordBusy(true);
      setPasswordError(null);
      try {
        const innerJson = await restoreSource.detected.decrypt(password);
        setPasswordVisible(false);
        buildRestorePlan(innerJson, restoreSource.file);
      } catch {
        setPasswordError('Incorrect password. This backup cannot be decrypted.');
      } finally {
        setPasswordBusy(false);
      }
    },
    [restoreSource, buildRestorePlan]
  );

  const handleConfirmRestore = useCallback(async () => {
    if (!pendingRestore) return;
    setShowRestoreConfirm(false);
    setBusyAction('restoring');
    try {
      await applyImportPlan(pendingRestore.plan);
      await refreshAllData();
      Toast.show({
        type: 'success',
        text1: 'Restore Complete',
        text2: `Restored from ${pendingRestore.file.name}`,
      });
      navigateTab('profile');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Restore Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setBusyAction(null);
      setPendingRestore(null);
    }
  }, [pendingRestore, refreshAllData, navigateTab]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const file = deleteTarget;
    setDeleteTarget(null);
    setBusyAction(`delete-${file.id}`);
    try {
      await deleteDriveBackup(file.id);
      await loadBackups();
      Toast.show({
        type: 'success',
        text1: 'Backup Deleted',
        text2: file.name,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setBusyAction(null);
    }
  }, [deleteTarget, loadBackups]);

  const handleSignOut = useCallback(async () => {
    await signOutOfDrive();
    setAccount(null);
    setBackups([]);
    Toast.show({
      type: 'success',
      text1: 'Signed Out',
      text2: 'Google Drive is no longer connected.',
    });
  }, []);

  const busy = busyAction !== null || backingUp || signingIn;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="Backup" showBack onLeftPress={() => navigateTab('profile')} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled">
        {!configured && (
          <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Icon as={Info} size={22} className="text-primary" />
            </View>
            <Text className="mb-2 text-base font-semibold text-foreground">
              Google Drive needs one-time setup
            </Text>
            <Text className="text-sm leading-5 text-muted">
              Backup is disabled until a Google OAuth client ID is added in{' '}
              <Text className="font-medium text-foreground">lib/backup/config.ts</Text>.
              Instructions are included in that file: create a free Google Cloud project, enable
              the Drive API, and add an Android OAuth client with package{' '}
              <Text className="font-medium text-foreground">com.buildsbyaman.spendsense</Text>.
            </Text>
          </View>
        )}

        {/* ── Google Drive ── */}
        <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Icon as={Cloud} size={18} className="text-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">Google Drive</Text>
              <Text className="text-xs text-muted">
                {account
                  ? `Backed up as ${account.email ?? 'Google account'}`
                  : configured
                    ? 'Not connected'
                    : 'Unavailable'}
              </Text>
            </View>
            {configured && account && (
              <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7} className="p-1.5">
                <Icon as={LogOut} size={18} className="text-muted" />
              </TouchableOpacity>
            )}
          </View>

          {configured && !account && (
            <TouchableOpacity
              onPress={handleConnect}
              disabled={signingIn || busy}
              activeOpacity={0.8}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4">
              {signingIn ? (
                <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
              ) : (
                <Icon as={CloudUpload} size={18} className="text-white dark:text-black" />
              )}
              <Text className="text-base font-medium text-white dark:text-black">
                {signingIn ? 'Connecting…' : 'Connect Google Drive'}
              </Text>
            </TouchableOpacity>
          )}

          {configured && account && (
            <>
              <TouchableOpacity
                onPress={handleBackupNow}
                disabled={backingUp || busy}
                activeOpacity={0.8}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4">
                {backingUp ? (
                  <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
                ) : (
                  <Icon as={CloudUpload} size={18} className="text-white dark:text-black" />
                )}
                <Text className="text-base font-medium text-white dark:text-black">
                  {backingUp ? 'Backing up…' : 'Back up now'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEncryptedBackup}
                disabled={backingUp || busy}
                activeOpacity={0.8}
                className="mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3.5">
                <Icon as={Lock} size={16} className="text-foreground" />
                <Text className="text-sm font-medium text-foreground">Back up with password</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Restore ── */}
        <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-muted">Restore from a backup</Text>
            {configured && account && (
              <TouchableOpacity onPress={loadBackups} disabled={listing || busy} activeOpacity={0.7}>
                <Icon as={RefreshCw} size={16} className="text-muted" />
              </TouchableOpacity>
            )}
          </View>

          {!configured && (
            <Text className="text-sm text-muted">Connect Google Drive to view backups.</Text>
          )}

          {configured && !account && (
            <Text className="text-sm text-muted">
              Backups stored on your Drive appear here after you connect.
            </Text>
          )}

          {configured && account && listing && (
            <View className="flex-row items-center justify-center py-6">
              <ActivityIndicator color={colorScheme === 'dark' ? '#fff' : '#000'} />
            </View>
          )}

          {configured && account && !listing && backups.length === 0 && (
            <View className="items-center py-6">
              <Icon as={Cloud} size={28} className="mb-2 text-muted" />
              <Text className="text-sm text-muted">No backups on this Drive account yet.</Text>
            </View>
          )}

          {configured &&
            account &&
            !listing &&
            backups.map((file) => (
              <View
                key={file.id}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
                  <Icon as={ShieldCheck} size={16} className="text-foreground" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text className="text-xs text-muted">
                    {formatBackupDate(file.createdTime)}
                    {formatBytes(file.size) ? ` · ${formatBytes(file.size)}` : ''}
                  </Text>
                </View>
                {busyAction === `delete-${file.id}` || busyAction === `restore-${file.id}` ? (
                  <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#fff' : '#000'} />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        void startRestore(file);
                      }}
                      disabled={busy}
                      activeOpacity={0.7}
                      className="rounded-lg bg-primary/10 px-3 py-2 dark:bg-primary/20">
                      <Text className="text-xs font-semibold text-primary">Restore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeleteTarget(file)}
                      disabled={busy}
                      activeOpacity={0.7}
                      className="p-2">
                      <Icon as={Trash2} size={16} className="text-muted" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}

          {busyAction === 'restoring' && (
            <View className="mt-4 flex-row items-center justify-center gap-2 py-2">
              <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#fff' : '#000'} />
              <Text className="text-sm text-muted">Restoring…</Text>
            </View>
          )}
        </View>

        {/* ── Info ── */}
        <View className="rounded-xl border border-border bg-surface p-6 shadow-xs">
          <View className="mb-3 flex-row items-center gap-2">
            <Icon as={ShieldCheck} size={16} className="text-primary" />
            <Text className="text-sm font-medium text-foreground">Privacy</Text>
          </View>
          <Text className="text-xs leading-5 text-muted">
            Backups are stored in your own Google Drive under the{' '}
            <Text className="font-medium text-foreground">drive.file</Text> scope, so SpendSense can
            only see the files it creates. Password-protected backups are encrypted with AES-256
            before uploading; the password is never stored and cannot be recovered if forgotten.
            Restoring replaces all current data on this device.
          </Text>
        </View>
      </ScrollView>

      <PasswordModal
        visible={passwordVisible}
        mode={passwordMode}
        title={passwordMode === 'create' ? 'Protect your backup' : 'Enter backup password'}
        subtitle={
          passwordMode === 'create'
            ? 'A password encrypts the backup before it leaves this device.'
            : 'The backup is password-protected.'
        }
        busy={passwordBusy || backingUp}
        error={passwordError}
        onCancel={() => {
          setPasswordVisible(false);
          setPasswordError(null);
          setRestoreSource(null);
        }}
        onSubmit={passwordMode === 'create' ? handleBackupPasswordSubmit : handleRestorePasswordSubmit}
      />

      <ConfirmDialog
        visible={showRestoreConfirm}
        icon={Download}
        title="Restore Backup"
        message={
          pendingRestore
            ? `${formatPlanSummary(pendingRestore.plan)}\n\nThis will replace ALL data currently on this device.`
            : ''
        }
        confirmText="Restore"
        cancelText="Cancel"
        destructive
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setPendingRestore(null);
        }}
      />

      <ConfirmDialog
        visible={deleteTarget !== null}
        icon={Trash2}
        title="Delete Backup"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}" from your Google Drive? This cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
