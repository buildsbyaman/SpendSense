import {
  ArrowUpDown,
  Repeat,
  Wallet,
  PiggyBank,
  Tags,
  FileDown,
  File,
  FileJson,
  FileSpreadsheet,
  Shuffle,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  UserRound,
} from 'lucide-react-native';
import { type ExportType } from '@/lib/export/buildExportData';
import { type ExportFormat } from '@/lib/export/download';
import { type ImportMode, type ConflictPolicy } from './merge';

export type ImportType = ExportType;

export const DATA_TYPES: { key: ImportType; label: string; icon: any }[] = [
  { key: 'transactions', label: 'Transactions', icon: ArrowUpDown },
  { key: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  { key: 'wallets', label: 'Wallets', icon: Wallet },
  { key: 'budgets', label: 'Budgets', icon: PiggyBank },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'alldata', label: 'All Data', icon: FileDown },
];

export const FORMATS: { key: ExportFormat; label: string; icon: any }[] = [
  { key: 'pdf', label: 'PDF', icon: File },
  { key: 'json', label: 'JSON', icon: FileJson },
  { key: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
];

export const IMPORT_MODES: { key: ImportMode; label: string; icon: any; destructive?: boolean }[] = [
  { key: 'merge', label: 'Merge', icon: Shuffle },
  { key: 'replace', label: 'Replace', icon: RotateCcw, destructive: true },
];

export const CONFLICT_POLICIES: { key: ConflictPolicy; label: string; icon: any }[] = [
  { key: 'skip', label: 'Skip Existing', icon: ShieldCheck },
  { key: 'overwrite', label: 'Overwrite', icon: AlertTriangle },
];

export const MIME_MAP: Record<ExportFormat, string> = {
  json: 'application/json',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};
