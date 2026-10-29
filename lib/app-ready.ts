// A single "first frame is ready" signal.
//
// The splash screen is held until the data snapshot and the persisted theme are
// both applied. Other bootstrap work that should not compete with that first
// frame (e.g. the biometric prompt) can await this instead of using a magic
// timeout.

let ready = false;
let resolveReady: (() => void) | null = null;

const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function markAppReady(): void {
  if (ready) return;
  ready = true;
  resolveReady?.();
  resolveReady = null;
}

export function waitForAppReady(): Promise<void> {
  return ready ? Promise.resolve() : readyPromise;
}

/** Test/dev helper: whether the first frame has been marked ready. */
export function isAppReady(): boolean {
  return ready;
}
