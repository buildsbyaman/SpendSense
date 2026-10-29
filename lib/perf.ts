// Dev-only timing helpers used to compare before/after of the performance work.
//
// `__DEV__` is a compile-time constant: in a release build Metro replaces it
// with `false`, these functions become no-ops and the call sites are dropped by
// the minifier. Never use these for user-facing behaviour.

const ENABLED = __DEV__;

export function perfNow(): number {
  if (!ENABLED) return 0;
  const p = globalThis.performance;
  return typeof p?.now === 'function' ? p.now() : Date.now();
}

export function perfLog(label: string, startedAt: number, detail?: string): void {
  if (!ENABLED) return;
  const elapsed = perfNow() - startedAt;
  // eslint-disable-next-line no-console
  console.log(`[perf] ${label} ${elapsed.toFixed(1)}ms${detail ? ` (${detail})` : ''}`);
}

/** Times an async operation. Logs on both success and failure, then rethrows. */
export async function perfAsync<T>(
  label: string,
  fn: () => Promise<T>,
  detail?: (result: T) => string
): Promise<T> {
  if (!ENABLED) return fn();
  const startedAt = perfNow();
  try {
    const result = await fn();
    perfLog(label, startedAt, detail?.(result));
    return result;
  } catch (err) {
    perfLog(label, startedAt, 'failed');
    throw err;
  }
}
