/**
 * Offline Invoice CSV/Excel Parser
 *
 * Expected format (CSV template yang disediakan aplikasi):
 * - "Tanggal" / "Date"               → tanggal transaksi (dd/mm/yyyy atau yyyy-mm-dd)
 * - "No. Invoice" / "Invoice ID"     → nomor invoice
 * - "Nama Produk" / "Product Name"   → nama produk
 * - "SKU"                            → kode produk (opsional)
 * - "Jumlah" / "Quantity"            → jumlah unit
 * - "Harga Satuan" / "Unit Price"    → harga per unit
 * - "Subtotal"                       → jumlah * harga (opsional, dihitung otomatis)
 * - "Catatan" / "Notes"              → catatan (opsional)
 */

import Papa from 'papaparse';
import { Order, OrderItem, Platform } from '../types';
import { generateId, parseLocalDate } from './helpers';
import { getProductByName } from '../storage/database';

const COL = {
  date: ['tanggal', 'date', 'tgl'],
  invoiceId: ['no. invoice', 'invoice id', 'no invoice', 'nomor invoice', 'id'],
  productName: ['nama produk', 'product name', 'produk', 'nama barang'],
  sku: ['sku', 'kode produk', 'product code'],
  quantity: ['jumlah', 'quantity', 'qty', 'jumlah unit'],
  unitPrice: ['harga satuan', 'unit price', 'harga', 'price'],
  subtotal: ['subtotal', 'total harga', 'total'],
  notes: ['catatan', 'notes', 'keterangan'],
};

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function parseOfflineCSV(
  csvContent: string,
  importedAt: string
): Promise<Order[]> {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error('Gagal membaca file offline: ' + result.errors[0].message);
  }

  const headers = result.meta.fields || [];

  const colDate = findColumn(headers, COL.date);
  const colInvoiceId = findColumn(headers, COL.invoiceId);
  const colProductName = findColumn(headers, COL.productName);
  const colSku = findColumn(headers, COL.sku);
  const colQuantity = findColumn(headers, COL.quantity);
  const colUnitPrice = findColumn(headers, COL.unitPrice);
  const colSubtotal = findColumn(headers, COL.subtotal);

  if (!colDate && !colInvoiceId) {
    throw new Error(
      'Format CSV offline tidak dikenali. Gunakan template CSV yang tersedia di halaman Import.'
    );
  }

  // Group rows by invoice ID
  const orderMap = new Map<string, { rows: Record<string, string>[] }>();

  for (const row of result.data) {
    const invoiceId = colInvoiceId
      ? (row[colInvoiceId] || '').trim()
      : (colDate ? (row[colDate] || '') : '') + '_' + generateId();
    if (!invoiceId) continue;
    if (!orderMap.has(invoiceId)) orderMap.set(invoiceId, { rows: [] });
    orderMap.get(invoiceId)!.rows.push(row);
  }

  const orders: Order[] = [];

  for (const [invoiceId, { rows }] of orderMap) {
    const firstRow = rows[0];
    const dateRaw = colDate ? (firstRow[colDate] || '') : '';
    const orderDate = parseLocalDate(dateRaw);

    const items: OrderItem[] = [];
    let grossAmount = 0;

    for (const row of rows) {
      const productName = colProductName ? (row[colProductName] || 'Produk').trim() : 'Produk';
      const sku = colSku ? (row[colSku] || '').trim() : '';
      const quantity = colQuantity ? parseNumber(row[colQuantity]) : 1;
      const unitPrice = colUnitPrice ? parseNumber(row[colUnitPrice]) : 0;
      let subtotal = colSubtotal ? parseNumber(row[colSubtotal]) : 0;
      if (subtotal === 0) subtotal = unitPrice * quantity;

      const product = await getProductByName(sku || productName);
      const cogsPerUnit = product?.cogs || 0;

      items.push({
        productId: product?.id || '',
        productName,
        sku,
        quantity,
        unitPrice,
        subtotal,
        cogs: cogsPerUnit,
        totalCogs: cogsPerUnit * quantity,
      });

      grossAmount += subtotal;
    }

    const totalCogs = items.reduce((s, i) => s + i.totalCogs, 0);
    const netAmount = grossAmount; // No admin fee for offline
    const netIncome = netAmount - totalCogs;

    orders.push({
      id: generateId(),
      externalId: invoiceId,
      platform: 'offline' as Platform,
      date: orderDate,
      status: 'completed',
      items,
      grossAmount,
      adminFeeAmount: 0,
      voucherDiscount: 0,
      shippingCost: 0,
      netAmount,
      totalCogs,
      netIncome,
      importedAt,
    });
  }

  return orders;
}

// ── Template CSV Generator ───────────────────────────────────────────────────

export function generateOfflineTemplate(): string {
  const headers = [
    'No. Invoice',
    'Tanggal',
    'Nama Produk',
    'SKU',
    'Jumlah',
    'Harga Satuan',
    'Subtotal',
    'Catatan',
  ].join(',');

  const exampleRows = [
    ['INV-001', '2024-01-15', 'Produk A', 'SKU-001', '2', '50000', '100000', ''].join(','),
    ['INV-001', '2024-01-15', 'Produk B', 'SKU-002', '1', '75000', '75000', ''].join(','),
    ['INV-002', '2024-01-16', 'Produk C', 'SKU-003', '3', '30000', '90000', 'Pelanggan tetap'].join(','),
  ];

  return [headers, ...exampleRows].join('\n');
}
