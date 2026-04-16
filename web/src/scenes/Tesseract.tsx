import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * True 4D hypercube (tesseract): 16 vertices in R^4, rotated in the
 * XW and YW planes, then stereographically projected to R^3.
 */
function rotateXW(v: number[], a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  const [x, y, z, w] = v;
  return [c * x - s * w, y, z, s * x + c * w];
}
function rotateYW(v: number[], a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  const [x, y, z, w] = v;
  return [x, c * y - s * w, z, s * y + c * w];
}
function rotateZW(v: number[], a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  const [x, y, z, w] = v;
  return [x, y, c * z - s * w, s * z + c * w];
}
function project(v: number[], distance = 2.4): [number, number, number] {
  const w = 1 / (distance - v[3]);
  return [v[0] * w * 2, v[1] * w * 2, v[2] * w * 2];
}

export function Tesseract({
  scale = 1,
  color = '#ff5b2e',
  accent = '#22d3ee',
}: {
  scale?: number;
  color?: string;
  accent?: string;
}) {
  const group = useRef<THREE.Group>(null!);
  const edgesRef = useRef<THREE.LineSegments>(null!);

  // Build 16 vertices of a 4-cube and its 32 edges (pairs that differ by 1 bit)
  const { vertices4D, edgeIndices } = useMemo(() => {
    const verts: number[][] = [];
    for (let i = 0; i < 16; i++) {
      verts.push([
        i & 1 ? 1 : -1,
        i & 2 ? 1 : -1,
        i & 4 ? 1 : -1,
        i & 8 ? 1 : -1,
      ]);
    }
    const edges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = i ^ j;
        if (diff && (diff & (diff - 1)) === 0) edges.push([i, j]);
      }
    }
    return { vertices4D: verts, edgeIndices: edges };
  }, []);

  const positions = useMemo(() => new Float32Array(edgeIndices.length * 6), [edgeIndices]);
  const colors = useMemo(() => new Float32Array(edgeIndices.length * 6), [edgeIndices]);
  const colorA = useMemo(() => new THREE.Color(color), [color]);
  const colorB = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const aXW = t * 0.35;
    const aYW = t * 0.5;
    const aZW = t * 0.22;

    const projected: [number, number, number][] = vertices4D.map((v) => {
      let r = rotateXW(v, aXW);
      r = rotateYW(r, aYW);
      r = rotateZW(r, aZW);
      return project(r);
    });

    for (let e = 0; e < edgeIndices.length; e++) {
      const [i, j] = edgeIndices[e];
      const a = projected[i], b = projected[j];
      const o = e * 6;
      positions[o] = a[0]; positions[o+1] = a[1]; positions[o+2] = a[2];
      positions[o+3] = b[0]; positions[o+4] = b[1]; positions[o+5] = b[2];

      // Colorize by W-depth
      const wA = (vertices4D[i][3] + 1) * 0.5;
      const wB = (vertices4D[j][3] + 1) * 0.5;
      const cA = colorA.clone().lerp(colorB, wA);
      const cB = colorA.clone().lerp(colorB, wB);
      colors[o] = cA.r; colors[o+1] = cA.g; colors[o+2] = cA.b;
      colors[o+3] = cB.r; colors[o+4] = cB.g; colors[o+5] = cB.b;
    }

    const geom = edgesRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geom.getAttribute('color') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    if (group.current) {
      group.current.rotation.y = t * 0.12;
      group.current.rotation.x = Math.sin(t * 0.25) * 0.2;
    }
  });

  return (
    <group ref={group} scale={scale}>
      <lineSegments ref={edgesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.9} linewidth={1} />
      </lineSegments>
      {/* glowing vertex points */}
      <Points vertices4D={vertices4D} colorA={colorA} colorB={colorB} />
    </group>
  );
}

function Points({
  vertices4D, colorA, colorB,
}: { vertices4D: number[][]; colorA: THREE.Color; colorB: THREE.Color }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => new Float32Array(vertices4D.length * 3), [vertices4D]);
  const colors = useMemo(() => new Float32Array(vertices4D.length * 3), [vertices4D]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < vertices4D.length; i++) {
      let r = rotateXW(vertices4D[i], t * 0.35);
      r = rotateYW(r, t * 0.5);
      r = rotateZW(r, t * 0.22);
      const p = project(r);
      positions[i*3] = p[0]; positions[i*3+1] = p[1]; positions[i*3+2] = p[2];
      const w = (vertices4D[i][3] + 1) * 0.5;
      const c = colorA.clone().lerp(colorB, w);
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }
    const geom = ref.current.geometry as THREE.BufferGeometry;
    (geom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (geom.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={vertices4D.length} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={vertices4D.length} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors sizeAttenuation transparent opacity={0.95} />
    </points>
  );
}
