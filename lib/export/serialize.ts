import { type ExportedTable } from './buildExportData';
import { encodeUtf8Base64 } from '../import/base64';

// ── Shared constants ──────────────────────────────────────────────────

export type ExportFormat = 'json' | 'xlsx' | 'pdf';

export const EXTENSIONS: Record<ExportFormat, string> = {
  json: '.json',
  xlsx: '.xlsx',
  pdf: '.pdf',
};

export const MIME_TYPES: Record<ExportFormat, string> = {
  json: 'application/json;charset=utf-8;',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export function buildFilename(types: string[], periodLabel: string, format: ExportFormat): string {
  const typePart =
    types.length === 1 ? types[0] : types.length >= 6 ? 'AllData' : types.slice(0, 3).join('');
  const ext = EXTENSIONS[format];
  return `SpendSense-${typePart}-${periodLabel}${ext}`;
}

// ── JSON ──────────────────────────────────────────────────────────────

export function tablesToJSON(
  tables: ExportedTable[],
  profile: { name: string; currencyCode: string }
): string {
  const data: Record<string, unknown[]> = {};
  for (const table of tables) {
    data[table.title.toLowerCase()] = table.rows;
  }
  const wrapper = {
    exportedAt: new Date().toISOString(),
    app: 'SpendSense',
    user: profile.name,
    currency: profile.currencyCode,
    data,
  };
  return JSON.stringify(wrapper, null, 2);
}

// ── XLSX bytes ────────────────────────────────────────────────────────

export async function buildXlsxBytes(
  tables: ExportedTable[],
  profile?: { name: string; currencyCode: string }
): Promise<Uint8Array<ArrayBuffer>> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const usedNames = new Map<string, number>();

  // Embed metadata sheet for import round-trip
  if (profile) {
    const metaWs = XLSX.utils.aoa_to_sheet([
      ['Field', 'Value'],
      ['App', 'SpendSense'],
      ['User', profile.name],
      ['Currency', profile.currencyCode],
    ]);
    metaWs['!cols'] = [{ wch: 10 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, metaWs, '__meta__');
  }

  for (const table of tables) {
    const wsData = [
      table.columns,
      ...table.rows.map((row) => table.columns.map((col) => row[col] ?? '')),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = table.columns.map((col) => {
      const maxLen = Math.max(
        col.length,
        ...table.rows.map((row) => String(row[col] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    ws['!cols'] = colWidths;

    const baseName = table.title.substring(0, 31);
    const count = usedNames.get(baseName) ?? 0;
    usedNames.set(baseName, count + 1);
    const name = count === 0 ? baseName : baseName.substring(0, 28) + ` (${count + 1})`;
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout) as Uint8Array<ArrayBuffer>;
}

// ── PDF bytes ─────────────────────────────────────────────────────────

export async function buildPdfBytes(
  tables: ExportedTable[],
  profile?: { name: string; currencyCode: string }
): Promise<Uint8Array<ArrayBuffer>> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  let isFirstTable = true;

  for (const table of tables) {
    if (!isFirstTable) {
      doc.addPage();
    }

    doc.setFontSize(14);
    doc.text(`SpendSense — ${table.title}`, 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [table.columns],
      body: table.rows.map((row) => table.columns.map((col) => String(row[col] ?? ''))),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [26, 28, 27] },
      alternateRowStyles: { fillColor: [246, 246, 246] },
    });

    isFirstTable = false;
  }

  // Embed hidden payload for import round-trip (visible output unchanged)
  if (profile) {
    const payload = JSON.stringify({
      app: 'SpendSense',
      currency: profile.currencyCode,
      tables: tables.map((t) => ({ title: t.title, columns: t.columns, rows: t.rows })),
    });
    doc.setProperties({ subject: encodeUtf8Base64(payload) });
  }

  const buf = doc.output('arraybuffer');
  return new Uint8Array(buf) as Uint8Array<ArrayBuffer>;
}
