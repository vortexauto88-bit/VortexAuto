import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getOrdersByDateRange, getSettings } from '../storage/database';
import {
  buildChartData,
  calcGrowth,
  calculateSummary,
  formatCurrency,
  formatCurrencyShort,
  formatDateLabel,
  getDateRange,
  getPreviousPeriodRange,
} from '../utils/helpers';
import { DateRange, DateRangeType, Order, SalesSummary } from '../types';
import SummaryCard from '../components/SummaryCard';
import PlatformBadge from '../components/PlatformBadge';
import { COLORS, SPACING } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DATE_TABS: { type: DateRangeType; label: string }[] = [
  { type: 'daily', label: 'Hari' },
  { type: 'weekly', label: 'Minggu' },
  { type: 'monthly', label: 'Bulan' },
];

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<DateRangeType>('monthly');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('monthly'));
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [prevSummary, setPrevSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('Rp');

  const loadData = useCallback(async (range: DateRange) => {
    try {
      const settings = await getSettings();
      setCurrencySymbol(settings.currencySymbol);

      const [current, prev] = await Promise.all([
        getOrdersByDateRange(range.startDate, range.endDate),
        getOrdersByDateRange(
          ...(() => {
            const p = getPreviousPeriodRange(range);
            return [p.startDate, p.endDate] as [string, string];
          })()
        ),
      ]);

      setOrders(current);
      setSummary(calculateSummary(current));
      setPrevSummary(calculateSummary(prev));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const range = getDateRange(activeTab);
      setDateRange(range);
      setLoading(true);
      loadData(range);
    }, [activeTab, loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(dateRange);
  };

  const switchTab = (type: DateRangeType) => {
    setActiveTab(type);
    const range = getDateRange(type);
    setDateRange(range);
    setLoading(true);
    loadData(range);
  };

  const chartData = buildChartData(orders, dateRange);
  const labels = chartData.map((d) => formatDateLabel(d.date, activeTab));
  const grossData = chartData.map((d) => d.grossSales);
  const netData = chartData.map((d) => d.netSales);
  const incomeData = chartData.map((d) => d.netIncome);

  const hasChartData = chartData.length > 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const grossGrowth = summary && prevSummary
    ? calcGrowth(summary.grossSales, prevSummary.grossSales)
    : undefined;
  const netGrowth = summary && prevSummary
    ? calcGrowth(summary.netSales, prevSummary.netSales)
    : undefined;
  const incomeGrowth = summary && prevSummary
    ? calcGrowth(summary.netIncome, prevSummary.netIncome)
    : undefined;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>VortexAuto</Text>
          <Text style={styles.headerSubtitle}>{dateRange.label}</Text>
        </View>
        <View style={styles.orderCountBadge}>
          <Text style={styles.orderCountText}>{summary?.orderCount ?? 0} pesanan</Text>
        </View>
      </View>

      {/* Period Tabs */}
      <View style={styles.tabRow}>
        {DATE_TABS.map((tab) => (
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

      {/* Summary Cards */}
      <View style={styles.section}>
        <View style={styles.cardsRow}>
          <SummaryCard
            title="Penjualan Kotor"
            amount={summary?.grossSales ?? 0}
            icon="cash-outline"
            color={COLORS.chartGross}
            growth={grossGrowth}
            currencySymbol={currencySymbol}
          />
          <SummaryCard
            title="Penjualan Bersih"
            amount={summary?.netSales ?? 0}
            icon="trending-up"
            color={COLORS.chartNet}
            growth={netGrowth}
            currencySymbol={currencySymbol}
          />
        </View>

        <View style={[styles.cardsRow, { marginTop: SPACING.sm }]}>
          <SummaryCard
            title="Total COGS"
            amount={summary?.totalCogs ?? 0}
            icon="cube-outline"
            color={COLORS.chartCogs}
            currencySymbol={currencySymbol}
          />
          <SummaryCard
            title="Penghasilan Bersih"
            amount={summary?.netIncome ?? 0}
            icon="wallet-outline"
            color={COLORS.chartIncome}
            growth={incomeGrowth}
            currencySymbol={currencySymbol}
          />
        </View>

        {/* Admin Fee Summary */}
        <View style={styles.adminFeeSummary}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.adminFeeText}>
            Biaya Admin/Platform: {formatCurrencyShort(summary?.adminFees ?? 0, currencySymbol)}
          </Text>
        </View>
      </View>

      {/* Chart */}
      {hasChartData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grafik Penjualan</Text>
          <LineChart
            data={{
              labels: labels.length > 7 ? labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0) : labels,
              datasets: [
                {
                  data: grossData.length > 0 ? grossData : [0],
                  color: () => COLORS.chartGross,
                  strokeWidth: 2,
                },
                {
                  data: netData.length > 0 ? netData : [0],
                  color: () => COLORS.chartNet,
                  strokeWidth: 2,
                },
                {
                  data: incomeData.length > 0 ? incomeData : [0],
                  color: () => COLORS.chartIncome,
                  strokeWidth: 2,
                },
              ],
              legend: ['Kotor', 'Bersih', 'Net Income'],
            }}
            width={SCREEN_WIDTH - 32}
            height={200}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(30, 58, 95, ${opacity})`,
              labelColor: () => COLORS.textSecondary,
              propsForDots: { r: '4' },
              formatYLabel: (val) => {
                const n = parseInt(val);
                if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`;
                if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
                return val;
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Platform Breakdown */}
      {summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per Platform</Text>
          {(['shopee', 'tiktok', 'offline'] as const).map((platform) => {
            const plat = summary.byPlatform[platform];
            if (plat.orderCount === 0) return null;
            return (
              <View key={platform} style={styles.platformRow}>
                <PlatformBadge platform={platform} size="md" />
                <View style={styles.platformStats}>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>Kotor</Text>
                    <Text style={styles.platformStatValue}>
                      {formatCurrencyShort(plat.grossSales, currencySymbol)}
                    </Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>Net</Text>
                    <Text style={[styles.platformStatValue, { color: COLORS.success }]}>
                      {formatCurrencyShort(plat.netSales, currencySymbol)}
                    </Text>
                  </View>
                  <View style={styles.platformStat}>
                    <Text style={styles.platformStatLabel}>Pesanan</Text>
                    <Text style={styles.platformStatValue}>{plat.orderCount}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {(!summary || summary.orderCount === 0) && (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Belum ada data</Text>
          <Text style={styles.emptySubtitle}>
            Import file pesanan dari Shopee, TikTok, atau Invoice Offline untuk melihat laporan.
          </Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  orderCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderCountText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  tabTextActive: { color: COLORS.primary },
  section: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
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
  cardsRow: { flexDirection: 'row', gap: SPACING.sm },
  adminFeeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  adminFeeText: { fontSize: 12, color: COLORS.textSecondary },
  chart: { borderRadius: 8, marginLeft: -SPACING.md },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  platformStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  platformStat: { alignItems: 'flex-end' },
  platformStatLabel: { fontSize: 11, color: COLORS.textTertiary },
  platformStatValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  emptyState: { alignItems: 'center', padding: SPACING.xl * 2 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
});
