import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform as RNPlatform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';

import { getOrdersByDateRange, getSettings } from '../storage/database';
import {
  calculateSummary,
  formatCurrency,
  formatCurrencyShort,
  getDateRange,
} from '../utils/helpers';
import { DateRange, DateRangeType, Order, SalesSummary } from '../types';
import PlatformBadge from '../components/PlatformBadge';
import { COLORS, SPACING } from '../theme';

const TABS: { type: DateRangeType; label: string }[] = [
  { type: 'daily', label: 'Harian' },
  { type: 'weekly', label: 'Mingguan' },
  { type: 'monthly', label: 'Bulanan' },
  { type: 'custom', label: 'Custom' },
];

function buildCSVReport(
  orders: Order[],
  summary: SalesSummary,
  dateRange: DateRange,
  currencySymbol: string
): string {
  const lines: string[] = [];
  lines.push('LAPORAN PENJUALAN VORTEXAUTO');
  lines.push(`Periode,${dateRange.label}`);
  lines.push(`Dari,${dateRange.startDate}`);
  lines.push(`Sampai,${dateRange.endDate}`);
  lines.push('');
  lines.push('RINGKASAN');
  lines.push(`Total Pesanan,${summary.orderCount}`);
  lines.push(`Penjualan Kotor,${Math.round(summary.grossSales)}`);
  lines.push(`Biaya Admin/Platform,${Math.round(summary.adminFees)}`);
  lines.push(`Penjualan Bersih,${Math.round(summary.netSales)}`);
  lines.push(`Total COGS,${Math.round(summary.totalCogs)}`);
  lines.push(`Penghasilan Bersih,${Math.round(summary.netIncome)}`);
  lines.push('');
  lines.push('PER PLATFORM');
  lines.push('Platform,Pesanan,Penjualan Kotor,Biaya Admin,Penjualan Bersih,COGS,Penghasilan Bersih');
  for (const platform of ['shopee', 'tiktok', 'offline'] as const) {
    const p = summary.byPlatform[platform];
    if (p.orderCount > 0) {
      lines.push([
        platform,
        p.orderCount,
        Math.round(p.grossSales),
        Math.round(p.adminFees),
        Math.round(p.netSales),
        Math.round(p.totalCogs),
        Math.round(p.netIncome),
      ].join(','));
    }
  }
  lines.push('');
  lines.push('DETAIL PESANAN');
  lines.push('Tanggal,Platform,No. Pesanan,Penjualan Kotor,Biaya Admin,Penjualan Bersih,COGS,Penghasilan Bersih,Status');
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    lines.push([
      order.date,
      order.platform,
      order.externalId,
      Math.round(order.grossAmount),
      Math.round(order.adminFeeAmount),
      Math.round(order.netAmount),
      Math.round(order.totalCogs),
      Math.round(order.netIncome),
      order.status,
    ].join(','));
  }
  return lines.join('\n');
}

export default function ReportScreen() {
  const [activeTab, setActiveTab] = useState<DateRangeType>('monthly');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('monthly'));
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('Rp');
  const [exporting, setExporting] = useState(false);

  const [showReturns, setShowReturns] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const loadData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const settings = await getSettings();
      setCurrencySymbol(settings.currencySymbol);
      const fetched = await getOrdersByDateRange(range.startDate, range.endDate);
      setOrders(fetched);
      setSummary(calculateSummary(fetched));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const range = getDateRange(activeTab);
      setDateRange(range);
      loadData(range);
    }, [activeTab, loadData])
  );

  const switchTab = (type: DateRangeType) => {
    setActiveTab(type);
    if (type !== 'custom') {
      const range = getDateRange(type);
      setDateRange(range);
      loadData(range);
    }
  };

  const applyCustomRange = () => {
    const range: DateRange = {
      type: 'custom',
      startDate: format(customStart, 'yyyy-MM-dd'),
      endDate: format(customEnd, 'yyyy-MM-dd'),
      label: `${format(customStart, 'd MMM yyyy', { locale: idLocale })} - ${format(customEnd, 'd MMM yyyy', { locale: idLocale })}`,
    };
    setDateRange(range);
    loadData(range);
  };

  const handleExport = async () => {
    if (!summary) return;
    setExporting(true);
    try {
      const csv = buildCSVReport(orders, summary, dateRange, currencySymbol);
      const fileName = `laporan_${dateRange.startDate}_${dateRange.endDate}.csv`;
      const path = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
      await Share.share({ url: path, title: fileName });
    } catch (err: any) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const cancelled = orders.filter((o) => o.status === 'cancelled');
  const returned = orders.filter((o) => o.status === 'returned');
  const completed = orders.filter((o) => o.status === 'completed');

  const Row = ({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableLabel, bold && styles.tableBold]}>{label}</Text>
      <Text style={[styles.tableValue, bold && styles.tableBold, color ? { color } : undefined]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan Penjualan</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting || !summary}>
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="share-outline" size={16} color={COLORS.white} />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.type}
              style={[styles.tab, activeTab === tab.type && styles.tabActive]}
              onPress={() => switchTab(tab.type)}
            >
              <Text style={[styles.tabText, activeTab === tab.type && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Custom Date Picker */}
      {activeTab === 'custom' && (
        <View style={styles.customDateSection}>
          <TouchableOpacity style={styles.datePicker} onPress={() => setShowStartPicker(true)}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.datePickerText}>
              Dari: {format(customStart, 'd MMM yyyy', { locale: idLocale })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.datePicker} onPress={() => setShowEndPicker(true)}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.datePickerText}>
              Sampai: {format(customEnd, 'd MMM yyyy', { locale: idLocale })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={applyCustomRange}>
            <Text style={styles.applyBtnText}>Tampilkan</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={customStart}
              mode="date"
              onChange={(_, date) => { setShowStartPicker(false); if (date) setCustomStart(date); }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={customEnd}
              mode="date"
              onChange={(_, date) => { setShowEndPicker(false); if (date) setCustomEnd(date); }}
            />
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />
      ) : !summary ? null : (
        <>
          {/* Summary Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ringkasan — {dateRange.label}</Text>

            <Row label="Total Pesanan Selesai" value={`${completed.length} pesanan`} />
            <View style={styles.divider} />
            <Row
              label="Penjualan Kotor"
              value={formatCurrency(summary.grossSales, currencySymbol)}
              bold
            />
            <Row
              label="  Biaya Admin Shopee"
              value={`- ${formatCurrencyShort(summary.byPlatform.shopee.adminFees, currencySymbol)}`}
              color={COLORS.error}
            />
            <Row
              label="  Biaya Admin TikTok"
              value={`- ${formatCurrencyShort(summary.byPlatform.tiktok.adminFees, currencySymbol)}`}
              color={COLORS.error}
            />
            <View style={styles.divider} />
            <Row
              label="Penjualan Bersih"
              value={formatCurrency(summary.netSales, currencySymbol)}
              bold
              color={COLORS.success}
            />
            <View style={styles.divider} />
            <Row
              label="  Total COGS (HPP)"
              value={`- ${formatCurrency(summary.totalCogs, currencySymbol)}`}
              color={COLORS.error}
            />
            <View style={styles.divider} />
            <Row
              label="Penghasilan Bersih"
              value={formatCurrency(summary.netIncome, currencySymbol)}
              bold
              color={summary.netIncome >= 0 ? COLORS.chartIncome : COLORS.error}
            />
          </View>

          {/* Per Platform */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Per Platform</Text>
            {(['shopee', 'tiktok', 'offline'] as const).map((platform) => {
              const p = summary.byPlatform[platform];
              if (p.orderCount === 0) return null;
              return (
                <View key={platform} style={styles.platformBlock}>
                  <View style={styles.platformBlockHeader}>
                    <PlatformBadge platform={platform} size="md" />
                    <Text style={styles.platformOrderCount}>{p.orderCount} pesanan</Text>
                  </View>
                  <Row label="Penjualan Kotor" value={formatCurrencyShort(p.grossSales, currencySymbol)} />
                  {platform !== 'offline' && (
                    <Row
                      label="Biaya Admin/Platform"
                      value={`- ${formatCurrencyShort(p.adminFees, currencySymbol)}`}
                      color={COLORS.error}
                    />
                  )}
                  <Row
                    label="Penjualan Bersih"
                    value={formatCurrencyShort(p.netSales, currencySymbol)}
                    color={COLORS.success}
                    bold
                  />
                  <Row label="COGS" value={`- ${formatCurrencyShort(p.totalCogs, currencySymbol)}`} color={COLORS.error} />
                  <Row
                    label="Penghasilan Bersih"
                    value={formatCurrencyShort(p.netIncome, currencySymbol)}
                    bold
                    color={p.netIncome >= 0 ? COLORS.chartIncome : COLORS.error}
                  />
                </View>
              );
            })}
          </View>

          {/* Returns Section */}
          {returned.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setShowReturns(!showReturns)}
              >
                <View style={styles.collapsibleLeft}>
                  <Ionicons name="return-up-back-outline" size={18} color={COLORS.warning} />
                  <Text style={styles.collapsibleTitle}>Pesanan Retur ({returned.length})</Text>
                </View>
                <Ionicons
                  name={showReturns ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
              {showReturns && (
                <>
                  <Text style={styles.returnsNote}>
                    Pesanan retur dikurangkan otomatis dari total penjualan bersih.
                  </Text>
                  {returned.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderCardHeader}>
                        <PlatformBadge platform={order.platform} />
                        <Text style={styles.orderDate}>{order.date}</Text>
                      </View>
                      <Text style={styles.orderId}>{order.externalId}</Text>
                      <View style={styles.orderAmounts}>
                        <Text style={styles.orderAmountLabel}>Nilai Retur:</Text>
                        <Text style={[styles.orderAmountValue, { color: COLORS.error }]}>
                          - {formatCurrencyShort(order.grossAmount, currencySymbol)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* Cancelled Section */}
          {cancelled.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setShowCancelled(!showCancelled)}
              >
                <View style={styles.collapsibleLeft}>
                  <Ionicons name="close-circle-outline" size={18} color={COLORS.error} />
                  <Text style={styles.collapsibleTitle}>Pesanan Dibatalkan ({cancelled.length})</Text>
                </View>
                <Ionicons
                  name={showCancelled ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
              {showCancelled && (
                <>
                  <Text style={styles.returnsNote}>
                    Pesanan batal tidak dihitung dalam total penjualan.
                  </Text>
                  {cancelled.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderCardHeader}>
                        <PlatformBadge platform={order.platform} />
                        <Text style={styles.orderDate}>{order.date}</Text>
                      </View>
                      <Text style={styles.orderId}>{order.externalId}</Text>
                      <View style={styles.orderAmounts}>
                        <Text style={styles.orderAmountLabel}>Nilai Pesanan:</Text>
                        <Text style={[styles.orderAmountValue, { color: COLORS.textTertiary }]}>
                          {formatCurrencyShort(order.grossAmount, currencySymbol)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </>
      )}

      {!loading && orders.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Tidak ada data</Text>
          <Text style={styles.emptySubtitle}>Tidak ada pesanan pada periode ini.</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  tabScrollView: { backgroundColor: COLORS.primary, paddingBottom: SPACING.sm },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tabTextActive: { color: COLORS.primary },
  customDateSection: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  datePickerText: { fontSize: 14, color: COLORS.textPrimary },
  applyBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  section: {
    margin: SPACING.md,
    marginBottom: 0,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tableLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  tableValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', textAlign: 'right' },
  tableBold: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 4 },
  platformBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  platformBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  platformOrderCount: { fontSize: 13, color: COLORS.textSecondary },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsibleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  collapsibleTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  returnsNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    lineHeight: 18,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderDate: { fontSize: 12, color: COLORS.textTertiary },
  orderId: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  orderAmounts: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  orderAmountLabel: { fontSize: 12, color: COLORS.textTertiary },
  orderAmountValue: { fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontSize: 13, color: COLORS.textTertiary, marginTop: SPACING.sm },
});
