export type Platform = 'shopee' | 'tiktok' | 'offline';

export type OrderStatus = 'completed' | 'cancelled' | 'returned' | 'pending';

export interface OrderItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  cogs: number; // Cost of Goods Sold per unit
  totalCogs: number; // cogs * quantity
}

export interface Order {
  id: string;
  externalId: string; // Order ID from Shopee/TikTok/Offline
  platform: Platform;
  date: string; // ISO date string
  status: OrderStatus;
  items: OrderItem[];
  grossAmount: number;       // Total before any deductions
  adminFeeAmount: number;    // Admin/commission fee
  voucherDiscount: number;   // Voucher/discount amount
  shippingCost: number;      // Shipping cost (if applicable)
  netAmount: number;         // grossAmount - adminFeeAmount
  totalCogs: number;         // Sum of all item COGSg
  netIncome: number;         // netAmount - totalCogs
  importedAt: string;        // When was this record imported
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "1 Botol", "3 Botol", "5 Botol"
  cogs: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  cogs: number; // Default COGS (used when no variant matches)
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeeConfig {
  shopeeAdminFeeRate: number;      // percentage e.g. 2.5 means 2.5%
  shopeePaymentFeeRate: number;    // e.g. 2.0
  tiktokAdminFeeRate: number;      // e.g. 5.0
  tiktokPaymentFeeRate: number;    // e.g. 2.0
}

export interface AppSettings {
  adminFees: AdminFeeConfig;
  currency: string; // e.g. 'IDR'
  currencySymbol: string; // e.g. 'Rp'
}

export interface ImportSession {
  id: string;
  platform: Platform;
  fileName: string;
  importedAt: string;
  orderCount: number;
  grossTotal: number;
  netTotal: number;
}

export interface SalesSummary {
  grossSales: number;
  adminFees: number;
  netSales: number;
  totalCogs: number;
  netIncome: number;
  orderCount: number;
  byPlatform: {
    shopee: PlatformSummary;
    tiktok: PlatformSummary;
    offline: PlatformSummary;
  };
}

export interface PlatformSummary {
  grossSales: number;
  adminFees: number;
  netSales: number;
  totalCogs: number;
  netIncome: number;
  orderCount: number;
}

export type DateRangeType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DateRange {
  type: DateRangeType;
  startDate: string;
  endDate: string;
  label: string;
}

export interface ChartDataPoint {
  date: string;
  grossSales: number;
  netSales: number;
  netIncome: number;
}
