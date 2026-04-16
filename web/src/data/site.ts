import { productImages } from './productImages';

export const site = {
  brand: 'YSP Genuine Parts',
  short: 'YSP',
  tagline: 'Suku cadang asli untuk Yamaha & Honda.',
  subTagline:
    'Mangkok Ganda, Rumah Roller, V-Belt, Kampas Ganda — dibuat presisi, diuji di jalanan Indonesia.',
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

export type CategorySlug =
  | 'mangkok-ganda'
  | 'rumah-roller'
  | 'tutup-rumah-roller'
  | 'v-belt'
  | 'v-belt-assy-roller'
  | 'kampas-ganda'
  | 'kampas-rem';

export type Category = {
  slug: CategorySlug;
  name: string;       // MUST match the prefix used in filenames
  blurb: string;
  aliases?: string[]; // extra name variants accepted in filenames
};

export const categories: Category[] = [
  {
    slug: 'mangkok-ganda',
    name: 'Mangkok Ganda',
    blurb: 'Clutch bell / housing — permukaan presisi, putaran halus.',
  },
  {
    slug: 'rumah-roller',
    name: 'Rumah Roller',
    blurb: 'Rumah roller CVT — dimensi OEM, presisi tinggi.',
  },
  {
    slug: 'tutup-rumah-roller',
    name: 'Tutup Rumah Roller',
    blurb: 'Cover roller housing — debu & panas terkunci di luar.',
  },
  {
    slug: 'v-belt',
    name: 'V-Belt',
    blurb: 'Sabuk CVT tahan panas & tahan aus untuk harian kota.',
    aliases: ['V Belt'],
  },
  {
    slug: 'v-belt-assy-roller',
    name: 'V-Belt Assy + Roller',
    blurb: 'Paket lengkap V-belt plus roller — tinggal pasang.',
    aliases: ['V Belt Assy + Roller'],
  },
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

function slugifyCategoryName(name: string): CategorySlug | null {
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const c of categories) {
    if (c.name.toLowerCase() === n) return c.slug;
    if (c.aliases?.some((a) => a.toLowerCase() === n)) return c.slug;
  }
  return null;
}

/**
 * Code → motorcycle model & brand. Add new codes here as you photograph
 * more parts. Unknown codes fall back to "Universal".
 */
export const codeMap: Record<string, { motor: Motor; model: string }> = {
  // Yamaha
  '1S7':  { motor: 'Yamaha', model: 'Jupiter MX' },
  '2DP':  { motor: 'Yamaha', model: 'NMax 155cc' },
  '2SX':  { motor: 'Yamaha', model: 'Mio M3' },
  '5TL':  { motor: 'Yamaha', model: 'Mio Sporty' },
  '5TP':  { motor: 'Yamaha', model: 'Vega R' },
  '14D':  { motor: 'Yamaha', model: 'Mio Soul' },
  '44D':  { motor: 'Yamaha', model: 'Xeon 125' },
  '54P':  { motor: 'Yamaha', model: 'Mio J' },
  'B5X':  { motor: 'Yamaha', model: 'Lexi 125' },
  'B65':  { motor: 'Yamaha', model: 'Aerox 155cc' },
  'B74':  { motor: 'Yamaha', model: 'X-Max' },
  // Honda
  'GCC/KVB': { motor: 'Honda', model: 'Vario 110 CW' },
  'GFM':  { motor: 'Honda', model: 'Beat Street' },
  'K0J':  { motor: 'Honda', model: 'Beat Pop' },
  'K0JA': { motor: 'Honda', model: 'Beat Pop' },
  'K2FA/K1A': { motor: 'Honda', model: 'Scoopy ESP' },
  'K2S':  { motor: 'Honda', model: 'Vario 150' },
  'K16':  { motor: 'Honda', model: 'Scoopy' },
  'K16 FCC': { motor: 'Honda', model: 'Scoopy' },
  'K35':  { motor: 'Honda', model: 'Vario 125 eSP' },
  'K36':  { motor: 'Honda', model: 'Vario 150 eSP' },
  'K44':  { motor: 'Honda', model: 'Beat Pop' },
  'K81':  { motor: 'Honda', model: 'Beat Esp' },
  'K97':  { motor: 'Honda', model: 'Genio' },
  'KPH':  { motor: 'Honda', model: 'Karisma' },
  'KVB':  { motor: 'Honda', model: 'Vario 110 CW' },
  'KVY':  { motor: 'Honda', model: 'Beat Karbu' },
  'KWN':  { motor: 'Honda', model: 'Vario 125' },
  'KWW':  { motor: 'Honda', model: 'New Revo' },
  'KZL':  { motor: 'Honda', model: 'Beat FI' },
  'KZR':  { motor: 'Honda', model: 'Beat FI eSP' },
};

export type Product = {
  code: string;
  name: string;        // "Mangkok Ganda"
  model: string;       // "Jupiter MX"
  motor: Motor;
  category: CategorySlug;
  image?: string;
};

/**
 * Auto-built catalog from discovered image files. If an image filename
 * includes an explicit model (e.g. "Mangkok Ganda (Vario 125) - KWN.png"),
 * that model wins. Otherwise we look the code up in `codeMap`.
 */
export const products: Product[] = productImages
  .map((img) => {
    const slug = slugifyCategoryName(img.category);
    if (!slug) return null;
    const category = categories.find((c) => c.slug === slug)!;
    const lookup = codeMap[img.code];
    const model = img.model ?? lookup?.model ?? 'Universal';
    const motor: Motor = lookup?.motor ?? 'Honda';
    return {
      code: img.code,
      name: category.name,
      model,
      motor,
      category: slug,
      image: img.url,
    } as Product;
  })
  .filter((p): p is Product => p !== null)
  .sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.motor !== b.motor) return a.motor.localeCompare(b.motor);
    return a.model.localeCompare(b.model);
  });

export const motors: { name: Motor; count: number }[] = [
  { name: 'Yamaha', count: products.filter((p) => p.motor === 'Yamaha').length },
  { name: 'Honda', count: products.filter((p) => p.motor === 'Honda').length },
];

/** Categories that actually have products available right now. */
export const activeCategories = categories.filter((c) =>
  products.some((p) => p.category === c.slug)
);

export const brands = [
  'YAMAHA', 'HONDA', 'NMAX', 'AEROX', 'MIO', 'VARIO', 'BEAT', 'SCOOPY',
  'JUPITER MX', 'XEON', 'LEXI', 'X-MAX', 'GENIO',
];

export const tiers = [
  {
    name: 'Grosiran',
    scale: '30 Dus',
    price: 'Dihubungi',
    tagline: 'Untuk toko kecil & bengkel aktif.',
    perks: ['Harga grosir per dus', 'Pengiriman reguler', 'Minimum 30 dus per order', 'Support WhatsApp'],
    highlighted: false,
    cta: 'Saya ingin jadi Grosiran',
  },
  {
    name: 'Agen',
    scale: '600 Juta',
    price: 'Mulai Rp 600 jt',
    tagline: 'Jaringan kota & kabupaten.',
    perks: ['Harga agen resmi YSP', 'Eksklusif wilayah tertentu', 'Marketing kit + training produk', 'Dukungan prioritas'],
    highlighted: true,
    cta: 'Saya ingin jadi Agen',
  },
  {
    name: 'Distributor',
    scale: '2 Miliar',
    price: 'Mulai Rp 2 M',
    tagline: 'Skala regional & nasional.',
    perks: ['Harga distributor terbaik', 'Wilayah provinsi', 'Joint marketing & co-branding', 'Account manager dedicated'],
    highlighted: false,
    cta: 'Saya ingin jadi Distributor',
  },
];

export const featureHighlights = [
  {
    eyebrow: 'PRESISI',
    title: 'Toleransi mikron, bukan milimeter.',
    body: 'Setiap part YSP dicetak dengan toleransi manufaktur yang ketat — kopling engage mulus, tanpa selip, tanpa getar.',
  },
  {
    eyebrow: 'TAHAN PANAS',
    title: 'Dirancang untuk macet jam 5 sore.',
    body: 'Compound dan material teruji pada suhu tinggi berulang — lebih tahan lama di rute harian kota padat.',
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
