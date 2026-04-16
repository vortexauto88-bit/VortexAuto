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
    <section className="relative pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <Reveal>
            <div className="font-mono text-xs tracking-[0.3em] text-white/50">// KONTAK</div>
            <h1 className="mt-2 text-4xl md:text-6xl font-semibold tracking-tight">
              Kirim <span className="bg-gradient-to-r from-ember to-amber bg-clip-text text-transparent">sinyal</span>.
            </h1>
            <p className="text-white/70 mt-4">
              Paling cepat: chat WhatsApp. Sebutkan nomor part atau foto — tim kami
              akan balas dengan stok dan harga dalam hitungan menit.
            </p>
          </Reveal>

          <div className="mt-8 space-y-3">
            <ContactRow label="WhatsApp" value={site.whatsapp} href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`} />
            <ContactRow label="Telepon" value={site.phone} href={`tel:${site.phone.replace(/\s/g, '')}`} />
            <ContactRow label="Email" value={site.email} href={`mailto:${site.email}`} />
            <ContactRow label="Alamat" value={site.address} />
            <ContactRow label="Jam Operasional" value={site.hours} />
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            onSubmit={(e) => {
              e.preventDefault();
              window.open(waLink(), '_blank');
            }}
            className="chip rounded-3xl p-6 md:p-8"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nama" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nama kamu" />
              <Field label="No. HP / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0812-..." />
            </div>
            <div className="mt-4">
              <Field label="Part yang Dicari" value={form.part} onChange={(v) => setForm({ ...form, part: v })} placeholder="mis. Piston Honda Beat 52mm" />
            </div>
            <div className="mt-4">
              <label className="text-xs font-mono text-white/60">Catatan</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={4}
                placeholder="Merk, tipe motor/mobil, tahun, atau info tambahan"
                className="mt-1.5 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-ember transition"
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold">
                Kirim via WhatsApp →
              </button>
              <a href={`mailto:${site.email}`} className="btn-ghost rounded-xl px-5 py-3 text-sm font-semibold">
                Kirim Email
              </a>
            </div>
            <p className="mt-4 text-xs text-white/50">
              Dengan mengirim, kamu setuju informasi di atas digunakan untuk merespon permintaan part.
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
      <label className="text-xs font-mono text-white/60">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-ember transition"
      />
    </div>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="chip rounded-2xl p-4 flex items-center justify-between hover:border-white/30 transition">
      <div>
        <div className="text-xs font-mono text-white/55">{label}</div>
        <div className="text-white font-medium mt-0.5">{value}</div>
      </div>
      {href && <div className="text-ember text-sm">→</div>}
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noreferrer">{inner}</a> : inner;
}
