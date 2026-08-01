import { encodeUtf8Base64, decodeUtf8Base64 } from './base64';

export interface PdfPayload {
  app: string;
  currency: string;
  tables: { title: string; columns: string[]; rows: Record<string, string | number>[] }[];
}

export function encodePayloadForPdf(payload: PdfPayload): string {
  return encodeUtf8Base64(JSON.stringify(payload));
}

export function decodePayloadFromPdf(pdfText: string): PdfPayload | null {
  const match = pdfText.match(/\/Subject\s*\(([^)]*)\)/);
  if (!match) return null;
  try {
    const json = decodeUtf8Base64(match[1]);
    const obj = JSON.parse(json);
    if (obj.app === 'SpendSense' && Array.isArray(obj.tables)) return obj;
    return null;
  } catch {
    return null;
  }
}
