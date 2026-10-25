// Costruisce ogni modello in Node e confronta le dimensioni reali con i metadati.
import { BUILDINGS, measure } from '../src/three/buildings.js';

let ok = true;
for (const b of BUILDINGS) {
  const g = b.build();
  const { size } = measure(g);
  let meshes = 0;
  g.traverse((o) => { if (o.isMesh || o.isLine) meshes++; });
  const h = Math.round(size.y);
  const flag = Math.abs(h - b.height) <= 1 ? 'ok' : `MISMATCH (metadati ${b.height})`;
  if (flag !== 'ok') ok = false;
  console.log(`${b.id.padEnd(12)} h=${String(h).padStart(4)} m  w=${size.x.toFixed(0)} d=${size.z.toFixed(0)}  oggetti=${meshes}  ${flag}`);
}
process.exit(ok ? 0 : 1);
