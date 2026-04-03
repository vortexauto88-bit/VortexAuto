import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Order, SalesSummary, PlatformSummary, ChartDataPoint, DateRange, DateRangeType } from '../types';

// ── ID Generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
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
