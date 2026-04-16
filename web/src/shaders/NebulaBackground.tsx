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

const fragment = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

// Simplex-ish hash noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float t = uTime * 0.05;
  vec2 q = vec2(fbm(p * 1.2 + t), fbm(p * 1.2 - t + 7.3));
  vec2 r = vec2(fbm(p * 2.0 + q + t * 1.1), fbm(p * 2.0 + q - t));

  float f = fbm(p * 2.5 + r * 2.0 + t);
  vec3 col = mix(uColorA, uColorB, clamp(f * 1.6, 0.0, 1.0));
  col = mix(col, uColorC, clamp(length(r) * 0.85, 0.0, 1.0));

  // Vignette
  float d = length(uv - 0.5);
  col *= smoothstep(0.95, 0.2, d);

  // Scanline / film grain
  float g = hash(uv * uRes + uTime * 60.0);
  col += (g - 0.5) * 0.03;
  col += 0.05 * sin(uv.y * uRes.y * 3.14159);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function NebulaBackground() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const { size } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(size.width, size.height) },
    uColorA: { value: new THREE.Color('#05060a') },
    uColorB: { value: new THREE.Color('#301a2b') },
    uColorC: { value: new THREE.Color('#ff5b2e').multiplyScalar(0.25) },
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
