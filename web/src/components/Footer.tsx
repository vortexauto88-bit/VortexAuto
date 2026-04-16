import { site } from '../data/site';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="text-xs font-mono tracking-[0.3em] text-white/50">{site.short}</div>
          <div className="text-2xl font-semibold mt-1">{site.brand}</div>
          <p className="text-white/60 mt-3 max-w-sm">{site.subTagline}</p>
        </div>
        <div>
          <div className="text-xs uppercase text-white/50 font-mono mb-3">Menu</div>
          <ul className="space-y-2 text-white/80">
            <li><Link className="hover:text-ember" to="/">Home</Link></li>
            <li><Link className="hover:text-ember" to="/products">Products</Link></li>
            <li><Link className="hover:text-ember" to="/about">About</Link></li>
            <li><Link className="hover:text-ember" to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase text-white/50 font-mono mb-3">Hubungi</div>
          <ul className="space-y-2 text-white/80 text-sm">
            <li>{site.phone}</li>
            <li>{site.email}</li>
            <li>{site.address}</li>
            <li>{site.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-5 text-xs text-white/40 flex flex-col md:flex-row justify-between gap-2">
          <div>© {new Date().getFullYear()} {site.brand}. All rights reserved.</div>
          <div className="font-mono">v4D · built for {site.site}</div>
        </div>
      </div>
    </footer>
  );
}
