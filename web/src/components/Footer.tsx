import { site } from '../data/site';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] mt-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="text-[15px] font-medium">{site.brand}</div>
          <p className="text-muted mt-2 max-w-sm text-sm leading-relaxed">{site.subTagline}</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-dim mb-4">Menu</div>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link className="hover:text-text transition" to="/">Home</Link></li>
            <li><Link className="hover:text-text transition" to="/products">Products</Link></li>
            <li><Link className="hover:text-text transition" to="/about">About</Link></li>
            <li><Link className="hover:text-text transition" to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-dim mb-4">Contact</div>
          <ul className="space-y-2 text-sm text-muted">
            <li>{site.phone}</li>
            <li>{site.email}</li>
            <li>{site.address}</li>
            <li>{site.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-5 text-xs text-dim flex flex-col md:flex-row justify-between gap-2">
          <div>© {new Date().getFullYear()} {site.brand}. All rights reserved.</div>
          <div className="font-mono">{site.site}</div>
        </div>
      </div>
    </footer>
  );
}
