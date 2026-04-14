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
import Papa from 'papaparse';
import { downloadFile } from '../utils/fileUtils';

import { deleteProduct, getAllOrders, getAllProducts, saveProduct } from '../storage/database';
import { generateId } from '../utils/helpers';
import { DEFAULT_HPP_DATA } from '../utils/defaultHpp';
import { Product, ProductVariant } from '../types';
import { COLORS, SPACING } from '../theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductWithStats extends Product {
  totalUnitsSold: number;
  totalRevenue: number;
  totalCogsCost: number;
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function COGSScreen() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Product modal
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCogs, setFormCogs] = useState('');
  const [saving, setSaving] = useState(false);

  // Variant modal
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null);
  const [variantLabel, setVariantLabel] = useState('');
  const [variantCogs, setVariantCogs] = useState('');
  const [savingVariant, setSavingVariant] = useState(false);

  // Expanded products
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ── Data loading ────────────────────────────────────────────────────────────

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
        return { ...p, totalUnitsSold: stats.units, totalRevenue: stats.revenue, totalCogsCost: stats.cogs };
      });

      setProducts(enriched);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // ── Product CRUD ────────────────────────────────────────────────────────────

  const openAddProduct = () => {
    setEditProduct(null);
    setFormName('');
    setFormSku('');
    setFormCogs('');
    setProductModalVisible(true);
  };

  const openEditProduct = (product: Product) => {
    setEditProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || '');
    setFormCogs(product.cogs > 0 ? product.cogs.toString() : '');
    setProductModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Nama produk tidak boleh kosong.');
      return;
    }
    const cogs = formCogs.trim() ? parseFloat(formCogs.replace(/[^0-9.]/g, '')) || 0 : 0;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const product: Product = {
        id: editProduct?.id || generateId(),
        name: formName.trim(),
        sku: formSku.trim(),
        cogs,
        variants: editProduct?.variants || [],
        createdAt: editProduct?.createdAt || now,
        updatedAt: now,
      };
      await saveProduct(product);
      setProductModalVisible(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Hapus Produk',
      `Hapus "${product.name}" beserta semua variannya?`,
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

  // ── Variant CRUD ────────────────────────────────────────────────────────────

  const openAddVariant = (product: Product) => {
    setTargetProduct(product);
    setEditVariant(null);
    setVariantLabel('');
    setVariantCogs('');
    setVariantModalVisible(true);
  };

  const openEditVariant = (product: Product, variant: ProductVariant) => {
    setTargetProduct(product);
    setEditVariant(variant);
    setVariantLabel(variant.label);
    setVariantCogs(variant.cogs.toString());
    setVariantModalVisible(true);
  };

  const handleSaveVariant = async () => {
    if (!variantLabel.trim()) {
      Alert.alert('Error', 'Nama varian tidak boleh kosong. Contoh: "0.8 L", "1 L", "120 ml"');
      return;
    }
    const cogs = parseFloat(variantCogs.replace(/[^0-9.]/g, ''));
    if (isNaN(cogs) || cogs <= 0) {
      Alert.alert('Error', 'HPP harus berupa angka yang valid.');
      return;
    }
    if (!targetProduct) return;

    setSavingVariant(true);
    try {
      const now = new Date().toISOString();
      const newVariant: ProductVariant = {
        id: editVariant?.id || generateId(),
        label: variantLabel.trim(),
        cogs,
      };
      const variants = editVariant
        ? targetProduct.variants.map((v) => (v.id === editVariant.id ? newVariant : v))
        : [...(targetProduct.variants || []), newVariant];

      await saveProduct({ ...targetProduct, variants, updatedAt: now });
      setVariantModalVisible(false);
      await loadData();
    } finally {
      setSavingVariant(false);
    }
  };

  const handleDeleteVariant = (product: Product, variant: ProductVariant) => {
    Alert.alert(
      'Hapus Varian',
      `Hapus varian "${variant.label}" (HPP Rp ${Math.round(variant.cogs).toLocaleString('id-ID')})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const variants = product.variants.filter((v) => v.id !== variant.id);
            await saveProduct({ ...product, variants, updatedAt: new Date().toISOString() });
            await loadData();
          },
        },
      ]
    );
  };

  // ── CSV Import ──────────────────────────────────────────────────────────────

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const { readUri } = await import('../utils/fileUtils');
      const content = await readUri(result.assets[0].uri, 'utf8');
      const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });

      // Group rows: (Nama Produk) → [{Nama Variasi, COGS}]
      const productMap = new Map<string, { sku: string; fallbackCogs: number; variants: { label: string; cogs: number }[] }>();

      for (const row of parsed.data) {
        const name = (row['Nama Produk'] || row['name'] || row['product_name'] || '').trim();
        const sku = (row['SKU'] || row['sku'] || '').trim();
        const variantLabel = (row['Nama Variasi'] || row['variasi'] || row['variant'] || '').trim();
        const cogsRaw = row['COGS'] || row['cogs'] || row['HPP'] || row['hpp'] || '0';
        const cogs = parseFloat(cogsRaw.replace(/[^0-9.]/g, '')) || 0;

        if (!name) continue;
        if (!productMap.has(name)) {
          productMap.set(name, { sku, fallbackCogs: 0, variants: [] });
        }
        const entry = productMap.get(name)!;
        if (sku) entry.sku = sku;

        if (variantLabel) {
          entry.variants.push({ label: variantLabel, cogs });
        } else {
          // No variant column → treat as fallback COGS
          entry.fallbackCogs = cogs;
        }
      }

      const existing = await getAllProducts();
      const existingByName = new Map(existing.map((p) => [p.name.toLowerCase(), p]));
      let count = 0;

      for (const [name, { sku, fallbackCogs, variants }] of productMap) {
        const now = new Date().toISOString();
        const existing = existingByName.get(name.toLowerCase());
        const newVariants: ProductVariant[] = variants.map((v) => ({ id: generateId(), label: v.label, cogs: v.cogs }));

        if (existing) {
          // Merge variants: add new ones, skip duplicates by label
          const existingLabels = new Set(existing.variants.map((v) => v.label.toLowerCase()));
          const toAdd = newVariants.filter((v) => !existingLabels.has(v.label.toLowerCase()));
          await saveProduct({
            ...existing,
            sku: sku || existing.sku,
            cogs: fallbackCogs || existing.cogs,
            variants: [...existing.variants, ...toAdd],
            updatedAt: now,
          });
        } else {
          await saveProduct({
            id: generateId(),
            name,
            sku,
            cogs: fallbackCogs,
            variants: newVariants,
            createdAt: now,
            updatedAt: now,
          });
        }
        count++;
      }

      await loadData();
      Alert.alert('Berhasil', `${count} produk berhasil diimpor/diperbarui.`);
    } catch (err: any) {
      Alert.alert('Gagal', err.message);
    }
  };

  const handleLoadDefault = () => {
    Alert.alert(
      'Muat Data HPP Bawaan',
      `Akan memuat ${DEFAULT_HPP_DATA.length} baris HPP (36 produk). Data yang sudah ada tidak akan dihapus, hanya ditambah/diperbarui. Lanjutkan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Muat Sekarang',
          onPress: async () => {
            setSaving(true);
            try {
              const existing = await getAllProducts();
              const existingByName = new Map(existing.map((p) => [p.name.toLowerCase(), p]));
              const now = new Date().toISOString();

              // Group default data by product name
              const productMap = new Map<string, { variants: { label: string; cogs: number }[] }>();
              for (const row of DEFAULT_HPP_DATA) {
                if (!productMap.has(row.productName)) productMap.set(row.productName, { variants: [] });
                if (row.variantLabel) {
                  productMap.get(row.productName)!.variants.push({ label: row.variantLabel, cogs: row.cogs });
                }
              }

              for (const [name, { variants }] of productMap) {
                const ex = existingByName.get(name.toLowerCase());
                const fallbackCogs = DEFAULT_HPP_DATA.find(
                  (r) => r.productName === name && !r.variantLabel
                )?.cogs || 0;
                const newVariants: ProductVariant[] = variants.map((v) => ({
                  id: generateId(), label: v.label, cogs: v.cogs,
                }));

                if (ex) {
                  const existingLabels = new Set(ex.variants.map((v) => v.label.toLowerCase()));
                  const toAdd = newVariants.filter((v) => !existingLabels.has(v.label.toLowerCase()));
                  await saveProduct({
                    ...ex,
                    cogs: ex.cogs || fallbackCogs,
                    variants: [...ex.variants, ...toAdd],
                    updatedAt: now,
                  });
                } else {
                  await saveProduct({
                    id: generateId(), name, sku: '', cogs: fallbackCogs,
                    variants: newVariants, createdAt: now, updatedAt: now,
                  });
                }
              }

              await loadData();
              Alert.alert('Berhasil', 'Data HPP bawaan berhasil dimuat. Silakan cek tab Orderan dan tekan "Hitung Ulang COGS".');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleExportTemplate = async () => {
    const csv = [
      'Nama Produk,Nama Variasi,COGS,SKU',
      'Federal Ultratec,0.8 L,22500,',
      'Federal Ultratec,1 L,26667,',
      'MPX 1,0.8 L,27083,',
      'MPX 1,1 L,32500,',
      'AHM Gear,120 ml,6979,',
    ].join('\n');
    await downloadFile(csv, 'template_hpp.csv', 'text/csv');
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
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
          <Text style={styles.headerSubtitle}>Harga Pokok Penjualan (HPP) per Varian</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddProduct}>
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
          <Text style={styles.summaryValue}>Rp {Math.round(totalCogsCost).toLocaleString('id-ID')}</Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
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

      {/* Load default HPP button */}
      <TouchableOpacity style={styles.defaultHppBtn} onPress={handleLoadDefault} disabled={saving}>
        {saving
          ? <ActivityIndicator size="small" color={COLORS.white} />
          : <Ionicons name="cloud-download-outline" size={15} color={COLORS.white} />}
        <Text style={styles.defaultHppBtnText}>Muat Data HPP Bawaan (36 produk)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.templateHint} onPress={handleExportTemplate}>
        <Ionicons name="download-outline" size={14} color={COLORS.info} />
        <Text style={styles.templateHintText}>Download template CSV (Nama Produk, Nama Variasi, COGS)</Text>
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
              Tambahkan produk beserta varian dan HPP-nya, atau import dari file CSV.
            </Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={openAddProduct}>
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.addFirstBtnText}>Tambah Produk</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedIds.has(item.id);
          const hasVariants = item.variants && item.variants.length > 0;
          return (
            <View style={styles.productCard}>
              {/* Product header row */}
              <View style={styles.productHeader}>
                <TouchableOpacity style={styles.productTitleRow} onPress={() => toggleExpand(item.id)}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    {item.sku ? <Text style={styles.productSku}>SKU: {item.sku}</Text> : null}
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textTertiary}
                  />
                </TouchableOpacity>
                <View style={styles.productActions}>
                  <TouchableOpacity onPress={() => openEditProduct(item)} style={styles.iconBtn}>
                    <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteProduct(item)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Variant summary chips */}
              {!isExpanded && hasVariants && (
                <View style={styles.variantChips}>
                  {item.variants.slice(0, 4).map((v) => (
                    <View key={v.id} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {v.label} · Rp {Math.round(v.cogs).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}
                  {item.variants.length > 4 && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>+{item.variants.length - 4} lainnya</Text>
                    </View>
                  )}
                </View>
              )}

              {/* No variants → show fallback HPP */}
              {!isExpanded && !hasVariants && item.cogs > 0 && (
                <Text style={styles.fallbackCogs}>
                  HPP: Rp {Math.round(item.cogs).toLocaleString('id-ID')} (fallback)
                </Text>
              )}

              {/* Expanded variant list */}
              {isExpanded && (
                <View style={styles.variantList}>
                  {item.variants.map((v) => (
                    <View key={v.id} style={styles.variantRow}>
                      <View style={styles.variantInfo}>
                        <Text style={styles.variantLabel}>{v.label}</Text>
                        <Text style={styles.variantCogs}>Rp {Math.round(v.cogs).toLocaleString('id-ID')}/pcs</Text>
                      </View>
                      <View style={styles.variantActions}>
                        <TouchableOpacity onPress={() => openEditVariant(item, v)} style={styles.iconBtn}>
                          <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteVariant(item, v)} style={styles.iconBtn}>
                          <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Fallback COGS row */}
                  {item.cogs > 0 && (
                    <View style={[styles.variantRow, styles.fallbackRow]}>
                      <Text style={styles.fallbackLabel}>
                        Fallback HPP: Rp {Math.round(item.cogs).toLocaleString('id-ID')} (jika varian tidak cocok)
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.addVariantBtn} onPress={() => openAddVariant(item)}>
                    <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.addVariantText}>Tambah Varian</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Stats */}
              {item.totalUnitsSold > 0 && (
                <View style={styles.statsRow}>
                  <Text style={styles.statItem}>Terjual: {item.totalUnitsSold} unit</Text>
                  <Text style={styles.statItem}>
                    Total COGS: Rp {Math.round(item.totalCogsCost).toLocaleString('id-ID')}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Product Modal */}
      <Modal visible={productModalVisible} animationType="slide" transparent>
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
              placeholder="Contoh: Federal Ultratec"
              value={formName}
              onChangeText={setFormName}
              placeholderTextColor={COLORS.textTertiary}
            />
            <Text style={styles.inputHint}>
              Tulis nama pendek yang cukup unik — akan dicocokkan ke nama produk di Shopee/TikTok.
            </Text>

            <Text style={styles.inputLabel}>SKU (opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: FED-ULT"
              value={formSku}
              onChangeText={setFormSku}
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={styles.inputLabel}>HPP Fallback (Rp) — opsional</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 25000 (dipakai jika varian tidak cocok)"
              value={formCogs}
              onChangeText={setFormCogs}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />
            <Text style={styles.inputHint}>
              Tambahkan varian dan HPP-nya setelah menyimpan produk ini.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setProductModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={styles.saveBtnText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Variant Modal */}
      <Modal visible={variantModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editVariant ? 'Edit Varian' : 'Tambah Varian'}
            </Text>
            {targetProduct && (
              <Text style={styles.modalSubtitle}>Produk: {targetProduct.name}</Text>
            )}

            <Text style={styles.inputLabel}>Nama Varian *</Text>
            <TextInput
              style={styles.input}
              placeholder='Contoh: "0.8 L", "1 L", "120 ml"'
              value={variantLabel}
              onChangeText={setVariantLabel}
              placeholderTextColor={COLORS.textTertiary}
            />
            <Text style={styles.inputHint}>
              Tulis sesuai dengan "Nama Variasi" di Shopee/TikTok. Untuk bundle, cukup tulis ukurannya (misal "120 ml") —
              qty bundle akan dideteksi otomatis dari nama varian di laporan.
            </Text>

            <Text style={styles.inputLabel}>HPP per pcs/unit (Rp) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 22500"
              value={variantCogs}
              onChangeText={setVariantCogs}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />
            <Text style={styles.inputHint}>
              Masukkan HPP per 1 pcs/botol. Untuk varian "120 ml x 5", app akan otomatis ×5.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setVariantModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVariant} disabled={savingVariant}>
                {savingVariant
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Text style={styles.saveBtnText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, paddingBottom: 0 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  actionBar: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, paddingBottom: 0 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 10,
    paddingHorizontal: SPACING.sm, gap: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: COLORS.textPrimary },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.infoLight, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.info + '40',
  },
  importBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  defaultHppBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, marginHorizontal: SPACING.md,
    marginTop: SPACING.sm, borderRadius: 10, paddingVertical: 10,
    paddingHorizontal: SPACING.md, justifyContent: 'center',
  },
  defaultHppBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  templateHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginHorizontal: SPACING.md, marginTop: SPACING.xs,
  },
  templateHintText: { fontSize: 12, color: COLORS.info },
  listContent: { padding: SPACING.md, paddingBottom: 100 },

  // Product card
  productCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: SPACING.sm, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  productHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  productTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  productSku: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },
  productActions: { flexDirection: 'row', gap: 4, marginLeft: SPACING.xs },
  iconBtn: { padding: 6 },

  // Variant chips (collapsed)
  variantChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  chip: {
    backgroundColor: COLORS.infoLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.info + '30',
  },
  chipText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  fallbackCogs: { fontSize: 12, color: COLORS.textTertiary, marginTop: SPACING.xs },

  // Variant list (expanded)
  variantList: { marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.sm },
  variantRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  variantInfo: { flex: 1 },
  variantLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  variantCogs: { fontSize: 12, color: COLORS.error, marginTop: 1 },
  variantActions: { flexDirection: 'row', gap: 2 },
  fallbackRow: { backgroundColor: COLORS.background, borderRadius: 6, paddingHorizontal: 8 },
  fallbackLabel: { fontSize: 11, color: COLORS.textTertiary, fontStyle: 'italic' },
  addVariantBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: SPACING.sm, paddingVertical: 8,
    justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '40',
    borderRadius: 8, borderStyle: 'dashed',
  },
  addVariantText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: SPACING.sm, paddingTop: SPACING.xs,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  statItem: { fontSize: 11, color: COLORS.textTertiary },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubtitle: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  addFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 20, marginTop: SPACING.md,
  },
  addFirstBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary, marginBottom: 4,
  },
  inputHint: { fontSize: 11, color: COLORS.textTertiary, marginBottom: SPACING.md, lineHeight: 16 },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1, padding: SPACING.md, borderRadius: 12,
    alignItems: 'center', backgroundColor: COLORS.borderLight,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  saveBtn: {
    flex: 2, padding: SPACING.md, borderRadius: 12,
    alignItems: 'center', backgroundColor: COLORS.primary,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
