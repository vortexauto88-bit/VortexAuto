/**
 * Shopee CSV Parser
 *
 * Shopee exports orders with columns like (may vary by region/app version):
 * - "No. Pesanan" / "Order ID"
 * - "Status Pesanan" / "Order Status"
 * - "Nama Produk" / "Product Name(s)"
 * - "Jumlah" / "Quantity"
 * - "Harga Satuan Produk" / "Unit Price"
 * - "Total Harga Produk" / "Product Subtotal"
 * - "Ongkos Kirim yang Dibebankan ke Pembeli"
 * - "Estimasi Potongan Biaya Pengiriman dari Shopee"
 * - "Voucher Ditanggung Shopee"
 * - "Voucher Ditanggung Penjual"
 * - "Cashback Koin"
 * - "Total Pembayaran" / "Total Amount"
 * - "Waktu Pesanan Dibuat" / "Order Creation Time"
 * - "Biaya Administrasi" / "Commission Fee"
 * - "Biaya Transaksi" / "Transaction Fee"
 */

import Papa from 'papaparse';
import { Order, OrderItem, Platform } from '../types';
import { generateId, parseLocalDate } from './helpers';
import { getProductCogsByNameAndVariant } from '../storage/database';

// Map of possible column name variations (lowercase)
const COL = {
  orderId: ['no. pesanan', 'order id', 'nomor pesanan', 'no pesanan'],
  status: ['status pesanan', 'order status', 'status'],
  productName: ['nama produk', 'product name', 'nama produk(s)', "product name(s)"],
  variantName: ['nama variasi', 'variasi produk', 'variation name', 'variant name', 'nama varian'],
  quantity: ['jumlah', 'quantity', 'jumlah produk'],
  unitPrice: ['harga satuan produk', 'unit price', 'harga satuan'],
  productSubtotal: ['total harga produk', 'product subtotal', 'subtotal produk'],
  totalPayment: ['total pembayaran', 'total amount', 'jumlah pembayaran pembeli'],
  orderDate: ['waktu pesanan dibuat', 'order creation time', 'tanggal pesanan', 'order date'],
  commissionFee: ['biaya administrasi', 'commission fee', 'biaya komisi', 'biaya admin'],
  transactionFee: ['biaya transaksi', 'transaction fee', 'biaya layanan'],
  voucherSeller: ['voucher ditanggung penjual', 'seller voucher', 'diskon voucher penjual'],
  shippingBuyer: ['ongkos kirim yang dibebankan ke pembeli', 'shipping fee', 'ongkir pembeli'],
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
  if (s.includes('selesai') || s.includes('completed') || s.includes('delivered')) return 'completed';
  if (s.includes('batal') || s.includes('cancel')) return 'cancelled';
  if (s.includes('retur') || s.includes('return') || s.includes('refund')) return 'returned';
  return 'pending';
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  // Remove currency symbols, dots as thousand separators, commas
  const cleaned = val.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function parseShopeeCSV(
  csvContent: string,
  importedAt: string,
  adminFeeRate: number,
  paymentFeeRate: number,
  fixedFeePerOrder: number = 0,
): Promise<Order[]> {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error('Gagal membaca file Shopee: ' + result.errors[0].message);
  }

  const headers = result.meta.fields || [];

  const colOrderId = findColumn(headers, COL.orderId);
  const colStatus = findColumn(headers, COL.status);
  const colProductName = findColumn(headers, COL.productName);
  const colVariantName = findColumn(headers, COL.variantName);
  const colQuantity = findColumn(headers, COL.quantity);
  const colUnitPrice = findColumn(headers, COL.unitPrice);
  const colProductSubtotal = findColumn(headers, COL.productSubtotal);
  const colTotalPayment = findColumn(headers, COL.totalPayment);
  const colOrderDate = findColumn(headers, COL.orderDate);
  const colCommissionFee = findColumn(headers, COL.commissionFee);
  const colTransactionFee = findColumn(headers, COL.transactionFee);
  const colVoucherSeller = findColumn(headers, COL.voucherSeller);
  const colShippingBuyer = findColumn(headers, COL.shippingBuyer);

  if (!colOrderId) {
    throw new Error(
      'Format CSV Shopee tidak dikenali. Pastikan file adalah ekspor pesanan dari Shopee Seller Center.'
    );
  }

  // Group rows by order ID (one order can have multiple product rows)
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
    const statusRaw = colStatus ? (firstRow[colStatus] || '') : 'selesai';
    const status = resolveStatus(statusRaw);

    // Skip cancelled orders unless user wants them
    if (status === 'cancelled') continue;

    const orderDateRaw = colOrderDate ? (firstRow[colOrderDate] || '') : '';
    const orderDate = parseLocalDate(orderDateRaw);

    // Build items
    const items: OrderItem[] = [];
    let grossAmount = 0;

    for (const row of rows) {
      const productName = colProductName ? (row[colProductName] || 'Produk').trim() : 'Produk';
      const variantName = colVariantName ? (row[colVariantName] || '').trim() : '';
      const quantity = colQuantity ? parseNumber(row[colQuantity]) : 1;
      const unitPrice = colUnitPrice ? parseNumber(row[colUnitPrice]) : 0;
      let subtotal = colProductSubtotal ? parseNumber(row[colProductSubtotal]) : unitPrice * quantity;

      if (subtotal === 0) subtotal = unitPrice * quantity;

      // Look up COGS from product database using variant-aware matching
      const { cogs: cogsPerUnit, productId } = await getProductCogsByNameAndVariant(productName, variantName);

      items.push({
        productId,
        productName,
        variantName,
        quantity,
        unitPrice,
        subtotal,
        cogs: cogsPerUnit,
        totalCogs: cogsPerUnit * quantity,
      });

      grossAmount += subtotal;
    }

    // Use total payment column if available (more accurate)
    const totalPaymentRaw = colTotalPayment ? parseNumber(firstRow[colTotalPayment]) : 0;
    if (totalPaymentRaw > 0) grossAmount = totalPaymentRaw;

    // Admin fees: use CSV values if available, otherwise calculate from rates
    let commissionFee = colCommissionFee ? parseNumber(firstRow[colCommissionFee]) : 0;
    let transactionFee = colTransactionFee ? parseNumber(firstRow[colTransactionFee]) : 0;

    if (commissionFee === 0) commissionFee = grossAmount * (adminFeeRate / 100);
    if (transactionFee === 0) transactionFee = grossAmount * (paymentFeeRate / 100);

    const adminFeeAmount = commissionFee + transactionFee + fixedFeePerOrder;
    const voucherDiscount = colVoucherSeller ? parseNumber(firstRow[colVoucherSeller]) : 0;
    const shippingCost = colShippingBuyer ? parseNumber(firstRow[colShippingBuyer]) : 0;

    const netAmount = grossAmount - adminFeeAmount;
    const totalCogs = items.reduce((s, i) => s + i.totalCogs, 0);
    const netIncome = netAmount - totalCogs;

    orders.push({
      id: generateId(),
      externalId: orderId,
      platform: 'shopee' as Platform,
      date: orderDate,
      status,
      items,
      grossAmount,
      adminFeeAmount,
      voucherDiscount,
      shippingCost,
      netAmount,
      totalCogs,
      netIncome,
      importedAt,
      _fixedFeeAdded: true,
    } as any);
  }

  return orders;
}
