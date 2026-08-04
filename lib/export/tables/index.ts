export * from './types';
export * from './shared';
export * from './transactions';
export * from './wallets';
export * from './balances';
export * from './budgets';
export * from './categories';
export * from './profile';

import { type ExportedTable, type ExportSelection, type AppState } from './types';
import { filterByPeriod, filterSubsByPeriod } from './shared';
import { buildTransactionsTable, buildSubscriptionsTable } from './transactions';
import { buildWalletsTable, buildWalletOrderTable } from './wallets';
import { buildBalancesTable } from './balances';
import { buildBudgetsTable } from './budgets';
import {
  buildCategoriesTable,
  buildCategoryOrderTable,
  buildHiddenCategoriesTable,
} from './categories';
import { buildProfileTable } from './profile';

// ── Main builder ───────────────────────────────────────────────────────

export function buildExportData(selection: ExportSelection, state: AppState): ExportedTable[] {
  const { types, period } = selection;
  const periodTxs = filterByPeriod(state.transactions, period);

  const wantAll = types.includes('alldata');
  const want = (kind: string) => wantAll || types.includes(kind as ExportSelection['types'][number]);

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
    tables.push(buildWalletOrderTable(state.walletOrder, state.accounts));
  }
  if (want('balances')) {
    tables.push(
      buildBalancesTable(state.accounts, state.transactions, period, state.profile.currencySymbol)
    );
  }
  if (want('budgets')) {
    tables.push(
      buildBudgetsTable(state.budgets, state.transactions, period, state.profile.currencySymbol)
    );
  }
  if (want('categories')) {
    tables.push(buildCategoriesTable(state.customCategories));
    tables.push(buildCategoryOrderTable(state.categoryOrder));
    tables.push(buildHiddenCategoriesTable(state.deletedDefaultCategories));
  }
  if (want('profile')) {
    // Only the JSON format can carry a full-resolution avatar back into the
    // importer losslessly; XLSX/PDF omit it (see buildProfileTable).
    tables.push(buildProfileTable(state.profile, selection.format === 'json'));
  }

  return tables;
}
