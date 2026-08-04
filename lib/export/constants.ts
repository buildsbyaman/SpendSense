import {
  Wallet,
  Repeat,
  ArrowUpDown,
  PiggyBank,
  Tags,
  FileDown,
  Download,
  CircleDashed,
  FileJson,
  FileSpreadsheet,
  File,
  UserRound,
} from 'lucide-react-native';
import { type ExportType } from './buildExportData';
import { type ExportFormat } from './download';

export const DATA_TYPES: { key: ExportType; label: string; icon: any }[] = [
  { key: 'transactions', label: 'Transactions', icon: ArrowUpDown },
  { key: 'subscriptions', label: 'Subscriptions', icon: Repeat },
  { key: 'wallets', label: 'Wallets', icon: Wallet },
  { key: 'balances', label: 'Balances', icon: CircleDashed },
  { key: 'budgets', label: 'Budgets', icon: PiggyBank },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'profile', label: 'Profile', icon: UserRound },
  { key: 'alldata', label: 'All Data', icon: FileDown },
];

export const FORMATS: { key: ExportFormat; label: string; ext: string; icon: any }[] = [
  { key: 'pdf', label: 'PDF', ext: '.pdf', icon: File },
  { key: 'json', label: 'JSON', ext: '.json', icon: FileJson },
  { key: 'xlsx', label: 'Excel', ext: '.xlsx', icon: FileSpreadsheet },
];

export { Download as ExportDownloadIcon };
