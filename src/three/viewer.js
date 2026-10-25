import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BUILDINGS, measure } from './buildings.js';
import { sharedTime } from './facade.js';
import { createPipeline, createLoop, observeSize, prefersReducedMotion } from './pipeline.js';

const BG = 0x060912;

function createGrid() {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uBg: { value: new THREE.Color(BG) }, uRadius: { value: 1400 } },
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vXZ = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBg;
      uniform float uRadius;
      varying vec2 vXZ;
      float line(vec2 p, float step) {
        vec2 g = abs(fract(p / step - 0.5) - 0.5) / fwidth(p / step);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main() {
        float minor = line(vXZ, 10.0);
        float major = line(vXZ, 50.0);
        float r = length(vXZ);
        float fade = 1.0 - smoothstep(uRadius * 0.15, uRadius, r);
        vec3 col = vec3(0.006, 0.009, 0.016);
        col += vec3(0.1, 0.25, 0.6) * minor * 0.035 + vec3(0.18, 0.45, 1.0) * major * 0.09;
        gl_FragColor = vec4(mix(uBg, col, fade), 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const m = new THREE.Mesh(new THREE.CircleGeometry(1400, 96), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = -0.05;
  m.renderOrder = -1;
  return m;
}

function labelSprite(text, { color = '#c9d1dc', size = 10, weight = 600, mono = false } = {}) {
  const font = `${weight} 64px ${mono ? '"IBM Plex Mono", monospace' : '"Chakra Petch", sans-serif'}`;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 32;
  c.width = w;
  c.height = 88;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 16, 46);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true, toneMapped: false }));
  sprite.scale.set((size * w) / 88, size, 1);
  sprite.center.set(0, 0.5);
  return sprite;
}

function disposeTree(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) {
      o.material.map?.dispose();
      o.material.dispose();
    }
  });
}

/** Righello verticale in metri: tacche ogni 10 m, etichette ogni 50/100 m. */
function createRuler(height, x, z, labelScale = 1) {
  const g = new THREE.Group();
  const top = Math.ceil(height / 50) * 50;
  const labelStep = top > 250 ? 100 : 50;
  const pos = [0, 0, 0, 0, top, 0];
  for (let y = 0; y <= top; y += 10) {
    const len = (y % 50 === 0 ? 6 : 3) * labelScale;
    pos.push(0, y, 0, len, y, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x7f9bd6, transparent: true, opacity: 0.8 })));

  const size = Math.max(5, top * 0.028) * labelScale;
  for (let y = labelStep; y <= top; y += labelStep) {
    const s = labelSprite(`${y} m`, { color: '#8fb8ff', size, mono: true });
    s.position.set(8, y, 0);
    g.add(s);
  }
  // marcatore dell'altezza reale
  const mark = new THREE.BufferGeometry();
  mark.setAttribute('position', new THREE.Float32BufferAttribute([-4, height, 0, 14, height, 0], 3));
  g.add(new THREE.LineSegments(mark, new THREE.LineBasicMaterial({ color: new THREE.Color(0x6fe3ff).multiplyScalar(2), toneMapped: false })));

  g.position.set(x, 0, z);
  return g;
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createViewer(stage, canvas) {
  const reduced = prefersReducedMotion();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 1200, 3600);

  const camera = new THREE.PerspectiveCamera(34, 1, 1, 8000);
  const pipe = createPipeline(canvas, scene, camera, { bloom: true, strength: 0.55, radius: 0.45, threshold: 0.85 });
  pipe.environment(0.7);

  scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x0a0d14, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(250, 420, 300);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x2d7dff, 1.2);
  rim.position.set(-300, 150, -250);
  scene.add(rim);
  scene.add(createGrid());

  // Lo zoom con la rotella richiede Ctrl/⌘, così la pagina continua a scorrere.
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        e.stopImmediatePropagation();
        stage.classList.add('show-wheel-hint');
        clearTimeout(canvas._hintT);
        canvas._hintT = setTimeout(() => stage.classList.remove('show-wheel-hint'), 1400);
      }
    },
    { capture: true, passive: true },
  );

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    transition = null;
  });

  // Modelli costruiti una sola volta, su richiesta.
  const models = new Map();
  function getModel(id) {
    if (models.has(id)) return models.get(id);
    const def = BUILDINGS.find((b) => b.id === id);
    const group = def.build();
    const { box, size } = measure(group);
    const label = labelSprite(def.short, { size: 9, color: '#e6ebf2' });
    const hLabel = labelSprite(`${Math.round(size.y)} m`, { size: 8, color: '#6fe3ff', mono: true });
    label.visible = hLabel.visible = false;
    label.userData.base = label.scale.clone();
    hLabel.userData.base = hLabel.scale.clone();
    const entry = { def, group, box, size, label, hLabel };
    scene.add(group, label, hLabel);
    models.set(id, entry);
    return entry;
  }

  let ruler = null;
  let mode = null;
  let transition = null;
  let aspect = 1;

  function setRuler(height, x, z, labelScale) {
    if (ruler) {
      scene.remove(ruler);
      disposeTree(ruler);
    }
    ruler = createRuler(height, x, z, labelScale);
    scene.add(ruler);
  }

  function frame(box, dir, flat = false) {
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const fov = Math.min(vfov, hfov);
    const radius = size.length() / 2;
    // "flat": scena larga vista di fronte, si adatta a larghezza e altezza
    const dist = flat
      ? Math.max(size.x / 2 / Math.tan(hfov / 2), size.y / 2 / Math.tan(vfov / 2)) * 1.08 + size.z / 2
      : (radius / Math.sin(fov / 2)) * 1.02;
    const to = center.clone().add(dir.clone().normalize().multiplyScalar(dist));
    controls.minDistance = radius * 0.6;
    controls.maxDistance = dist * 2.2;
    transition = {
      start: performance.now(),
      t: 0,
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos: to,
      toTarget: center,
    };
    if (mode === null || reduced) transition.t = 1;
  }

  function hideAll() {
    for (const m of models.values()) {
      m.group.visible = m.label.visible = m.hLabel.visible = false;
    }
  }

  let lastFocus = null;

  function show(id) {
    const m = getModel(id);
    hideAll();
    m.group.visible = true;
    m.group.position.set(0, 0, 0);
    const box = m.box.clone();
    setRuler(m.size.y, box.min.x - 30, box.max.z * 0.2);
    box.expandByPoint(new THREE.Vector3(box.min.x - 30, 0, 0));
    frame(box, new THREE.Vector3(1, 0.42, 1.25));
    controls.autoRotate = !reduced;
    lastFocus = () => show(id);
    mode = id;
  }

  function compare() {
    const list = BUILDINGS.map((b) => getModel(b.id)).sort((a, b) => a.size.y - b.size.y);
    hideAll();
    const gap = 36;
    const total = list.reduce((s, m) => s + m.size.x, 0) + gap * (list.length - 1);
    let x = -total / 2;
    const f = Math.max(1, total / 450) * (aspect < 1 ? 1.25 : 1);
    const all = new THREE.Box3();
    let tallest = 0;
    for (const m of list) {
      const cx = x + m.size.x / 2 - (m.box.min.x + m.size.x / 2);
      m.group.position.set(cx, 0, 0);
      m.group.visible = true;
      const top = m.size.y;
      tallest = Math.max(tallest, top);
      m.label.scale.copy(m.label.userData.base).multiplyScalar(f);
      m.hLabel.scale.copy(m.hLabel.userData.base).multiplyScalar(f);
      m.label.position.set(x, top + 22 * f, 0);
      m.hLabel.position.set(x, top + 10 * f, 0);
      m.label.visible = m.hLabel.visible = true;
      all.union(m.box.clone().translate(new THREE.Vector3(cx, 0, 0)));
      x += m.size.x + gap;
    }
    all.max.y += 30 * f;
    setRuler(tallest, all.min.x - 24, 0, Math.sqrt(f));
    all.expandByPoint(new THREE.Vector3(all.min.x - 24, 0, 0));
    all.max.x += 20 * f;
    // In confronto la scena è larga: si inquadra frontalmente
    frame(all, new THREE.Vector3(0.1, 0.14, 1), true);
    controls.autoRotate = false;
    lastFocus = compare;
    mode = 'compare';
  }

  observeSize(stage, (w, h) => {
    aspect = w / Math.max(1, h);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    pipe.setSize(w, h);
  });

  createLoop(stage, (dt, t) => {
    sharedTime.value = t;
    if (transition) {
      // basata sul tempo reale: dura 1,1 s anche su dispositivi lenti
      transition.t = transition.t >= 1 ? 1 : Math.min(1, (performance.now() - transition.start) / 1100);
      const k = ease(transition.t);
      camera.position.lerpVectors(transition.fromPos, transition.toPos, k);
      controls.target.lerpVectors(transition.fromTarget, transition.toTarget, k);
      if (transition.t >= 1) transition = null;
    }
    controls.update(dt);
    for (const m of models.values()) {
      if (m.group.visible) m.group.userData.update?.(t);
    }
    pipe.render(dt);
  });

  return {
    show,
    compare,
    reset: () => lastFocus?.(),
  };
}
