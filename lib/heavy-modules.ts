// Lazily-loaded heavy document libraries.
//
// These modules are only needed when the user actually exports or imports a
// spreadsheet/PDF. They are NOT imported at the top level anywhere, and this
// file only references them inside functions, so Metro keeps the evaluation
// deferred until first use.
//
// The `default ?? mod` normalisation exists because Metro/Hermes interop can
// hand back either the CJS namespace or the ESM default depending on the
// package's `exports` field. Doing it here is what makes a plain
// `await import('xlsx')` work without the old root-level "force into bundle"
// imports in `app/_layout.tsx`.

type XlsxModule = typeof import('xlsx');

export async function loadXlsx(): Promise<XlsxModule> {
  const mod = (await import('xlsx')) as unknown as XlsxModule & { default?: XlsxModule };
  return (mod.default ?? mod) as XlsxModule;
}

type JsPdfCtor = typeof import('jspdf').jsPDF;

export async function loadJsPdf(): Promise<JsPdfCtor> {
  const mod = (await import('jspdf')) as unknown as {
    jsPDF?: JsPdfCtor;
    default?: JsPdfCtor | { jsPDF?: JsPdfCtor };
  };
  const fromDefault = mod.default;
  const ctor = mod.jsPDF ?? (typeof fromDefault === 'function' ? fromDefault : fromDefault?.jsPDF);
  if (typeof ctor !== 'function') {
    throw new Error('jsPDF failed to load');
  }
  return ctor;
}

type AutoTableFn = typeof import('jspdf-autotable').default;

export async function loadAutoTable(): Promise<AutoTableFn> {
  const mod = (await import('jspdf-autotable')) as unknown as {
    autoTable?: AutoTableFn;
    default?: AutoTableFn;
  };
  const fn = mod.autoTable ?? mod.default;
  if (typeof fn !== 'function') {
    throw new Error('jspdf-autotable failed to load');
  }
  return fn;
}
