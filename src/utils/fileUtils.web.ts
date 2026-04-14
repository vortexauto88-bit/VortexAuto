/**
 * Web file utilities — uses fetch() and Blob/URL APIs.
 * Metro bundler automatically picks this file on web platform.
 */

export async function readUri(uri: string, encoding: 'utf8' | 'base64'): Promise<string> {
  const response = await fetch(uri);
  if (encoding === 'base64') {
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  return response.text();
}

export async function downloadFile(
  content: string,
  filename: string,
  mimeType = 'text/csv',
): Promise<void> {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
