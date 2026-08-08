import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Transaction } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import { type Account, formatWalletBalance } from '@/utils/wallet';
import { type Budget, type UserProfile } from '@/lib/repository';
import { type CustomCategory } from '@/utils/transaction';
import { sanitizeImportedAvatar } from '@/utils/avatar';
import { detectTable, TABLE_PROCESS_ORDER } from './table-kind';
import {
  type ImportMode,
  type ConflictPolicy,
  type ImportPlan,
  type PlanContext,
} from './plans/types';
import { processWalletsTable } from './plans/wallets';
import { processTransactionsTable } from './plans/transactions';
import { processSubscriptionsTable } from './plans/subscriptions';
import { processBudgetsTable } from './plans/budgets';
import { processCategoriesTable } from './plans/categories';

export type { ImportMode, ConflictPolicy, ImportPlan, PlanContext } from './plans/types';

// ── Main builder ───────────────────────────────────────────────────────

export function buildImportPlan(
  tables: ExportedTable[],
  current: {
    accounts: Account[];
    transactions: Transaction[];
    subscriptions: Subscription[];
    budgets: Budget[];
    customCategories: CustomCategory[];
    categoryOrder: { expense: string[]; income: string[] };
    hiddenCategories?: string[];
    walletOrder?: string[];
  },
  currentCurrency: string,
  importedCurrency: string | null,
  selectedTypes: string[],
  mode: ImportMode,
  conflict: ConflictPolicy
): ImportPlan {
  const wantAll = selectedTypes.includes('alldata');
  const want = (kind: string) => wantAll || selectedTypes.includes(kind);

  const isReplace = mode === 'replace';

  const plan: ImportPlan = {
    wallets: { insert: [], update: [], skip: 0, dropped: 0 },
    transactions: { insert: [], update: [], skip: 0, dropped: 0 },
    subscriptions: { insert: [], update: [], skip: 0, dropped: 0 },
    budgets: { insert: [], update: [], skip: 0, dropped: 0 },
    categories: { insert: [], update: [], skip: 0, dropped: 0 },
    profile: { value: null, apply: false },
    categoryOrder: null,
    hiddenCategories: null,
    walletOrder: null,
    replace: isReplace,
    replaceTypes: isReplace ? selectedTypes.filter((t) => t !== 'alldata') : [],
    currencyWarning: null,
  };

  // In replace mode, treat all file data as inserts (existing data will be cleared first)
  const existingAccounts = isReplace ? [] : [...current.accounts];
  const existingSubs = isReplace ? [] : [...current.subscriptions];
  const existingBudgets = isReplace ? [] : [...current.budgets];
  const existingCats = isReplace ? [] : [...current.customCategories];

  // Index existing transactions by match key so plan building is O(n) instead of
  // O(n x m) (a 10k-row file against 10k existing rows would otherwise ANR).
  const existingTxsMap = new Map<string, Transaction[]>();
  if (!isReplace) {
    for (const t of current.transactions) {
      const key = `${t.title}|${t.category}|${t.date.slice(0, 10)}|${t.walletId}|${t.toWalletId ?? ''}`;
      const arr = existingTxsMap.get(key) ?? [];
      arr.push(t);
      existingTxsMap.set(key, arr);
    }
  }

  // Defense against crafted files: drop null / primitive rows before any
  // dereference (a `null` row would otherwise throw an uncaught TypeError).
  const cleanTables = tables.map((t) => ({
    ...t,
    rows: t.rows.filter((r) => r !== null && typeof r === 'object'),
  }));

  // Build balance lookup from any Balances table (for auto-creating wallets with correct balances)
  const balanceLookup = new Map<string, string>();
  for (const table of cleanTables) {
    const kind = detectTable(table.title, table.columns);
    if (kind === 'balances') {
      for (const row of table.rows) {
        const walletName = String(row['Wallet'] ?? '').trim();
        const rawBalance = String(row['Balance'] ?? '').trim();
        if (walletName) {
          const parsed = rawBalance ? parseFloat(rawBalance.replace(/[^0-9.-]/g, '')) : NaN;
          balanceLookup.set(
            walletName.toLowerCase(),
            isFinite(parsed) ? formatWalletBalance(parsed.toString()) : '0.00'
          );
        }
      }
      break;
    }
  }

  const ctx: PlanContext = {
    plan,
    conflict,
    isReplace,
    existingAccounts,
    existingSubs,
    existingBudgets,
    existingCats,
    existingTxsMap,
    balanceLookup,
  };

  // Process tables in dependency order
  const sorted = [...cleanTables].sort((a, b) => {
    return (
      TABLE_PROCESS_ORDER.indexOf(detectTable(a.title, a.columns)) -
      TABLE_PROCESS_ORDER.indexOf(detectTable(b.title, b.columns))
    );
  });

  for (const table of sorted) {
    const kind = detectTable(table.title, table.columns);
    if (kind === 'balances' || kind === 'unknown') continue;

    // Profile: always restore when selected and table present
    if (kind === 'profile' && want('profile')) {
      const map = new Map<string, string>();
      for (const row of table.rows) {
        map.set(String(row['Field'] ?? '').trim(), String(row['Value'] ?? '').trim());
      }
      const name = map.get('Name');
      if (name) {
        plan.profile = {
          value: {
            name,
            currencySymbol: map.get('Currency Symbol') || '$',
            currencyCode: map.get('Currency Code') || importedCurrency || 'USD',
            avatar: (() => {
              const v = map.get('Avatar');
              if (!v || v === '—') return null;
              // Only self-contained image data URIs are accepted (rejects
              // remote URLs, non-image payloads, and oversized base64).
              return sanitizeImportedAvatar(v);
            })(),
            hasOnboarded: true,
          },
          apply: true,
        };
      }
      continue;
    }

    // Category order: merge file order with existing order (append new names)
    if (kind === 'categoryorder' && want('categories')) {
      // In replace mode, only use file order (existing is cleared by apply.ts)
      const existingExpense = isReplace ? [] : [...current.categoryOrder.expense];
      const existingIncome = isReplace ? [] : [...current.categoryOrder.income];
      const fileExpense: string[] = [];
      const fileIncome: string[] = [];
      for (const row of table.rows) {
        const type = String(row['Type'] ?? '')
          .toLowerCase()
          .trim();
        const name = String(row['Name'] ?? '').trim();
        if (!name) continue;
        if (type === 'expense') fileExpense.push(name);
        else if (type === 'income') fileIncome.push(name);
      }
      // Merge: file order first, then append existing names not in file
      const mergedExpense = [
        ...fileExpense,
        ...existingExpense.filter((n) => !fileExpense.includes(n)),
      ];
      const mergedIncome = [
        ...fileIncome,
        ...existingIncome.filter((n) => !fileIncome.includes(n)),
      ];
      plan.categoryOrder = { expense: mergedExpense, income: mergedIncome };
      continue;
    }

    // Hidden categories: apply when categories selected
    if (kind === 'hiddencategories' && want('categories')) {
      const fileHidden: string[] = [];
      for (const row of table.rows) {
        const name = String(row['Name'] ?? '').trim();
        if (name) fileHidden.push(name);
      }
      // In merge mode, combine with existing; in replace mode, file list is authoritative
      const existingHidden = isReplace ? [] : (current.hiddenCategories ?? []);
      plan.hiddenCategories = [...new Set([...existingHidden, ...fileHidden])];
      continue;
    }

    // Wallet order: merge file order with existing order (append new names)
    if (kind === 'walletorder' && want('wallets')) {
      const existingOrder = isReplace ? [] : (current.walletOrder ?? []);
      const fileOrder: string[] = [];
      for (const row of table.rows) {
        const name = String(row['Name'] ?? '').trim();
        if (name) fileOrder.push(name);
      }
      // Merge: file order first, then append existing names not in file (preserving order)
      const merged = [...fileOrder, ...existingOrder.filter((n) => !fileOrder.includes(n))];
      plan.walletOrder = merged;
      continue;
    }

    if (!want(kind)) continue;

    if (kind === 'wallets') processWalletsTable(table, ctx);
    else if (kind === 'transactions') processTransactionsTable(table, ctx);
    else if (kind === 'subscriptions') processSubscriptionsTable(table, ctx);
    else if (kind === 'budgets') processBudgetsTable(table, ctx);
    else if (kind === 'categories') processCategoriesTable(table, ctx);
  }

  // Currency warning: always warn when currencies differ
  if (importedCurrency && importedCurrency !== currentCurrency) {
    if (plan.profile.apply) {
      plan.currencyWarning = `File uses ${importedCurrency}, app will switch to ${importedCurrency}. Existing data remains in ${currentCurrency}.`;
    } else {
      plan.currencyWarning = `File was exported with currency ${importedCurrency}, your app uses ${currentCurrency}. Amounts imported as-is.`;
    }
  }

  return plan;
}
