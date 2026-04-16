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
const Partnership = lazy(() => import('./routes/Partnership'));
const About = lazy(() => import('./routes/About'));
const Contact = lazy(() => import('./routes/Contact'));

export default function App() {
  useCursorGlow();
  return (
    <div className="relative min-h-screen aura grid-lines">
      <BackgroundCanvas />
      <Nav />
      <ScrollToTop />
      <main className="relative z-10">
        <Suspense fallback={<PageLoader />}>
          <RouteTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/partnership" element={<Partnership />} />
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
      <div className="font-mono text-[11px] tracking-[0.3em] text-muted animate-pulse">
        LOADING
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <div className="font-mono text-[11px] tracking-[0.3em] text-tron">404</div>
        <h1 className="display text-5xl md:text-7xl mt-4">Page not found.</h1>
        <p className="text-muted mt-3">The page you are looking for does not exist.</p>
        <a href="/" className="mt-8 inline-block btn-primary rounded-full px-6 py-3 text-sm">Back home</a>
      </div>
    </section>
  );
}
