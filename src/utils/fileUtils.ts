/**
 * Native file utilities — uses expo-file-system and expo-sharing.
 * On web, Metro automatically picks fileUtils.web.ts instead.
 */
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function readUri(uri: string, encoding: 'utf8' | 'base64'): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: encoding === 'base64'
      ? FileSystem.EncodingType.Base64
      : FileSystem.EncodingType.UTF8,
  });
}

export async function downloadFile(
  content: string,
  filename: string,
  mimeType = 'text/csv',
): Promise<void> {
  const path = (FileSystem.documentDirectory ?? '') + filename;
  await FileSystem.writeAsStringAsync(path, content, { encoding: 'utf8' });
  await Sharing.shareAsync(path, { mimeType });
}
