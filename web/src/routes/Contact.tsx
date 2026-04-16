import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reveal } from '../components/Reveal';
import { site } from '../data/site';

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', part: '', note: '' });
  const waLink = () => {
    const msg = `Halo ${site.short},
Nama: ${form.name}
No HP: ${form.phone}
Part yg dicari: ${form.part}
Catatan: ${form.note}`;
    return `https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <section className="relative pt-36 pb-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8 grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2">
          <Reveal>
            <div className="text-[11px] font-mono tracking-[0.25em] text-tron">CONTACT</div>
            <h1 className="display mt-3 text-5xl md:text-7xl">
              Send a <span className="text-muted">signal.</span>
            </h1>
            <p className="text-muted mt-5 text-lg leading-relaxed">
              Paling cepat: chat WhatsApp. Sebutkan nomor part atau foto — tim kami
              akan balas dengan stok dan harga dalam hitungan menit.
            </p>
          </Reveal>

          <div className="mt-8 space-y-3">
            <ContactRow label="WhatsApp" value={site.whatsapp} href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`} />
            <ContactRow label="Phone" value={site.phone} href={`tel:${site.phone.replace(/\s/g, '')}`} />
            <ContactRow label="Email" value={site.email} href={`mailto:${site.email}`} />
            <ContactRow label="Address" value={site.address} />
            <ContactRow label="Hours" value={site.hours} />
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onSubmit={(e) => {
              e.preventDefault();
              window.open(waLink(), '_blank');
            }}
            className="surface rounded-3xl p-7 md:p-10"
          >
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Your name" />
              <Field label="Phone / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0812-..." />
            </div>
            <div className="mt-5">
              <Field label="Part you are looking for" value={form.part} onChange={(v) => setForm({ ...form, part: v })} placeholder="e.g. Piston Honda Beat 52mm" />
            </div>
            <div className="mt-5">
              <label className="text-[11px] font-mono text-dim tracking-[0.15em]">NOTES</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={4}
                placeholder="Merk, tipe motor/mobil, tahun, atau info tambahan"
                className="mt-2 w-full bg-black/40 border border-white/[0.10] rounded-xl px-4 py-3 outline-none focus:border-tron/60 transition placeholder:text-dim"
              />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="submit" className="btn-primary rounded-full px-5 py-2.5 text-[14px]">
                Send via WhatsApp →
              </button>
              <a href={`mailto:${site.email}`} className="btn-ghost rounded-full px-5 py-2.5 text-[14px]">
                Send email
              </a>
            </div>
            <p className="mt-5 text-xs text-dim">
              By submitting, you agree the info above will be used to respond to your inquiry.
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-mono text-dim tracking-[0.15em]">{label.toUpperCase()}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-black/40 border border-white/[0.10] rounded-xl px-4 py-3 outline-none focus:border-tron/60 transition placeholder:text-dim"
      />
    </div>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="surface surface-hover rounded-2xl p-5 flex items-center justify-between">
      <div>
        <div className="text-[10px] font-mono text-dim tracking-[0.2em]">{label.toUpperCase()}</div>
        <div className="text-text mt-1">{value}</div>
      </div>
      {href && <div className="text-tron text-sm">→</div>}
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer">{inner}</a> : inner;
}
