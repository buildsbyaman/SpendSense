import { parseJson, parseXlsx, parsePdf, type ParsedFile } from './parse';
import { readFileAsText, readFileAsBytes } from './readFile';

// Reject files larger than 20MB to prevent memory exhaustion / DoS.
export const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024;

export type DetectedFormat = 'json' | 'xlsx' | 'pdf';

export interface ParsedDocumentResult extends ParsedFile {
  format: DetectedFormat;
}

/**
 * Detects format from filename and MIME type.
 */
export function detectFormatFromMeta(
  filename?: string | null,
  mimeType?: string | null
): DetectedFormat | null {
  if (filename) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.json')) return 'json';
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
    if (lower.endsWith('.pdf')) return 'pdf';
  }

  if (mimeType) {
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime === 'application/json' || lowerMime === 'text/json') return 'json';
    if (lowerMime === 'application/pdf') return 'pdf';
    if (
      lowerMime.includes('spreadsheetml') ||
      lowerMime.includes('ms-excel') ||
      lowerMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return 'xlsx';
    }
  }

  return null;
}

/**
 * Reads and parses a picked document into an import plan payload.
 * Format is auto-detected from filename, MIME type, or content inspection.
 */
export async function parseDocumentFile(
  uri: string,
  filenameOrFormat?: string | null,
  mimeType?: string | null
): Promise<ParsedDocumentResult> {
  let format: DetectedFormat | null = null;
  if (filenameOrFormat === 'json' || filenameOrFormat === 'xlsx' || filenameOrFormat === 'pdf') {
    format = filenameOrFormat;
  } else {
    format = detectFormatFromMeta(filenameOrFormat, mimeType);
  }

  // If format cannot be determined from metadata, inspect initial bytes / content
  if (!format) {
    const bytes = await readFileAsBytes(uri);
    if (bytes.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('This file is too large (max 20MB).');
    }

    // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      format = 'pdf';
    } else if (
      // ZIP / XLSX magic: PK\x03\x04
      (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) ||
      // Legacy Excel CFB magic: \xD0\xCF\x11\xE0
      (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0)
    ) {
      format = 'xlsx';
    } else {
      // Check if text starts with JSON object or array
      const textSample = new TextDecoder().decode(bytes.slice(0, 100)).trimStart();
      if (textSample.startsWith('{') || textSample.startsWith('[')) {
        format = 'json';
      }
    }

    if (!format) {
      throw new Error('Unsupported file format. Please upload a JSON, Excel (.xlsx), or PDF file.');
    }

    if (format === 'xlsx') {
      const parsed = await parseXlsx(bytes);
      return { ...parsed, format };
    } else if (format === 'json') {
      const text = new TextDecoder().decode(bytes);
      const parsed = parseJson(text);
      return { ...parsed, format };
    } else {
      const text = await readFileAsText(uri);
      const parsed = parsePdf(text);
      return { ...parsed, format };
    }
  }

  if (format === 'json') {
    const text = await readFileAsText(uri);
    if (text.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('This file is too large (max 20MB).');
    }
    const parsed = parseJson(text);
    return { ...parsed, format };
  } else if (format === 'pdf') {
    const text = await readFileAsText(uri);
    if (text.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('This file is too large (max 20MB).');
    }
    const parsed = parsePdf(text);
    return { ...parsed, format };
  } else {
    const bytes = await readFileAsBytes(uri);
    if (bytes.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('This file is too large (max 20MB).');
    }
    const parsed = await parseXlsx(bytes);
    return { ...parsed, format };
  }
}
