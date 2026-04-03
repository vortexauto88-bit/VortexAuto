import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Order, Product, SalesSummary, PlatformSummary, ChartDataPoint, DateRange, DateRangeType } from '../types';

// ── ID Generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ── Variant / HPP Matching ────────────────────────────────────────────────────

/**
 * Normalize a variant label to a compact key for fuzzy matching.
 * Examples:
 *   "0.8 L"          → "08l"
 *   "1 L"            → "1l"
 *   "120 ml"         → "120ml"
 *   "0.8 lter|20w-40"→ "08l"   (take part before "|")
 *   "1 botol|100 ml" → "100ml"
 */
export function normalizeVariantKey(v: string): string {
  let s = v.toLowerCase().trim();
  // If contains "|", prefer the part that has volume info (ml/l)
  if (s.includes('|')) {
    const parts = s.split('|');
    // Pick the part containing a volume unit
    const volPart = parts.find(p => /\d+\s*(ml|l\b|liter|litre|ltr)/.test(p));
    s = (volPart || parts[parts.length - 1]).trim();
  }
  return s
    .replace(/\bliter\b|\blitre\b|\bltr\b/g, 'l')
    .replace(/\bbotol\b/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')        // "0.8" → "08"
    .replace(/[^0-9a-z]/g, '');
}

/**
 * Extract a quantity multiplier from a Shopee variant name.
 * Used when the variant represents a bundle.
 *
 * Examples:
 *   "3"           → { sizeKey: "",      qty: 3 }  ← pure qty (single-type product)
 *   "5"           → { sizeKey: "",      qty: 5 }
 *   "120 ml x 5"  → { sizeKey: "120ml", qty: 5 }
 *   "3 botol|120 ml" → { sizeKey: "120ml", qty: 3 }
 *   "0.8 L"       → { sizeKey: "08l",   qty: 1 }
 *   "1 L"         → { sizeKey: "1l",    qty: 1 }
 */
export function extractVariantQty(variantName: string): { sizeKey: string; qty: number } {
  const v = variantName.trim();

  // Pure integer → quantity multiplier for a single-type product
  if (/^\d+$/.test(v)) {
    return { sizeKey: '', qty: parseInt(v, 10) };
  }

  // "size x N" pattern, e.g., "120 ml x 5", "120ml X 3"
  const xMatch = v.match(/^(.+?)\s*[xX×]\s*(\d+)$/);
  if (xMatch) {
    return { sizeKey: normalizeVariantKey(xMatch[1].trim()), qty: parseInt(xMatch[2], 10) };
  }

  // "N botol|size" pattern, e.g., "3 botol|120 ml"
  const botolMatch = v.match(/^(\d+)\s*botol[|\s](.+)$/i);
  if (botolMatch && parseInt(botolMatch[1], 10) > 1) {
    return { sizeKey: normalizeVariantKey(botolMatch[2].trim()), qty: parseInt(botolMatch[1], 10) };
  }

  return { sizeKey: normalizeVariantKey(v), qty: 1 };
}

/**
 * Look up the HPP (COGS per order-item unit) for a product given its variant name.
 *
 * Logic:
 * 1. If product has no variants → return product.cogs (fallback).
 * 2. Extract sizeKey + qty multiplier from variantName.
 * 3. Match sizeKey against each variant's normalized label.
 * 4. Return matchedVariant.cogs × qty  (HPP per pcs × bundle size).
 * 5. Fallback to product.cogs × qty if no variant matched.
 */
export function findCogsByVariant(product: Product, variantName: string): number {
  if (!product.variants || product.variants.length === 0) {
    return product.cogs;
  }

  if (!variantName) return product.cogs;

  const { sizeKey, qty } = extractVariantQty(variantName);

  if (!sizeKey) {
    // Pure-qty variant (e.g., "3") → multiply the first/only variant's HPP
    const baseCogs = product.variants[0]?.cogs ?? product.cogs;
    return baseCogs * qty;
  }

  // Find the best matching variant
  const matched = product.variants.find((v) => {
    const vKey = normalizeVariantKey(v.label);
    return vKey === sizeKey || vKey.includes(sizeKey) || sizeKey.includes(vKey);
  });

  const baseCogs = matched?.cogs ?? product.cogs;
  return baseCogs * qty;
}

// ── Date Parsing ─────────────────────────────────────────────────────────────

/**
 * Parse various date formats from CSV exports.
 * Returns ISO date string (yyyy-MM-dd).
 */
export function parseLocalDate(raw: string): string {
  if (!raw) return format(new Date(), 'yyyy-MM-dd');

  const s = raw.trim();

  // Already ISO: 2024-01-15 or 2024-01-15T...
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try native Date parse
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return format(parsed, 'yyyy-MM-dd');
  }

  return format(new Date(), 'yyyy-MM-dd');
}

// ── Currency Formatting ───────────────────────────────────────────────────────

export function formatCurrency(amount: number, symbol = 'Rp'): string {
  if (isNaN(amount)) return `${symbol} 0`;
  const formatted = Math.abs(Math.round(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${symbol} ${amount < 0 ? '-' : ''}${formatted}`;
}

export function formatCurrencyShort(amount: number, symbol = 'Rp'): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${symbol} ${(abs / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${sign}${symbol} ${(abs / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${sign}${symbol} ${(abs / 1_000).toFixed(0)}rb`;
  return `${sign}${symbol} ${Math.round(abs)}`;
}

// ── Date Range ────────────────────────────────────────────────────────────────

export function getDateRange(type: DateRangeType, customStart?: string, customEnd?: string): DateRange {
  const today = new Date();

  switch (type) {
    case 'daily':
      return {
        type,
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
        label: 'Hari Ini',
      };

    case 'weekly': {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      return {
        type,
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        label: 'Minggu Ini',
      };
    }

    case 'monthly': {
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      return {
        type,
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        label: format(today, 'MMMM yyyy', { locale: idLocale }),
      };
    }

    case 'custom':
      return {
        type,
        startDate: customStart || format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: customEnd || format(today, 'yyyy-MM-dd'),
        label: `${customStart} - ${customEnd}`,
      };
  }
}

export function formatDateLabel(date: string, type: DateRangeType): string {
  try {
    const d = parseISO(date);
    switch (type) {
      case 'daily': return format(d, 'HH:mm');
      case 'weekly': return format(d, 'EEE', { locale: idLocale });
      case 'monthly': return format(d, 'd MMM', { locale: idLocale });
      case 'custom': return format(d, 'd/M', { locale: idLocale });
    }
  } catch {
    return date;
  }
}

// ── Sales Calculations ────────────────────────────────────────────────────────

export function calculateSummary(orders: Order[]): SalesSummary {
  // Include both 'completed' and 'returned' orders.
  // Returned orders carry negative amounts (they subtract from totals).
  // Cancelled orders are fully excluded.
  const completed = orders.filter((o) => o.status !== 'cancelled');

  const emptyPlatform = (): PlatformSummary => ({
    grossSales: 0,
    adminFees: 0,
    netSales: 0,
    totalCogs: 0,
    netIncome: 0,
    orderCount: 0,
  });

  const summary: SalesSummary = {
    grossSales: 0,
    adminFees: 0,
    netSales: 0,
    totalCogs: 0,
    netIncome: 0,
    // orderCount = only truly completed orders (returned reduce totals but not counted as success)
    orderCount: orders.filter((o) => o.status === 'completed').length,
    byPlatform: {
      shopee: emptyPlatform(),
      tiktok: emptyPlatform(),
      offline: emptyPlatform(),
    },
  };

  for (const order of completed) {
    summary.grossSales += order.grossAmount;
    summary.adminFees += order.adminFeeAmount;
    summary.netSales += order.netAmount;
    summary.totalCogs += order.totalCogs;
    summary.netIncome += order.netIncome;

    const plat = summary.byPlatform[order.platform];
    plat.grossSales += order.grossAmount;
    plat.adminFees += order.adminFeeAmount;
    plat.netSales += order.netAmount;
    plat.totalCogs += order.totalCogs;
    plat.netIncome += order.netIncome;
    plat.orderCount += 1;
  }

  return summary;
}

export function buildChartData(orders: Order[], dateRange: DateRange): ChartDataPoint[] {
  const grouped = new Map<string, ChartDataPoint>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    const date = order.date.substring(0, 10);
    if (!grouped.has(date)) {
      grouped.set(date, { date, grossSales: 0, netSales: 0, netIncome: 0 });
    }
    const pt = grouped.get(date)!;
    pt.grossSales += order.grossAmount;
    pt.netSales += order.netAmount;
    pt.netIncome += order.netIncome;
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function getPreviousPeriodRange(range: DateRange): DateRange {
  const start = parseISO(range.startDate);
  const end = parseISO(range.endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    type: 'custom',
    startDate: format(subDays(start, diffDays), 'yyyy-MM-dd'),
    endDate: format(subDays(end, diffDays), 'yyyy-MM-dd'),
    label: 'Periode Sebelumnya',
  };
}

export function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatGrowth(growth: number): string {
  const sign = growth >= 0 ? '+' : '';
  return `${sign}${growth.toFixed(1)}%`;
}
