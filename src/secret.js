// Area riservata: modale con password e apertura dell'Arsenale.
// Nota: è un controllo lato client, pensato per gioco, non per proteggere dati reali.

const HASH = '02ed6eadea5a71ab676c6003d88311553b3e4013a5a0b77c6f680fbeb4587a8e';
const SESSION_KEY = 'biagiopoli.secret';

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(bytes);
}

// crypto.subtle esiste solo in contesti sicuri (https/localhost): fallback per http in LAN.
function sha256Fallback(bytes) {
  const K = [];
  const H = [];
  const frac = (x) => ((x - Math.floor(x)) * 0x100000000) | 0;
  for (let n = 2, found = 0; found < 64; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) prime = false;
    if (!prime) continue;
    if (found < 8) H.push(frac(Math.sqrt(n)));
    K.push(frac(Math.cbrt(n)));
    found++;
  }
  const len = bytes.length;
  const total = Math.ceil((len + 9) / 64) * 64;
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[len] = 0x80;
  const view = new DataView(msg.buffer);
  view.setUint32(total - 4, len * 8);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const w = new Int32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getInt32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) | 0));
  }
  return H.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

export function initSecret() {
  const gate = document.getElementById('secret-gate');
  const armory = document.getElementById('armory');
  const modal = document.getElementById('secret-modal');
  const form = document.getElementById('secret-form');
  const input = document.getElementById('secret-password');
  const error = document.getElementById('secret-error');
  if (!modal || !armory) return;

  async function unlock({ scroll = true } = {}) {
    const { renderArmory } = await import('./armory.js');
    renderArmory(armory);
    gate.hidden = true;
    armory.hidden = false;
    if (scroll) armory.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* storage non disponibile */
    }
  }

  armory.addEventListener('armory:lock', () => {
    armory.hidden = true;
    gate.hidden = false;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage non disponibile */
    }
    gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('secret-open').addEventListener('click', () => {
    error.textContent = '';
    input.value = '';
    modal.showModal();
    input.focus();
  });
  document.getElementById('secret-cancel').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close(); // clic sullo sfondo
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ((await sha256(input.value.trim())) === HASH) {
      modal.close();
      unlock();
    } else {
      error.textContent = 'Parola d’ordine errata. Il tentativo è stato registrato dal Ministero della Difesa.';
      form.classList.remove('shake');
      void form.offsetWidth;
      form.classList.add('shake');
      input.select();
    }
  });

  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') unlock({ scroll: false });
  } catch {
    /* storage non disponibile */
  }
}
