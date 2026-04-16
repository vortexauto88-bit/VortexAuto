import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Reveal } from '../components/Reveal';
import { site, brands, featured, categories, testimonials } from '../data/site';

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-center">
        <div className="mx-auto max-w-6xl px-5 md:px-8 pt-32 pb-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono tracking-[0.2em] text-tron border border-white/[0.08]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tron shadow-[0_0_8px_#7dd3fc]"/>
            NEW · 4D CATALOG
          </motion.div>

          <h1 className="display mt-6 text-[clamp(2.75rem,7.5vw,6.5rem)]">
            Spare parts.
            <br />
            <span className="text-muted">Engineered for precision.</span>
          </h1>

          <p className="mt-7 max-w-xl text-muted text-lg leading-relaxed">
            {site.brand} menghadirkan suku cadang motor & mobil dengan visualisasi
            empat dimensi. Temukan part yang tepat — dari piston sampai
            shockbreaker — dalam pengalaman yang belum pernah kamu lihat.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/products" className="btn-primary rounded-full px-5 py-2.5 text-[14px]">
              Explore catalog
            </Link>
            <a
              href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="btn-ghost rounded-full px-5 py-2.5 text-[14px]"
            >
              Talk to an expert →
            </a>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
            {site.stats.map((s, i) => (
              <Reveal key={s.v} delay={i * 0.06}>
                <div className="bg-black/70 p-6 h-full">
                  <div className="display text-3xl md:text-4xl">{s.k}</div>
                  <div className="text-xs text-muted mt-2">{s.v}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <ScrollHint />
      </section>

      {/* BRAND MARQUEE */}
      <section className="relative py-8 border-y border-white/[0.06] overflow-hidden">
        <div className="marquee text-dim text-sm">
          {[...brands, ...brands].map((b, i) => (
            <span key={i} className="whitespace-nowrap font-medium tracking-[0.15em]">{b}</span>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="relative py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <div className="max-w-2xl">
              <div className="text-[11px] font-mono tracking-[0.25em] text-tron">CATEGORIES</div>
              <h2 className="display text-4xl md:text-6xl mt-3">Six dimensions of performance.</h2>
              <p className="text-muted mt-4 text-lg">
                Kategori yang tersusun rapi — setiap part dipilih untuk daya tahan di jalanan Indonesia.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.05}>
                <Link
                  to={`/products#${c.slug}`}
                  className="group surface surface-hover rounded-2xl p-7 block h-full"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-[11px] font-mono text-tron tracking-[0.2em]">0{i + 1}</div>
                    <div className="text-text text-2xl leading-none">{c.icon}</div>
                  </div>
                  <div className="mt-8 text-xl font-medium tracking-tight">{c.name}</div>
                  <p className="text-muted text-sm mt-2 leading-relaxed">{c.blurb}</p>
                  <div className="mt-6 flex items-center gap-2 text-[12px] text-muted group-hover:text-text transition">
                    <span>View parts</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <div className="flex items-end justify-between flex-wrap gap-6">
              <div>
                <div className="text-[11px] font-mono tracking-[0.25em] text-tron">FEATURED</div>
                <h2 className="display text-4xl md:text-6xl mt-3">This week's picks.</h2>
              </div>
              <Link to="/products" className="text-sm link-tron">See all</Link>
            </div>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.05}>
                <div className="surface surface-hover rounded-2xl p-6 h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-dim tracking-[0.2em]">{p.cat.toUpperCase()}</div>
                      <div className="text-[17px] font-medium mt-2 leading-tight">{p.name}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-tron/30 text-tron">{p.tag}</span>
                  </div>
                  <div className="mt-10 flex items-end justify-between">
                    <div className="text-2xl font-medium">{p.price}</div>
                    <a
                      href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${p.name}`)}`}
                      target="_blank" rel="noreferrer"
                      className="text-[12px] link-tron"
                    >
                      Inquire →
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <div className="text-[11px] font-mono tracking-[0.25em] text-tron">CUSTOMERS</div>
            <h2 className="display text-4xl md:text-6xl mt-3">Built on trust.</h2>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <Reveal key={t.who} delay={i * 0.08}>
                <figure className="surface rounded-2xl p-7 h-full">
                  <blockquote className="text-text leading-relaxed text-[17px]">“{t.say}”</blockquote>
                  <figcaption className="mt-6 text-sm text-dim">— {t.who}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <Reveal>
            <div className="rounded-3xl p-12 md:p-20 text-center relative overflow-hidden border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tron/60 to-transparent"/>
              <h3 className="display text-4xl md:text-6xl">Need something rare?</h3>
              <p className="text-muted mt-4 max-w-xl mx-auto text-lg">
                Kirim foto & nomor part ke tim kami. Kami cari, stok, dan kirim.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link to="/contact" className="btn-primary rounded-full px-5 py-2.5 text-[14px]">
                  Request a part
                </Link>
                <Link to="/products" className="btn-ghost rounded-full px-5 py-2.5 text-[14px]">
                  View catalog
                </Link>
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
      transition={{ delay: 1.0, duration: 0.6 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 text-dim text-[10px] font-mono tracking-[0.3em]"
    >
      <div className="flex flex-col items-center gap-2">
        SCROLL
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-px h-6 bg-gradient-to-b from-text/60 to-transparent"
        />
      </div>
    </motion.div>
  );
}
