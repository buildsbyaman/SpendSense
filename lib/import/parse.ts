import { type ExportedTable } from '@/lib/export/buildExportData';
import { decodePayloadFromPdf, type PdfPayload } from './pdfPayload';

export interface ParsedFile {
  meta: { app?: string; currency?: string; user?: string; truncated?: boolean };
  tables: ExportedTable[];
}

export const MAX_ROWS_PER_TABLE = 10_000;
export const MAX_SHEETS = 25;
export const MAX_TOTAL_ROWS = 50_000;
const MAX_COLUMNS = 100;

// Upper bound on total decompressed size of an XLSX archive. The import screen
// caps the file at ~5MB of *compressed* bytes, which does not bound how much a
// crafted zip can inflate to (zip-bomb). SheetJS decompresses the whole archive
// before any row cap applies, so we pre-validate the central directory.
const MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function safeColumns(keys: string[]): string[] {
  return keys
    .map((k) => String(k).trim())
    .filter((k) => k.length > 0 && !DANGEROUS_KEYS.has(k))
    .slice(0, MAX_COLUMNS);
}

// Defensive filter: a crafted JSON/PDF can contain `null` or primitive rows.
function validRows(rows: unknown[]): Record<string, string | number>[] {
  return rows.filter(
    (r): r is Record<string, string | number> => r !== null && typeof r === 'object'
  );
}

/**
 * Returns the total uncompressed size declared in a ZIP central directory, or
 * `null` when the bytes are not a ZIP (e.g. legacy XLS/CFB, which is not
 * compression-amplifiable). Used to reject zip-bombs before SheetJS inflates
 * the archive into memory.
 */
function sumZipUncompressedSize(bytes: Uint8Array): number | null {
  if (bytes.length < 22) return null;
  const scanStart = Math.max(0, bytes.length - 22 - 65535);
  for (let i = bytes.length - 22; i >= scanStart; i--) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      const totalEntries = bytes[i + 10] | (bytes[i + 11] << 8);
      const cdSize =
        bytes[i + 12] | (bytes[i + 13] << 8) | (bytes[i + 14] << 16) | ((bytes[i + 15] << 24) >>> 0);
      const cdOffset =
        bytes[i + 16] | (bytes[i + 17] << 8) | (bytes[i + 18] << 16) | ((bytes[i + 19] << 24) >>> 0);
      if (cdOffset + cdSize > bytes.length) return null;
      let total = 0;
      let p = cdOffset;
      for (let n = 0; n < totalEntries; n++) {
        if (p + 46 > bytes.length) break;
        if (bytes[p] !== 0x50 || bytes[p + 1] !== 0x4b || bytes[p + 2] !== 0x01 || bytes[p + 3] !== 0x02) {
          break;
        }
        const method = bytes[p + 10] | (bytes[p + 11] << 8);
        const uncomp =
          bytes[p + 24] | (bytes[p + 25] << 8) | (bytes[p + 26] << 16) | ((bytes[p + 27] << 24) >>> 0);
        const nameLen = bytes[p + 28] | (bytes[p + 29] << 8);
        const extraLen = bytes[p + 30] | (bytes[p + 31] << 8);
        const commentLen = bytes[p + 32] | (bytes[p + 33] << 8);
        if (method !== 0) total += uncomp;
        p += 46 + nameLen + extraLen + commentLen;
      }
      return total;
    }
  }
  return null;
}

export function parseJson(text: string): ParsedFile {
  const obj = JSON.parse(text);
  if (obj.app !== 'SpendSense') {
    throw new Error('This JSON file was not exported from SpendSense.');
  }
  const meta: ParsedFile['meta'] = { app: obj.app, currency: obj.currency, user: obj.user };
  const tables: ExportedTable[] = [];
  if (obj.data && typeof obj.data === 'object') {
    let totalRows = 0;
    for (const [title, rows] of Object.entries(obj.data)) {
      // Hitting either cap means data is being discarded — always flag it.
      if (tables.length >= MAX_SHEETS || totalRows >= MAX_TOTAL_ROWS) {
        meta.truncated = true;
        break;
      }
      if (DANGEROUS_KEYS.has(title.toLowerCase())) continue;
      if (!Array.isArray(rows) || rows.length === 0) continue;
      const cleanRows = validRows(rows);
      const firstRow = cleanRows[0];
      if (!firstRow) continue;
      const columns = safeColumns(Object.keys(firstRow));
      // Cumulative budget: cap this table by what remains of MAX_TOTAL_ROWS so a
      // crafted file cannot push 25 x 10k = 250k rows past the advertised limit.
      const limitedRows = cleanRows.slice(0, Math.min(MAX_ROWS_PER_TABLE, MAX_TOTAL_ROWS - totalRows));
      if (cleanRows.length > limitedRows.length) meta.truncated = true;
      totalRows += limitedRows.length;
      tables.push({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        columns,
        rows: limitedRows,
      });
    }
  }
  return { meta, tables };
}

export async function parseXlsx(bytes: Uint8Array): Promise<ParsedFile> {
  const uncompressed = sumZipUncompressedSize(bytes);
  if (uncompressed !== null && uncompressed > MAX_UNCOMPRESSED_BYTES) {
    throw new Error(
      'This spreadsheet would expand beyond a safe size when decompressed. Please use a smaller file.'
    );
  }
  const XLSX = await import('xlsx');
  const wb = XLSX.read(bytes, { type: 'array', cellDates: true });
  const tables: ExportedTable[] = [];
  let meta: ParsedFile['meta'] = { app: 'SpendSense' };
  let totalRows = 0;

  for (const name of wb.SheetNames) {
    if (tables.length >= MAX_SHEETS || totalRows >= MAX_TOTAL_ROWS) {
      meta.truncated = true;
      break;
    }
    const ws = wb.Sheets[name];
    const ref = ws['!ref'];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);

    // Read cells directly from the used range so the row/column caps apply
    // BEFORE any full-sheet materialization (a crafted sheet with millions of
    // cells could otherwise exhaust memory via sheet_to_json).
    const maxRow = Math.min(range.e.r, range.s.r + MAX_ROWS_PER_TABLE);
    const maxCol = Math.min(range.e.c, range.s.c + MAX_COLUMNS - 1);

    const readRow = (r: number): unknown[] => {
      const cells: unknown[] = [];
      for (let c = range.s.c; c <= maxCol; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        let v = cell ? cell.v : '';
        // Reverse the OWASP formula-escape added on export: SheetJS reads the
        // leading `'` prefix back as part of the value, so a title like
        // "-50% coupon" would otherwise round-trip with a literal `'` glued on.
        // Strip it only when it is exactly the injection guard prefix.
        if (typeof v === 'string' && /^'[=+\-@\t\r]/.test(v)) v = v.slice(1);
        cells.push(v);
      }
      return cells;
    };

    const headerRow = readRow(range.s.r);
    // Keep the ORIGINAL cell index for each column so that filtering out a
    // dangerous header name (e.g. `__proto__`) does not shift cell alignment.
    // The DANGEROUS_KEYS check runs on the TRIM-silent value, not the raw one,
    // so a header like "__proto__ " cannot slip past the filter as "__proto__".
    const columns: string[] = [];
    const columnIndexes: number[] = [];
    headerRow.forEach((c, i) => {
      const raw = String(c);
      const trimmed = raw.trim();
      if (DANGEROUS_KEYS.has(trimmed)) return;
      columns.push(trimmed || `Column ${range.s.c + i + 1}`);
      columnIndexes.push(i);
    });
    if (columns.length === 0) continue;

    // Read metadata from __meta__ sheet
    if (name === '__meta__') {
      for (let r = range.s.r + 1; r <= maxRow; r++) {
        const row = readRow(r);
        if (row.every((c) => c === '' || c == null)) continue;
        const field = String(row[0] ?? '')
          .trim()
          .toLowerCase();
        const value = String(row[1] ?? '').trim();
        if (field === 'currency') meta.currency = value;
        else if (field === 'user') meta.user = value;
      }
      continue;
    }

    const rows: Record<string, string | number>[] = [];
    for (let r = range.s.r + 1; r <= maxRow; r++) {
      if (rows.length >= MAX_ROWS_PER_TABLE || totalRows >= MAX_TOTAL_ROWS) {
        meta.truncated = true;
        break;
      }
      const row = readRow(r);
      if (row.every((c) => c === '' || c == null)) continue;
      const obj: Record<string, string | number> = {};
      for (let c = 0; c < columns.length; c++) {
        const val = row[columnIndexes[c]];
        if (val == null) {
          obj[columns[c]] = '';
        } else if (val instanceof Date) {
          // SheetJS anchors date cells to UTC midnight, so toISOString() keeps
          // the calendar date the spreadsheet shows regardless of timezone.
          obj[columns[c]] = val.toISOString();
        } else {
          obj[columns[c]] = val as string | number;
        }
      }
      rows.push(obj);
      totalRows++;
    }
    tables.push({ title: name, columns, rows });
  }
  return { meta, tables };
}

export function parsePdf(pdfText: string): ParsedFile {
  const result = decodePayloadFromPdf(pdfText);
  if (!result.ok) {
    switch (result.reason) {
      case 'no-subject':
        throw new Error(
          'This file does not contain SpendSense data. Make sure it was exported using the PDF format from SpendSense.'
        );
      case 'decode-failed':
        throw new Error(
          'The PDF data could not be read. The file may have been modified or corrupted during transfer.'
        );
      case 'not-spendsense':
        throw new Error('This PDF was not exported from SpendSense.');
    }
  }
  let truncated = false;
  let totalRows = 0;
  // A crafted PDF payload can contain arbitrary JSON (e.g. `tables: [null]` or
  // primitives). Validate every element before dereferencing `t.rows`/`t.columns`.
  const validTables = (result.payload.tables ?? [])
    .filter(
      (t): t is ExportedTable =>
        t !== null &&
        typeof t === 'object' &&
        Array.isArray((t as { rows?: unknown }).rows) &&
        Array.isArray((t as { columns?: unknown }).columns)
    )
    .slice(0, MAX_SHEETS);
  const tables: ExportedTable[] = validTables.map((t) => {
    const cleanRows = validRows(t.rows as unknown[]);
    // Cumulative budget: cap this table by what remains of MAX_TOTAL_ROWS so a
    // crafted file cannot push 25 x 10k = 250k rows past the advertised limit.
    const remaining = Math.max(0, MAX_TOTAL_ROWS - totalRows);
    const limitedRows = cleanRows.slice(0, Math.min(MAX_ROWS_PER_TABLE, remaining));
    if (cleanRows.length > limitedRows.length || totalRows + limitedRows.length > MAX_TOTAL_ROWS) truncated = true;
    totalRows += limitedRows.length;
    return {
      ...t,
      columns: safeColumns(t.columns),
      rows: limitedRows,
    };
  });
  return {
    meta: {
      app: result.payload.app,
      currency: result.payload.currency,
      truncated: truncated || result.payload.truncated === true,
    },
    tables,
  };
}
