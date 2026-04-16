export const site = {
  brand: 'YSP Motorindo Parts',
  short: 'YSP',
  tagline: 'Suku Cadang dalam 4 Dimensi',
  subTagline: 'Presisi. Kecepatan. Kepercayaan — untuk setiap mesin yang kamu rawat.',
  location: 'Indonesia',
  phone: '+62 812-0000-0000',
  whatsapp: '+62 812-0000-0000',
  email: 'halo@yspmotorindoparts.com',
  address: 'Jakarta, Indonesia',
  hours: 'Senin–Sabtu · 08.00 – 18.00 WIB',
  site: 'yspmotorindoparts.com',
  stats: [
    { k: '12K+', v: 'SKU tersedia' },
    { k: '48 jam', v: 'kirim nasional' },
    { k: '9+ thn', v: 'pengalaman' },
    { k: '4.9/5', v: 'rating pelanggan' },
  ],
};

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  accent: string; // tailwind color hint
  icon: string;
  items: string[];
};

export const categories: Category[] = [
  {
    slug: 'engine',
    name: 'Engine & Power',
    blurb: 'Jantung mesin — piston, ring, klep, sampai head assembly.',
    accent: '#ff5b2e',
    icon: '⚙',
    items: ['Piston Kit', 'Klep / Valve', 'Gasket Set', 'Camshaft', 'Crankshaft Bearing'],
  },
  {
    slug: 'drivetrain',
    name: 'Drivetrain',
    blurb: 'Tenaga yang tersalur sempurna dari mesin ke roda.',
    accent: '#22d3ee',
    icon: '◎',
    items: ['V-Belt CVT', 'Roller', 'Kampas Ganda', 'Rantai & Gear Set', 'Kopling Assembly'],
  },
  {
    slug: 'brakes',
    name: 'Brakes & Safety',
    blurb: 'Berhenti yang yakin. Pakem di semua kondisi.',
    accent: '#ffc857',
    icon: '⏹',
    items: ['Kampas Rem', 'Disc Rotor', 'Master Rem', 'Minyak Rem DOT4', 'Kabel Rem'],
  },
  {
    slug: 'suspension',
    name: 'Suspension',
    blurb: 'Redam guncangan, kuasai jalan.',
    accent: '#b6ff2e',
    icon: '≈',
    items: ['Shockbreaker', 'Seal Shock', 'Per Shock', 'Comstir', 'Bushing Arm'],
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    blurb: 'Arus yang stabil, pengapian yang konsisten.',
    accent: '#8b5cf6',
    icon: '⚡',
    items: ['Aki / Battery', 'CDI / ECU', 'Spul Magnet', 'Coil Pengapian', 'Busi Iridium'],
  },
  {
    slug: 'body',
    name: 'Body & Trim',
    blurb: 'Tampilan yang tajam. Detail yang rapi.',
    accent: '#f472b6',
    icon: '◇',
    items: ['Body Cover', 'Spion', 'Cover Lampu', 'Stiker & Emblem', 'Jok'],
  },
];

export const featured = [
  { name: 'Piston Racing Hi-Comp 58.5mm', cat: 'Engine', price: 'Rp 485.000', tag: 'HOT' },
  { name: 'V-Belt CVT Kevlar Reinforced', cat: 'Drivetrain', price: 'Rp 215.000', tag: 'BARU' },
  { name: 'Kampas Rem Sinter Premium', cat: 'Brakes', price: 'Rp 145.000', tag: 'STOK' },
  { name: 'Shockbreaker Gas Tabung Adjustable', cat: 'Suspension', price: 'Rp 1.290.000', tag: 'HOT' },
  { name: 'Busi Iridium IX', cat: 'Electrical', price: 'Rp 125.000', tag: 'STOK' },
  { name: 'Gasket Set Full Overhaul', cat: 'Engine', price: 'Rp 320.000', tag: 'BARU' },
];

export const brands = [
  'HONDA', 'YAMAHA', 'SUZUKI', 'KAWASAKI', 'VESPA', 'BAJAJ',
  'DAIHATSU', 'TOYOTA', 'MITSUBISHI', 'ISUZU', 'NGK', 'FEDERAL',
  'DENSO', 'AISIN', 'KAYABA', 'SHOWA', 'BRT', 'IRC',
];

export const testimonials = [
  { who: 'Bengkel Rajawali', say: 'Stok lengkap, harga jelas. Kirim Jakarta–Bandung cuma sehari.' },
  { who: 'Adit — rider harian', say: 'Pesan malam, besok pagi nyampe. Part original, bukan KW.' },
  { who: 'PT. Logistik Nusantara', say: 'Mitra suku cadang armada kami selama 3 tahun. Tanpa drama.' },
];
