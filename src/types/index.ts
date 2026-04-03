export type Platform = 'shopee' | 'tiktok' | 'offline';

export type OrderStatus = 'completed' | 'cancelled' | 'returned' | 'pending';

export interface OrderItem {
  productId: string;
  productName: string;
  variantName?: string; // variant from Shopee/TikTok, e.g. "0.8 L", "1 L", "3"
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  cogs: number; // Cost of Goods Sold per unit (already includes bundle multiplier)
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
  totalCogs: number;         // Sum of all item COGS
  netIncome: number;         // netAmount - totalCogs
  importedAt: string;        // When was this record imported
}

export interface ProductVariant {
  id: string;
  label: string;  // variant name, e.g. "0.8 L", "1 L", "120 ml"
  cogs: number;   // HPP per pcs/unit (NOT per bundle)
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  cogs: number;              // fallback HPP when no variant matched
  variants: ProductVariant[]; // per-variant HPP
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeeConfig {
  shopeeAdminFeeRate: number;      // percentage e.g. 2.5 means 2.5%
  shopeePaymentFeeRate: number;    // e.g. 2.0
  shopeeFixedFeePerOrder: number;  // flat fee per order e.g. 1250
  tiktokAdminFeeRate: number;      // e.g. 5.0
  tiktokPaymentFeeRate: number;    // e.g. 2.0
  tiktokFixedFeePerOrder: number;  // flat fee per order e.g. 1250
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
