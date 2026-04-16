import { Reveal } from '../components/Reveal';
import { site } from '../data/site';

const pillars = [
  { t: 'Asli', d: 'Part original & aftermarket premium. Tanpa barang tak jelas asal-usulnya.' },
  { t: 'Cepat', d: 'Pesan hari ini, kirim hari ini ke JABODETABEK. Nasional dalam 1–3 hari.' },
  { t: 'Terkurasi', d: 'Tim teknis memilih tiap SKU — yang awet di jalanan Indonesia.' },
  { t: 'Transparan', d: 'Harga jelas, garansi jelas, kualitas jelas. Tanpa drama.' },
];

const timeline = [
  { y: '2016', t: 'Toko pertama dibuka di Jakarta — fokus suku cadang motor harian.' },
  { y: '2019', t: 'Ekspansi kategori ke mobil LCGC dan komersial ringan.' },
  { y: '2022', t: 'Sistem stok digital & jaringan pengiriman nasional online.' },
  { y: '2026', t: 'Peluncuran pengalaman katalog 4D — ini yang kamu lihat sekarang.' },
];

export default function About() {
  return (
    <section className="relative pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <div className="font-mono text-xs tracking-[0.3em] text-white/50">// TENTANG KAMI</div>
          <h1 className="mt-2 text-4xl md:text-6xl font-semibold tracking-tight">
            Suku cadang bukan sekadar logam — <span className="bg-gradient-to-r from-plasma to-ember bg-clip-text text-transparent">itu kepercayaan</span>.
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl">
            {site.brand} dimulai dari satu bengkel kecil yang gerah dengan part palsu
            di pasar. Kami bertekad menghadirkan suku cadang yang benar — untuk
            mekanik, untuk rider, dan untuk armada yang bergantung pada presisi.
          </p>
        </Reveal>

        <div className="mt-16 grid md:grid-cols-4 gap-4">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.06}>
              <div className="chip rounded-2xl p-6 h-full">
                <div className="text-xs font-mono text-ember">0{i + 1}</div>
                <div className="text-xl font-semibold mt-2">{p.t}</div>
                <p className="text-white/65 text-sm mt-2 leading-relaxed">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-24">
          <Reveal>
            <div className="font-mono text-xs tracking-[0.3em] text-white/50">// PERJALANAN</div>
            <h2 className="text-3xl md:text-5xl font-semibold mt-2">Dari bengkel, ke dimensi keempat.</h2>
          </Reveal>

          <div className="relative mt-10">
            <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <ul className="space-y-10">
              {timeline.map((e, i) => (
                <Reveal key={e.y} delay={i * 0.08}>
                  <li className={`relative md:grid md:grid-cols-2 md:gap-10 ${i % 2 ? 'md:[&>div]:col-start-2' : ''}`}>
                    <div className="chip rounded-2xl p-5 ml-10 md:ml-0">
                      <div className="font-mono text-xs text-plasma">{e.y}</div>
                      <p className="mt-2 text-white/85">{e.t}</p>
                    </div>
                    <div className="absolute left-3 md:left-1/2 -translate-x-1/2 top-4 w-3 h-3 rounded-full bg-ember shadow-[0_0_0_6px_rgba(255,91,46,0.15)]" />
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-24 chip rounded-3xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-ember/20 blur-3xl" />
          <div className="relative">
            <div className="font-mono text-xs tracking-[0.3em] text-white/50">// MISI</div>
            <h3 className="mt-2 text-3xl md:text-5xl font-semibold max-w-3xl">
              Menjadi titik temu antara mekanik yang teliti dan part yang jujur.
            </h3>
            <p className="mt-4 max-w-2xl text-white/70">
              Kami percaya jalanan Indonesia pantas mendapatkan suku cadang yang
              dipilih dengan hati-hati. Setiap part yang kami jual sudah melewati
              filter teknis dan pengalaman ribuan bengkel mitra.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
