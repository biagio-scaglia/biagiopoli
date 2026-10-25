import * as THREE from 'three';
import { createFacadeMaterial } from './facade.js';
import { PALAZZI } from '../data/palazzi.js';

// Unità: 1 = 1 metro. Ogni modello poggia su y = 0 ed è centrato in x/z.

const BOX = new THREE.BoxGeometry(1, 1, 1);
const dummy = new THREE.Object3D();

const neon = (hex, intensity = 2.4) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(intensity), toneMapped: false });

const neonLine = (hex, intensity = 2, opacity = 1) =>
  new THREE.LineBasicMaterial({
    color: new THREE.Color(hex).multiplyScalar(intensity),
    toneMapped: false,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity === 1,
  });

let MAT = null;
function mats() {
  if (MAT) return MAT;
  MAT = {
    silver: new THREE.MeshStandardMaterial({ color: 0xc8d0dc, metalness: 0.9, roughness: 0.24 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x2b3342, metalness: 0.6, roughness: 0.5 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x3a4150, metalness: 0.1, roughness: 0.85 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0c1018, metalness: 0.5, roughness: 0.55 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x2a5ca8, metalness: 0.9, roughness: 0.06, transparent: true, opacity: 0.42,
    }),
    roofBlue: new THREE.MeshStandardMaterial({ color: 0x1b2a55, metalness: 0.4, roughness: 0.45 }),
    garden: new THREE.MeshStandardMaterial({ color: 0x1d5a35, roughness: 0.9 }),
    tree: new THREE.MeshStandardMaterial({ color: 0x2a8a4e, roughness: 0.8 }),
    neonBlue: neon(0x2d7dff),
    neonCyan: neon(0x6fe3ff),
    neonOrange: neon(0xff7a1a, 2.6),
    neonWhite: neon(0xffffff, 1.6),
    neonRed: neon(0xff3b3b, 2.6),
  };
  return MAT;
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(BOX, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  return m;
}

/** Cornice luminosa: quattro listelli sul perimetro (niente superfici piene abbaglianti). */
function frame(w, d, t, mat, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.add(box(w, t, t, mat, 0, 0, d / 2), box(w, t, t, mat, 0, 0, -d / 2));
  g.add(box(t, t, d, mat, w / 2, 0, 0), box(t, t, d, mat, -w / 2, 0, 0));
  g.position.set(x, y, z);
  return g;
}

function cyl(rTop, rBot, h, seg, mat, y = 0, open = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open), mat);
  m.position.y = y + h / 2;
  return m;
}

function edges(geometry, material) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material);
}

/** Texture di testo (insegne). Restituisce null fuori dal browser. */
function textTexture(text, { color = '#6fe3ff', bg = 'rgba(4,8,18,0.92)', font = 'bold 64px "Chakra Petch", sans-serif', w = 1024, h = 160 } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(text, w / 2, h / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function sign(text, width, height, opts) {
  const tex = textTexture(text, opts);
  const mat = tex
    ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6) })
    : mats().neonCyan;
  if (tex) mat.color.setScalar(1.05);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}

/* ------------------------------------------------------------------ */
/* 1. Torre Scaglia — Palazzo della Presidenza                          */
/* ------------------------------------------------------------------ */
function buildTorre() {
  const M = mats();
  const g = new THREE.Group();
  const facade = createFacadeMaterial({ base: 0x18202f, glow: 0x9cc8ff, glow2: 0xffffff, density: 0.5, floor: 3.8 });
  const podium = createFacadeMaterial({ base: 0x141a26, glow: 0xffd29a, glow2: 0x9cc8ff, density: 0.7, floor: 6 });

  g.add(box(88, 6, 88, M.stone));
  g.add(box(72, 30, 72, podium, 0, 6));
  g.add(box(73, 1.2, 73, M.neonBlue, 0, 36));

  const floors = 90;
  const fh = 3.8;
  const base = 37.2;
  const slabs = new THREE.InstancedMesh(BOX, facade, floors);
  const rings = new THREE.InstancedMesh(BOX, M.neonBlue, Math.floor(floors / 10));
  let ri = 0;
  for (let i = 0; i < floors; i++) {
    const t = i / (floors - 1);
    const s = 42 * (1 - 0.34 * t);
    const rot = THREE.MathUtils.degToRad(i * 0.9);
    dummy.position.set(0, base + i * fh + fh / 2, 0);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(s, fh, s);
    dummy.updateMatrix();
    slabs.setMatrixAt(i, dummy.matrix);
    if (i % 10 === 9 && ri < rings.count) {
      dummy.position.y = base + (i + 1) * fh;
      dummy.scale.set(s + 1.4, 0.7, s + 1.4);
      dummy.updateMatrix();
      rings.setMatrixAt(ri++, dummy.matrix);
    }
  }
  g.add(slabs, rings);

  const top = base + floors * fh; // ≈ 379 m
  const crownBase = cyl(15, 16, 6, 8, M.silver, top);
  crownBase.rotation.y = Math.PI / 8;
  g.add(crownBase);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(16.5, 0.7, 8, 64), M.neonCyan);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = top + 6.5;
  g.add(ring);

  // Corona: otto punte, come nel sigillo nazionale.
  const spikeGeo = new THREE.ConeGeometry(1.8, 20, 6);
  spikeGeo.translate(0, 10, 0);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const spike = new THREE.Mesh(spikeGeo, M.silver);
    spike.position.set(Math.cos(a) * 13, top + 6, Math.sin(a) * 13);
    spike.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18);
    g.add(spike);
  }

  g.add(cyl(5, 6.5, 14, 16, M.steel, top + 6));
  g.add(cyl(0.6, 0.9, 26, 8, M.silver, top + 20));
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12), M.neonRed);
  beacon.position.y = top + 47;
  g.add(beacon);

  g.userData.update = (t) => {
    const on = (t % 1.6) < 0.25 ? 1 : 0.15;
    beacon.scale.setScalar(on);
  };
  return g;
}

/* ------------------------------------------------------------------ */
/* 2. Dojo della Difesa Nazionale — Son Goku                            */
/* ------------------------------------------------------------------ */
function buildDojo() {
  const M = mats();
  const g = new THREE.Group();
  const warm = createFacadeMaterial({ base: 0x241a16, glow: 0xffb36b, glow2: 0xfff0c8, density: 0.65, floor: 3.4, col: 3.2 });

  // Basamento a gradoni
  g.add(box(78, 2, 78, M.stone));
  g.add(box(70, 2, 70, M.stone, 0, 2));

  const widths = [56, 47, 38, 30, 22];
  const roofGeo = new THREE.ConeGeometry(1 / Math.SQRT2, 1, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  let y = 4;
  widths.forEach((w, i) => {
    const bw = w * 0.74;
    g.add(box(bw, 10, bw, warm, 0, y));
    g.add(box(w * 0.98, 0.7, w * 0.98, M.neonOrange, 0, y + 10));
    const roof = new THREE.Mesh(roofGeo, M.roofBlue);
    roof.scale.set(w, i === widths.length - 1 ? 12 : 5.5, w);
    roof.position.y = y + 10.7 + roof.scale.y / 2;
    g.add(roof);
    y += 13;
  });

  // Pinnacolo con la sfera arancione
  const peak = y + 4;
  g.add(cyl(0.5, 0.8, 9, 8, M.silver, peak - 2));
  const orb = new THREE.Mesh(new THREE.SphereGeometry(3.4, 32, 24), M.neonOrange);
  orb.position.y = peak + 10;
  g.add(orb);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.25, 8, 48), M.neonOrange);
  halo.position.y = orb.position.y;
  g.add(halo);

  // La Mensa del Parlamento — sempre aperta
  const mensaX = 64;
  g.add(box(42, 2, 30, M.stone, mensaX, 0));
  g.add(box(38, 12, 26, warm, mensaX, 2));
  g.add(box(38.4, 0.6, 26.4, M.steel, mensaX, 14));
  g.add(frame(38.6, 26.6, 0.6, M.neonOrange, mensaX, 14));
  const s = sign('MENSA · SEMPRE APERTA', 30, 4.7, { color: '#ffb36b' });
  s.position.set(mensaX, 9, 13.1);
  g.add(s);

  // Ponte coperto tra dojo e mensa
  g.add(box(22, 3, 6, M.steel, 38, 8));
  g.add(frame(22, 6.2, 0.35, M.neonOrange, 38, 11));

  g.userData.update = (t) => {
    halo.rotation.x = Math.PI / 2 + Math.sin(t * 0.8) * 0.4;
    halo.rotation.y = t * 0.9;
    orb.scale.setScalar(1 + Math.sin(t * 2.2) * 0.05);
  };
  return g;
}

/* ------------------------------------------------------------------ */
/* 3. Parlamento del Codice Aperto                                      */
/* ------------------------------------------------------------------ */
function buildParlamento() {
  const M = mats();
  const g = new THREE.Group();
  const facade = createFacadeMaterial({ base: 0x1c2333, glow: 0xcfe2ff, glow2: 0x9cc8ff, density: 0.6, floor: 5.5, col: 4 });
  const drumMat = createFacadeMaterial({ base: 0x1a2130, glow: 0x6fe3ff, glow2: 0xffffff, density: 0.75, floor: 4, col: 3, curved: true });

  g.add(box(116, 2, 84, M.stone));
  g.add(box(108, 2, 78, M.stone, 0, 2));
  g.add(box(100, 2, 72, M.stone, 0, 4));

  g.add(box(86, 24, 54, facade, 0, 6));

  // Colonnato frontale
  const colGeo = new THREE.CylinderGeometry(1.3, 1.5, 22, 16);
  const cols = new THREE.InstancedMesh(colGeo, M.silver, 13);
  for (let i = 0; i < 13; i++) {
    dummy.position.set(-42 + i * 7, 6 + 11, 32);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    cols.setMatrixAt(i, dummy.matrix);
  }
  g.add(cols);
  g.add(box(92, 3, 10, M.silver, 0, 28, 30));
  g.add(box(92.4, 0.6, 0.4, M.neonCyan, 0, 29.2, 35.1));

  // Tamburo e cupola trasparente
  const domeY = 38;
  g.add(cyl(27, 27, 8, 64, drumMat, 30));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(26, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), M.glass);
  dome.position.y = domeY;
  g.add(dome);
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.SphereGeometry(26.2, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2)),
    neonLine(0x6fe3ff, 1.8, 0.85),
  );
  wire.position.y = domeY;
  g.add(wire);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 1), M.neonBlue);
  core.position.y = domeY + 9;
  g.add(core);

  g.add(cyl(3.5, 4, 6, 16, M.silver, domeY + 25.5));
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 18, 8), M.silver);
  spire.position.y = domeY + 31.5 + 9;
  g.add(spire);

  g.userData.update = (t) => {
    core.rotation.y = t * 0.4;
    core.rotation.x = t * 0.25;
  };
  return g;
}

/* ------------------------------------------------------------------ */
/* 4. Istituto Nazionale di Intelligenza Artificiale                    */
/* ------------------------------------------------------------------ */
function buildIstitutoIA() {
  const M = mats();
  const g = new THREE.Group();
  const coreMat = createFacadeMaterial({ base: 0x151d2c, glow: 0x6fe3ff, glow2: 0xffffff, density: 0.55, floor: 4, col: 3, curved: true });

  g.add(cyl(44, 46, 4, 64, M.stone));
  g.add(cyl(14, 19, 240, 48, coreMat, 4));
  g.add(cyl(10, 14, 12, 32, M.silver, 244));
  g.add(cyl(0.7, 1, 22, 8, M.silver, 256));

  const layers = [
    { n: 6, y: 40, r: 32 },
    { n: 10, y: 78, r: 41 },
    { n: 14, y: 116, r: 47 },
    { n: 14, y: 154, r: 47 },
    { n: 10, y: 192, r: 41 },
    { n: 6, y: 226, r: 32 },
  ];
  const nodes = [];
  layers.forEach((L, li) => {
    const list = [];
    for (let k = 0; k < L.n; k++) {
      const a = (k / L.n) * Math.PI * 2 + li * 0.35;
      list.push(new THREE.Vector3(Math.cos(a) * L.r, L.y, Math.sin(a) * L.r));
    }
    nodes.push(list);
  });

  const all = nodes.flat();
  const nodeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(2.4, 16, 12), M.neonCyan, all.length);
  all.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    nodeMesh.setMatrixAt(i, dummy.matrix);
  });
  g.add(nodeMesh);

  // Sinapsi tra strati consecutivi + raggi verso il nucleo
  const edgesList = [];
  const pos = [];
  for (let li = 0; li < nodes.length - 1; li++) {
    for (const a of nodes[li]) {
      for (const b of nodes[li + 1]) {
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        edgesList.push([a, b]);
      }
    }
  }
  const synGeo = new THREE.BufferGeometry();
  synGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const syn = new THREE.LineSegments(synGeo, neonLine(0x2d7dff, 1.4, 0.28));
  g.add(syn);

  const spokePos = [];
  for (const p of all) {
    const coreR = 19 - (p.y / 244) * 5;
    const d = Math.hypot(p.x, p.z);
    spokePos.push(p.x, p.y, p.z, (p.x / d) * coreR, p.y, (p.z / d) * coreR);
  }
  const spokeGeo = new THREE.BufferGeometry();
  spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(spokePos, 3));
  g.add(new THREE.LineSegments(spokeGeo, neonLine(0x6fe3ff, 1.6, 0.6)));

  // Impulsi che viaggiano lungo le sinapsi
  const PULSES = 48;
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(1.1, 8, 6), M.neonWhite, PULSES);
  g.add(pulses);
  const tmp = new THREE.Vector3();

  g.userData.update = (t) => {
    for (let k = 0; k < PULSES; k++) {
      const speed = 0.35 + (k % 7) * 0.05;
      const phase = (k * 0.618) % 1;
      const c = t * speed + phase;
      const cycle = Math.floor(c);
      const e = edgesList[(cycle * 7919 + k * 131) % edgesList.length];
      tmp.lerpVectors(e[0], e[1], c - cycle);
      dummy.position.copy(tmp);
      dummy.updateMatrix();
      pulses.setMatrixAt(k, dummy.matrix);
    }
    pulses.instanceMatrix.needsUpdate = true;
  };
  g.userData.update(0);
  return g;
}

/* ------------------------------------------------------------------ */
/* 5. Banca del Byte Sovrano                                            */
/* ------------------------------------------------------------------ */
function buildBanca() {
  const M = mats();
  const g = new THREE.Group();
  const on = createFacadeMaterial({ base: 0x1a2640, glow: 0x7fb2ff, glow2: 0xffffff, density: 0.92, floor: 4, glowStrength: 1.9 });
  const off = createFacadeMaterial({ base: 0x10141d, glow: 0x9cc8ff, glow2: 0xffc27a, density: 0.1, floor: 4 });
  const frame = neonLine(0x2d7dff, 2.4);

  g.add(box(72, 6, 72, M.stone));

  // 0xB2 = 1011 0010, letto dall'alto verso il basso (MSB in cima).
  const bits = [1, 0, 1, 1, 0, 0, 1, 0];
  const th = 20;
  bits.forEach((bit, i) => {
    const y = 6 + (bits.length - 1 - i) * th;
    const x = bit ? 5 : -5;
    const tier = box(46, th - 0.6, 46, bit ? on : off, x, y);
    g.add(tier);
    if (bit) {
      const e = edges(BOX, frame);
      e.scale.set(46.3, th - 0.3, 46.3);
      e.position.copy(tier.position);
      g.add(e);
    } else {
      g.add(box(46.6, 0.6, 46.6, M.silver, x, y + th - 0.6));
    }
  });

  const roofY = 6 + bits.length * th;
  g.add(box(30, 2, 30, M.steel, 5, roofY));

  // La moneta: un Byte sovrano che ruota sul tetto.
  const coinGeo = new THREE.CylinderGeometry(9, 9, 1.8, 64);
  coinGeo.rotateX(Math.PI / 2);
  const coin = new THREE.Group();
  coin.add(new THREE.Mesh(coinGeo, M.silver));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(9, 0.45, 8, 64), M.neonCyan);
  coin.add(rim);
  const face = sign('BYS', 11, 4, { color: '#6fe3ff', bg: 'rgba(0,0,0,0)', font: 'bold 120px "Chakra Petch", sans-serif', w: 512, h: 186 });
  face.position.z = 0.95;
  const back = face.clone();
  back.rotation.y = Math.PI;
  back.position.z = -0.95;
  coin.add(face, back);
  coin.position.set(5, roofY + 13, 0);
  g.add(coin);

  g.userData.update = (t) => {
    coin.rotation.y = t * 0.8;
  };
  return g;
}

/* ------------------------------------------------------------------ */
/* 6. Biblioteca dello Stack                                            */
/* ------------------------------------------------------------------ */
function buildBiblioteca() {
  const M = mats();
  const g = new THREE.Group();
  const db = createFacadeMaterial({ base: 0x161c29, glow: 0x6fe3ff, glow2: 0x9cc8ff, density: 0.45, floor: 3, col: 3.4, curved: true });
  const back = createFacadeMaterial({ base: 0x1a2232, glow: 0x9cc8ff, glow2: 0xffd29a, density: 0.7, floor: 3.75 });
  const front = createFacadeMaterial({ base: 0x26324a, glow: 0xcfe2ff, glow2: 0xffffff, density: 0.6, floor: 4.5, col: 5, glowStrength: 1.0 });

  g.add(box(96, 2, 96, M.stone));

  // Database: tre dischi, come l'icona universale
  for (let i = 0; i < 3; i++) {
    const y = 2 + i * 10;
    g.add(cyl(31, 31, 9, 64, db, y));
    g.add(cyl(31.8, 31.8, 1, 64, M.neonCyan, y + 9));
  }

  // Backend
  g.add(box(56, 30, 56, back, 0, 32));

  // Strato API: piano sospeso con pilastri
  g.add(box(62, 1.2, 62, M.neonBlue, 0, 62));
  const pillar = new THREE.CylinderGeometry(1.4, 1.4, 6, 12);
  const pillars = new THREE.InstancedMesh(pillar, M.silver, 4);
  [[-24, -24], [24, -24], [-24, 24], [24, 24]].forEach(([x, z], i) => {
    dummy.position.set(x, 66.2, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pillars.setMatrixAt(i, dummy.matrix);
  });
  g.add(pillars);

  // Frontend: vetro e luce
  const fe = box(58, 36, 58, front, 0, 69.2);
  fe.rotation.y = Math.PI / 12;
  g.add(fe);
  const feEdges = edges(BOX, neonLine(0xffffff, 1.4));
  feEdges.scale.set(58.2, 36.1, 58.2);
  feEdges.position.copy(fe.position);
  feEdges.rotation.y = fe.rotation.y;
  g.add(feEdges);

  // Giardino pensile
  const gardenY = 105.2;
  const garden = box(54, 1, 54, M.garden, 0, gardenY);
  garden.rotation.y = Math.PI / 12;
  g.add(garden);
  const treeGeo = new THREE.ConeGeometry(2.6, 8, 7);
  const trees = new THREE.InstancedMesh(treeGeo, M.tree, 22);
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996;
    const r = 6 + (i / 22) * 18;
    const s = 0.7 + ((i * 37) % 10) / 20;
    dummy.position.set(Math.cos(a) * r, gardenY + 1 + 4 * s, Math.sin(a) * r);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    trees.setMatrixAt(i, dummy.matrix);
  }
  g.add(trees);

  return g;
}

/* ------------------------------------------------------------------ */
/* 7. Faro della Cybersecurity                                          */
/* ------------------------------------------------------------------ */
function buildFaro() {
  const M = mats();
  const g = new THREE.Group();
  const facade = createFacadeMaterial({ base: 0x121a28, glow: 0x6fe3ff, glow2: 0x2d7dff, density: 0.42, floor: 4, col: 3.2, curved: true });

  g.add(cyl(46, 48, 3, 6, M.stone));

  // Scudo esagonale (firewall perimetrale)
  const shieldGeo = new THREE.CylinderGeometry(40, 40, 16, 6, 1, true);
  const shield = new THREE.Mesh(
    shieldGeo,
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x2d7dff).multiplyScalar(0.6), transparent: true, opacity: 0.16,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    }),
  );
  shield.position.y = 11;
  g.add(shield);
  const shieldEdges = edges(shieldGeo, neonLine(0x6fe3ff, 2));
  shieldEdges.position.y = 11;
  g.add(shieldEdges);

  const H = 260;
  g.add(cyl(10, 22, H, 6, facade, 3));
  for (let y = 40; y < H; y += 40) {
    const r = 22 - 12 * (y / H) + 1.6;
    g.add(cyl(r, r, 1.1, 6, M.neonCyan, 3 + y));
  }

  const lanternY = 3 + H;
  g.add(cyl(17, 15, 3, 6, M.silver, lanternY));
  g.add(cyl(9, 9, 14, 24, M.glass, lanternY + 3));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 16), M.neonWhite);
  lamp.position.y = lanternY + 10;
  g.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(11.5, 10, 6), M.silver);
  cap.position.y = lanternY + 22;
  g.add(cap);
  g.add(cyl(0.5, 0.8, 18, 8, M.silver, lanternY + 27));

  // Fasci di scansione (esclusi dal calcolo delle dimensioni)
  const beamGeo = new THREE.ConeGeometry(26, 220, 32, 1, true);
  beamGeo.translate(0, -110, 0);
  beamGeo.rotateZ(Math.PI / 2);
  // Il fascio sfuma dalla lanterna verso l'esterno e ai bordi.
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uColor: { value: new THREE.Color(0x9fe9ff) } },
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying float vFacing;
      void main() {
        vAlong = uv.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vFacing = abs(dot(n, normalize(-mv.xyz + vec3(1e-4))));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlong;
      varying float vFacing;
      void main() {
        // Con MSAA i varying possono uscire di poco da [0,1]: pow() di un
        // negativo dà NaN su Direct3D e il bloom lo propaga a tutto lo schermo.
        float along = clamp(vAlong, 0.0, 1.0);
        float a = along * along * 0.22 * smoothstep(0.0, 0.6, clamp(vFacing, 0.0, 1.0));
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
  });
  const beams = new THREE.Group();
  const b1 = new THREE.Mesh(beamGeo, beamMat);
  const b2 = b1.clone();
  b2.rotation.y = Math.PI;
  beams.add(b1, b2);
  beams.position.y = lamp.position.y;
  beams.userData.noBounds = true;
  g.add(beams);

  g.userData.update = (t) => {
    beams.rotation.y = t * 0.6;
  };
  return g;
}

/* ------------------------------------------------------------------ */

const BUILDERS = {
  'torre': buildTorre,
  'dojo': buildDojo,
  'parlamento': buildParlamento,
  'istituto-ia': buildIstitutoIA,
  'banca': buildBanca,
  'biblioteca': buildBiblioteca,
  'faro': buildFaro,
};

export const BUILDINGS = PALAZZI.map((p) => ({ ...p, build: BUILDERS[p.id] }));

/** Altezza reale del modello (esclude fasci di luce e oggetti decorativi). */
export function measure(group) {
  const hidden = [];
  group.traverse((o) => {
    if (o.userData.noBounds) hidden.push(o);
  });
  const parents = hidden.map((o) => o.parent);
  hidden.forEach((o) => o.removeFromParent());
  group.updateMatrixWorld(true);
  const box3 = new THREE.Box3().setFromObject(group);
  hidden.forEach((o, i) => parents[i].add(o));
  return { box: box3, size: box3.getSize(new THREE.Vector3()) };
}
