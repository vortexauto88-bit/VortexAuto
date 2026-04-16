import { Reveal } from '../components/Reveal';
import { site } from '../data/site';

const pillars = [
  { t: 'Genuine', d: 'Part original & aftermarket premium. Tanpa barang tak jelas asal-usulnya.' },
  { t: 'Fast', d: 'Pesan hari ini, kirim hari ini ke JABODETABEK. Nasional dalam 1–3 hari.' },
  { t: 'Curated', d: 'Tim teknis memilih tiap SKU — yang awet di jalanan Indonesia.' },
  { t: 'Transparent', d: 'Harga jelas, garansi jelas, kualitas jelas. Tanpa drama.' },
];

const timeline = [
  { y: '2016', t: 'Toko pertama dibuka di Jakarta — fokus suku cadang motor harian.' },
  { y: '2019', t: 'Ekspansi kategori ke mobil LCGC dan komersial ringan.' },
  { y: '2022', t: 'Sistem stok digital & jaringan pengiriman nasional online.' },
  { y: '2026', t: 'Peluncuran pengalaman katalog 4D — ini yang kamu lihat sekarang.' },
];

export default function About() {
  return (
    <section className="relative pt-36 pb-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="text-[11px] font-mono tracking-[0.25em] text-tron">ABOUT</div>
          <h1 className="display mt-3 text-5xl md:text-7xl">
            Parts are not metal —<br /><span className="text-muted">they are trust.</span>
          </h1>
          <p className="mt-6 text-muted max-w-2xl text-lg leading-relaxed">
            {site.brand} dimulai dari satu bengkel kecil yang gerah dengan part palsu
            di pasar. Kami bertekad menghadirkan suku cadang yang benar — untuk
            mekanik, untuk rider, dan untuk armada yang bergantung pada presisi.
          </p>
        </Reveal>

        <div className="mt-20 grid md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.06}>
              <div className="bg-black/70 p-7 h-full">
                <div className="text-[11px] font-mono text-tron">0{i + 1}</div>
                <div className="text-xl font-medium mt-4 tracking-tight">{p.t}</div>
                <p className="text-muted text-sm mt-2 leading-relaxed">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-28">
          <Reveal>
            <div className="text-[11px] font-mono tracking-[0.25em] text-tron">JOURNEY</div>
            <h2 className="display text-4xl md:text-6xl mt-3">From workshop to 4D.</h2>
          </Reveal>

          <div className="relative mt-14">
            <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            <ul className="space-y-12">
              {timeline.map((e, i) => (
                <Reveal key={e.y} delay={i * 0.08}>
                  <li className={`relative md:grid md:grid-cols-2 md:gap-10 ${i % 2 ? 'md:[&>div]:col-start-2' : ''}`}>
                    <div className="surface rounded-2xl p-6 ml-10 md:ml-0">
                      <div className="font-mono text-[11px] text-tron tracking-[0.2em]">{e.y}</div>
                      <p className="mt-3 text-text leading-relaxed">{e.t}</p>
                    </div>
                    <div className="absolute left-3 md:left-1/2 -translate-x-1/2 top-5 w-2 h-2 rounded-full bg-tron shadow-[0_0_12px_#7dd3fc]" />
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-28 rounded-3xl p-12 md:p-20 relative overflow-hidden border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tron/60 to-transparent"/>
          <div className="text-[11px] font-mono tracking-[0.25em] text-tron">MISSION</div>
          <h3 className="display mt-3 text-3xl md:text-5xl max-w-3xl">
            The meeting point between precise mechanics and honest parts.
          </h3>
          <p className="mt-5 max-w-2xl text-muted text-lg leading-relaxed">
            Setiap part yang kami jual sudah melewati filter teknis dan pengalaman ribuan bengkel mitra.
          </p>
        </div>
      </div>
    </section>
  );
}
