import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Tron-style orbiting wireframe parts. No colored materials, just
 * thin cyan/white lines drifting in the dark.
 */
export function PartsField({ count = 24 }: { count?: number }) {
  const group = useRef<THREE.Group>(null!);
  const items = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      const type = i % 3;
      const r = 3.2 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const speed = 0.1 + Math.random() * 0.25;
      const scale = 0.18 + Math.random() * 0.3;
      const tint = Math.random() > 0.5 ? '#ffffff' : '#7dd3fc';
      return { type, r, theta, phi, speed, scale, seed: Math.random() * 10, tint };
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
      const y = Math.sin(ph) * it.r * 0.5;
      const z = Math.sin(th) * Math.cos(ph) * it.r;
      const c = children[i] as THREE.LineSegments;
      c.position.set(x, y, z);
      c.rotation.x = t * it.speed * 1.2 + it.seed;
      c.rotation.y = t * it.speed * 0.9 + it.seed;
    }
  });

  return (
    <group ref={group}>
      {items.map((it, i) => {
        const geom =
          it.type === 0 ? new THREE.TorusGeometry(1, 0.32, 10, 24)
          : it.type === 1 ? new THREE.CylinderGeometry(0.55, 0.55, 1.5, 18)
          : new THREE.OctahedronGeometry(1, 0);
        const edges = new THREE.EdgesGeometry(geom);
        return (
          <lineSegments key={i} scale={it.scale} geometry={edges}>
            <lineBasicMaterial color={it.tint} transparent opacity={0.55} />
          </lineSegments>
        );
      })}
    </group>
  );
}
