import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { site } from '../data/site';

const links = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="mx-auto max-w-7xl px-5 md:px-8 pt-5">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="chip rounded-2xl px-4 md:px-6 py-3 flex items-center justify-between"
        >
          <Link to="/" className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <div className="text-xs md:text-sm tracking-[0.25em] text-white/70 font-mono">{site.short}</div>
              <div className="text-sm md:text-base font-semibold -mt-0.5">Motorindo Parts</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm transition ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="btn-primary ml-2 px-4 py-2 rounded-xl text-sm font-semibold"
            >
              WhatsApp
            </a>
          </nav>

          <button
            className="md:hidden p-2 -mr-1 text-white/80"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative">
              <span className={`absolute left-0 right-0 h-0.5 bg-white transition ${open ? 'top-2 rotate-45' : 'top-0'}`}/>
              <span className={`absolute left-0 right-0 top-2 h-0.5 bg-white transition ${open ? 'opacity-0' : ''}`}/>
              <span className={`absolute left-0 right-0 h-0.5 bg-white transition ${open ? 'top-2 -rotate-45' : 'top-4'}`}/>
            </div>
          </button>
        </motion.div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden chip mt-2 rounded-2xl p-3 flex flex-col gap-1"
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="btn-primary mt-1 px-4 py-3 rounded-xl text-sm font-semibold text-center"
            >
              Chat WhatsApp
            </a>
          </motion.div>
        )}
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 64 64" className="shrink-0">
      <defs>
        <linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ff5b2e"/>
          <stop offset="1" stopColor="#22d3ee"/>
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#lg)" strokeWidth="2.4" strokeLinejoin="round">
        <rect x="14" y="14" width="26" height="26"/>
        <rect x="24" y="24" width="26" height="26"/>
        <path d="M14 14L24 24M40 14L50 24M14 40L24 50M40 40L50 50"/>
      </g>
    </svg>
  );
}
