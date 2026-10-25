import * as THREE from 'three';
import { createFacadeMaterial, sharedTime } from './facade.js';
import { BUILDINGS } from './buildings.js';
import { createPipeline, createLoop, observeSize, isSmallScreen, prefersReducedMotion } from './pipeline.js';

const SKY = 0x070b16;
const LOT = 34;          // passo del lotto in metri
const BLOCK = 4;         // una strada ogni 4 lotti

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Strade con traffico luminoso disegnato direttamente nello shader. */
function createGround() {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      { uLot: { value: LOT }, uPeriod: { value: LOT * BLOCK } },
    ]),
    fog: true,
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      varying vec2 vXZ;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vXZ = wp.xz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uLot;
      uniform float uPeriod;
      #include <common>
      #include <fog_pars_fragment>
      varying vec2 vXZ;

      float hash(float n) { return fract(sin(n) * 43758.5453); }

      // Flusso di veicoli su una corsia: x = coordinata lungo la strada
      float traffic(float along, float lane, float seed, float dir) {
        float p = along * 0.02 + uTime * (0.35 + hash(seed) * 0.3) * dir + hash(seed + 3.0) * 10.0;
        float f = fract(p);
        return smoothstep(0.0, 0.02, f) * (1.0 - smoothstep(0.02, 0.09, f)) * (1.0 - smoothstep(1.2, 2.4, abs(lane)));
      }

      void main() {
        vec2 q = vXZ / uPeriod;
        vec2 idx = floor(q + 0.5);
        vec2 d = vXZ - idx * uPeriod;          // distanza dal centro strada
        float hw = uLot * 0.5;
        float roadX = 1.0 - step(hw, abs(d.x)); // strada lungo z
        float roadZ = 1.0 - step(hw, abs(d.y)); // strada lungo x

        vec3 col = vec3(0.012, 0.016, 0.028);
        float road = max(roadX, roadZ);
        col = mix(col, vec3(0.02, 0.026, 0.04), road);

        // marciapiedi luminosi
        float edgeX = 1.0 - smoothstep(0.0, 0.6, abs(abs(d.x) - hw));
        float edgeZ = 1.0 - smoothstep(0.0, 0.6, abs(abs(d.y) - hw));
        col += vec3(0.05, 0.16, 0.42) * max(edgeX, edgeZ) * 0.5;

        // fari (bianchi) e luci posteriori (rosse)
        vec3 head = vec3(1.6, 1.5, 1.3);
        vec3 tail = vec3(1.8, 0.15, 0.1);
        float cars = 0.0;
        vec3 carCol = vec3(0.0);
        if (roadX > 0.5) {
          float a = traffic(vXZ.y, d.x - 5.0, idx.x * 7.1, 1.0);
          float b = traffic(vXZ.y, d.x + 5.0, idx.x * 7.1 + 1.0, -1.0);
          carCol += head * a + tail * b;
        }
        if (roadZ > 0.5) {
          float a = traffic(vXZ.x, d.y - 5.0, idx.y * 3.3 + 9.0, 1.0);
          float b = traffic(vXZ.x, d.y + 5.0, idx.y * 3.3 + 11.0, -1.0);
          carCol += head * a + tail * b;
        }
        col += carCol;

        // piazza centrale
        float r = length(vXZ);
        col += vec3(0.08, 0.25, 0.9) * (1.0 - smoothstep(0.0, 1.2, abs(r - 118.0))) * 0.8;
        col += vec3(0.02, 0.05, 0.14) * (1.0 - smoothstep(60.0, 118.0, r));

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  mat.uniforms.uTime = sharedTime;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), mat);
  plane.rotation.x = -Math.PI / 2;
  return plane;
}

/* Veicoli volanti: tutto il movimento è calcolato nel vertex shader. */
function createSkyTraffic(count, pixelRatio) {
  const rng = mulberry32(7);
  const a = new Float32Array(count * 4); // raggio, quota, velocità, fase
  const b = new Float32Array(count * 2); // tipo (0 = anello, 1 = rettilineo), colore
  for (let i = 0; i < count; i++) {
    const ring = rng() < 0.7;
    a[i * 4] = ring ? 160 + rng() * 900 : (rng() - 0.5) * 2400;
    a[i * 4 + 1] = 70 + Math.pow(rng(), 1.6) * 320;
    a[i * 4 + 2] = (rng() < 0.5 ? -1 : 1) * (ring ? 0.04 + rng() * 0.08 : 30 + rng() * 50);
    a[i * 4 + 3] = rng() * 6.283;
    b[i * 2] = ring ? 0 : (rng() < 0.5 ? 1 : 2);
    b[i * 2 + 1] = rng();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aMotion', new THREE.BufferAttribute(a, 4));
  geo.setAttribute('aKind', new THREE.BufferAttribute(b, 2));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 200, 0), 3000);

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: sharedTime, uPR: { value: pixelRatio } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: /* glsl */ `
      attribute vec4 aMotion;
      attribute vec2 aKind;
      uniform float uTime;
      uniform float uPR;
      varying vec3 vColor;
      void main() {
        vec3 p;
        if (aKind.x < 0.5) {
          float ang = aMotion.w + uTime * aMotion.z;
          p = vec3(cos(ang) * aMotion.x, aMotion.y, sin(ang) * aMotion.x);
        } else {
          float t = mod(aMotion.w * 400.0 + uTime * aMotion.z, 3200.0) - 1600.0;
          p = aKind.x < 1.5 ? vec3(t, aMotion.y, aMotion.x) : vec3(aMotion.x, aMotion.y, t);
        }
        vColor = aKind.y < 0.55 ? vec3(1.6, 1.6, 1.8) : (aKind.y < 0.85 ? vec3(0.4, 1.4, 2.4) : vec3(2.4, 0.5, 0.3));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(1400.0 / -mv.z, 1.5, 7.0) * uPR;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.1, 0.5, d);
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

function createSkyline(small) {
  const rng = mulberry32(2026);
  const N = small ? 20 : 30;
  const items = [];
  for (let i = -N; i <= N; i++) {
    if (i % BLOCK === 0) continue;
    for (let j = -N; j <= N; j++) {
      if (j % BLOCK === 0) continue;
      const x = i * LOT;
      const z = j * LOT;
      const dist = Math.hypot(x, z);
      if (dist < 130) continue;
      const edge = N * LOT;
      if (dist > edge && rng() < 0.6) continue;
      if (rng() < 0.12) continue;
      const fall = Math.exp(-dist / 650);
      const h = 10 + Math.pow(rng(), 2.4) * 240 * fall + rng() * 24 * (0.4 + fall);
      const w = 14 + rng() * 15;
      const d = 14 + rng() * 15;
      items.push({ x: x + (rng() - 0.5) * 4, z: z + (rng() - 0.5) * 4, w, h, d, r: rng() });
    }
  }

  const facade = createFacadeMaterial({ base: 0x111827, glow: 0x8fb8ff, glow2: 0xffc27a, density: 0.38, floor: 3.6, col: 3 });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), facade, items.length);
  const dummy = new THREE.Object3D();
  const tops = items.filter((it) => it.h > 55 && it.r < 0.28);
  const neonTops = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ toneMapped: false }),
    tops.length,
  );
  const palette = [0x2d7dff, 0x6fe3ff, 0xc9d1dc, 0x2d7dff, 0xff7a1a].map((c) => new THREE.Color(c).multiplyScalar(2.4));

  items.forEach((it, k) => {
    dummy.position.set(it.x, it.h / 2, it.z);
    dummy.scale.set(it.w, it.h, it.d);
    dummy.updateMatrix();
    mesh.setMatrixAt(k, dummy.matrix);
  });
  tops.forEach((it, k) => {
    dummy.position.set(it.x, it.h + 0.4, it.z);
    dummy.scale.set(it.w + 0.6, 0.8, it.d + 0.6);
    dummy.updateMatrix();
    neonTops.setMatrixAt(k, dummy.matrix);
    neonTops.setColorAt(k, palette[k % palette.length]);
  });
  mesh.computeBoundingSphere();
  neonTops.computeBoundingSphere();
  return { mesh, neonTops, count: items.length };
}

export function createCity(container, canvas) {
  const small = isSmallScreen();
  const reduced = prefersReducedMotion();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.FogExp2(SKY, small ? 0.0007 : 0.00055);

  const camera = new THREE.PerspectiveCamera(42, 1, 2, 5000);
  const pipe = createPipeline(canvas, scene, camera, { bloom: true, strength: 0.85, radius: 0.55, threshold: 0.72 });
  pipe.environment(0.35);

  scene.add(new THREE.HemisphereLight(0x5a7cff, 0x05070c, 0.7));
  const sun = new THREE.DirectionalLight(0xcfe0ff, 1.2);
  sun.position.set(300, 500, 200);
  scene.add(sun);

  scene.add(createGround());
  const skyline = createSkyline(small);
  scene.add(skyline.mesh, skyline.neonTops);
  scene.add(createSkyTraffic(small ? 220 : 520, pipe.renderer.getPixelRatio()));

  const torre = BUILDINGS.find((b) => b.id === 'torre').build();
  scene.add(torre);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );

  let w = 1;
  let h = 1;
  observeSize(container, (cw, ch) => {
    w = cw;
    h = ch;
    camera.aspect = w / h;
    // Su schermi larghi la torre si sposta a destra, lasciando spazio al titolo.
    if (w / h > 1.15) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    pipe.setSize(w, h);
  });

  const target = new THREE.Vector3(0, 170, 0);
  let angle = 0.6;
  let first = true;

  createLoop(container, (dt, t) => {
    sharedTime.value = t;
    if (!reduced) angle += dt * 0.025;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2);

    const scroll = Math.min(1, window.scrollY / Math.max(1, h));
    const radius = (small ? 980 : 860) - scroll * 120;
    const a = angle + pointer.x * 0.18;
    camera.position.set(Math.cos(a) * radius, 240 + pointer.y * -50 + scroll * 260, Math.sin(a) * radius);
    target.y = 170 + scroll * 80;
    camera.lookAt(target);

    torre.userData.update?.(t);
    pipe.render(dt);
    if (first) {
      first = false;
      container.classList.add('is-ready');
    }
  });

  return { buildingCount: skyline.count };
}
