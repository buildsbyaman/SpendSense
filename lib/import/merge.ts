import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Transaction, type TransactionType } from '@/utils/transaction';
import { type Subscription, type SubscriptionCycle } from '@/utils/subscription';
import { type Account } from '@/utils/wallet';
import { type Budget, type UserProfile } from '@/lib/repository';
import { type CustomCategory } from '@/utils/transaction';
import { parseBalance } from '@/utils/wallet';

export type ImportMode = 'merge' | 'replace';
export type ConflictPolicy = 'skip' | 'overwrite';

export interface ImportPlan {
  wallets: { insert: Account[]; update: Account[]; skip: number };
  transactions: { insert: Transaction[]; update: Transaction[]; skip: number };
  subscriptions: { insert: Subscription[]; update: Subscription[]; skip: number };
  budgets: { insert: Budget[]; update: Budget[]; skip: number };
  categories: { insert: CustomCategory[]; update: CustomCategory[]; skip: number };
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
  const ms = Date.UTC(y, month, d);
  if (isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function parseDisplayAmount(str: string): number {
  const cleaned = str.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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

// ── Wallet name → ID resolution ────────────────────────────────────────

function buildWalletMap(current: Account[], toInsert: Account[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const a of current) map.set(a.name.toLowerCase(), a.id);
  for (const a of toInsert) map.set(a.name.toLowerCase(), a.id);
  return map;
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
    wallets: { insert: [], update: [], skip: 0 },
    transactions: { insert: [], update: [], skip: 0 },
    subscriptions: { insert: [], update: [], skip: 0 },
    budgets: { insert: [], update: [], skip: 0 },
    categories: { insert: [], update: [], skip: 0 },
    profile: { value: null, apply: false },
    categoryOrder: null,
    hiddenCategories: null,
    replace: isReplace,
    currencyWarning: null,
  };

  const existingAccounts = [...current.accounts];
  const existingTxs = [...current.transactions];
  const existingSubs = [...current.subscriptions];
  const existingBudgets = [...current.budgets];
  const existingCats = [...current.customCategories];

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

    // Category order: apply when categories selected
    if (kind === 'categoryorder' && want('categories')) {
      const expenseOrder: string[] = [];
      const incomeOrder: string[] = [];
      for (const row of table.rows) {
        const type = String(row['Type'] ?? '')
          .toLowerCase()
          .trim();
        const name = String(row['Name'] ?? '').trim();
        if (!name) continue;
        if (type === 'expense') expenseOrder.push(name);
        else if (type === 'income') incomeOrder.push(name);
      }
      plan.categoryOrder = { expense: expenseOrder, income: incomeOrder };
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
      for (const row of table.rows) {
        const name = String(row['Name'] ?? '').trim();
        const number = String(row['Number'] ?? '').trim();
        const type = String(row['Type'] ?? 'Bank').trim();
        const balance = String(row['Balance'] ?? '0').trim();
        const isDefault = String(row['Default'] ?? '').toLowerCase() === 'yes';
        if (!name) continue;

        const existing = existingAccounts.find((a) => a.name.toLowerCase() === name.toLowerCase());
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
        const walletName = String(row['Wallet'] ?? '').trim();
        if (!title || !typeStr) continue;

        const amount = parseDisplayAmount(amountStr);
        const date = parseDisplayDate(dateStr);
        if (!date) continue;

        const walletId = resolveWallet(walletName, existingAccounts, plan);
        if (!walletId) continue;

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
            e.date === tx.date &&
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
        const nextBillingStr = String(row['Next Billing'] ?? '');
        const statusStr = String(row['Status'] ?? 'Active');
        const endDateStr = String(row['End Date'] ?? '');
        const walletName = String(row['Wallet'] ?? '').trim();
        if (!name) continue;

        const amount = parseDisplayAmount(amountStr);
        const next_billing_date = parseDisplayDate(nextBillingStr) || new Date().toISOString();
        const end_date = endDateStr === '—' || !endDateStr ? null : parseDisplayDate(endDateStr);

        // Wallet: resolve by name (new Column), fallback to default
        const walletId = walletName
          ? resolveWallet(walletName, existingAccounts, plan)
          : resolveWalletDefault(existingAccounts, plan);
        if (!walletId) continue;

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
            Math.abs(e.amount - sub.amount) < 0.01
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
        if (!category) continue;

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
        if (!name || !typeStr) continue;

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

  // Currency warning: only when currency differs AND profile not being applied
  if (importedCurrency && importedCurrency !== currentCurrency && !plan.profile.apply) {
    plan.currencyWarning = `File was exported with currency ${importedCurrency}, your app uses ${currentCurrency}. Amounts imported as-is.`;
  }

  return plan;
}

function resolveWallet(walletName: string, accounts: Account[], plan: ImportPlan): string | null {
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
  // Auto-create missing wallet
  const newAcc: Account = {
    id: newId(),
    name: walletName,
    number: walletName,
    type: 'Bank',
    balance: '0.00',
    isDefault: false,
    icon: undefined as any,
  };
  plan.wallets.insert.push(newAcc);
  accounts.push(newAcc);
  return newAcc.id;
}

function resolveWalletDefault(accounts: Account[], plan: ImportPlan): string {
  const defaultAcc = accounts.find((a) => a.isDefault);
  if (defaultAcc) return defaultAcc.id;
  if (plan.wallets.insert.length > 0) return plan.wallets.insert[0].id;
  if (accounts.length > 0) return accounts[0].id;
  return '';
}
