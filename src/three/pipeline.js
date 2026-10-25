import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const isSmallScreen = () => window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Renderer + bloom con qualità adattiva: se il frame rate scende,
 * prima spegne il bloom, poi abbassa la risoluzione.
 */
export function createPipeline(canvas, scene, camera, { bloom = true, strength = 0.8, radius = 0.5, threshold = 0.8, maxDpr = 1.75 } = {}) {
  const small = isSmallScreen();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : maxDpr);
  renderer.setPixelRatio(dpr);

  let useBloom = bloom && !small;
  let composer = null;
  let bloomPass = null;
  let width = 1;
  let height = 1;

  function buildComposer() {
    const rt = new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), strength, radius, threshold);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
  }
  if (useBloom) buildComposer();

  function setSize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    renderer.setSize(width, height, false);
    if (composer) {
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
    }
  }

  // Misura delle prestazioni
  let frames = 0;
  let acc = 0;
  let settled = false;
  function sample(dt) {
    if (settled) return;
    frames++;
    if (frames < 30) return; // compilazione shader
    acc += dt;
    if (frames < 120) return;
    const avg = acc / (frames - 30);
    frames = 0;
    acc = 0;
    if (avg > 0.024) {
      if (useBloom) {
        useBloom = false;
      } else if (dpr > 1) {
        dpr = 1;
        renderer.setPixelRatio(dpr);
        setSize(width, height);
      } else {
        settled = true;
      }
    } else {
      settled = true;
    }
  }

  function render(dt = 0.016) {
    sample(dt);
    if (useBloom && composer) composer.render(dt);
    else renderer.render(scene, camera);
  }

  function environment(intensity = 0.6) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = new RoomEnvironment();
    scene.environment = pmrem.fromScene(env, 0.04).texture;
    scene.environmentIntensity = intensity;
    env.dispose?.();
    pmrem.dispose();
  }

  return { renderer, setSize, render, environment };
}

/**
 * Avvia/ferma il loop di rendering in base alla visibilità dell'elemento
 * e della scheda del browser: niente GPU sprecata fuori schermo.
 */
export function createLoop(el, tick) {
  let visible = false;
  let running = false;
  let raf = 0;
  let last = 0;

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    tick(dt, now / 1000);
  };

  const update = () => {
    const should = visible && !document.hidden;
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      update();
    },
    { rootMargin: '80px' },
  );
  io.observe(el);
  document.addEventListener('visibilitychange', update);

  return {
    get running() {
      return running;
    },
  };
}

/** Osserva le dimensioni del contenitore. */
export function observeSize(el, cb) {
  const ro = new ResizeObserver(() => {
    const r = el.getBoundingClientRect();
    cb(r.width, r.height);
  });
  ro.observe(el);
  const r = el.getBoundingClientRect();
  cb(r.width, r.height);
  return ro;
}
