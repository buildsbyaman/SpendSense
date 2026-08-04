import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Account, formatWalletBalance } from '@/utils/wallet';
import { newId } from '@/lib/id';
import { type PlanContext } from './types';

export function resolveWallet(
  walletName: string,
  accounts: Account[],
  plan: PlanContext['plan'],
  balanceLookup: Map<string, string>
): string | null {
  if (!walletName) {
    const defaultAcc = accounts.find((a) => a.isDefault);
    if (defaultAcc) return defaultAcc.id;
    if (accounts.length > 0) return accounts[0].id;
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
    number: '',
    type: 'Bank',
    balance,
    isDefault: false,
    icon: undefined as any,
  };
  plan.wallets.insert.push(newAcc);
  accounts.push(newAcc);
  return newAcc.id;
}

export function resolveWalletDefault(
  accounts: Account[],
  plan: PlanContext['plan'],
  balanceLookup: Map<string, string>
): string | null {
  const defaultAcc = accounts.find((a) => a.isDefault);
  if (defaultAcc) return defaultAcc.id;
  if (plan.wallets.insert.length > 0) return plan.wallets.insert[0].id;
  if (accounts.length > 0) return accounts[0].id;
  // No wallet at all — returning '' would create orphan subscriptions with an
  // empty wallet_id. The caller counts this row as dropped instead.
  return null;
}

export function processWalletsTable(table: ExportedTable, ctx: PlanContext): void {
  const { plan, conflict, existingAccounts } = ctx;
  let defaultFound = false;
  for (const row of table.rows) {
    const name = String(row['Name'] ?? '').trim();
    const number = String(row['Number'] ?? '').trim();
    const type = String(row['Type'] ?? 'Bank').trim();
    // Normalize the balance: an unparseable cell (garbage, NaN, nested
    // object string) must not be stored verbatim where it would corrupt
    // display, currency conversion, and re-export.
    const rawBalance = String(row['Balance'] ?? '0').trim();
    const parsedBalance = rawBalance ? parseFloat(rawBalance.replace(/[^0-9.-]/g, '')) : NaN;
    const balance = isFinite(parsedBalance)
      ? formatWalletBalance(parsedBalance.toString())
      : '0.00';
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
        // In merge mode, don't override existing app default
        if (!ctx.isReplace && existingAccounts.some((a) => a.isDefault)) {
          isDefault = false;
        } else {
          defaultFound = true;
        }
      }
    }

    // Match by name alone (preferring an exact name+number match). Matching
    // only when the number is empty previously created duplicate accounts
    // with identical names when a file's number differed, which made every
    // later name->id resolution ambiguous.
    const sameName = existingAccounts.filter(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    const existing = sameName.find((a) => a.number === number) ?? sameName[0];
    if (existing) {
      if (conflict === 'overwrite') {
        const updated = {
          ...existing,
          name,
          number: number || existing.number,
          type,
          balance: balance || existing.balance,
          isDefault,
        };
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
