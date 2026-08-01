import { type ExportedTable } from './buildExportData';
import { type ExportFormat } from './serialize';
import { tablesToJSON, buildXlsxBytes, buildPdfBytes } from './serialize';
import { saveAndShareText, saveAndShareBytes } from './share.native';

export async function exportData(
  tables: ExportedTable[],
  format: ExportFormat,
  filename: string,
  profile: { name: string; currencyCode: string }
): Promise<void> {
  switch (format) {
    case 'json': {
      const json = tablesToJSON(tables, profile);
      await saveAndShareText(filename, json, 'json');
      break;
    }
    case 'xlsx': {
      const bytes = await buildXlsxBytes(tables);
      await saveAndShareBytes(filename, bytes, 'xlsx');
      break;
    }
    case 'pdf': {
      const bytes = await buildPdfBytes(tables, profile);
      await saveAndShareBytes(filename, bytes, 'pdf');
      break;
    }
  }
}
