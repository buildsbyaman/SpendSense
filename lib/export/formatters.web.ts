import { downloadContent, downloadBlobDirect } from './download';
import { tablesToJSON, buildXlsxBytes, buildPdfBytes, type ExportFormat } from './serialize';
import { type ExportedTable } from './buildExportData';

async function tablesToXLSXDownload(
  tables: ExportedTable[],
  filename: string,
  profile: { name: string; currencyCode: string }
): Promise<void> {
  const bytes = await buildXlsxBytes(tables, profile);
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlobDirect(filename, blob);
}

async function tablesToPDFDownload(
  tables: ExportedTable[],
  filename: string,
  profile: { name: string; currencyCode: string }
): Promise<void> {
  const bytes = await buildPdfBytes(tables, profile);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  downloadBlobDirect(filename, blob);
}

export async function exportData(
  tables: ExportedTable[],
  format: ExportFormat,
  filename: string,
  profile: { name: string; currencyCode: string }
): Promise<void> {
  switch (format) {
    case 'json': {
      const json = tablesToJSON(tables, profile);
      downloadContent(filename, json, 'json');
      break;
    }
    case 'xlsx': {
      await tablesToXLSXDownload(tables, filename, profile);
      break;
    }
    case 'pdf': {
      await tablesToPDFDownload(tables, filename, profile);
      break;
    }
  }
}
