import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Order,
  Product,
  AppSettings,
  ImportSession,
  AdminFeeConfig,
} from '../types';

const KEYS = {
  ORDERS: 'vortex_orders',
  PRODUCTS: 'vortex_products',
  SETTINGS: 'vortex_settings',
  IMPORT_SESSIONS: 'vortex_import_sessions',
};

const DEFAULT_SETTINGS: AppSettings = {
  adminFees: {
    shopeeAdminFeeRate: 2.5,
    shopeePaymentFeeRate: 2.0,
    tiktokAdminFeeRate: 5.0,
    tiktokPaymentFeeRate: 2.0,
  },
  currency: 'IDR',
  currencySymbol: 'Rp',
};

// ── Orders ──────────────────────────────────────────────────────────────────

export async function getAllOrders(): Promise<Order[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

export async function addOrders(newOrders: Order[]): Promise<number> {
  const existing = await getAllOrders();
  const existingIds = new Set(existing.map((o) => o.externalId + '_' + o.platform));
  const toAdd = newOrders.filter(
    (o) => !existingIds.has(o.externalId + '_' + o.platform)
  );
  await saveOrders([...existing, ...toAdd]);
  return toAdd.length;
}

export async function deleteOrdersByImportSession(importedAt: string): Promise<void> {
  const existing = await getAllOrders();
  const filtered = existing.filter((o) => o.importedAt !== importedAt);
  await saveOrders(filtered);
}

export async function getOrdersByDateRange(
  startDate: string,
  endDate: string
): Promise<Order[]> {
  const orders = await getAllOrders();
  return orders.filter((o) => {
    const d = o.date.substring(0, 10);
    return d >= startDate && d <= endDate;
  });
}

// ── Products / COGS ─────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveProduct(product: Product): Promise<void> {
  const products = await getAllProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getAllProducts();
  const filtered = products.filter((p) => p.id !== id);
  await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));
}

export async function getProductByName(name: string): Promise<Product | undefined> {
  const products = await getAllProducts();
  return products.find(
    (p) =>
      p.name.toLowerCase().trim() === name.toLowerCase().trim() ||
      p.sku.toLowerCase().trim() === name.toLowerCase().trim()
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function saveAdminFees(fees: AdminFeeConfig): Promise<void> {
  const settings = await getSettings();
  settings.adminFees = fees;
  await saveSettings(settings);
}

// ── Import Sessions ──────────────────────────────────────────────────────────

export async function getAllImportSessions(): Promise<ImportSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.IMPORT_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addImportSession(session: ImportSession): Promise<void> {
  const sessions = await getAllImportSessions();
  sessions.unshift(session);
  await AsyncStorage.setItem(KEYS.IMPORT_SESSIONS, JSON.stringify(sessions));
}

export async function deleteImportSession(id: string): Promise<void> {
  const sessions = await getAllImportSessions();
  const session = sessions.find((s) => s.id === id);
  if (session) {
    await deleteOrdersByImportSession(session.importedAt);
  }
  const filtered = sessions.filter((s) => s.id !== id);
  await AsyncStorage.setItem(KEYS.IMPORT_SESSIONS, JSON.stringify(filtered));
}

// ── Clear All ────────────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.ORDERS, KEYS.IMPORT_SESSIONS]);
}
