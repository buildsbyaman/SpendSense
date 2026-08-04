import { type AppState, type ExportedTable } from './types';

export function buildWalletsTable(accounts: AppState['accounts']): ExportedTable {
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

export function buildWalletOrderTable(
  order: string[],
  accounts: AppState['accounts']
): ExportedTable {
  const rows: Record<string, string>[] = [];
  for (const id of order) {
    const account = accounts.find((a) => a.id === id);
    rows.push({ Name: account?.name ?? id });
  }
  return { title: 'Wallet Order', columns: ['Name'], rows };
}
