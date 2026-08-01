import { type Transaction } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import { type UserProfile } from '@/lib/repository';
import { filterByMonth, filterByYear, sumByType } from '@/utils/analytics';

export type ExportType =
  | 'transactions'
  | 'subscriptions'
  | 'wallets'
  | 'balances'
  | 'budgets'
  | 'categories'
  | 'profile'
  | 'alldata';

export type PeriodMode = 'all' | 'month' | 'year' | 'custom';

export interface ExportSelection {
  types: ExportType[];
  period: {
    mode: PeriodMode;
    year?: number;
    month?: number;
    from?: Date;
    to?: Date;
  };
  format: 'json' | 'xlsx' | 'pdf';
}

export interface ExportedTable {
  title: string;
  columns: string[];
  rows: Record<string, string | number>[];
}

interface AppState {
  transactions: Transaction[];
  accounts: {
    id: string;
    name: string;
    number: string;
    balance: string;
    type: string;
    isDefault?: boolean;
  }[];
  budgets: { id: string; category: string; amount: number }[];
  subscriptions: Subscription[];
  customCategories: { id: string; name: string; type: string; icon?: string; color?: string }[];
  profile: UserProfile;
  categoryOrder: { expense: string[]; income: string[] };
  deletedDefaultCategories: string[];
}

function filterByPeriod(txs: Transaction[], period: ExportSelection['period']): Transaction[] {
  if (period.mode === 'all') return txs;
  if (period.mode === 'month' && period.year != null && period.month != null) {
    return filterByMonth(txs, period.year, period.month);
  }
  if (period.mode === 'year' && period.year != null) {
    return filterByYear(txs, period.year);
  }
  if (period.mode === 'custom' && (period.from || period.to)) {
    return txs.filter((tx) => {
      const d = new Date(tx.date);
      d.setHours(0, 0, 0, 0);
      let isAfter = true;
      if (period.from) {
        const from = new Date(period.from);
        from.setHours(0, 0, 0, 0);
        isAfter = d >= from;
      }
      let isBefore = true;
      if (period.to) {
        const to = new Date(period.to);
        to.setHours(23, 59, 59, 999);
        isBefore = d <= to;
      }
      return isAfter && isBefore;
    });
  }
  return txs;
}

function filterSubsByPeriod(
  subs: Subscription[],
  period: ExportSelection['period']
): Subscription[] {
  if (period.mode === 'all') return subs;
  if (period.mode === 'month' && period.year != null && period.month != null) {
    return subs.filter((s) => {
      const d = new Date(s.next_billing_date);
      return d.getFullYear() === period.year && d.getMonth() === period.month;
    });
  }
  if (period.mode === 'year' && period.year != null) {
    return subs.filter((s) => new Date(s.next_billing_date).getFullYear() === period.year);
  }
  if (period.mode === 'custom' && (period.from || period.to)) {
    return subs.filter((s) => {
      const d = new Date(s.next_billing_date);
      d.setHours(0, 0, 0, 0);
      let isAfter = true;
      if (period.from) {
        const from = new Date(period.from);
        from.setHours(0, 0, 0, 0);
        isAfter = d >= from;
      }
      let isBefore = true;
      if (period.to) {
        const to = new Date(period.to);
        to.setHours(23, 59, 59, 999);
        isBefore = d <= to;
      }
      return isAfter && isBefore;
    });
  }
  return subs;
}

function fmtMoney(v: number, symbol: string = '$'): string {
  const neg = v < 0;
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return neg ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Table builders ─────────────────────────────────────────────────────

function buildTransactionsTable(
  txs: Transaction[],
  accounts: AppState['accounts'],
  symbol?: string
): ExportedTable {
  const walletName = (wid: string) => accounts.find((a) => a.id === wid)?.name ?? wid;

  return {
    title: 'Transactions',
    columns: ['Date', 'Title', 'Category', 'Type', 'Amount', 'Wallet', 'Date ISO'],
    rows: [...txs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((tx) => ({
        Date: fmtDate(tx.date),
        Title: tx.title,
        Category: tx.category,
        Type: tx.type,
        Amount: fmtMoney(tx.amount, symbol),
        Wallet: walletName(tx.walletId),
        'Date ISO': tx.date,
      })),
  };
}

function buildSubscriptionsTable(
  subs: Subscription[],
  accounts: AppState['accounts'],
  symbol?: string
): ExportedTable {
  const walletName = (wid: string) => accounts.find((a) => a.id === wid)?.name ?? wid;

  return {
    title: 'Subscriptions',
    columns: [
      'Name',
      'Amount',
      'Cycle',
      'Category',
      'Next Billing',
      'Next Billing ISO',
      'Status',
      'End Date',
      'End Date ISO',
      'Wallet',
    ],
    rows: subs.map((s) => ({
      Name: s.name,
      Amount: fmtMoney(s.amount, symbol),
      Cycle: s.cycle.charAt(0).toUpperCase() + s.cycle.slice(1),
      Category: s.category,
      'Next Billing': fmtDate(s.next_billing_date),
      'Next Billing ISO': s.next_billing_date,
      Status: s.is_active === 1 ? 'Active' : 'Inactive',
      'End Date': s.end_date ? fmtDate(s.end_date) : '—',
      'End Date ISO': s.end_date ?? '',
      Wallet: walletName(s.wallet_id),
    })),
  };
}

function buildWalletsTable(accounts: AppState['accounts']): ExportedTable {
  return {
    title: 'Wallets',
    columns: ['Name', 'Number', 'Type', 'Balance', 'Default'],
    rows: accounts.map((a) => ({
      Name: a.name,
      Number: a.number,
      Type: a.type,
      Balance: a.balance,
      Default: a.isDefault ? 'Yes' : 'No',
    })),
  };
}

function buildBalancesTable(
  accounts: AppState['accounts'],
  txs: Transaction[],
  period: ExportSelection['period']
): ExportedTable {
  const periodTxs = filterByPeriod(txs, period);
  const hasFilter = period.mode !== 'all';

  const columns = hasFilter
    ? ['Wallet', 'Balance', 'Income', 'Expense', 'Net']
    : ['Wallet', 'Balance'];

  const rows = accounts.map((a) => {
    const walletTxs = periodTxs.filter((t) => t.walletId === a.id);
    const { income, expense } = sumByType(walletTxs);
    const net = income - expense;

    const base: Record<string, string | number> = {
      Wallet: a.name,
      Balance: a.balance,
    };

    if (hasFilter) {
      base.Income = fmtMoney(income);
      base.Expense = fmtMoney(expense);
      base.Net = fmtMoney(net);
    }

    return base;
  });

  return { title: 'Balances', columns, rows };
}

function buildBudgetsTable(
  budgets: AppState['budgets'],
  txs: Transaction[],
  period: ExportSelection['period']
): ExportedTable {
  const periodTxs = filterByPeriod(txs, period);

  return {
    title: 'Budgets',
    columns: ['Category', 'Budget', 'Spent', 'Remaining', '% Used'],
    rows: budgets.map((b) => {
      const spent = periodTxs
        .filter((t) => t.category === b.category && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = b.amount - spent;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      return {
        Category: b.category,
        Budget: fmtMoney(b.amount),
        Spent: fmtMoney(spent),
        Remaining: fmtMoney(remaining),
        '% Used': `${pct}%`,
      };
    }),
  };
}

function buildCategoriesTable(customCats: AppState['customCategories']): ExportedTable {
  const rows: Record<string, string>[] = [];

  const defaults = [
    {
      type: 'Expense',
      names: [
        'Food',
        'Shopping',
        'Transport',
        'Bills',
        'Entertainment',
        'Medical',
        'Miscellaneous',
        'Others',
      ],
    },
    { type: 'Income', names: ['Salary', 'Business', 'Investment', 'Gift', 'Others'] },
  ];

  for (const d of defaults) {
    for (const name of d.names) {
      const custom = customCats.find(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.type === d.type.toLowerCase()
      );
      rows.push({
        Type: d.type,
        Name: name,
        Source: custom ? 'Custom' : 'Default',
        Color: custom?.color ?? '—',
        Icon: custom?.icon ?? '—',
      });
    }
  }

  for (const c of customCats) {
    const isDefault = defaults.some(
      (d) =>
        d.type.toLowerCase() === c.type &&
        d.names.some((n) => n.toLowerCase() === c.name.toLowerCase())
    );
    if (!isDefault) {
      rows.push({
        Type: c.type,
        Name: c.name,
        Source: 'Custom',
        Color: c.color ?? '—',
        Icon: c.icon ?? '—',
      });
    }
  }

  return { title: 'Categories', columns: ['Type', 'Name', 'Source', 'Color', 'Icon'], rows };
}

function buildProfileTable(profile: UserProfile): ExportedTable {
  return {
    title: 'Profile',
    columns: ['Field', 'Value'],
    rows: [
      { Field: 'Name', Value: profile.name },
      { Field: 'Currency Symbol', Value: profile.currencySymbol },
      { Field: 'Currency Code', Value: profile.currencyCode },
      { Field: 'Avatar', Value: profile.avatar ?? '—' },
    ],
  };
}

function buildCategoryOrderTable(order: { expense: string[]; income: string[] }): ExportedTable {
  const rows: Record<string, string>[] = [];
  for (const name of order.expense) {
    rows.push({ Type: 'expense', Name: name });
  }
  for (const name of order.income) {
    rows.push({ Type: 'income', Name: name });
  }
  return { title: 'Category Order', columns: ['Type', 'Name'], rows };
}

function buildHiddenCategoriesTable(deleted: string[]): ExportedTable {
  return {
    title: 'Hidden Categories',
    columns: ['Name'],
    rows: deleted.map((name) => ({ Name: name })),
  };
}

// ── Main builder ───────────────────────────────────────────────────────

export function buildExportData(selection: ExportSelection, state: AppState): ExportedTable[] {
  const { types, period } = selection;
  const periodTxs = filterByPeriod(state.transactions, period);

  const wantAll = types.includes('alldata');
  const want = (kind: string) => wantAll || types.includes(kind as ExportType);

  const tables: ExportedTable[] = [];

  if (want('transactions')) {
    tables.push(buildTransactionsTable(periodTxs, state.accounts, state.profile.currencySymbol));
  }
  if (want('subscriptions')) {
    const filteredSubs = filterSubsByPeriod(state.subscriptions, period);
    tables.push(
      buildSubscriptionsTable(filteredSubs, state.accounts, state.profile.currencySymbol)
    );
  }
  if (want('wallets')) {
    tables.push(buildWalletsTable(state.accounts));
  }
  if (want('balances')) {
    tables.push(buildBalancesTable(state.accounts, state.transactions, period));
  }
  if (want('budgets')) {
    tables.push(buildBudgetsTable(state.budgets, state.transactions, period));
  }
  if (want('categories')) {
    tables.push(buildCategoriesTable(state.customCategories));
    tables.push(buildCategoryOrderTable(state.categoryOrder));
    tables.push(buildHiddenCategoriesTable(state.deletedDefaultCategories));
  }
  if (want('profile')) {
    tables.push(buildProfileTable(state.profile));
  }

  return tables;
}
