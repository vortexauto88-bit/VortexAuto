import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '../components/Reveal';
import { WordReveal } from '../components/WordReveal';
import { ClutchSpider, BrakeShoe } from '../components/PartVisual';
import { products, motors, categories, site, Motor } from '../data/site';

type MotorFilter = 'all' | Motor;
type CatFilter = 'all' | 'kampas-ganda' | 'kampas-rem';

export default function Products() {
  const [motor, setMotor] = useState<MotorFilter>('all');
  const [cat, setCat] = useState<CatFilter>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (motor !== 'all' && p.motor !== motor) return false;
      if (cat !== 'all' && p.category !== cat) return false;
      if (q) {
        const t = q.toLowerCase();
        return (
          p.model.toLowerCase().includes(t) ||
          p.code.toLowerCase().includes(t) ||
          p.name.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [motor, cat, q]);

  return (
    <section className="relative pt-36 pb-20 min-h-screen">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="text-[11px] font-mono tracking-[0.25em] text-tron">KATALOG · {products.length} PART</div>
          <h1 className="display text-5xl md:text-7xl mt-3">
            <WordReveal text="Cari partmu." />
            <br />
            <WordReveal text="Pesan dalam hitungan menit." delay={0.2} className="text-muted" />
          </h1>
        </Reveal>

        {/* Search bar */}
        <div className="mt-12 surface rounded-full px-4 py-2 flex items-center gap-3 focus-within:border-tron/50 transition">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2 text-dim"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari part — Nmax, Beat Esp, 1S7, Jupiter MX…"
            className="flex-1 bg-transparent outline-none placeholder:text-dim text-[15px] py-2"
          />
          {q && <button onClick={() => setQ('')} className="text-xs text-dim hover:text-text px-3">Clear</button>}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <FilterSection label="Motor">
            <Chip active={motor === 'all'} onClick={() => setMotor('all')}>Semua</Chip>
            {motors.map((m) => (
              <Chip key={m.name} active={motor === m.name} onClick={() => setMotor(m.name)}>
                {m.name} <span className="text-dim ml-1">{m.count}</span>
              </Chip>
            ))}
          </FilterSection>
          <FilterSection label="Kategori">
            <Chip active={cat === 'all'} onClick={() => setCat('all')}>Semua</Chip>
            {categories.map((c) => (
              <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
                {c.name}
              </Chip>
            ))}
          </FilterSection>
        </div>

        {/* Result count */}
        <div className="mt-8 text-sm text-dim font-mono">
          {filtered.length} hasil {q && <span>untuk "<span className="text-text">{q}</span>"</span>}
        </div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${motor}-${cat}-${q}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {filtered.map((p, i) => (
              <ProductCard key={p.code + p.model} product={p} index={i} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-24 text-muted">
                Tidak ada part cocok. Coba cari dengan kata lain atau{' '}
                <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="link-tron">chat kami langsung</a>.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-mono text-dim tracking-[0.2em] uppercase">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active, onClick, children,
}: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-[13px] border transition ${
        active
          ? 'bg-text text-black border-text'
          : 'border-white/[0.12] text-muted hover:text-text hover:border-white/30'
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({
  product, index,
}: { product: typeof products[number]; index: number }) {
  const msg = encodeURIComponent(`Halo YSP, saya tanya stok & harga:\n${product.name} ${product.model} (${product.code})`);
  return (
    <motion.a
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.4) }}
      href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${msg}`}
      target="_blank" rel="noreferrer"
      className="group surface surface-hover rounded-2xl p-5 relative overflow-hidden block h-full"
    >
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-mono text-dim tracking-[0.2em]">{product.motor.toUpperCase()}</div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.12] text-muted">
          {product.code}
        </span>
      </div>

      {/* Art — scales on hover */}
      <div className="relative aspect-[4/3] my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
          {product.category === 'kampas-ganda' ? (
            <ClutchSpider className="w-[80%] h-[80%]" />
          ) : (
            <BrakeShoe className="w-[90%] h-[90%]" />
          )}
        </div>
      </div>

      <div>
        <div className="text-[11px] text-dim">{product.name}</div>
        <div className="text-[16px] font-medium tracking-tight mt-1">{product.model}</div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-dim">Stok · tanyakan</span>
          <span className="text-[12px] link-tron">Tanya →</span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-tron/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
    </motion.a>
  );
}
