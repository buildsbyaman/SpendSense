import { type SubscriptionCycle } from '@/utils/subscription';

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
  if (y < 1000 || y > 9999 || d < 1 || d > 31) return null;
  // Build the ISO string in UTC so the stored calendar day matches the one the
  // spreadsheet/user sees regardless of the device timezone. Using `new Date(y,
  // month, d)` would anchor to local midnight and `.toISOString()` could shift
  // the date a day back in UTC+ timezones.
  const ms = Date.UTC(y, month, d);
  if (isNaN(ms)) return null;
  const result = new Date(ms);
  if (
    result.getUTCFullYear() !== y ||
    result.getUTCMonth() !== month ||
    result.getUTCDate() !== d
  )
    return null;
  return result.toISOString();
}

const MAX_IMPORT_AMOUNT = 1e12;

export function parseDisplayAmount(str: string): number | null {
  const cleaned = str.replace(/[^0-9.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const num = parseFloat(cleaned);
  // Reject (rather than clamp) negatives, non-finite values (e.g. `Infinity`
  // from `1e999`) and implausibly large amounts so a crafted file cannot write
  // `9e999` into `amount REAL` or silently turn a real negative into a 0 row.
  if (!isFinite(num) || num <= 0 || num > MAX_IMPORT_AMOUNT) return null;
  return Math.round(num * 100) / 100;
}

export function parseCycle(raw: string): SubscriptionCycle {
  const lower = raw.toLowerCase();
  if (lower === 'weekly' || lower === 'monthly' || lower === 'quarterly' || lower === 'yearly')
    return lower;
  return 'monthly';
}

export function parseStatus(raw: string): number {
  return raw.toLowerCase() === 'active' ? 1 : 0;
}
