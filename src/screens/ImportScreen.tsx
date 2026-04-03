import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { readFileAsString } from '../utils/fileReader';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { addImportSession, addOrders, deleteImportSession, getAllImportSessions, getSettings } from '../storage/database';
import { parseShopeeCSV } from '../utils/shopeeParser';
import { parseTikTokCSV } from '../utils/tiktokParser';
import { parseOfflineCSV, generateOfflineTemplate } from '../utils/offlineParser';
import { generateId } from '../utils/helpers';
import { ImportSession, Platform } from '../types';
import { COLORS, SPACING } from '../theme';
import PlatformBadge from '../components/PlatformBadge';

interface PlatformOption {
  id: Platform;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  acceptedTypes: string[];
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'shopee',
    label: 'Shopee',
    description: 'Import file CSV/Excel dari Shopee Seller Center > Pesanan Saya > Ekspor',
    icon: 'storefront-outline',
    color: COLORS.shopee,
    acceptedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values'],
  },
  {
    id: 'tiktok',
    label: 'TikTok Shop',
    description: 'Import file CSV/Excel dari TikTok Seller Center > Orders > Export',
    icon: 'musical-notes-outline',
    color: '#010101',
    acceptedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values'],
  },
  {
    id: 'offline',
    label: 'Penjualan Offline',
    description: 'Import file CSV/Excel invoice penjualan offline menggunakan template',
    icon: 'receipt-outline',
    color: COLORS.offline,
    acceptedTypes: ['text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values'],
  },
];

export default function ImportScreen() {
  const [importing, setImporting] = useState<Platform | null>(null);
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const loadSessions = useCallback(async () => {
    const all = await getAllImportSessions();
    setSessions(all);
    setLoadingSessions(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleImport = async (platform: Platform) => {
    try {
      setImporting(platform);
      const result = await DocumentPicker.getDocumentAsync({
        // Accept CSV and Excel files
        type: [
          'text/csv',
          'text/plain',
          'application/vnd.ms-excel',                                          // .xls
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/octet-stream',
          '*/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        setImporting(null);
        return;
      }

      const asset = result.assets[0];
      // Supports CSV and Excel (.xlsx/.xls) via universal file reader
      const content = await readFileAsString(asset.uri, asset.name);
      const settings = await getSettings();
      const importedAt = new Date().toISOString();

      let orders;

      if (platform === 'shopee') {
        orders = await parseShopeeCSV(
          content,
          importedAt,
          settings.adminFees.shopeeAdminFeeRate,
          settings.adminFees.shopeePaymentFeeRate,
          settings.adminFees.shopeeFixedFeePerOrder || 0,
        );
      } else if (platform === 'tiktok') {
        orders = await parseTikTokCSV(
          content,
          importedAt,
          settings.adminFees.tiktokAdminFeeRate,
          settings.adminFees.tiktokPaymentFeeRate,
          settings.adminFees.tiktokFixedFeePerOrder || 0,
        );
      } else {
        orders = await parseOfflineCSV(content, importedAt);
      }

      if (orders.length === 0) {
        Alert.alert(
          'Tidak Ada Data',
          'File tidak mengandung data pesanan yang valid. Pastikan format file benar.'
        );
        setImporting(null);
        return;
      }

      const added = await addOrders(orders);
      const gross = orders.reduce((s, o) => s + o.grossAmount, 0);
      const net = orders.reduce((s, o) => s + o.netAmount, 0);
      const skipped = orders.length - added;

      const session: ImportSession = {
        id: generateId(),
        platform,
        fileName: asset.name,
        importedAt,
        orderCount: added,
        grossTotal: gross,
        netTotal: net,
      };

      await addImportSession(session);
      await loadSessions();

      const skippedMsg = skipped > 0 ? `\n${skipped} pesanan dilewati (duplikat).` : '';
      Alert.alert(
        'Import Berhasil',
        `${added} pesanan berhasil diimpor dari ${asset.name}.${skippedMsg}`
      );
    } catch (err: any) {
      Alert.alert('Gagal Import', err.message || 'Terjadi kesalahan saat membaca file.');
    } finally {
      setImporting(null);
    }
  };

  const handleDeleteSession = (session: ImportSession) => {
    Alert.alert(
      'Hapus Import',
      `Hapus data import "${session.fileName}"?\nSemua ${session.orderCount} pesanan dari import ini akan dihapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteImportSession(session.id);
            await loadSessions();
          },
        },
      ]
    );
  };

  const handleDownloadTemplate = async () => {
    const template = generateOfflineTemplate();
    const path = FileSystem.documentDirectory + 'template_offline.csv';
    await FileSystem.writeAsStringAsync(path, template, { encoding: 'utf8' });
    await Share.share({ url: path, title: 'Template CSV Offline' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Import Data</Text>
        <Text style={styles.headerSubtitle}>
          Pilih platform untuk mengimpor file pesanan CSV
        </Text>
      </View>

      {/* Platform Import Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pilih Sumber Data</Text>
        {PLATFORMS.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={styles.platformCard}
            onPress={() => handleImport(platform.id)}
            disabled={importing !== null}
          >
            <View style={[styles.platformIconContainer, { backgroundColor: platform.color + '20' }]}>
              {importing === platform.id ? (
                <ActivityIndicator size="small" color={platform.color} />
              ) : (
                <Ionicons name={platform.icon} size={28} color={platform.color} />
              )}
            </View>
            <View style={styles.platformInfo}>
              <Text style={styles.platformName}>{platform.label}</Text>
              <Text style={styles.platformDesc}>{platform.description}</Text>
            </View>
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Template Download */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Template Offline</Text>
        <TouchableOpacity style={styles.templateButton} onPress={handleDownloadTemplate}>
          <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          <Text style={styles.templateButtonText}>Download Template CSV Offline</Text>
        </TouchableOpacity>
        <Text style={styles.templateHint}>
          Gunakan template ini untuk mencatat penjualan offline dan import ke aplikasi.
        </Text>
      </View>

      {/* Import History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Riwayat Import</Text>
        {loadingSessions ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : sessions.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada riwayat import</Text>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <PlatformBadge platform={session.platform} />
                <Text style={styles.sessionDate}>
                  {format(new Date(session.importedAt), 'dd/MM/yyyy HH:mm')}
                </Text>
              </View>
              <Text style={styles.sessionFileName} numberOfLines={1}>{session.fileName}</Text>
              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatLabel}>Pesanan</Text>
                  <Text style={styles.sessionStatValue}>{session.orderCount}</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatLabel}>Total Kotor</Text>
                  <Text style={styles.sessionStatValue}>
                    Rp {Math.round(session.grossTotal).toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteSession(session)}
              >
                <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                <Text style={styles.deleteText}>Hapus Import</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  platformIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  platformDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.infoLight,
    padding: SPACING.md,
    borderRadius: 10,
  },
  templateButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  templateHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.sm, lineHeight: 18 },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', padding: SPACING.md },
  sessionCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sessionDate: { fontSize: 12, color: COLORS.textTertiary },
  sessionFileName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  sessionStats: { flexDirection: 'row', gap: SPACING.md },
  sessionStat: {},
  sessionStatLabel: { fontSize: 11, color: COLORS.textTertiary },
  sessionStatValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  deleteText: { fontSize: 12, color: COLORS.error, fontWeight: '600' },
});
