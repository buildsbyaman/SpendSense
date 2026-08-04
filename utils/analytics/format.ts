// ── Helpers ───────────────────────────────────────────────────────────

/** Rounds a value up to a clean chart ceiling. */
export function niceCeil(value: number): number {
  if (value <= 0) return 100;
  let step: number;
  if (value < 50) step = 10;
  else if (value < 200) step = 50;
  else if (value < 1000) step = 100;
  else if (value < 5000) step = 500;
  else step = 1000;
  return Math.ceil(value / step) * step;
}

/** Rounds a compact tier value to at most 1 decimal place. */
function compactTier(n: number): string {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
}

/** Compact axis label: $850, $12.5k, $3.2M, $1.1B (cents kept below $100). */
export function formatCompactCurrency(v: number, symbol: string = '$'): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${symbol}${compactTier(abs / 1_000_000_000)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${symbol}${compactTier(abs / 1_000_000)}M`;
  }
  if (abs >= 1000) {
    return `${sign}${symbol}${compactTier(abs / 1000)}k`;
  }
  if (abs >= 100) {
    return `${sign}${symbol}${abs.toFixed(0)}`;
  }
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

export function savingsRate(income: number, expense: number): number | null {
  if (income <= 0) return null;
  return Math.round(((income - expense) / income) * 100);
}
