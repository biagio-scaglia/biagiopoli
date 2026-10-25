import * as THREE from 'three';

// Tempo condiviso da tutte le facciate (sfarfallio delle finestre).
export const sharedTime = { value: 0 };

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>

  varying vec3 vPos;        // posizione locale in metri (scala applicata)
  varying vec3 vNormal;     // normale locale
  varying vec3 vWorldNormal;
  varying float vWorldY;
  varying float vSeed;

  void main() {
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = modelMatrix * instanceMatrix;
      vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
    #else
      vSeed = fract(sin(dot(modelMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
    #endif

    vec3 s = vec3(length(m[0].xyz), length(m[1].xyz), length(m[2].xyz));
    vPos = position * s;
    vNormal = normal;

    vec4 wp = m * vec4(position, 1.0);
    vWorldY = wp.y;
    vWorldNormal = normalize(mat3(m) * normal);

    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uGlow;
  uniform vec3 uGlow2;
  uniform float uDensity;
  uniform float uFloor;
  uniform float uCol;
  uniform float uTime;
  uniform float uCurved;
  uniform float uGlowStrength;
  uniform vec3 uLightDir;

  #include <common>
  #include <fog_pars_fragment>

  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying float vWorldY;
  varying float vSeed;

  float h21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 wn = normalize(vWorldNormal);
    float diff = max(dot(wn, normalize(uLightDir)), 0.0);
    float sky = wn.y * 0.5 + 0.5;
    vec3 col = uBase * (0.45 + 0.55 * diff) + uBase * 0.35 * sky;

    if (abs(n.y) < 0.5) {
      float u;
      if (uCurved > 0.5) {
        u = atan(vPos.z, vPos.x) * length(vPos.xz);
      } else {
        u = abs(n.x) > abs(n.z) ? vPos.z * sign(n.x) : -vPos.x * sign(n.z);
      }
      vec2 g = vec2(u / uCol, vWorldY / uFloor);
      vec2 cell = floor(g);
      vec2 f = fract(g);

      // Antialiasing: da lontano la griglia diventa un valore medio.
      float fw = max(fwidth(g.x), fwidth(g.y));
      float far = smoothstep(0.35, 0.9, fw);

      float win = step(0.16, f.x) * step(f.x, 0.84) * step(0.22, f.y) * step(f.y, 0.86);
      float r = h21(cell + vSeed * 91.7 + n.xz * 13.1);
      float lit = step(1.0 - uDensity, r);
      float tint = h21(cell.yx + 3.7 + vSeed);
      vec3 wc = mix(uGlow, uGlow2, step(0.82, tint));
      float flick = 0.88 + 0.12 * sin(uTime * 1.7 + r * 40.0);

      vec3 near = mix(col, col * 0.55 + vec3(0.015, 0.02, 0.035), win);
      near += wc * win * lit * uGlowStrength * flick * (0.55 + 0.45 * r);
      vec3 avg = col * 0.8 + mix(uGlow, uGlow2, 0.18) * uDensity * 0.45 * uGlowStrength;
      col = mix(near, avg, far);
    } else {
      col = uBase * (0.75 + 0.25 * sky) + vec3(0.01, 0.015, 0.03);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/**
 * Materiale "facciata" con finestre procedurali in metri reali:
 * un piano ogni `floor` metri, una campata ogni `col` metri.
 */
export function createFacadeMaterial({
  base = 0x141b28,
  glow = 0x9cc8ff,
  glow2 = 0xffc27a,
  density = 0.5,
  floor = 3.8,
  col = 2.8,
  curved = false,
  glowStrength = 1.6,
} = {}) {
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uBase: { value: new THREE.Color(base) },
      uGlow: { value: new THREE.Color(glow) },
      uGlow2: { value: new THREE.Color(glow2) },
      uDensity: { value: density },
      uFloor: { value: floor },
      uCol: { value: col },
      uCurved: { value: curved ? 1 : 0 },
      uGlowStrength: { value: glowStrength },
      uLightDir: { value: new THREE.Vector3(0.5, 0.8, 0.35) },
    },
  ]);
  uniforms.uTime = sharedTime;

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    fog: true,
  });
}
