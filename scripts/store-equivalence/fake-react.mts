// Minimal React hook shims so the legacy hooks can run outside a renderer.

export function useCallback(callback) {
  return callback;
}

export function useMemo(factory) {
  return factory();
}

export function useRef(initial) {
  return { current: initial };
}

export function useState(initial) {
  return [initial, () => {}];
}

export default { useCallback, useMemo, useRef, useState };
