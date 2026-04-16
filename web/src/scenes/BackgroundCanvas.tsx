import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Tesseract } from './Tesseract';
import { PartsField } from './PartsField';
import { NebulaBackground } from '../shaders/NebulaBackground';
import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

/**
 * Global 3D backdrop. Apple-clean + Tron:
 * pure black canvas, monochrome wireframes, single cyan accent, soft bloom.
 */
export function BackgroundCanvas() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const mode = useMemo(() => {
    if (pathname.startsWith('/products')) return 'parts';
    if (pathname.startsWith('/about')) return 'wire';
    if (pathname.startsWith('/contact')) return 'signal';
    return 'hero';
  }, [pathname]);

  const partsCount = isMobile ? 12 : 24;
  const signalCount = isMobile ? 6 : 12;

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        dpr={[1, isMobile ? 1.25 : 1.75]}
        gl={{ antialias: !isMobile, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 7], fov: 55 }}
      >
        <NebulaBackground />

        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#7dd3fc" />

        {mode === 'hero' && <Tesseract scale={1.35} />}
        {mode === 'parts' && (
          <>
            <Tesseract scale={0.7} color="#ffffff" accent="#7dd3fc" />
            <PartsField count={partsCount} />
          </>
        )}
        {mode === 'wire' && <Tesseract scale={1.1} color="#ffffff" accent="#7dd3fc" />}
        {mode === 'signal' && (
          <>
            <Tesseract scale={0.9} color="#ffffff" accent="#7dd3fc" />
            <PartsField count={signalCount} />
          </>
        )}

        <EffectComposer multisampling={0}>
          <Bloom intensity={isMobile ? 0.35 : 0.55} luminanceThreshold={0.35} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.9} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
