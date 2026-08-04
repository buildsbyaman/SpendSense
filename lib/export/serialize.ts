import { type ExportedTable } from './buildExportData';
import { encodeUtf8Base64 } from '../import/base64';
import { decodePayloadFromPdf } from '../import/pdfPayload';
import { MAX_ROWS_PER_TABLE, MAX_TOTAL_ROWS } from '../import/parse';

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

// Keys that would trigger prototype setters if assigned on a plain object.
const DANGEROUS_TABLE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function tablesToJSON(
  tables: ExportedTable[],
  profile: { name: string; currencyCode: string }
): string {
  const data: Record<string, unknown[]> = {};
  for (const table of tables) {
    const key = table.title.toLowerCase();
    // `data["__proto__"] = rows` would run the prototype setter instead of
    // storing data. Skip such titles defensively.
    if (DANGEROUS_TABLE_KEYS.has(key)) continue;
    data[key] = table.rows;
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

// Spreadsheet formula-injection guard (OWASP CSV/Separator Injection):
// cells that begin with =, +, -, @, tab, or CR are prefixed with a single
// quote so they export as literal text instead of executable formulas.
function escapeFormulaCell(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (/^[=+\-@\t\r]/.test(value)) return `'${value}`;
  return value;
}

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
      ['User', escapeFormulaCell(profile.name)],
      ['Currency', escapeFormulaCell(profile.currencyCode)],
    ]);
    metaWs['!cols'] = [{ wch: 10 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, metaWs, '__meta__');
  }

  for (const table of tables) {
    const wsData = [
      table.columns,
      ...table.rows.map((row) => table.columns.map((col) => escapeFormulaCell(row[col] ?? ''))),
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
  const { jsPDF } = await import('jspdf');
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

  // Embed hidden payload for import round-trip (visible output unchanged). The
  // payload is capped to the same limits the import screen enforces so a large
  // export can never produce a PDF that its own import would reject (>20MB).
  if (profile) {
    const payloadTables = tables.map((t) => ({
      title: t.title,
      columns: t.columns,
      rows: t.rows.slice(0, MAX_ROWS_PER_TABLE),
    }));
    let truncated = tables.some((t) => t.rows.length > MAX_ROWS_PER_TABLE);
    let remaining = MAX_TOTAL_ROWS;
    for (const t of payloadTables) {
      if (remaining <= 0) {
        t.rows = [];
        continue;
      }
      if (t.rows.length > remaining) {
        t.rows = t.rows.slice(0, remaining);
        truncated = true;
      }
      remaining -= t.rows.length;
    }
    const payload = JSON.stringify({
      app: 'SpendSense',
      currency: profile.currencyCode,
      truncated,
      tables: payloadTables,
    });
    doc.setProperties({ subject: encodeUtf8Base64(payload) });
  }

  const buf = doc.output('arraybuffer');

  // Self-check: verify the embedded payload survives a UTF-8 round-trip
  // (same path the import screen takes via readAsStringAsync with UTF-8 encoding)
  if (profile) {
    const text = new TextDecoder().decode(new Uint8Array(buf));
    const result = decodePayloadFromPdf(text);
    if (!result.ok) {
      throw new Error(
        `PDF export produced an unreadable file (${result.reason}). Please try exporting again.`
      );
    }
  }

  return new Uint8Array(buf) as Uint8Array<ArrayBuffer>;
}
