import { Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { BackgroundCanvas } from './scenes/BackgroundCanvas';
import { RouteTransition } from './components/RouteTransition';
import { ScrollToTop } from './components/ScrollToTop';
import { useCursorGlow } from './hooks/useCursorGlow';

const Home = lazy(() => import('./routes/Home'));
const Products = lazy(() => import('./routes/Products'));
const About = lazy(() => import('./routes/About'));
const Contact = lazy(() => import('./routes/Contact'));

export default function App() {
  useCursorGlow();
  return (
    <div className="relative min-h-screen noise grid-overlay">
      <BackgroundCanvas />
      <Nav />
      <ScrollToTop />
      <main className="relative z-10">
        <Suspense fallback={<PageLoader />}>
          <RouteTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteTransition>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono text-xs tracking-[0.3em] text-white/50 animate-pulse">
        LOADING 4D ·········
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <div className="font-mono text-xs tracking-[0.3em] text-ember">// 404</div>
        <h1 className="text-5xl md:text-7xl font-semibold mt-3">Dimensi tidak ditemukan.</h1>
        <p className="text-white/60 mt-3">Halaman ini tersesat di ruang 4D.</p>
        <a href="/" className="mt-6 inline-block btn-primary rounded-xl px-5 py-3 text-sm font-semibold">Kembali ke Home</a>
      </div>
    </section>
  );
}
