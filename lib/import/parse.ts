import { type ExportedTable } from '@/lib/export/buildExportData';
import { decodePayloadFromPdf, type PdfPayload } from './pdfPayload';

export interface ParsedFile {
  meta: { app?: string; currency?: string; user?: string };
  tables: ExportedTable[];
}

const MAX_ROWS_PER_TABLE = 10_000;

function safeColumns(keys: string[]): string[] {
  return keys.filter((k) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype');
}

export function parseJson(text: string): ParsedFile {
  const obj = JSON.parse(text);
  if (obj.app !== 'SpendSense') {
    throw new Error('This JSON file was not exported from SpendSense.');
  }
  const meta = { app: obj.app, currency: obj.currency, user: obj.user };
  const tables: ExportedTable[] = [];
  if (obj.data && typeof obj.data === 'object') {
    for (const [title, rows] of Object.entries(obj.data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const firstRow = rows[0] as Record<string, unknown>;
      const columns = safeColumns(Object.keys(firstRow));
      const limitedRows = rows.slice(0, MAX_ROWS_PER_TABLE);
      tables.push({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        columns,
        rows: limitedRows as Record<string, string | number>[],
      });
    }
  }
  return { meta, tables };
}

export async function parseXlsx(bytes: Uint8Array): Promise<ParsedFile> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(bytes, { type: 'array', cellDates: true });
  const tables: ExportedTable[] = [];
  let meta: { app?: string; currency?: string; user?: string } = { app: 'SpendSense' };

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (aoa.length === 0) continue;

    // Read metadata from __meta__ sheet
    if (name === '__meta__') {
      for (let i = 1; i < aoa.length; i++) {
        const row = aoa[i];
        if (!Array.isArray(row) || row.length < 2) continue;
        const field = String(row[0] ?? '')
          .trim()
          .toLowerCase();
        const value = String(row[1] ?? '').trim();
        if (field === 'currency') meta.currency = value;
        else if (field === 'user') meta.user = value;
      }
      continue;
    }

    const rawColumns = (aoa[0] as string[]).map(String);
    const columns = safeColumns(rawColumns).map((c, i) => c.trim() || `Column ${i + 1}`);
    if (columns.length === 0) continue;
    const rows: Record<string, string | number>[] = [];
    for (let i = 1; i < Math.min(aoa.length, MAX_ROWS_PER_TABLE + 1); i++) {
      const row = aoa[i];
      if (!Array.isArray(row) || row.every((c) => c === '' || c == null)) continue;
      const obj: Record<string, string | number> = {};
      for (let c = 0; c < columns.length; c++) {
        const val = row[c];
        if (val == null) {
          obj[columns[c]] = '';
        } else if (val instanceof Date) {
          obj[columns[c]] = val.toISOString();
        } else {
          obj[columns[c]] = val as string | number;
        }
      }
      rows.push(obj);
    }
    tables.push({ title: name, columns, rows });
  }
  return { meta, tables };
}

export function parsePdf(pdfText: string): ParsedFile {
  const payload = decodePayloadFromPdf(pdfText);
  if (!payload)
    throw new Error(
      'This PDF was exported from an older version of SpendSense. Please re-export it.'
    );
  return {
    meta: { app: payload.app, currency: payload.currency },
    tables: payload.tables.map((t) => ({
      ...t,
      columns: safeColumns(t.columns),
      rows: t.rows.slice(0, MAX_ROWS_PER_TABLE),
    })),
  };
}
