import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Transaction, type TransactionType } from '@/utils/transaction';
import { type Subscription, type SubscriptionCycle } from '@/utils/subscription';
import { type Account } from '@/utils/wallet';
import { type Budget, type UserProfile } from '@/lib/repository';
import { type CustomCategory } from '@/utils/transaction';

export type ImportMode = 'merge' | 'replace';
export type ConflictPolicy = 'skip' | 'overwrite';

export interface ImportPlan {
  wallets: { insert: Account[]; update: Account[]; skip: number; dropped: number };
  transactions: { insert: Transaction[]; update: Transaction[]; skip: number; dropped: number };
  subscriptions: { insert: Subscription[]; update: Subscription[]; skip: number; dropped: number };
  budgets: { insert: Budget[]; update: Budget[]; skip: number; dropped: number };
  categories: { insert: CustomCategory[]; update: CustomCategory[]; skip: number; dropped: number };
  profile: { value: UserProfile | null; apply: boolean };
  categoryOrder: { expense: string[]; income: string[] } | null;
  hiddenCategories: string[] | null;
  replace: boolean;
  currencyWarning: string | null;
}

// ── Display-value parsers ──────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export function parseDisplayDate(str: string): string | null {
  const clean = str.trim().replace(/,/g, '');
  const m = clean.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month == null) return null;
  const y = parseInt(m[3]);
  const d = parseInt(m[2]);
  if (y < 2000 || y > 2100 || d < 1 || d > 31) return null;
  const ms = Date.UTC(y, month, d);
  if (isNaN(ms)) return null;
  const result = new Date(ms);
  if (result.getUTCFullYear() !== y || result.getUTCMonth() !== month || result.getUTCDate() !== d)
    return null;
  return result.toISOString();
}

export function parseDisplayAmount(str: string): number {
  const cleaned = str.replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  const num = parseFloat(cleaned);
  return isNaN(num) || num < 0 ? 0 : num;
}

function parseCycle(raw: string): SubscriptionCycle {
  const lower = raw.toLowerCase();
  if (lower === 'weekly' || lower === 'monthly' || lower === 'quarterly' || lower === 'yearly')
    return lower;
  return 'monthly';
}

function parseStatus(raw: string): number {
  return raw.toLowerCase() === 'active' ? 1 : 0;
}

// ── Table-title detection ──────────────────────────────────────────────

type TableKind =
  | 'transactions'
  | 'subscriptions'
  | 'wallets'
  | 'budgets'
  | 'categories'
  | 'balances'
  | 'profile'
  | 'categoryorder'
  | 'hiddencategories'
  | 'unknown';

function detectTable(title: string, columns: string[]): TableKind {
  const t = title.toLowerCase();
  const cols = columns.map((c) => c.toLowerCase());

  if (
    t.includes('transaction') ||
    (cols.includes('title') &&
      cols.includes('type') &&
      cols.includes('amount') &&
      cols.includes('wallet'))
  )
    return 'transactions';

  if (t.includes('subscription') || (cols.includes('cycle') && cols.includes('next billing')))
    return 'subscriptions';

  if (t.includes('wallet') || (cols.includes('number') && cols.includes('default')))
    return 'wallets';

  if (t.includes('budget') || (cols.includes('budget') && cols.includes('category')))
    return 'budgets';

  if (t.includes('profile') || (cols.includes('field') && cols.includes('value'))) return 'profile';

  if (t.includes('order') && t.includes('categor')) return 'categoryorder';

  if (t.includes('hidden') && t.includes('categor')) return 'hiddencategories';

  if (t.includes('categor') || (cols.includes('source') && cols.includes('color')))
    return 'categories';

  if (t.includes('balance') || (cols.includes('income') && cols.includes('expense')))
    return 'balances';

  return 'unknown';
}

// ── ID generation ──────────────────────────────────────────────────────

let _counter = 0;
function newId(): string {
  return `${Date.now()}-${++_counter}-${Math.random().toString(36).slice(2, 8)}`;
}

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
    replace: isReplace,
    currencyWarning: null,
  };

  // In replace mode, treat all file data as inserts (existing data will be cleared first)
  const existingAccounts = isReplace ? [] : [...current.accounts];
  const existingTxs = isReplace ? [] : [...current.transactions];
  const existingSubs = isReplace ? [] : [...current.subscriptions];
  const existingBudgets = isReplace ? [] : [...current.budgets];
  const existingCats = isReplace ? [] : [...current.customCategories];

  // Build balance lookup from any Balances table (for auto-creating wallets with correct balances)
  const balanceLookup = new Map<string, string>();
  for (const table of tables) {
    const kind = detectTable(table.title, table.columns);
    if (kind === 'balances') {
      for (const row of table.rows) {
        const walletName = String(row['Wallet'] ?? '').trim();
        const balance = String(row['Balance'] ?? '').trim();
        if (walletName) {
          balanceLookup.set(walletName.toLowerCase(), balance || '0.00');
        }
      }
      break;
    }
  }

  // Process tables in dependency order
  const sorted = [...tables].sort((a, b) => {
    const order = [
      'wallets',
      'transactions',
      'subscriptions',
      'budgets',
      'categories',
      'categoryorder',
      'hiddencategories',
      'profile',
      'balances',
      'unknown',
    ];
    return (
      order.indexOf(detectTable(a.title, a.columns)) -
      order.indexOf(detectTable(b.title, b.columns))
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
              return !v || v === '—' ? null : v;
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
      const existingExpense = [...current.categoryOrder.expense];
      const existingIncome = [...current.categoryOrder.income];
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
      const hidden: string[] = [];
      for (const row of table.rows) {
        const name = String(row['Name'] ?? '').trim();
        if (name) hidden.push(name);
      }
      plan.hiddenCategories = hidden;
      continue;
    }

    if (!want(kind)) continue;

    if (kind === 'wallets') {
      let defaultFound = false;
      for (const row of table.rows) {
        const name = String(row['Name'] ?? '').trim();
        const number = String(row['Number'] ?? '').trim();
        const type = String(row['Type'] ?? 'Bank').trim();
        const balance = String(row['Balance'] ?? '0').trim();
        let isDefault = String(row['Default'] ?? '').toLowerCase() === 'yes';
        if (!name) {
          plan.wallets.dropped++;
          continue;
        }

        // Enforce single default wallet
        if (isDefault) {
          if (defaultFound) {
            isDefault = false;
          } else {
            defaultFound = true;
          }
        }

        const existing = existingAccounts.find(
          (a) =>
            a.name.toLowerCase() === name.toLowerCase() &&
            (a.number || number ? a.number === number : true)
        );
        if (existing) {
          if (conflict === 'overwrite') {
            const updated = { ...existing, name, number, type, balance, isDefault };
            plan.wallets.update.push(updated);
            existingAccounts.splice(existingAccounts.indexOf(existing), 1, updated);
          } else {
            plan.wallets.skip++;
          }
        } else {
          const newAcc: Account = {
            id: newId(),
            name,
            number,
            balance,
            type,
            isDefault,
            icon: undefined as any,
          };
          plan.wallets.insert.push(newAcc);
          existingAccounts.push(newAcc);
        }
      }
    }

    if (kind === 'transactions') {
      for (const row of table.rows) {
        const title = String(row['Title'] ?? '').trim();
        const category = String(row['Category'] ?? '').trim();
        const typeStr = String(row['Type'] ?? '')
          .trim()
          .toLowerCase();
        const amountStr = String(row['Amount'] ?? '0');
        const dateStr = String(row['Date'] ?? '');
        const dateISO = String(row['Date ISO'] ?? '').trim();
        const walletName = String(row['Wallet'] ?? '').trim();
        if (!title || !typeStr || (typeStr !== 'income' && typeStr !== 'expense')) {
          plan.transactions.dropped++;
          continue;
        }

        const amount = parseDisplayAmount(amountStr);
        // Prefer raw ISO date if present, fall back to parsed display date
        const parsedISO = typeof row['Date ISO'] === 'string' ? dateISO : '';
        const dateISOValid =
          parsedISO &&
          !isNaN(new Date(parsedISO).getTime()) &&
          new Date(parsedISO).getFullYear() >= 2000;
        const date = dateISOValid ? parsedISO : parseDisplayDate(dateStr);
        if (!date) {
          plan.transactions.dropped++;
          continue;
        }

        const walletId = resolveWallet(walletName, existingAccounts, plan, balanceLookup);
        if (!walletId) {
          plan.transactions.dropped++;
          continue;
        }

        const tx: Transaction = {
          id: newId(),
          title,
          amount,
          type: typeStr as TransactionType,
          category,
          date,
          walletId,
        };

        const existing = existingTxs.find(
          (e) =>
            e.title === tx.title &&
            Math.abs(e.amount - tx.amount) < 0.01 &&
            e.category === tx.category &&
            e.date.slice(0, 10) === tx.date.slice(0, 10) &&
            e.walletId === tx.walletId
        );
        if (existing) {
          if (conflict === 'overwrite') {
            plan.transactions.update.push({ ...tx, id: existing.id });
            existingTxs.splice(existingTxs.indexOf(existing), 1);
          } else {
            plan.transactions.skip++;
          }
        } else {
          plan.transactions.insert.push(tx);
        }
      }
    }

    if (kind === 'subscriptions') {
      for (const row of table.rows) {
        const name = String(row['Name'] ?? '').trim();
        const amountStr = String(row['Amount'] ?? '0');
        const cycleStr = String(row['Cycle'] ?? 'monthly');
        const category = String(row['Category'] ?? '').trim();
        const nextBillingISO = String(row['Next Billing ISO'] ?? '');
        const nextBillingStr = String(row['Next Billing'] ?? '');
        const statusStr = String(row['Status'] ?? 'Active');
        const endDateISO = String(row['End Date ISO'] ?? '');
        const endDateStr = String(row['End Date'] ?? '');
        const walletName = String(row['Wallet'] ?? '').trim();
        if (!name) {
          plan.subscriptions.dropped++;
          continue;
        }

        const amount = parseDisplayAmount(amountStr);

        // Prefer ISO columns for lossless round-trip
        let next_billing_date: string | null = null;
        if (nextBillingISO && !isNaN(new Date(nextBillingISO).getTime())) {
          next_billing_date = new Date(nextBillingISO).toISOString();
        } else if (nextBillingStr) {
          next_billing_date = parseDisplayDate(nextBillingStr);
        }
        if (!next_billing_date) {
          plan.subscriptions.dropped++;
          continue;
        }

        let end_date: string | null = null;
        if (endDateISO && endDateISO !== 'null' && !isNaN(new Date(endDateISO).getTime())) {
          end_date = new Date(endDateISO).toISOString();
        } else if (endDateStr && endDateStr !== '—') {
          end_date = parseDisplayDate(endDateStr);
        }

        // Wallet: resolve by name (new Column), fallback to default
        const walletId = walletName
          ? resolveWallet(walletName, existingAccounts, plan, balanceLookup)
          : resolveWalletDefault(existingAccounts, plan, balanceLookup);
        if (!walletId) {
          plan.subscriptions.dropped++;
          continue;
        }

        const sub: Subscription = {
          id: newId(),
          name,
          amount,
          cycle: parseCycle(cycleStr),
          category,
          wallet_id: walletId,
          next_billing_date,
          is_active: parseStatus(statusStr),
          end_date,
        };

        const existing = existingSubs.find(
          (e) =>
            e.name.toLowerCase() === sub.name.toLowerCase() &&
            Math.abs(e.amount - sub.amount) < 0.01 &&
            e.cycle === sub.cycle &&
            e.wallet_id === sub.wallet_id
        );
        if (existing) {
          if (conflict === 'overwrite') {
            plan.subscriptions.update.push({ ...sub, id: existing.id });
            existingSubs.splice(existingSubs.indexOf(existing), 1);
          } else {
            plan.subscriptions.skip++;
          }
        } else {
          plan.subscriptions.insert.push(sub);
        }
      }
    }

    if (kind === 'budgets') {
      for (const row of table.rows) {
        const category = String(row['Category'] ?? '').trim();
        const budgetStr = String(row['Budget'] ?? '0');
        if (!category) {
          plan.budgets.dropped++;
          continue;
        }

        const amount = parseDisplayAmount(budgetStr);
        const budget: Budget = { id: newId(), category, amount };

        const existing = existingBudgets.find(
          (e) => e.category.toLowerCase() === budget.category.toLowerCase()
        );
        if (existing) {
          if (conflict === 'overwrite') {
            plan.budgets.update.push({ ...budget, id: existing.id });
            existingBudgets.splice(existingBudgets.indexOf(existing), 1);
          } else {
            plan.budgets.skip++;
          }
        } else {
          plan.budgets.insert.push(budget);
        }
      }
    }

    if (kind === 'categories') {
      for (const row of table.rows) {
        const source = String(row['Source'] ?? '').trim();
        if (source !== 'Custom') continue;
        const typeStr = String(row['Type'] ?? '')
          .trim()
          .toLowerCase();
        const name = String(row['Name'] ?? '').trim();
        const colorStr = String(row['Color'] ?? '').trim();
        const iconStr = String(row['Icon'] ?? '').trim();
        if (!name || !typeStr) {
          plan.categories.dropped++;
          continue;
        }

        const cat: CustomCategory = {
          id: newId(),
          name,
          type: typeStr as TransactionType,
          color: colorStr && colorStr !== '—' ? colorStr : undefined,
          icon: iconStr && iconStr !== '—' ? iconStr : undefined,
        };

        const existing = existingCats.find(
          (e) => e.name.toLowerCase() === cat.name.toLowerCase() && e.type === cat.type
        );
        if (existing) {
          if (conflict === 'overwrite') {
            plan.categories.update.push({ ...cat, id: existing.id });
            existingCats.splice(existingCats.indexOf(existing), 1);
          } else {
            plan.categories.skip++;
          }
        } else {
          plan.categories.insert.push(cat);
        }
      }
    }
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

function resolveWallet(
  walletName: string,
  accounts: Account[],
  plan: ImportPlan,
  balanceLookup: Map<string, string>
): string | null {
  if (!walletName) {
    const existing = accounts[0];
    if (existing) return existing.id;
    if (plan.wallets.insert.length > 0) return plan.wallets.insert[0].id;
    return null;
  }
  const lower = walletName.toLowerCase();
  const found = accounts.find((a) => a.name.toLowerCase() === lower);
  if (found) return found.id;
  const inserting = plan.wallets.insert.find((a) => a.name.toLowerCase() === lower);
  if (inserting) return inserting.id;
  // Auto-create missing wallet — use balance from Balances table if available
  const balance = balanceLookup.get(lower) ?? '0.00';
  const newAcc: Account = {
    id: newId(),
    name: walletName,
    number: walletName,
    type: 'Bank',
    balance,
    isDefault: false,
    icon: undefined as any,
  };
  plan.wallets.insert.push(newAcc);
  accounts.push(newAcc);
  return newAcc.id;
}

function resolveWalletDefault(
  accounts: Account[],
  plan: ImportPlan,
  balanceLookup: Map<string, string>
): string {
  const defaultAcc = accounts.find((a) => a.isDefault);
  if (defaultAcc) return defaultAcc.id;
  if (plan.wallets.insert.length > 0) return plan.wallets.insert[0].id;
  if (accounts.length > 0) return accounts[0].id;
  return '';
}
