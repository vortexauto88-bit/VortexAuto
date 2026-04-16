import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Tesseract } from './Tesseract';
import { PartsField } from './PartsField';
import { NebulaBackground } from '../shaders/NebulaBackground';
import { Vector2 } from 'three';
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
 * Global 3D backdrop that persists across routes. Scene morphs per-route.
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

  const partsCount = isMobile ? 14 : 34;
  const signalCount = isMobile ? 6 : 14;

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        dpr={[1, isMobile ? 1.25 : 1.75]}
        gl={{ antialias: !isMobile, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 7], fov: 55 }}
      >
        {/* full-screen shader quad — rendered first, behind everything */}
        <NebulaBackground />

        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 6, 3]} intensity={1.1} color="#ff9b6f" />
        <directionalLight position={[-5, -3, -2]} intensity={0.7} color="#22d3ee" />
        <pointLight position={[0, 0, 3]} intensity={1.2} color="#ffc857" />

        {mode === 'hero' && <Tesseract scale={1.35} />}
        {mode === 'parts' && (
          <>
            <Tesseract scale={0.7} color="#22d3ee" accent="#b6ff2e" />
            <PartsField count={partsCount} />
          </>
        )}
        {mode === 'wire' && <Tesseract scale={1.1} color="#ffc857" accent="#ff5b2e" />}
        {mode === 'signal' && (
          <>
            <Tesseract scale={0.9} color="#b6ff2e" accent="#22d3ee" />
            <PartsField count={signalCount} />
          </>
        )}

        <EffectComposer multisampling={0}>
          <Bloom intensity={isMobile ? 0.7 : 0.95} luminanceThreshold={0.18} luminanceSmoothing={0.2} mipmapBlur />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new Vector2(0.0008, 0.0012)} radialModulation={false} modulationOffset={0} />
          <Noise opacity={0.045} />
          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
