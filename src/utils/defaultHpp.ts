/**
 * Default HPP (Harga Pokok Penjualan) data.
 * Tambah produk baru lewat tab COGS di app.
 */
export interface DefaultHppRow {
  productName: string;
  variantLabel: string; // kosong = produk tanpa varian
  cogs: number;
}

export const DEFAULT_HPP_DATA: DefaultHppRow[] = [
  { productName: 'AHM Gear', variantLabel: '120 ml', cogs: 6979 },

  { productName: 'Federal Ultratec', variantLabel: '0.8 L', cogs: 22500 },
  { productName: 'Federal Ultratec', variantLabel: '1 L', cogs: 26667 },

  { productName: 'Federal Matic Silver', variantLabel: '', cogs: 25000 },
  { productName: 'Federal Matic Orange', variantLabel: '', cogs: 25000 },

  { productName: 'MPX 1.2 L', variantLabel: '', cogs: 40000 },

  { productName: 'MPX 1', variantLabel: '0.8 L', cogs: 27083 },
  { productName: 'MPX 1', variantLabel: '1 L', cogs: 32500 },

  { productName: 'MPX 2', variantLabel: '0.65 L', cogs: 24583 },
  { productName: 'MPX 2', variantLabel: '0.8 L', cogs: 27083 },

  { productName: 'SPX 2', variantLabel: '', cogs: 27083 },

  { productName: 'Yamalube Silver 4T', variantLabel: '', cogs: 23750 },
  { productName: 'Yamalube Matic', variantLabel: '', cogs: 27083 },
  { productName: 'Yamalube Gold', variantLabel: '', cogs: 23750 },
  { productName: 'Yamalube Sport', variantLabel: '', cogs: 31458 },
  { productName: 'Yamalube Super Matic', variantLabel: '', cogs: 27917 },

  { productName: 'Yamaha Gear Matic', variantLabel: '100 ml', cogs: 5833 },
  { productName: 'Yamaha Gear Matic', variantLabel: '3 botol', cogs: 6875 },
  { productName: 'Yamaha Gear Matic', variantLabel: '5 botol', cogs: 7708 },

  { productName: 'Castrol 2T', variantLabel: '', cogs: 30833 },
  { productName: 'Castrol GO 4T', variantLabel: '', cogs: 32083 },

  { productName: 'SGO Suzuki Exstar', variantLabel: '0.8 L', cogs: 23750 },
  { productName: 'SGO Suzuki Exstar', variantLabel: '1 L', cogs: 27917 },

  { productName: 'Prima XP', variantLabel: '1 L', cogs: 38333 },
  { productName: 'Prima XP', variantLabel: '4 L', cogs: 125000 },

  { productName: 'Enduro Matic', variantLabel: '', cogs: 34167 },
  { productName: 'Enduro Racing', variantLabel: '', cogs: 38333 },
  { productName: 'Enduro 4T', variantLabel: '', cogs: 34167 },

  { productName: 'Mesran 40', variantLabel: '1 L', cogs: 33250 },
  { productName: 'Mesran 40', variantLabel: '4 L', cogs: 125000 },

  { productName: 'Mesran B40', variantLabel: '1 L', cogs: 34000 },
  { productName: 'Mesran B40', variantLabel: '4 L', cogs: 125000 },

  { productName: 'Mesran Super', variantLabel: '800 ml', cogs: 27708 },
  { productName: 'Mesran Super', variantLabel: '1 L', cogs: 33250 },
  { productName: 'Mesran Super', variantLabel: '4 L', cogs: 125000 },

  { productName: 'Mesrania 2T Super', variantLabel: '', cogs: 34000 },
  { productName: 'Mesrania 2T OB', variantLabel: '', cogs: 34000 },

  { productName: 'Meditran S40', variantLabel: '1 L', cogs: 34000 },
  { productName: 'Meditran S40', variantLabel: '4 L', cogs: 155000 },
  { productName: 'Meditran S40', variantLabel: '9 L', cogs: 310000 },

  { productName: 'Meditran SC', variantLabel: '1 L', cogs: 34000 },
  { productName: 'Meditran SC', variantLabel: '4 L', cogs: 155000 },
  { productName: 'Meditran SC', variantLabel: '9 L', cogs: 310000 },

  { productName: 'Meditran SX', variantLabel: '1 L', cogs: 34250 },
  { productName: 'Meditran SX', variantLabel: '4 L', cogs: 125000 },
  { productName: 'Meditran SX', variantLabel: '9 L', cogs: 310000 },

  { productName: 'TMO Bensin', variantLabel: '1 L', cogs: 47917 },
  { productName: 'TMO Diesel', variantLabel: '1 L', cogs: 47917 },
  { productName: 'TMO Bensin Diesel', variantLabel: '4 L', cogs: 150000 },

  { productName: 'Shell Ax5 4T', variantLabel: '0.8 L', cogs: 27083 },
  { productName: 'Shell Ax5 4T', variantLabel: '1 L', cogs: 31250 },

  { productName: 'Shell Ax5 Matic', variantLabel: '0.8 L', cogs: 27500 },
  { productName: 'Shell Ax5 Matic', variantLabel: '1 L', cogs: 31250 },

  { productName: 'Shell Ax7 4T', variantLabel: '0.8 L', cogs: 31250 },
  { productName: 'Shell Ax7 4T', variantLabel: '1 L', cogs: 36667 },

  { productName: 'Shell Ax7 Matic', variantLabel: '', cogs: 31667 },

  { productName: 'Shell Helix Hx5', variantLabel: '1 L', cogs: 32917 },
  { productName: 'Shell Helix Hx5', variantLabel: '4 L', cogs: 122500 },

  { productName: 'Shell Helix Hx6', variantLabel: '1 L', cogs: 32917 },
  { productName: 'Shell Helix Hx6', variantLabel: '4 L', cogs: 122500 },
];
