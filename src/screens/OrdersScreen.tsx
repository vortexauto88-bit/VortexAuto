import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform as RNPlatform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getAllOrders, recalculateAllCogs } from '../storage/database';
import { Order, Platform } from '../types';
import { COLORS, SPACING } from '../theme';

const PLATFORM_COLOR: Record<Platform, string> = {
  shopee: '#EE4D2D',
  tiktok: '#010101',
  offline: '#6366F1',
};

const PLATFORM_LABEL: Record<Platform, string> = {
  shopee: 'Shopee',
  tiktok: 'TikTok',
  offline: 'Offline',
};

const STATUS_COLOR: Record<string, string> = {
  completed: '#10B981',
  returned: '#F59E0B',
  pending: '#6B7280',
  cancelled: '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Selesai',
  returned: 'Retur',
  pending: 'Pending',
  cancelled: 'Batal',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [recalculating, setRecalculating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllOrders();
      // Sort newest first
      all.sort((a, b) => b.date.localeCompare(a.date));
      setOrders(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleRecalculate = () => {
    const msg = 'Semua order akan di-update COGS-nya berdasarkan data produk/varian yang sekarang. Lanjutkan?';
    const doRecalculate = async () => {
      setRecalculating(true);
      try {
        const count = await recalculateAllCogs();
        await loadData();
        Alert.alert('Selesai', `COGS berhasil dihitung ulang untuk ${count} order.`);
      } finally {
        setRecalculating(false);
      }
    };
    if (RNPlatform.OS === 'web') {
      if ((global as any).confirm(`Hitung Ulang COGS\n\n${msg}`)) doRecalculate();
    } else {
      Alert.alert('Hitung Ulang COGS', msg, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Hitung Ulang', onPress: doRecalculate },
      ]);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = orders.filter((o) => {
    const matchPlatform = platformFilter === 'all' || o.platform === platformFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      o.externalId.toLowerCase().includes(q) ||
      o.items.some(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          (i.variantName || '').toLowerCase().includes(q)
      );
    return matchPlatform && matchSearch;
  });

  // Totals for filtered
  const totalGross = filtered.reduce((s, o) => s + (o.status !== 'cancelled' ? o.grossAmount : 0), 0);
  const totalCogs = filtered.reduce((s, o) => s + (o.status !== 'cancelled' ? o.totalCogs : 0), 0);
  const totalNet = filtered.reduce((s, o) => s + (o.status !== 'cancelled' ? o.netIncome : 0), 0);

  const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Detail Orderan</Text>
          <Text style={styles.headerSubtitle}>Verifikasi produk, varian, dan COGS tiap item</Text>
        </View>
        <TouchableOpacity style={styles.recalcBtn} onPress={handleRecalculate} disabled={recalculating}>
          {recalculating
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Ionicons name="refresh-outline" size={18} color={COLORS.white} />}
          <Text style={styles.recalcBtnText}>
            {recalculating ? 'Menghitung...' : 'Hitung Ulang COGS'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}
        contentContainerStyle={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Order</Text>
          <Text style={styles.summaryValue}>{filtered.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Gross Sales</Text>
          <Text style={styles.summaryValue}>{fmt(totalGross)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: COLORS.error }]}>
          <Text style={styles.summaryLabel}>Total COGS</Text>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>{fmt(totalCogs)}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: '#10B981' }]}>
          <Text style={styles.summaryLabel}>Net Income</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{fmt(totalNet)}</Text>
        </View>
      </ScrollView>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari order ID atau nama produk..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
      </View>

      {/* Platform filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.platformScroll} contentContainerStyle={styles.platformRow}>
        {(['all', 'shopee', 'tiktok', 'offline'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.platformChip, platformFilter === p && styles.platformChipActive]}
            onPress={() => setPlatformFilter(p)}
          >
            <Text style={[styles.platformChipText, platformFilter === p && styles.platformChipTextActive]}>
              {p === 'all' ? 'Semua' : PLATFORM_LABEL[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Order list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Belum ada orderan</Text>
            <Text style={styles.emptySubtitle}>Import data dari Shopee atau TikTok terlebih dahulu.</Text>
          </View>
        }
        renderItem={({ item: order }) => {
          const isExpanded = expandedOrderIds.has(order.id);
          const hasCogs = order.totalCogs > 0;
          const cogsWarning = order.totalCogs === 0 && order.status !== 'cancelled';
          return (
            <View style={styles.orderCard}>
              {/* Order header */}
              <TouchableOpacity style={styles.orderHeader} onPress={() => toggleExpand(order.id)}>
                <View style={styles.orderMeta}>
                  <View style={[styles.platformBadge, { backgroundColor: PLATFORM_COLOR[order.platform] }]}>
                    <Text style={styles.platformBadgeText}>{PLATFORM_LABEL[order.platform]}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[order.status] + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: STATUS_COLOR[order.status] }]}>
                      {STATUS_LABEL[order.status]}
                    </Text>
                  </View>
                  {cogsWarning && (
                    <View style={styles.warnBadge}>
                      <Ionicons name="warning-outline" size={11} color="#F59E0B" />
                      <Text style={styles.warnBadgeText}>HPP 0</Text>
                    </View>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>

              {/* Order ID & date */}
              <View style={styles.orderIdRow}>
                <Text style={styles.orderId} numberOfLines={1}>{order.externalId}</Text>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>

              {/* Collapsed summary */}
              {!isExpanded && (
                <View style={styles.orderSummaryRow}>
                  <Text style={styles.orderSummaryItem}>
                    {order.items.length} item
                    {order.items.length > 1 ? 's' : ''}: {order.items.map((i) => i.productName.split(' ').slice(0, 3).join(' ')).join(', ')}
                  </Text>
                  <Text style={styles.orderSummaryAmount}>{fmt(order.grossAmount)}</Text>
                </View>
              )}

              {/* Expanded: item table */}
              {isExpanded && (
                <View style={styles.itemTable}>
                  {/* Table header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thCell, { flex: 3 }]}>Produk / Varian</Text>
                    <Text style={[styles.thCell, styles.thRight, { flex: 1 }]}>Qty</Text>
                    <Text style={[styles.thCell, styles.thRight, { flex: 2 }]}>Harga</Text>
                    <Text style={[styles.thCell, styles.thRight, { flex: 2 }]}>COGS</Text>
                  </View>

                  {/* Item rows */}
                  {order.items.map((item, idx) => (
                    <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                      <View style={{ flex: 3 }}>
                        <Text style={styles.tdProductName} numberOfLines={2}>{item.productName}</Text>
                        {item.variantName ? (
                          <Text style={styles.tdVariant}>{item.variantName}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.tdCell, { flex: 1 }]}>{item.quantity}</Text>
                      <Text style={[styles.tdCell, { flex: 2 }]}>
                        {fmt(item.subtotal)}
                      </Text>
                      <View style={{ flex: 2, alignItems: 'flex-end' }}>
                        {item.totalCogs > 0 ? (
                          <Text style={styles.tdCogs}>{fmt(item.totalCogs)}</Text>
                        ) : (
                          <Text style={styles.tdCogsEmpty}>—</Text>
                        )}
                        {item.cogs > 0 && (
                          <Text style={styles.tdCogsUnit}>
                            {fmt(item.cogs)}/unit
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}

                  {/* Order totals */}
                  <View style={styles.orderTotals}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Gross Sales</Text>
                      <Text style={styles.totalValue}>{fmt(order.grossAmount)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Biaya Admin</Text>
                      <Text style={[styles.totalValue, { color: COLORS.error }]}>-{fmt(order.adminFeeAmount)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total COGS</Text>
                      <Text style={[styles.totalValue, { color: COLORS.error }]}>
                        {hasCogs ? `-${fmt(order.totalCogs)}` : '—'}
                      </Text>
                    </View>
                    <View style={[styles.totalRow, styles.totalRowFinal]}>
                      <Text style={styles.totalLabelFinal}>Net Income</Text>
                      <Text style={[styles.totalValueFinal, { color: order.netIncome >= 0 ? '#10B981' : COLORS.error }]}>
                        {fmt(order.netIncome)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary, padding: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  recalcBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  recalcBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.white },

  summaryScroll: { maxHeight: 80 },
  summaryRow: { gap: SPACING.sm, padding: SPACING.md, paddingVertical: SPACING.sm },
  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: SPACING.sm,
    minWidth: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },

  filterBar: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingBottom: 0 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 10,
    paddingHorizontal: SPACING.sm, gap: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: COLORS.textPrimary },

  platformScroll: { maxHeight: 44 },
  platformRow: { gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, alignItems: 'center' },
  platformChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  platformChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  platformChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  platformChipTextActive: { color: COLORS.white },

  listContent: { padding: SPACING.md, paddingBottom: 100 },

  // Order card
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: SPACING.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderMeta: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  platformBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  platformBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  warnBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  warnBadgeText: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },

  orderIdRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 12, color: COLORS.textSecondary, flex: 1, marginRight: 8 },
  orderDate: { fontSize: 12, color: COLORS.textTertiary },

  orderSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderSummaryItem: { fontSize: 12, color: COLORS.textTertiary, flex: 1 },
  orderSummaryAmount: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  // Item table
  itemTable: { marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.sm },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4,
    backgroundColor: COLORS.background, borderRadius: 6, marginBottom: 2,
  },
  thCell: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  thRight: { textAlign: 'right' },
  tableRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 4,
  },
  tableRowAlt: { backgroundColor: '#F9FAFB', borderRadius: 4 },
  tdProductName: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  tdVariant: { fontSize: 11, color: COLORS.primary, marginTop: 1 },
  tdCell: { fontSize: 12, color: COLORS.textPrimary, textAlign: 'right', paddingTop: 2 },
  tdCogs: { fontSize: 12, color: COLORS.error, fontWeight: '700', textAlign: 'right' },
  tdCogsEmpty: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'right' },
  tdCogsUnit: { fontSize: 10, color: COLORS.textTertiary, textAlign: 'right' },

  // Totals
  orderTotals: {
    marginTop: SPACING.sm, borderTopWidth: 1,
    borderTopColor: COLORS.borderLight, paddingTop: SPACING.sm,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 12, color: COLORS.textSecondary },
  totalValue: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  totalRowFinal: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    marginTop: 4, paddingTop: 6,
  },
  totalLabelFinal: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  totalValueFinal: { fontSize: 14, fontWeight: '800' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.sm },
});
