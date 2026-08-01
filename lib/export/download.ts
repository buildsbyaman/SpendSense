export { type ExportFormat, EXTENSIONS, MIME_TYPES, buildFilename } from './serialize';

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadContent(filename: string, content: string, format: string) {
  const mime = format === 'json' ? 'application/json;charset=utf-8;' : 'application/octet-stream';
  const blob = new Blob([content], { type: mime });
  downloadBlob(filename, blob);
}

export function downloadBlobDirect(filename: string, blob: Blob) {
  downloadBlob(filename, blob);
}
