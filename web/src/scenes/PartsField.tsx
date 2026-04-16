import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Abstract floating "parts" — torus (gears/bearings), cylinders (pistons),
 * octahedrons (bolts). Orbiting in a 4D-projected swirl.
 */
export function PartsField({ count = 28 }: { count?: number }) {
  const group = useRef<THREE.Group>(null!);
  const items = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const type = i % 3;
      const r = 3 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.35;
      const scale = 0.18 + Math.random() * 0.35;
      return { type, r, theta, phi, speed, scale, seed: Math.random() * 10 };
    });
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const children = group.current.children;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const th = it.theta + t * it.speed;
      const ph = it.phi + t * it.speed * 0.7;
      const x = Math.cos(th) * it.r;
      const y = Math.sin(ph) * it.r * 0.6;
      const z = Math.sin(th) * Math.cos(ph) * it.r;
      const c = children[i] as THREE.Mesh;
      c.position.set(x, y, z);
      c.rotation.x = t * it.speed * 1.4 + it.seed;
      c.rotation.y = t * it.speed * 1.1 + it.seed;
    }
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} scale={it.scale}>
          {it.type === 0 && <torusGeometry args={[1, 0.32, 12, 28]} />}
          {it.type === 1 && <cylinderGeometry args={[0.6, 0.6, 1.6, 20]} />}
          {it.type === 2 && <octahedronGeometry args={[1, 0]} />}
          <meshStandardMaterial
            color={it.type === 0 ? '#ff5b2e' : it.type === 1 ? '#22d3ee' : '#ffc857'}
            metalness={0.8}
            roughness={0.25}
            emissive={it.type === 0 ? '#441100' : it.type === 1 ? '#002a33' : '#332200'}
          />
        </mesh>
      ))}
    </group>
  );
}
