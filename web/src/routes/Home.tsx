import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Reveal } from '../components/Reveal';
import { site, brands, featured, categories, testimonials } from '../data/site';

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center">
        <div className="mx-auto max-w-7xl px-5 md:px-8 pt-32 pb-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="chip inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-mono tracking-widest"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse"/>
            LIVE · 4D INVENTORY ENGINE
          </motion.div>

          <h1 className="mt-6 text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] font-semibold tracking-tight">
            <span className="block text-white/90">Spare parts,</span>
            <span className="glitch bg-gradient-to-r from-ember via-amber to-plasma bg-clip-text text-transparent" data-text="diproyeksikan dari 4 dimensi.">
              diproyeksikan dari 4 dimensi.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-white/70 text-base md:text-lg">
            {site.brand} menghadirkan katalog suku cadang motor & mobil dengan visualisasi
            ruang-waktu. Temukan part yang tepat, dari piston sampai shockbreaker —
            dalam tampilan yang belum pernah kamu lihat.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold">
              Jelajahi Katalog →
            </Link>
            <a
              href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="btn-ghost rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Konsultasi Part
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3">
            {site.stats.map((s, i) => (
              <Reveal key={s.v} delay={i * 0.08}>
                <div className="chip rounded-2xl p-4">
                  <div className="text-2xl md:text-3xl font-semibold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">{s.k}</div>
                  <div className="text-xs text-white/60 mt-1">{s.v}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <ScrollHint />
      </section>

      {/* BRAND MARQUEE */}
      <section className="relative py-10 border-y border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
        <div className="marquee text-white/60 font-mono text-sm md:text-base">
          {[...brands, ...brands].map((b, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-ember"/> {b}
            </span>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="font-mono text-xs tracking-[0.3em] text-white/50">// KATEGORI</div>
                <h2 className="text-3xl md:text-5xl font-semibold mt-2">Enam dimensi performa.</h2>
              </div>
              <Link to="/products" className="text-sm text-white/70 hover:text-white">Lihat semua →</Link>
            </div>
          </Reveal>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.05}>
                <Link
                  to={`/products#${c.slug}`}
                  className="group relative block chip rounded-2xl p-6 overflow-hidden h-full"
                  style={{ boxShadow: `inset 0 0 0 1px ${c.accent}22` }}
                >
                  <div
                    className="absolute -right-8 -top-8 w-36 h-36 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70"
                    style={{ background: c.accent }}
                  />
                  <div className="text-3xl" style={{ color: c.accent }}>{c.icon}</div>
                  <div className="mt-4 text-xl font-semibold">{c.name}</div>
                  <p className="text-white/60 text-sm mt-1">{c.blurb}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.items.slice(0, 3).map((it) => (
                      <span key={it} className="text-[11px] px-2 py-1 rounded-full border border-white/10 text-white/70">{it}</span>
                    ))}
                  </div>
                  <div className="mt-6 text-xs font-mono text-white/50 group-hover:text-white transition">EXPLORE →</div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <div className="font-mono text-xs tracking-[0.3em] text-white/50">// UNGGULAN</div>
            <h2 className="text-3xl md:text-5xl font-semibold mt-2">Part yang paling dicari minggu ini.</h2>
          </Reveal>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.05}>
                <div className="chip rounded-2xl p-5 relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-white/50">{p.cat}</div>
                      <div className="text-lg font-semibold mt-1 leading-tight">{p.name}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-ember/20 text-ember border border-ember/30">{p.tag}</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between">
                    <div className="text-2xl font-semibold">{p.price}</div>
                    <a
                      href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${p.name}`)}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs font-mono text-plasma hover:underline"
                    >
                      Tanya stok →
                    </a>
                  </div>
                  <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-plasma/20 blur-2xl opacity-0 group-hover:opacity-100 transition" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <div className="font-mono text-xs tracking-[0.3em] text-white/50">// KATA MEREKA</div>
            <h2 className="text-3xl md:text-5xl font-semibold mt-2">Kepercayaan yang terbangun.</h2>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <Reveal key={t.who} delay={i * 0.08}>
                <figure className="chip rounded-2xl p-6 h-full">
                  <blockquote className="text-white/85 leading-relaxed">“{t.say}”</blockquote>
                  <figcaption className="mt-4 text-sm text-white/55 font-mono">— {t.who}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-5xl px-5 md:px-8">
          <Reveal>
            <div className="chip rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ember/10 via-transparent to-plasma/10" />
              <div className="relative">
                <h3 className="text-3xl md:text-5xl font-semibold">Butuh part yang langka?</h3>
                <p className="text-white/70 mt-3 max-w-xl mx-auto">
                  Kirim foto & nomor part ke tim kami. Kami cari, kami stok, kami kirim. Secepat kilat.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <Link to="/contact" className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold">
                    Request Part
                  </Link>
                  <Link to="/products" className="btn-ghost rounded-xl px-5 py-3 text-sm font-semibold">
                    Lihat Katalog
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs font-mono tracking-[0.3em]"
    >
      <div className="flex flex-col items-center gap-2">
        SCROLL
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="w-px h-8 bg-gradient-to-b from-white/80 to-transparent"
        />
      </div>
    </motion.div>
  );
}
