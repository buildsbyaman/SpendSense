import { parseJson, parseXlsx, parsePdf, type ParsedFile } from './parse';
import { readFileAsText, readFileAsBytes } from './readFile';

// Reject files larger than 20MB to prevent memory exhaustion / DoS.
export const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Reads and parses a picked document into an import plan payload. The cap is
 * enforced on the decoded text/bytes (asset.size may be undefined for content://
 * URIs, and zip-bombs inflate well beyond it).
 */
export async function parseDocumentFile(uri: string, format: string): Promise<ParsedFile> {
  let parsed;
  if (format === 'json') {
    const text = await readFileAsText(uri);
    if (text.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('This file is too large (max 20MB).');
    }
    parsed = parseJson(text);
  } else if (format === 'pdf') {
    const text = await readFileAsText(uri);
    if (text.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('This file is too large (max 20MB).');
    }
    parsed = parsePdf(text);
  } else {
    const bytes = await readFileAsBytes(uri);
    if (bytes.length > MAX_IMPORT_FILE_SIZE) {
      throw new Error('This file is too large (max 20MB).');
    }
    parsed = await parseXlsx(bytes);
  }
  return parsed;
}
