import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { site } from '../data/site';

const links = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Katalog' },
  { to: '/partnership', label: 'Kemitraan' },
  { to: '/about', label: 'Tentang' },
  { to: '/contact', label: 'Kontak' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`transition-colors duration-300 ${
          scrolled
            ? 'bg-black/60 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-6xl px-5 md:px-8 h-14 md:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[15px] font-medium tracking-tight">{site.brand}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-[13px] transition ${
                    isActive
                      ? 'text-text'
                      : 'text-muted hover:text-text'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noreferrer"
              className="btn-primary ml-3 px-4 py-1.5 rounded-full text-[13px]"
            >
              Contact sales
            </a>
          </nav>

          <button
            className="md:hidden p-2 -mr-2 text-text"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 relative">
              <span className={`absolute left-0 right-0 h-[1.5px] bg-text transition-all ${open ? 'top-1.5 rotate-45' : 'top-0'}`}/>
              <span className={`absolute left-0 right-0 top-1.5 h-[1.5px] bg-text transition-opacity ${open ? 'opacity-0' : ''}`}/>
              <span className={`absolute left-0 right-0 h-[1.5px] bg-text transition-all ${open ? 'top-1.5 -rotate-45' : 'top-3'}`}/>
            </div>
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/[0.06] bg-black/80 backdrop-blur-xl"
          >
            <div className="px-5 py-3 flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-3 rounded-lg text-[15px] ${isActive ? 'text-text bg-white/5' : 'text-muted'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <a
                href={`https://wa.me/${site.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noreferrer"
                className="btn-primary mt-2 px-4 py-3 rounded-full text-[13px] text-center"
              >
                Contact sales
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64" className="shrink-0">
      <g fill="none" stroke="#f5f5f7" strokeWidth="2.6" strokeLinejoin="round">
        <rect x="14" y="14" width="26" height="26"/>
        <rect x="24" y="24" width="26" height="26" stroke="#7dd3fc"/>
        <path d="M14 14L24 24M40 14L50 24M14 40L24 50M40 40L50 50" stroke="#7dd3fc"/>
      </g>
    </svg>
  );
}
