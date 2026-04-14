/**
 * Universal file reader — supports CSV and Excel (.xlsx/.xls)
 * Uses SheetJS (xlsx) to convert Excel to CSV, then PapaParse reads it.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { readUri } from './fileUtils';

export type FileType = 'csv' | 'xlsx' | 'xls' | 'unknown';

export function detectFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'xls') return 'xls';
  return 'unknown';
}

/**
 * Read a file (CSV or Excel) and return the data as an array of row objects.
 * Internally converts Excel to CSV format first.
 */
export async function readFileAsRows(
  uri: string,
  fileName: string
): Promise<{ rows: Record<string, string>[]; headers: string[] }> {
  const fileType = detectFileType(fileName);

  if (fileType === 'csv' || fileType === 'unknown') {
    const content = await readUri(uri, 'utf8');
    return parseCSVContent(content);
  }

  // Read Excel as base64
  const base64 = await readUri(uri, 'base64');

  const workbook = XLSX.read(base64, { type: 'base64', cellText: true, cellDates: true });

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File Excel tidak mengandung sheet yang valid.');
  }

  const worksheet = workbook.Sheets[sheetName];

  // Convert to CSV then parse
  const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
  return parseCSVContent(csv);
}

function parseCSVContent(content: string): { rows: Record<string, string>[]; headers: string[] } {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return {
    rows: result.data,
    headers: result.meta.fields || [],
  };
}

/**
 * Read raw file content as string (for CSV parsers that need raw text)
 */
export async function readFileAsString(uri: string, fileName: string): Promise<string> {
  const fileType = detectFileType(fileName);

  if (fileType === 'csv' || fileType === 'unknown') {
    return readUri(uri, 'utf8');
  }

  // Excel: convert to CSV string
  const base64 = await readUri(uri, 'base64');

  const workbook = XLSX.read(base64, { type: 'base64', cellText: true, cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('File Excel tidak mengandung sheet yang valid.');
  }

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
}
