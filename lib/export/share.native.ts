import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { MIME_TYPES, type ExportFormat } from './serialize';
import Toast from 'react-native-toast-message';

async function saveAndShare(
  filename: string,
  content: string | Uint8Array,
  format: ExportFormat
): Promise<void> {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(content);

  if (await isAvailableAsync()) {
    await shareAsync(file.uri, {
      mimeType: MIME_TYPES[format],
      dialogTitle: 'Export',
    });
  } else {
    Toast.show({
      type: 'info',
      text1: 'File Saved',
      text2: `${filename} saved to cache.`,
    });
  }
}

export function saveAndShareText(
  filename: string,
  content: string,
  format: ExportFormat
): Promise<void> {
  return saveAndShare(filename, content, format);
}

export function saveAndShareBytes(
  filename: string,
  bytes: Uint8Array,
  format: ExportFormat
): Promise<void> {
  return saveAndShare(filename, bytes, format);
}
