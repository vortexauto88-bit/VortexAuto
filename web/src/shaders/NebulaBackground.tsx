import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const vertex = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/**
 * Apple-clean / Tron background: deep black with an extremely subtle
 * cyan radial wash and a soft horizon gradient. No noise, no grain.
 */
const fragment = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;

void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;
  float aspect = uRes.x / uRes.y;
  p.x *= aspect;

  // Deep black base
  vec3 col = vec3(0.0);

  // Extremely subtle cyan breathing glow, centered, behind the camera subject
  float r = length(p);
  float pulse = 0.5 + 0.5 * sin(uTime * 0.25);
  float glow = smoothstep(0.85, 0.0, r) * (0.035 + 0.015 * pulse);
  col += glow * vec3(0.20, 0.55, 0.85);

  // Soft horizon — a quiet light band near the lower third
  float horizon = smoothstep(0.18, 0.0, abs(uv.y - 0.62));
  col += horizon * 0.02 * vec3(0.5, 0.8, 1.0);

  // Gentle vignette
  float v = smoothstep(1.0, 0.25, length(uv - 0.5));
  col *= v;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function NebulaBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const { size } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(size.width, size.height) },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uRes.value.set(size.width, size.height);
    }
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
