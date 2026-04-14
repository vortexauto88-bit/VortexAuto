import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform as RNPlatform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { clearAllData, getSettings, saveSettings } from '../storage/database';
import { AppSettings } from '../types';
import { COLORS, SPACING } from '../theme';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Admin fee form
  const [shopeeAdmin, setShopeeAdmin] = useState('');
  const [shopeePayment, setShopeePayment] = useState('');
  const [shopeeFixed, setShopeeFixed] = useState('');
  const [tiktokAdmin, setTiktokAdmin] = useState('');
  const [tiktokPayment, setTiktokPayment] = useState('');
  const [tiktokFixed, setTiktokFixed] = useState('');

  const loadSettings = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    setShopeeAdmin(s.adminFees.shopeeAdminFeeRate.toString());
    setShopeePayment(s.adminFees.shopeePaymentFeeRate.toString());
    setShopeeFixed((s.adminFees.shopeeFixedFeePerOrder ?? 1250).toString());
    setTiktokAdmin(s.adminFees.tiktokAdminFeeRate.toString());
    setTiktokPayment(s.adminFees.tiktokPaymentFeeRate.toString());
    setTiktokFixed((s.adminFees.tiktokFixedFeePerOrder ?? 1250).toString());
  }, []);

  useFocusEffect(useCallback(() => { loadSettings(); }, [loadSettings]));

  const handleSave = async () => {
    if (!settings) return;
    const parse = (v: string) => parseFloat(v.replace(',', '.')) || 0;

    setSaving(true);
    try {
      const updated: AppSettings = {
        ...settings,
        adminFees: {
          shopeeAdminFeeRate: parse(shopeeAdmin),
          shopeePaymentFeeRate: parse(shopeePayment),
          shopeeFixedFeePerOrder: parse(shopeeFixed),
          tiktokAdminFeeRate: parse(tiktokAdmin),
          tiktokPaymentFeeRate: parse(tiktokPayment),
          tiktokFixedFeePerOrder: parse(tiktokFixed),
        },
      };
      await saveSettings(updated);
      setSettings(updated);
      Alert.alert('Tersimpan', 'Pengaturan berhasil disimpan. Biaya admin akan diterapkan pada import berikutnya.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = () => {
    const msg = 'Semua data pesanan dan riwayat import akan dihapus permanen. Data produk/COGS tetap ada. Yakin?';
    const doDelete = async () => { await clearAllData(); Alert.alert('Berhasil', 'Semua data pesanan telah dihapus.'); };
    if (RNPlatform.OS === 'web') {
      if ((global as any).confirm(`Hapus Semua Data\n\n${msg}`)) doDelete();
    } else {
      Alert.alert('Hapus Semua Data', msg, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus Semua', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const FeeRow = ({
    label, value, onChange, description,
  }: { label: string; value: string; onChange: (v: string) => void; description?: string }) => (
    <View style={styles.feeRow}>
      <View style={styles.feeInfo}>
        <Text style={styles.feeLabel}>{label}</Text>
        {description && <Text style={styles.feeDesc}>{description}</Text>}
      </View>
      <View style={styles.feeInputContainer}>
        <TextInput
          style={styles.feeInput}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          maxLength={5}
          placeholderTextColor={COLORS.textTertiary}
        />
        <Text style={styles.feePercent}>%</Text>
      </View>
    </View>
  );

  const FixedFeeRow = ({
    label, value, onChange, description,
  }: { label: string; value: string; onChange: (v: string) => void; description?: string }) => (
    <View style={styles.feeRow}>
      <View style={styles.feeInfo}>
        <Text style={styles.feeLabel}>{label}</Text>
        {description && <Text style={styles.feeDesc}>{description}</Text>}
      </View>
      <View style={styles.feeInputContainer}>
        <Text style={styles.feePercent}>Rp</Text>
        <TextInput
          style={[styles.feeInput, { width: 80 }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          maxLength={8}
          placeholderTextColor={COLORS.textTertiary}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <Text style={styles.headerSubtitle}>Konfigurasi biaya admin & tarif platform</Text>
      </View>

      {/* Shopee Fees */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.platformDot, { backgroundColor: COLORS.shopee }]} />
          <Text style={styles.sectionTitle}>Biaya Admin Shopee</Text>
        </View>
        <Text style={styles.sectionNote}>
          Biaya ini digunakan jika file CSV tidak mengandung kolom biaya admin.
          Cek di Shopee Seller Center {'>'} Biaya &amp; Komisi.
        </Text>

        <FeeRow
          label="Biaya Komisi/Admin"
          value={shopeeAdmin}
          onChange={setShopeeAdmin}
          description="Umumnya 1–6% tergantung kategori produk"
        />
        <FeeRow
          label="Biaya Transaksi/Pembayaran"
          value={shopeePayment}
          onChange={setShopeePayment}
          description="Umumnya 2% dari total transaksi"
        />
        <FixedFeeRow
          label="Biaya Tetap per Pesanan"
          value={shopeeFixed}
          onChange={setShopeeFixed}
          description="Biaya flat per order, default Rp 1.250"
        />
        <View style={styles.totalFeeRow}>
          <Text style={styles.totalFeeLabel}>Total biaya estimasi per transaksi:</Text>
          <Text style={styles.totalFeeValue}>
            {(parseFloat(shopeeAdmin || '0') + parseFloat(shopeePayment || '0')).toFixed(1)}% + Rp {parseInt(shopeeFixed || '0').toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* TikTok Fees */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.platformDot, { backgroundColor: '#010101' }]} />
          <Text style={styles.sectionTitle}>Biaya Admin TikTok Shop</Text>
        </View>
        <Text style={styles.sectionNote}>
          Biaya ini digunakan jika file CSV tidak mengandung kolom biaya komisi.
          Cek di TikTok Seller Center {'>'} Biaya &amp; Komisi.
        </Text>

        <FeeRow
          label="Biaya Komisi TikTok"
          value={tiktokAdmin}
          onChange={setTiktokAdmin}
          description="Umumnya 1–8% tergantung kategori"
        />
        <FeeRow
          label="Biaya Transaksi/Pembayaran"
          value={tiktokPayment}
          onChange={setTiktokPayment}
          description="Umumnya 2% dari total transaksi"
        />
        <FixedFeeRow
          label="Biaya Tetap per Pesanan"
          value={tiktokFixed}
          onChange={setTiktokFixed}
          description="Biaya flat per order, default Rp 1.250"
        />
        <View style={styles.totalFeeRow}>
          <Text style={styles.totalFeeLabel}>Total biaya estimasi per transaksi:</Text>
          <Text style={styles.totalFeeValue}>
            {(parseFloat(tiktokAdmin || '0') + parseFloat(tiktokPayment || '0')).toFixed(1)}% + Rp {parseInt(tiktokFixed || '0').toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="bulb-outline" size={18} color={COLORS.warning} />
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: '700' }}>Tips: </Text>
          Jika file CSV Shopee/TikTok sudah mengandung kolom biaya admin yang eksplisit,
          aplikasi akan otomatis menggunakan nilai tersebut dan mengabaikan tarif di pengaturan ini.
        </Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="save-outline" size={18} color={COLORS.white} />
            <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Danger Zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={[styles.sectionTitle, { color: COLORS.error }]}>Zona Berbahaya</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          <Text style={styles.dangerBtnText}>Hapus Semua Data Pesanan</Text>
        </TouchableOpacity>
        <Text style={styles.dangerNote}>
          Menghapus semua data pesanan dan riwayat import. Data produk COGS tidak terhapus.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
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
  dangerSection: { borderWidth: 1, borderColor: COLORS.error + '30' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  platformDot: { width: 12, height: 12, borderRadius: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sectionNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
    backgroundColor: COLORS.borderLight,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  feeInfo: { flex: 1, paddingRight: SPACING.md },
  feeLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  feeDesc: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  feeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  feeInput: {
    width: 60,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  feePercent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.borderLight,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  totalFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  totalFeeLabel: { fontSize: 13, color: COLORS.textSecondary },
  totalFeeValue: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  infoBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    margin: SPACING.md,
    marginBottom: 0,
    backgroundColor: COLORS.warningLight,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.warning, lineHeight: 20 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    marginBottom: 0,
    padding: SPACING.md,
    borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: 10,
    marginTop: SPACING.sm,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.error },
  dangerNote: { fontSize: 12, color: COLORS.textTertiary, marginTop: SPACING.sm, lineHeight: 18 },
});
