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
      .flatMap((c) => c.items.map((it) => ({ name: it, cat: c.name, slug: c.slug })));
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  }, [active, q]);

  return (
    <section className="relative pt-36 pb-20 min-h-screen">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="text-[11px] font-mono tracking-[0.25em] text-tron">CATALOG</div>
          <h1 className="display text-5xl md:text-7xl mt-3">
            Navigate the <span className="text-muted">parts space.</span>
          </h1>
          <p className="text-muted mt-5 max-w-xl text-lg">
            Pilih kategori, sesuaikan part, chat langsung ke tim kami. Stok diperbarui tiap hari.
          </p>
        </Reveal>

        {/* Search */}
        <div className="mt-12 surface rounded-full px-4 py-2 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2 text-dim"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search parts — piston, kampas rem, busi…"
            className="flex-1 bg-transparent outline-none placeholder:text-dim text-[15px] py-2"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-xs text-dim hover:text-text px-3">Clear</button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-2">
          <FilterChip label="All" active={active === 'all'} onClick={() => setActive('all')} />
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              label={c.name}
              active={active === c.slug}
              onClick={() => setActive(c.slug)}
            />
          ))}
        </div>

        {active === 'all' ? (
          <div className="mt-16 space-y-20">
            {categories.map((c) => (
              <div key={c.slug} id={c.slug} className="scroll-mt-28">
                <Reveal>
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-[11px] font-mono text-tron tracking-[0.2em]">{c.icon}  {c.name.toUpperCase()}</div>
                      <h2 className="display text-3xl md:text-4xl mt-2">{c.name}</h2>
                      <p className="text-muted text-sm mt-1 max-w-md">{c.blurb}</p>
                    </div>
                  </div>
                </Reveal>
                <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {c.items
                    .filter((it) => !q || it.toLowerCase().includes(q.toLowerCase()))
                    .map((it, i) => (
                      <Reveal key={it} delay={i * 0.04}>
                        <PartCard name={it} cat={c.name} />
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
                <PartCard key={`${p.slug}-${p.name}-${i}`} name={p.name} cat={p.cat} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-20 text-muted">
                  No parts match your search. Try another keyword or contact us directly.
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
  label, active, onClick,
}: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[13px] border transition ${
        active
          ? 'bg-text text-black border-text'
          : 'border-white/[0.12] text-muted hover:text-text hover:border-white/30'
      }`}
    >
      {label}
    </button>
  );
}

function PartCard({ name, cat }: { name: string; cat: string }) {
  const msg = encodeURIComponent(`Halo YSP, saya mau tanya stok & harga: ${name} (${cat})`);
  return (
    <div className="group surface surface-hover rounded-2xl p-6 h-full relative overflow-hidden">
      <div className="text-[10px] font-mono text-dim tracking-[0.2em]">{cat.toUpperCase()}</div>
      <div className="mt-2 text-[17px] font-medium leading-tight">{name}</div>
      <div className="mt-8 flex items-center justify-between">
        <span className="text-xs text-dim">Stock · ask us</span>
        <a
          href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${msg}`}
          target="_blank" rel="noreferrer"
          className="text-[12px] link-tron"
        >
          Inquire →
        </a>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-tron/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
    </div>
  );
}
