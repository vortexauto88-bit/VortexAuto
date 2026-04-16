import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reveal } from '../components/Reveal';
import { WordReveal } from '../components/WordReveal';
import { useMagnetic } from '../hooks/useMagnetic';
import { tiers, site } from '../data/site';

export default function Partnership() {
  const [form, setForm] = useState({
    name: '', address: '', phone: '', npwp: '',
    tier: 'Agen', note: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Halo ${site.short}, saya ingin mendaftar kemitraan.
Nama: ${form.name}
Alamat: ${form.address}
No HP: ${form.phone}
NPWP: ${form.npwp}
Jenjang: ${form.tier}
Catatan: ${form.note}`;
    window.open(`https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <section className="relative pt-36 pb-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <div className="text-[11px] font-mono tracking-[0.25em] text-tron">KEMITRAAN</div>
          <h1 className="display text-5xl md:text-7xl mt-3 max-w-4xl">
            <WordReveal text="Bergabung dengan" />
            <br />
            <WordReveal text="jaringan YSP." delay={0.15} className="text-muted" />
          </h1>
          <p className="mt-6 text-muted max-w-2xl text-lg leading-relaxed">
            Tiga jenjang kemitraan, satu misi: suku cadang asli sampai ke tangan mekanik Indonesia dengan cepat dan pasti.
          </p>
        </Reveal>

        {/* Tiers */}
        <div className="mt-16 grid md:grid-cols-3 gap-4">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <TierCard tier={t} selectTier={(n) => setForm({ ...form, tier: n })} selected={form.tier === t.name} />
            </Reveal>
          ))}
        </div>

        {/* Form */}
        <div className="mt-28 grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Reveal>
              <div className="text-[11px] font-mono tracking-[0.25em] text-tron">DAFTAR</div>
              <h2 className="display text-4xl md:text-5xl mt-3">Isi data, kami kontak.</h2>
              <p className="text-muted mt-5 leading-relaxed">
                Form terkirim lewat WhatsApp. Tim kemitraan kami akan balas dengan info lengkap, penawaran harga, dan jadwal onboarding.
              </p>
              <div className="mt-8 space-y-3 text-sm">
                <Info label="WhatsApp" value={site.whatsapp} />
                <Info label="Email" value={site.email} />
                <Info label="Jam Operasional" value={site.hours} />
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-3">
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              onSubmit={submit}
              className="surface rounded-3xl p-7 md:p-10"
            >
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Nama Lengkap" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nama kamu" required />
                <Field label="No. HP / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="08xxxxxxxxxx" required />
              </div>
              <div className="mt-5">
                <Field label="Alamat Lengkap" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Kota, provinsi" multiline />
              </div>
              <div className="grid md:grid-cols-2 gap-5 mt-5">
                <Field label="NPWP (opsional)" value={form.npwp} onChange={(v) => setForm({ ...form, npwp: v })} placeholder="Nomor NPWP" />
                <div>
                  <label className="text-[11px] font-mono text-dim tracking-[0.15em] uppercase">Jenjang</label>
                  <select
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value })}
                    className="mt-2 w-full bg-black/40 border border-white/[0.10] rounded-xl px-4 py-3 outline-none focus:border-tron/60 transition appearance-none cursor-pointer"
                  >
                    {tiers.map((t) => (
                      <option key={t.name} value={t.name} className="bg-black">{t.name} — {t.scale}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-5">
                <label className="text-[11px] font-mono text-dim tracking-[0.15em] uppercase">Catatan</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={4}
                  placeholder="Rencana wilayah, pengalaman, atau pertanyaan"
                  className="mt-2 w-full bg-black/40 border border-white/[0.10] rounded-xl px-4 py-3 outline-none focus:border-tron/60 transition placeholder:text-dim"
                />
              </div>
              <div className="mt-8">
                <button type="submit" className="btn-primary rounded-full px-6 py-3 text-[14px]">
                  Kirim via WhatsApp →
                </button>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}

function TierCard({
  tier, selectTier, selected,
}: {
  tier: typeof tiers[number];
  selectTier: (name: string) => void;
  selected: boolean;
}) {
  const mag = useMagnetic<HTMLButtonElement>(0.2);
  return (
    <div
      className={`relative rounded-3xl p-8 h-full flex flex-col transition ${
        tier.highlighted
          ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-tron/40 shadow-[0_0_40px_-10px_rgba(125,211,252,0.35)]'
          : 'surface'
      } ${selected ? 'ring-2 ring-tron/50' : ''}`}
    >
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[0.25em] bg-tron text-black px-3 py-1 rounded-full">
          PALING POPULER
        </div>
      )}
      <div className="text-[11px] font-mono text-tron tracking-[0.2em]">{tier.scale.toUpperCase()}</div>
      <div className="display text-3xl mt-3">{tier.name}</div>
      <p className="text-muted text-sm mt-2">{tier.tagline}</p>
      <div className="mt-6 text-3xl font-medium tracking-tight">{tier.price}</div>
      <ul className="mt-6 space-y-3 text-sm text-muted flex-1">
        {tier.perks.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span className="mt-[7px] w-1 h-1 rounded-full bg-tron shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <button
        ref={mag}
        type="button"
        onClick={() => {
          selectTier(tier.name);
          document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className={`mt-8 rounded-full px-5 py-3 text-[14px] will-change-transform ${
          tier.highlighted ? 'btn-primary' : 'btn-ghost'
        }`}
      >
        Pilih {tier.name}
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, required, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-mono text-dim tracking-[0.15em] uppercase">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={2}
          className="mt-2 w-full bg-black/40 border border-white/[0.10] rounded-xl px-4 py-3 outline-none focus:border-tron/60 transition placeholder:text-dim"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="mt-2 w-full bg-black/40 border border-white/[0.10] rounded-xl px-4 py-3 outline-none focus:border-tron/60 transition placeholder:text-dim"
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/[0.06] py-2">
      <span className="text-dim">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
