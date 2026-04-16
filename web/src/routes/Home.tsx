import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { useRef } from 'react';
import { Reveal } from '../components/Reveal';
import { WordReveal } from '../components/WordReveal';
import { ClutchSpider } from '../components/PartVisual';
import { ProductImage } from '../components/ProductImage';
import { useMagnetic } from '../hooks/useMagnetic';
import { site, brands, products, featureHighlights, tiers, testimonials } from '../data/site';

export default function Home() {
  return (
    <>
      <Hero />
      <BrandStrip />
      <FeatureShowcase />
      <ProductsBento />
      <PartnershipTiers />
      <Testimonials />
      <FinalCTA />
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   HERO — scroll-driven. Product scales, rotates, and fades
   as you scroll. Text reveals word-by-word. Magnetic CTAs.
   ────────────────────────────────────────────────────────── */
function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const s = useSpring(scrollYProgress, { stiffness: 90, damping: 20, mass: 0.4 });

  const scale = useTransform(s, [0, 1], [1, 1.35]);
  const rotate = useTransform(s, [0, 1], [0, 75]);
  const opacity = useTransform(s, [0, 0.85], [1, 0]);
  const y = useTransform(s, [0, 1], ['0%', '-20%']);
  const textY = useTransform(s, [0, 1], ['0%', '-35%']);
  const textOpacity = useTransform(s, [0, 0.6], [1, 0]);

  const magA = useMagnetic<HTMLAnchorElement>(0.35);
  const magB = useMagnetic<HTMLAnchorElement>(0.25);

  return (
    <section ref={ref} className="relative min-h-[110svh]">
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="mx-auto max-w-6xl px-5 md:px-8 pt-32 md:pt-40 pb-10 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono tracking-[0.2em] text-tron border border-white/[0.08]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-tron shadow-[0_0_8px_#7dd3fc]"/>
          YAMAHA · HONDA · GENUINE
        </motion.div>

        <h1 className="display mt-6 text-[clamp(2.75rem,8vw,7rem)] max-w-5xl">
          <WordReveal as="span" text="Kampas ganda," className="block" />
          <WordReveal as="span" text="kampas rem," delay={0.15} className="block text-muted" />
          <WordReveal as="span" text="dibuat presisi." delay={0.3} className="block" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mt-8 max-w-xl text-muted text-lg leading-relaxed"
        >
          {site.subTagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            ref={magA}
            href="/products"
            className="btn-primary rounded-full px-6 py-3 text-[14px] will-change-transform"
          >
            Lihat katalog
          </a>
          <a
            ref={magB}
            href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
            target="_blank" rel="noreferrer"
            className="btn-ghost rounded-full px-6 py-3 text-[14px] will-change-transform"
          >
            Konsultasi part →
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll-driven product visual */}
      <motion.div
        style={{ scale, rotate, opacity, y }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="absolute top-[55%] right-[-10%] md:right-[5%] w-[90vw] md:w-[55vw] max-w-[720px] aspect-square">
          <ClutchSpider className="w-full h-full drop-shadow-[0_40px_60px_rgba(125,211,252,0.15)]" />
        </div>
      </motion.div>

      <ScrollHint />
    </section>
  );
}

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 0.6 }}
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

/* ──────────────────────────────────────────────────────────
   BRAND STRIP
   ────────────────────────────────────────────────────────── */
function BrandStrip() {
  return (
    <section className="relative py-10 border-y border-white/[0.06] overflow-hidden">
      <div className="marquee text-dim text-xs md:text-sm">
        {[...brands, ...brands].map((b, i) => (
          <span key={i} className="whitespace-nowrap font-medium tracking-[0.2em]">{b}</span>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   PINNED FEATURE SHOWCASE — Apple-style. A large product
   stays sticky while feature callouts scroll through it.
   ────────────────────────────────────────────────────────── */
function FeatureShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  // Product rotates + scales subtly through the pinned section
  const rotate = useTransform(scrollYProgress, [0, 1], [-20, 40]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 0.95]);

  // Active step highlights (0,1,2)
  const step = useTransform(scrollYProgress, (v) => Math.min(featureHighlights.length - 1, Math.floor(v * featureHighlights.length)));

  return (
    <section ref={ref} className="relative" style={{ height: `${featureHighlights.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div className="mx-auto max-w-6xl w-full px-5 md:px-8 grid md:grid-cols-2 gap-10 items-center">
          {/* Sticky product */}
          <motion.div style={{ rotate, scale }} className="relative aspect-square max-w-[520px] mx-auto w-full will-change-transform">
            <ClutchSpider className="w-full h-full" />
          </motion.div>

          {/* Steps */}
          <div className="relative">
            {featureHighlights.map((f, i) => (
              <FeatureStep key={f.eyebrow} index={i} step={step} {...f} />
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
          {featureHighlights.map((_, i) => (
            <Dot key={i} index={i} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureStep({
  index, step, eyebrow, title, body,
}: {
  index: number;
  step: MotionValue<number>;
  eyebrow: string; title: string; body: string;
}) {
  // Absolutely stacked; fade/translate when active
  const active = useTransform(step, (v) => (v === index ? 1 : 0));
  const opacity = useSpring(active, { stiffness: 120, damping: 20 });
  const y = useTransform(opacity, [0, 1], [30, 0]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <div className="text-[11px] font-mono text-tron tracking-[0.25em]">{eyebrow}</div>
      <h3 className="display text-3xl md:text-5xl mt-3">{title}</h3>
      <p className="text-muted mt-5 max-w-md text-lg leading-relaxed">{body}</p>
    </motion.div>
  );
}

function Dot({ index, step }: { index: number; step: MotionValue<number> }) {
  const opacity = useTransform(step, (v) => (v === index ? 1 : 0.3));
  return <motion.div style={{ opacity }} className="w-6 h-1 rounded-full bg-text transition-colors" />;
}

/* ──────────────────────────────────────────────────────────
   PRODUCTS BENTO — real catalog, varied card sizes
   ────────────────────────────────────────────────────────── */
function ProductsBento() {
  const picks = products.slice(0, 8);
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-xl">
              <div className="text-[11px] font-mono tracking-[0.25em] text-tron">KATALOG</div>
              <h2 className="display text-4xl md:text-6xl mt-3">Dari Jupiter MX sampai Beat Esp.</h2>
              <p className="text-muted mt-4 text-lg">Part yang paling dicari bengkel mitra kami.</p>
            </div>
            <Link to="/products" className="text-sm link-tron">Lihat semua {products.length} part →</Link>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-3">
          {picks.map((p, i) => {
            const isLarge = i === 0 || i === 3;
            return (
              <Reveal key={p.code + p.model} delay={i * 0.04}>
                <BentoCard product={p} large={isLarge} />
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BentoCard({ product, large }: { product: typeof products[number]; large?: boolean }) {
  const msg = encodeURIComponent(`Halo YSP, saya tanya stok: ${product.name} ${product.model} (${product.code})`);
  return (
    <a
      href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${msg}`}
      target="_blank" rel="noreferrer"
      className={`group surface surface-hover rounded-2xl p-5 md:p-6 relative overflow-hidden flex flex-col justify-between ${
        large ? 'col-span-2 row-span-2' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-mono text-dim tracking-[0.2em]">{product.motor.toUpperCase()}</div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.12] text-muted">
          {product.code}
        </span>
      </div>

      {/* Art */}
      <ProductImage
        product={product}
        className={`absolute ${large ? 'right-[-10%] bottom-[-15%] w-[70%] aspect-square' : 'right-[-15%] bottom-[-25%] w-[85%] aspect-square'} opacity-80 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6`}
      />

      <div className="relative z-10">
        <div className="text-[11px] text-dim">{product.name}</div>
        <div className={`font-medium tracking-tight mt-1 ${large ? 'text-2xl md:text-3xl' : 'text-[15px] md:text-lg'}`}>
          {product.model}
        </div>
        <div className="mt-3 text-[11px] link-tron inline-block">Tanya stok →</div>
      </div>
    </a>
  );
}

/* ──────────────────────────────────────────────────────────
   PARTNERSHIP TIERS
   ────────────────────────────────────────────────────────── */
function PartnershipTiers() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono tracking-[0.25em] text-tron">KEMITRAAN</div>
            <h2 className="display text-4xl md:text-6xl mt-3">Tumbuh bareng YSP.</h2>
            <p className="text-muted mt-4 text-lg">
              Tiga jenjang kemitraan. Mulai dari grosiran, agen wilayah, sampai distributor regional.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <TierCard {...t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({
  name, scale, price, tagline, perks, highlighted, cta,
}: (typeof tiers)[number]) {
  const mag = useMagnetic<HTMLAnchorElement>(0.2);
  const message = encodeURIComponent(`Halo YSP, saya tertarik menjadi ${name}. Mohon info lebih lanjut.`);
  return (
    <div
      className={`relative rounded-3xl p-8 h-full flex flex-col transition ${
        highlighted
          ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-tron/40 shadow-[0_0_40px_-10px_rgba(125,211,252,0.35)]'
          : 'surface'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[0.25em] bg-tron text-black px-3 py-1 rounded-full">
          PALING POPULER
        </div>
      )}
      <div className="text-[11px] font-mono text-tron tracking-[0.2em]">{scale.toUpperCase()}</div>
      <div className="display text-3xl mt-3">{name}</div>
      <p className="text-muted text-sm mt-2">{tagline}</p>
      <div className="mt-6 text-3xl font-medium tracking-tight">{price}</div>
      <ul className="mt-6 space-y-3 text-sm text-muted flex-1">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span className="mt-[7px] w-1 h-1 rounded-full bg-tron shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <a
        ref={mag}
        href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${message}`}
        target="_blank" rel="noreferrer"
        className={`mt-8 block text-center rounded-full px-5 py-3 text-[14px] will-change-transform ${
          highlighted ? 'btn-primary' : 'btn-ghost'
        }`}
      >
        {cta}
      </a>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   TESTIMONIALS
   ────────────────────────────────────────────────────────── */
function Testimonials() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="text-[11px] font-mono tracking-[0.25em] text-tron">KATA MEREKA</div>
          <h2 className="display text-4xl md:text-6xl mt-3">Dipercaya bengkel & rider.</h2>
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.who} delay={i * 0.08}>
              <figure className="surface rounded-2xl p-7 h-full">
                <div className="text-tron text-2xl leading-none">"</div>
                <blockquote className="text-text leading-relaxed text-[17px] mt-2">{t.say}</blockquote>
                <figcaption className="mt-6 text-sm text-dim">— {t.who}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   FINAL CTA
   ────────────────────────────────────────────────────────── */
function FinalCTA() {
  const mag = useMagnetic<HTMLAnchorElement>(0.3);
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <Reveal>
          <div className="rounded-3xl p-12 md:p-20 text-center relative overflow-hidden border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tron/60 to-transparent"/>
            <h3 className="display text-4xl md:text-6xl">Siap pesan?</h3>
            <p className="text-muted mt-4 max-w-xl mx-auto text-lg">
              Chat WhatsApp kami. Sebutkan tipe motor & nomor part, balasan datang dalam hitungan menit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <a
                ref={mag}
                href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer"
                className="btn-primary rounded-full px-6 py-3 text-[14px] will-change-transform"
              >
                Chat WhatsApp
              </a>
              <Link to="/products" className="btn-ghost rounded-full px-6 py-3 text-[14px]">
                Lihat katalog
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
