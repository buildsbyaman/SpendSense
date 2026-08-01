import { type ExportedTable } from '@/lib/export/buildExportData';
import { decodePayloadFromPdf, type PdfPayload } from './pdfPayload';

export interface ParsedFile {
  meta: { app?: string; currency?: string; user?: string };
  tables: ExportedTable[];
}

export function parseJson(text: string): ParsedFile {
  const obj = JSON.parse(text);
  const meta = { app: obj.app, currency: obj.currency, user: obj.user };
  const tables: ExportedTable[] = [];
  if (obj.data && typeof obj.data === 'object') {
    for (const [title, rows] of Object.entries(obj.data)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const firstRow = rows[0] as Record<string, unknown>;
      const columns = Object.keys(firstRow);
      tables.push({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        columns,
        rows: rows as Record<string, string | number>[],
      });
    }
  }
  return { meta, tables };
}

export async function parseXlsx(bytes: Uint8Array): Promise<ParsedFile> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(bytes, { type: 'array' });
  const tables: ExportedTable[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const aoa: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (aoa.length === 0) continue;
    const columns = (aoa[0] as string[]).map(String);
    const rows: Record<string, string | number>[] = [];
    for (let i = 1; i < aoa.length; i++) {
      const row = aoa[i];
      if (!Array.isArray(row) || row.every((c) => c === '' || c == null)) continue;
      const obj: Record<string, string | number> = {};
      for (let c = 0; c < columns.length; c++) {
        const val = row[c];
        obj[columns[c]] = val == null ? '' : (val as string | number);
      }
      rows.push(obj);
    }
    tables.push({ title: name, columns, rows });
  }
  return { meta: { app: 'SpendSense' }, tables };
}

export function parsePdf(pdfText: string): ParsedFile {
  const payload = decodePayloadFromPdf(pdfText);
  if (!payload)
    throw new Error(
      'This PDF was exported from an older version of SpendSense. Please re-export it.'
    );
  return {
    meta: { app: payload.app, currency: payload.currency },
    tables: payload.tables,
  };
}

export function parseFile(text: string, format: 'json' | 'xlsx' | 'pdf'): ParsedFile {
  if (format === 'json') return parseJson(text);
  if (format === 'pdf') return parsePdf(text);
  throw new Error('XLSX parsing requires Uint8 bytes. Use parseXlsx instead.');
}
