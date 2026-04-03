/**
 * TikTok Shop CSV Parser
 *
 * TikTok Shop exports orders with columns like:
 * - "Order ID"
 * - "Order Status"
 * - "Product Name"
 * - "SKU ID" / "Seller SKU"
 * - "Quantity"
 * - "SKU Unit Original Price" / "Product Price"
 * - "SKU Subtotal Before Discount"
 * - "SKU Subtotal After Discount"
 * - "Shipping Fee After Discount"
 * - "TikTok Shop Commission"
 * - "Transaction Fee"
 * - "Order Amount"
 * - "Created Time"
 */

import Papa from 'papaparse';
import { Order, OrderItem, Platform } from '../types';
import { generateId, parseLocalDate } from './helpers';
import { getProductByName } from '../storage/database';

const COL = {
  orderId: ['order id', 'order_id', 'no. pesanan', 'id pesanan'],
  status: ['order status', 'status', 'status pesanan'],
  productName: ['product name', 'nama produk', 'product name(s)'],
  sku: ['seller sku', 'sku id', 'sku'],
  quantity: ['quantity', 'jumlah', 'qty'],
  unitPrice: ['sku unit original price', 'product price', 'harga produk', 'unit price'],
  subtotalAfterDiscount: ['sku subtotal after discount', 'subtotal after discount', 'subtotal setelah diskon'],
  subtotalBeforeDiscount: ['sku subtotal before discount', 'subtotal before discount'],
  orderAmount: ['order amount', 'total order', 'jumlah pesanan', 'total amount'],
  commission: ['tiktok shop commission', 'commission fee', 'biaya komisi', 'commission'],
  transactionFee: ['transaction fee', 'biaya transaksi'],
  createdTime: ['created time', 'order creation time', 'tanggal pesanan', 'order date'],
  sellerDiscount: ['seller discount', 'diskon penjual'],
};

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function resolveStatus(raw: string): 'completed' | 'cancelled' | 'returned' | 'pending' {
  const s = raw.toLowerCase();
  if (s.includes('completed') || s.includes('delivered') || s.includes('selesai')) return 'completed';
  if (s.includes('cancel') || s.includes('batal')) return 'cancelled';
  if (s.includes('return') || s.includes('retur') || s.includes('refund')) return 'returned';
  return 'pending';
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function parseTikTokCSV(
  csvContent: string,
  importedAt: string,
  adminFeeRate: number,
  paymentFeeRate: number
): Promise<Order[]> {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error('Gagal membaca file TikTok: ' + result.errors[0].message);
  }

  const headers = result.meta.fields || [];

  const colOrderId = findColumn(headers, COL.orderId);
  const colStatus = findColumn(headers, COL.status);
  const colProductName = findColumn(headers, COL.productName);
  const colSku = findColumn(headers, COL.sku);
  const colQuantity = findColumn(headers, COL.quantity);
  const colUnitPrice = findColumn(headers, COL.unitPrice);
  const colSubtotalAfter = findColumn(headers, COL.subtotalAfterDiscount);
  const colSubtotalBefore = findColumn(headers, COL.subtotalBeforeDiscount);
  const colOrderAmount = findColumn(headers, COL.orderAmount);
  const colCommission = findColumn(headers, COL.commission);
  const colTransactionFee = findColumn(headers, COL.transactionFee);
  const colCreatedTime = findColumn(headers, COL.createdTime);

  if (!colOrderId) {
    throw new Error(
      'Format CSV TikTok tidak dikenali. Pastikan file adalah ekspor pesanan dari TikTok Seller Center.'
    );
  }

  // Group rows by order ID
  const orderMap = new Map<string, { rows: Record<string, string>[] }>();

  for (const row of result.data) {
    const orderId = colOrderId ? (row[colOrderId] || '').trim() : '';
    if (!orderId) continue;
    if (!orderMap.has(orderId)) orderMap.set(orderId, { rows: [] });
    orderMap.get(orderId)!.rows.push(row);
  }

  const orders: Order[] = [];

  for (const [orderId, { rows }] of orderMap) {
    const firstRow = rows[0];
    const statusRaw = colStatus ? (firstRow[colStatus] || '') : 'completed';
    const status = resolveStatus(statusRaw);

    if (status === 'cancelled') continue;

    const orderDateRaw = colCreatedTime ? (firstRow[colCreatedTime] || '') : '';
    const orderDate = parseLocalDate(orderDateRaw);

    const items: OrderItem[] = [];
    let grossAmount = 0;

    for (const row of rows) {
      const productName = colProductName ? (row[colProductName] || 'Produk').trim() : 'Produk';
      const sku = colSku ? (row[colSku] || '').trim() : '';
      const quantity = colQuantity ? parseNumber(row[colQuantity]) : 1;
      const unitPrice = colUnitPrice ? parseNumber(row[colUnitPrice]) : 0;

      let subtotal = 0;
      if (colSubtotalAfter) subtotal = parseNumber(row[colSubtotalAfter]);
      else if (colSubtotalBefore) subtotal = parseNumber(row[colSubtotalBefore]);
      else subtotal = unitPrice * quantity;

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

    // Use order amount if available
    const orderAmountRaw = colOrderAmount ? parseNumber(firstRow[colOrderAmount]) : 0;
    if (orderAmountRaw > 0) grossAmount = orderAmountRaw;

    // Admin fees
    let commissionFee = colCommission ? parseNumber(firstRow[colCommission]) : 0;
    let transactionFee = colTransactionFee ? parseNumber(firstRow[colTransactionFee]) : 0;

    if (commissionFee === 0) commissionFee = grossAmount * (adminFeeRate / 100);
    if (transactionFee === 0) transactionFee = grossAmount * (paymentFeeRate / 100);

    const adminFeeAmount = commissionFee + transactionFee;
    const netAmount = grossAmount - adminFeeAmount;
    const totalCogs = items.reduce((s, i) => s + i.totalCogs, 0);
    const netIncome = netAmount - totalCogs;

    orders.push({
      id: generateId(),
      externalId: orderId,
      platform: 'tiktok' as Platform,
      date: orderDate,
      status,
      items,
      grossAmount,
      adminFeeAmount,
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
