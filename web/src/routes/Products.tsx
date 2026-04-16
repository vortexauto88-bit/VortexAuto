import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '../components/Reveal';
import { categories, site } from '../data/site';

export default function Products() {
  const [active, setActive] = useState<string>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const list = categories
      .filter((c) => active === 'all' || c.slug === active)
      .flatMap((c) => c.items.map((it) => ({ name: it, cat: c.name, slug: c.slug, accent: c.accent })));
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  }, [active, q]);

  return (
    <section className="relative pt-32 pb-20 min-h-screen">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <div className="font-mono text-xs tracking-[0.3em] text-white/50">// KATALOG</div>
          <h1 className="text-4xl md:text-6xl font-semibold mt-2 tracking-tight">
            Navigasi <span className="bg-gradient-to-r from-ember to-plasma bg-clip-text text-transparent">ruang suku cadang</span>.
          </h1>
          <p className="text-white/65 mt-4 max-w-2xl">
            Pilih kategori, sesuaikan part, chat langsung ke tim kami. Stok
            diperbarui tiap hari.
          </p>
        </Reveal>

        {/* Search */}
        <div className="mt-10 chip rounded-2xl p-3 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2 text-white/60"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari part, mis. 'piston', 'kampas rem', 'busi'..."
            className="flex-1 bg-transparent outline-none placeholder:text-white/40 text-sm md:text-base"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-xs text-white/50 hover:text-white px-3">clear</button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <FilterChip label="Semua" active={active === 'all'} onClick={() => setActive('all')} />
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              label={c.name}
              color={c.accent}
              active={active === c.slug}
              onClick={() => setActive(c.slug)}
            />
          ))}
        </div>

        {/* Category sections */}
        {active === 'all' ? (
          <div className="mt-12 space-y-20">
            {categories.map((c) => (
              <div key={c.slug} id={c.slug} className="scroll-mt-28">
                <Reveal>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl" style={{ color: c.accent }}>{c.icon}</div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-semibold">{c.name}</h2>
                      <p className="text-white/60 text-sm">{c.blurb}</p>
                    </div>
                  </div>
                </Reveal>
                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {c.items
                    .filter((it) => !q || it.toLowerCase().includes(q.toLowerCase()))
                    .map((it, i) => (
                      <Reveal key={it} delay={i * 0.04}>
                        <PartCard name={it} cat={c.name} accent={c.accent} />
                      </Reveal>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={active + q}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {filtered.map((p, i) => (
                <PartCard key={`${p.slug}-${p.name}-${i}`} name={p.name} cat={p.cat} accent={p.accent} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-white/50">
                  Tidak ada part yang cocok. Coba kata kunci lain atau hubungi kami langsung.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  label, active, onClick, color,
}: { label: string; active?: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        active
          ? 'bg-white text-black border-white'
          : 'border-white/15 text-white/75 hover:text-white hover:border-white/40'
      }`}
      style={active && color ? { background: color, borderColor: color, color: '#0a0a0a' } : undefined}
    >
      {label}
    </button>
  );
}

function PartCard({ name, cat, accent }: { name: string; cat: string; accent: string }) {
  const msg = encodeURIComponent(`Halo YSP, saya mau tanya stok & harga: ${name} (${cat})`);
  return (
    <div
      className="group chip rounded-2xl p-5 relative overflow-hidden h-full"
      style={{ boxShadow: `inset 0 0 0 1px ${accent}22` }}
    >
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-2xl opacity-30 group-hover:opacity-70 transition" style={{ background: accent }} />
      <div className="text-[10px] font-mono text-white/50">{cat.toUpperCase()}</div>
      <div className="mt-1 text-lg font-semibold leading-tight">{name}</div>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-white/60 font-mono">STOK · tanyakan</span>
        <a
          href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${msg}`}
          target="_blank" rel="noreferrer"
          className="text-xs font-mono hover:underline"
          style={{ color: accent }}
        >
          Tanya →
        </a>
      </div>
    </div>
  );
}
