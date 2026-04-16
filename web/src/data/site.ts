export const site = {
  brand: 'YSP Genuine Parts',
  short: 'YSP',
  tagline: 'Suku cadang asli untuk Yamaha & Honda.',
  subTagline: 'Kampas ganda, kampas rem, dan lini lengkap suku cadang sepeda motor — dibuat presisi, diuji di jalanan Indonesia.',
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
    { k: '9+ thn', v: 'di jalanan' },
    { k: '300+', v: 'bengkel mitra' },
  ],
};

export type Motor = 'Yamaha' | 'Honda';

export type Product = {
  code: string;
  name: string;        // short name e.g. "Kampas Ganda"
  model: string;       // e.g. "Jupiter MX"
  motor: Motor;
  category: 'kampas-ganda' | 'kampas-rem';
  /** Optional override. If unset, the site tries /products/{code}.jpg|png|webp */
  image?: string;
};

// Real products from the YSP catalog
export const products: Product[] = [
  // Kampas Ganda (clutch shoes)
  { code: '1S7',      name: 'Kampas Ganda', model: 'Jupiter MX', motor: 'Yamaha', category: 'kampas-ganda' },
  { code: '2DP',      name: 'Kampas Ganda', model: 'NMax 155cc', motor: 'Yamaha', category: 'kampas-ganda' },
  { code: '2SX',      name: 'Kampas Ganda', model: 'Mio M3',     motor: 'Yamaha', category: 'kampas-ganda' },
  { code: '5TL',      name: 'Kampas Ganda', model: 'Mio Sporty', motor: 'Yamaha', category: 'kampas-ganda' },
  { code: '5TP',      name: 'Kampas Ganda', model: 'Vega R',     motor: 'Yamaha', category: 'kampas-ganda' },
  { code: '14D',      name: 'Kampas Ganda', model: 'Mio Soul',   motor: 'Yamaha', category: 'kampas-ganda' },
  { code: '44D',      name: 'Kampas Ganda', model: 'Xeon 125',   motor: 'Yamaha', category: 'kampas-ganda' },
  { code: '54P',      name: 'Kampas Ganda', model: 'Mio J',      motor: 'Yamaha', category: 'kampas-ganda' },
  { code: 'B65',      name: 'Kampas Ganda', model: 'Aerox 155cc',motor: 'Yamaha', category: 'kampas-ganda' },
  { code: 'B74',      name: 'Kampas Ganda', model: 'X-Max',      motor: 'Yamaha', category: 'kampas-ganda' },
  // Honda
  { code: 'GCC/KVB',  name: 'Kampas Ganda', model: 'Vario 110 CW', motor: 'Honda', category: 'kampas-ganda' },
  { code: 'K2FA/K1A', name: 'Kampas Ganda', model: 'Scoopy ESP', motor: 'Honda', category: 'kampas-ganda' },
  { code: 'K16',      name: 'Kampas Ganda', model: 'Scoopy',     motor: 'Honda', category: 'kampas-ganda' },
  { code: 'K44',      name: 'Kampas Ganda', model: 'Beat Pop',   motor: 'Honda', category: 'kampas-ganda' },
  { code: 'KPH',      name: 'Kampas Ganda', model: 'Karisma',    motor: 'Honda', category: 'kampas-ganda' },
  { code: 'KVY',      name: 'Kampas Ganda', model: 'Beat Karbu', motor: 'Honda', category: 'kampas-ganda' },
  { code: 'KWN',      name: 'Kampas Ganda', model: 'Vario 125',  motor: 'Honda', category: 'kampas-ganda' },
  { code: 'KWW',      name: 'Kampas Ganda', model: 'New Revo',   motor: 'Honda', category: 'kampas-ganda' },
  { code: 'KZL',      name: 'Kampas Ganda', model: 'Beat FI',    motor: 'Honda', category: 'kampas-ganda' },
  { code: 'K81',      name: 'Kampas Ganda', model: 'Beat Esp',   motor: 'Honda', category: 'kampas-ganda' },
];

export type Category = {
  slug: 'kampas-ganda' | 'kampas-rem';
  name: string;
  blurb: string;
};

export const categories: Category[] = [
  {
    slug: 'kampas-ganda',
    name: 'Kampas Ganda',
    blurb: 'Auto-clutch shoes — transfer tenaga halus, pakem, tahan panas.',
  },
  {
    slug: 'kampas-rem',
    name: 'Kampas Rem',
    blurb: 'Brake shoes & pads — hentinya yakin, aus-nya merata.',
  },
];

export const motors: { name: Motor; count: number }[] = [
  { name: 'Yamaha', count: products.filter((p) => p.motor === 'Yamaha').length },
  { name: 'Honda', count: products.filter((p) => p.motor === 'Honda').length },
];

export const brands = [
  'YAMAHA', 'HONDA', 'SUZUKI', 'KAWASAKI',
  'NMAX', 'AEROX', 'MIO', 'VARIO', 'BEAT', 'SCOOPY', 'JUPITER MX', 'XEON',
];

export const tiers = [
  {
    name: 'Grosiran',
    scale: '30 Dus',
    price: 'Dihubungi',
    tagline: 'Untuk toko kecil & bengkel aktif.',
    perks: [
      'Harga grosir per dus',
      'Pengiriman reguler',
      'Minimum 30 dus per order',
      'Support WhatsApp',
    ],
    highlighted: false,
    cta: 'Saya ingin jadi Grosiran',
  },
  {
    name: 'Agen',
    scale: '600 Juta',
    price: 'Mulai Rp 600 jt',
    tagline: 'Jaringan kota & kabupaten.',
    perks: [
      'Harga agen resmi YSP',
      'Eksklusif wilayah tertentu',
      'Marketing kit + training produk',
      'Dukungan prioritas',
    ],
    highlighted: true,
    cta: 'Saya ingin jadi Agen',
  },
  {
    name: 'Distributor',
    scale: '2 Miliar',
    price: 'Mulai Rp 2 M',
    tagline: 'Skala regional & nasional.',
    perks: [
      'Harga distributor terbaik',
      'Wilayah provinsi',
      'Joint marketing & co-branding',
      'Account manager dedicated',
    ],
    highlighted: false,
    cta: 'Saya ingin jadi Distributor',
  },
];

export const featureHighlights = [
  {
    eyebrow: 'PRESISI',
    title: 'Toleransi mikron, bukan milimeter.',
    body: 'Setiap kampas ganda YSP dicetak dengan toleransi manufaktur yang ketat — kopling engage mulus, tanpa selip, tanpa getar.',
  },
  {
    eyebrow: 'TAHAN PANAS',
    title: 'Dirancang untuk macet jam 5 sore.',
    body: 'Compound gesek kami teruji pada suhu tinggi berulang — lebih tahan lama di rute harian kota padat.',
  },
  {
    eyebrow: 'FITMEN',
    title: 'Pasang langsung. Tanpa otak-atik.',
    body: 'Dimensi disesuaikan OEM. Tidak perlu grinding, tidak perlu adjustment tambahan — mekanik bengkel puas.',
  },
];

export const testimonials = [
  { who: 'Bengkel Rajawali — Jakarta', say: 'Stok lengkap, harga jelas. Kirim Jakarta–Bandung cuma sehari.' },
  { who: 'Adit — rider harian Nmax', say: 'Pasang kampas ganda YSP, akselerasi balik enteng. Worth it.' },
  { who: 'PT. Logistik Nusantara', say: 'Mitra suku cadang armada Mio kami selama 3 tahun. Tanpa drama.' },
];
