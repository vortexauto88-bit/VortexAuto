import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Share from 'expo-sharing';
import Papa from 'papaparse';

import { deleteProduct, getAllOrders, getAllProducts, saveProduct } from '../storage/database';
import { generateId } from '../utils/helpers';
import { Product } from '../types';
import { COLORS, SPACING } from '../theme';

interface ProductWithStats extends Product {
  totalUnitsSold: number;
  totalRevenue: number;
  totalCogsCost: number;
}

export default function COGSScreen() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCogs, setFormCogs] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, orders] = await Promise.all([getAllProducts(), getAllOrders()]);

      const statsMap = new Map<string, { units: number; revenue: number; cogs: number }>();

      for (const order of orders) {
        if (order.status === 'cancelled') continue;
        for (const item of order.items) {
          const key = item.productId || item.productName;
          if (!statsMap.has(key)) statsMap.set(key, { units: 0, revenue: 0, cogs: 0 });
          const s = statsMap.get(key)!;
          s.units += item.quantity;
          s.revenue += item.subtotal;
          s.cogs += item.totalCogs;
        }
      }

      const enriched: ProductWithStats[] = prods.map((p) => {
        const stats = statsMap.get(p.id) || statsMap.get(p.name) || { units: 0, revenue: 0, cogs: 0 };
        return {
          ...p,
          totalUnitsSold: stats.units,
          totalRevenue: stats.revenue,
          totalCogsCost: stats.cogs,
        };
      });

      setProducts(enriched);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openAddModal = () => {
    setEditProduct(null);
    setFormName('');
    setFormSku('');
    setFormCogs('');
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormCogs(product.cogs.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Nama produk tidak boleh kosong.');
      return;
    }
    const cogs = parseFloat(formCogs.replace(/[^0-9.]/g, ''));
    if (isNaN(cogs) || cogs < 0) {
      Alert.alert('Error', 'COGS harus berupa angka yang valid.');
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const product: Product = {
        id: editProduct?.id || generateId(),
        name: formName.trim(),
        sku: formSku.trim(),
        cogs,
        createdAt: editProduct?.createdAt || now,
        updatedAt: now,
      };
      await saveProduct(product);
      setModalVisible(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Hapus Produk',
      `Hapus produk "${product.name}"? Data COGS produk ini tidak akan dihitung lagi.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'utf8' });
      const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });

      let count = 0;
      for (const row of parsed.data) {
        const name = (row['Nama Produk'] || row['name'] || row['product_name'] || '').trim();
        const sku = (row['SKU'] || row['sku'] || '').trim();
        const cogsRaw = row['COGS'] || row['cogs'] || row['HPP'] || '0';
        const cogs = parseFloat(cogsRaw.replace(/[^0-9.]/g, '')) || 0;

        if (!name) continue;
        const now = new Date().toISOString();
        await saveProduct({ id: generateId(), name, sku, cogs, createdAt: now, updatedAt: now });
        count++;
      }
      await loadData();
      Alert.alert('Berhasil', `${count} produk berhasil diimpor.`);
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handleExportTemplate = async () => {
    const csv = ['Nama Produk,SKU,COGS', 'Produk A,SKU-001,25000', 'Produk B,SKU-002,50000'].join('\n');
    const path = FileSystem.documentDirectory + 'template_cogs.csv';
    await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
    await Share.shareAsync(path, { mimeType: 'text/csv' });
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCogsCost = products.reduce((s, p) => s + p.totalCogsCost, 0);

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
          <Text style={styles.headerTitle}>Manajemen COGS</Text>
          <Text style={styles.headerSubtitle}>Harga Pokok Penjualan (HPP)</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Produk</Text>
          <Text style={styles.summaryValue}>{products.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total COGS Terjual</Text>
          <Text style={styles.summaryValue}>
            Rp {Math.round(totalCogsCost).toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk atau SKU..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
        <TouchableOpacity style={styles.importBtn} onPress={handleImportCSV}>
          <Ionicons name="cloud-upload-outline" size={16} color={COLORS.primary} />
          <Text style={styles.importBtnText}>Import</Text>
        </TouchableOpacity>
      </View>

      {/* Template hint */}
      <TouchableOpacity style={styles.templateHint} onPress={handleExportTemplate}>
        <Ionicons name="download-outline" size={14} color={COLORS.info} />
        <Text style={styles.templateHintText}>Download template CSV COGS</Text>
      </TouchableOpacity>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>Belum ada produk</Text>
            <Text style={styles.emptySubtitle}>
              Tambahkan produk beserta COGS/HPP-nya agar laporan penghasilan bersih akurat.
            </Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={openAddModal}>
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.addFirstBtnText}>Tambah Produk</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productMain}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                {item.sku ? (
                  <Text style={styles.productSku}>SKU: {item.sku}</Text>
                ) : null}
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
                  <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.productStats}>
              <View style={styles.productStat}>
                <Text style={styles.productStatLabel}>COGS/unit</Text>
                <Text style={[styles.productStatValue, { color: COLORS.error }]}>
                  Rp {Math.round(item.cogs).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.productStat}>
                <Text style={styles.productStatLabel}>Terjual</Text>
                <Text style={styles.productStatValue}>{item.totalUnitsSold} unit</Text>
              </View>
              <View style={styles.productStat}>
                <Text style={styles.productStatLabel}>Total COGS</Text>
                <Text style={[styles.productStatValue, { color: COLORS.error }]}>
                  Rp {Math.round(item.totalCogsCost).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editProduct ? 'Edit Produk' : 'Tambah Produk'}
            </Text>

            <Text style={styles.inputLabel}>Nama Produk *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Kaos Polos Putih"
              value={formName}
              onChangeText={setFormName}
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={styles.inputLabel}>SKU (opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: KPP-001"
              value={formSku}
              onChangeText={setFormSku}
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={styles.inputLabel}>COGS / HPP per Unit (Rp) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 25000"
              value={formCogs}
              onChangeText={setFormCogs}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />
            <Text style={styles.inputHint}>
              Harga Pokok Penjualan adalah biaya modal produk per satuan.
            </Text>

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
                  <Text style={styles.saveBtnText}>Simpan</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, paddingBottom: 0 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  actionBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingBottom: 0,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: COLORS.textPrimary },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
  },
  importBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  templateHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  templateHintText: { fontSize: 12, color: COLORS.info },
  listContent: { padding: SPACING.md, paddingBottom: 100 },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  productMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  productSku: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  productActions: { flexDirection: 'row', gap: SPACING.sm },
  editBtn: { padding: 6 },
  deleteBtn: { padding: 6 },
  productStats: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    justifyContent: 'space-between',
  },
  productStat: {},
  productStatLabel: { fontSize: 11, color: COLORS.textTertiary },
  productStatValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginTop: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: SPACING.md,
  },
  addFirstBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
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
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputHint: { fontSize: 12, color: COLORS.textTertiary, marginTop: -SPACING.sm, marginBottom: SPACING.md },
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
    backgroundColor: COLORS.primary,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
