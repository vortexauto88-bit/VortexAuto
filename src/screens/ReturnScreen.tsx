/**
 * ReturnScreen — Manajemen Retur Harian
 *
 * Flow retur:
 * 1. Retur dari Shopee/TikTok: sudah otomatis terbaca dari CSV ekspor (status "returned")
 * 2. Retur manual: user input nomor pesanan + tanggal + nilai retur
 *
 * Retur mengurangi penjualan bersih dan penghasilan bersih.
 * COGS dianggap tetap (produk retur kondisi tidak pasti).
 * User bisa centang "COGS Recovered" jika produk bisa dijual kembali.
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import DatePickerField from '../components/DatePickerField';

import { addOrders, getAllOrders, getSettings, saveOrders } from '../storage/database';
import { generateId, formatCurrencyShort } from '../utils/helpers';
import { Order, Platform as PlatformType } from '../types';
import PlatformBadge from '../components/PlatformBadge';
import { COLORS, SPACING } from '../theme';

export default function ReturnScreen() {
  const [returns, setReturns] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('Rp');

  // Form state
  const [formDate, setFormDate] = useState(new Date());
  const [formOrderId, setFormOrderId] = useState('');
  const [formPlatform, setFormPlatform] = useState<PlatformType>('shopee');
  const [formAmount, setFormAmount] = useState('');
  const [formCogs, setFormCogs] = useState('');
  const [formCogsRecovered, setFormCogsRecovered] = useState(false);
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, settings] = await Promise.all([getAllOrders(), getSettings()]);
      setCurrencySymbol(settings.currencySymbol);
      const returnOrders = orders
        .filter((o) => o.status === 'returned')
        .sort((a, b) => b.date.localeCompare(a.date));
      setReturns(returnOrders);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openModal = () => {
    setFormDate(new Date());
    setFormOrderId('');
    setFormPlatform('shopee');
    setFormAmount('');
    setFormCogs('');
    setFormCogsRecovered(false);
    setFormNote('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formOrderId.trim()) {
      Alert.alert('Error', 'Nomor pesanan tidak boleh kosong.');
      return;
    }
    const amount = parseFloat(formAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Nilai retur harus lebih dari 0.');
      return;
    }
    const cogs = parseFloat(formCogs.replace(/[^0-9.]/g, '')) || 0;
    const cogsEffect = formCogsRecovered ? -cogs : 0; // negative = COGS recovered (reduces cost)

    setSaving(true);
    try {
      const importedAt = new Date().toISOString();
      const returnOrder: Order = {
        id: generateId(),
        externalId: formOrderId.trim(),
        platform: formPlatform,
        date: format(formDate, 'yyyy-MM-dd'),
        status: 'returned',
        items: [],
        grossAmount: -amount,   // negative: reduces gross sales
        adminFeeAmount: 0,
        voucherDiscount: 0,
        shippingCost: 0,
        netAmount: -amount,     // negative: reduces net sales
        totalCogs: cogsEffect,  // 0 if COGS not recovered, negative if recovered
        netIncome: -amount - cogsEffect,
        importedAt,
      };

      await addOrders([returnOrder]);
      setModalVisible(false);
      await loadData();
      Alert.alert('Berhasil', 'Retur berhasil dicatat.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (order: Order) => {
    Alert.alert(
      'Hapus Retur',
      `Hapus retur pesanan "${order.externalId}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const all = await getAllOrders();
            const filtered = all.filter((o) => o.id !== order.id);
            await saveOrders(filtered);
            await loadData();
          },
        },
      ]
    );
  };

  const PLATFORM_OPTIONS: { id: PlatformType; label: string }[] = [
    { id: 'shopee', label: 'Shopee' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'offline', label: 'Offline' },
  ];

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
        <View>
          <Text style={styles.headerTitle}>Retur</Text>
          <Text style={styles.headerSubtitle}>
            Input retur harian — {returns.length} retur tercatat
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color={COLORS.info} />
        <Text style={styles.infoText}>
          Retur dari Shopee/TikTok otomatis terbaca dari file CSV ekspor.{'\n'}
          Gunakan tombol "Tambah" untuk input retur manual harian.
        </Text>
      </View>

      <FlatList
        data={returns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="return-up-back-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Belum ada retur</Text>
            <Text style={styles.emptySubtitle}>
              Retur dari file CSV akan otomatis muncul di sini.{'\n'}
              Atau tambahkan retur manual dengan tombol di atas.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.returnCard}>
            <View style={styles.returnHeader}>
              <PlatformBadge platform={item.platform} />
              <Text style={styles.returnDate}>{item.date}</Text>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.returnOrderId}>{item.externalId}</Text>
            <View style={styles.returnAmounts}>
              <View style={styles.returnAmountItem}>
                <Text style={styles.returnAmountLabel}>Nilai Retur</Text>
                <Text style={[styles.returnAmountValue, { color: COLORS.error }]}>
                  {formatCurrencyShort(Math.abs(item.grossAmount), currencySymbol)}
                </Text>
              </View>
              <View style={styles.returnAmountItem}>
                <Text style={styles.returnAmountLabel}>COGS Recovered</Text>
                <Text style={styles.returnAmountValue}>
                  {item.totalCogs < 0
                    ? formatCurrencyShort(Math.abs(item.totalCogs), currencySymbol)
                    : 'Tidak'}
                </Text>
              </View>
              <View style={styles.returnAmountItem}>
                <Text style={styles.returnAmountLabel}>Dampak Net</Text>
                <Text style={[styles.returnAmountValue, { color: COLORS.error }]}>
                  {formatCurrencyShort(Math.abs(item.netIncome), currencySymbol)}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add Return Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tambah Retur Manual</Text>

            {/* Date */}
            <DatePickerField
              label="Tanggal Retur"
              value={formDate}
              onChange={setFormDate}
            />

            {/* Platform */}
            <Text style={styles.inputLabel}>Platform</Text>
            <View style={styles.platformSelector}>
              {PLATFORM_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.platformOption,
                    formPlatform === opt.id && styles.platformOptionActive,
                  ]}
                  onPress={() => setFormPlatform(opt.id)}
                >
                  <Text
                    style={[
                      styles.platformOptionText,
                      formPlatform === opt.id && styles.platformOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Order ID */}
            <Text style={styles.inputLabel}>No. Pesanan / Invoice</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Contoh: SHP-12345678"
              value={formOrderId}
              onChangeText={setFormOrderId}
              placeholderTextColor={COLORS.textTertiary}
            />

            {/* Amount */}
            <Text style={styles.inputLabel}>Nilai Retur (Rp)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Contoh: 150000"
              value={formAmount}
              onChangeText={setFormAmount}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />

            {/* COGS */}
            <Text style={styles.inputLabel}>COGS Produk Retur (Rp, opsional)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Contoh: 50000"
              value={formCogs}
              onChangeText={setFormCogs}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />

            {/* COGS Recovered */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormCogsRecovered(!formCogsRecovered)}
            >
              <View style={[styles.checkbox, formCogsRecovered && styles.checkboxChecked]}>
                {formCogsRecovered && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxLabel}>
                COGS recovered (produk bisa dijual kembali)
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Retur</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    margin: SPACING.md,
    backgroundColor: COLORS.infoLight,
    padding: SPACING.md,
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 20 },
  listContent: { padding: SPACING.md, paddingBottom: 100 },
  returnCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  returnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  returnDate: { flex: 1, fontSize: 12, color: COLORS.textTertiary },
  deleteBtn: { padding: 4 },
  returnOrderId: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  returnAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  returnAmountItem: {},
  returnAmountLabel: { fontSize: 11, color: COLORS.textTertiary },
  returnAmountValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    marginBottom: SPACING.md,
    justifyContent: 'center',
  },
  inputField: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  platformSelector: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  platformOption: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  platformOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  platformOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  platformOptionTextActive: { color: COLORS.white },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checkboxLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  saveBtn: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.warning,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
