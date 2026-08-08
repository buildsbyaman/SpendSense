import { type ImportPlan } from './merge';

export function getPlanTotalRecords(plan: ImportPlan | null): number {
  if (!plan) return 0;
  return (
    plan.wallets.insert.length +
    plan.wallets.update.length +
    plan.transactions.insert.length +
    plan.transactions.update.length +
    plan.subscriptions.insert.length +
    plan.subscriptions.update.length +
    plan.budgets.insert.length +
    plan.budgets.update.length +
    plan.categories.insert.length +
    plan.categories.update.length +
    (plan.profile.apply ? 1 : 0) +
    (plan.categoryOrder
      ? plan.categoryOrder.expense.length + plan.categoryOrder.income.length
      : 0) +
    (plan.walletOrder ? plan.walletOrder.length : 0) +
    (plan.hiddenCategories ? plan.hiddenCategories.length : 0)
  );
}

export function formatPlanSummary(plan: ImportPlan): string {
  const parts: string[] = [];
  if (plan.profile.apply && plan.profile.value) {
    parts.push(`Profile: ${plan.profile.value.name}`);
  }
  if (plan.wallets.insert.length > 0) parts.push(`${plan.wallets.insert.length} wallet(s)`);
  if (plan.transactions.insert.length > 0)
    parts.push(`${plan.transactions.insert.length} transaction(s)`);
  if (plan.subscriptions.insert.length > 0)
    parts.push(`${plan.subscriptions.insert.length} subscription(s)`);
  if (plan.budgets.insert.length > 0) parts.push(`${plan.budgets.insert.length} budget(s)`);
  if (plan.categories.insert.length > 0)
    parts.push(`${plan.categories.insert.length} category(ies)`);
  if (plan.categoryOrder) parts.push('category order');
  if (plan.walletOrder) parts.push('wallet order');
  if (plan.hiddenCategories) parts.push(`${plan.hiddenCategories.length} hidden default(s)`);
  const totalSkip =
    plan.wallets.skip +
    plan.transactions.skip +
    plan.subscriptions.skip +
    plan.budgets.skip +
    plan.categories.skip;
  const totalDropped =
    plan.wallets.dropped +
    plan.transactions.dropped +
    plan.subscriptions.dropped +
    plan.budgets.dropped +
    plan.categories.dropped;
  const totalUpdate =
    plan.wallets.update.length +
    plan.transactions.update.length +
    plan.subscriptions.update.length +
    plan.budgets.update.length +
    plan.categories.update.length;
  if (parts.length === 0 && totalSkip === 0 && totalDropped === 0)
    return 'No importable data found.';
  let summary = parts.length > 0 ? `Add: ${parts.join(', ')}` : 'Nothing to add';
  if (totalSkip > 0) summary += ` | Skip: ${totalSkip} existing`;
  if (totalUpdate > 0) summary += ` | Overwrite: ${totalUpdate}`;
  if (totalDropped > 0) summary += ` | Dropped: ${totalDropped} invalid`;
  if (plan.replace) summary = `Replace all data | ${summary}`;
  if (
    plan.replace &&
    plan.replaceTypes.includes('wallets') &&
    (!plan.replaceTypes.includes('transactions') || !plan.replaceTypes.includes('subscriptions'))
  ) {
    summary +=
      ' | Note: replacing wallets also removes all existing transactions & subscriptions';
  }
  if (plan.currencyWarning) summary += ` | ${plan.currencyWarning}`;
  return summary;
}
