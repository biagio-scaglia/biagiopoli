// Ufficio Visti: modulo salvato in localStorage, visto disegnato su canvas
// ed esportato come PNG/JPG. Nessun dato lascia il dispositivo.

const STORAGE_KEY = 'biagiopoli.visto.v1';
const NUMBER_RE = /^BP\d{2}[A-Z0-9]{5}$/;
const W = 1600;
const H = 1000;
const REQUIRED = ['nome', 'cognome', 'nascita', 'nazionalita', 'tipo', 'arrivo', 'giuramento'];

const C = {
  bg1: '#0b1426',
  bg2: '#060b16',
  line: 'rgba(143, 184, 255, 0.22)',
  text: '#eef2f8',
  muted: '#7f8ca3',
  blue: '#2d7dff',
  cyan: '#6fe3ff',
  silver: '#c9d1dc',
  orange: '#ff7a1a',
};

const SEAL = {
  crown: new Path2D('M21 25 L23.5 16 L28 21.5 L32 13 L36 21.5 L40.5 16 L43 25 Z'),
  city: new Path2D('M17 46 V38 H21 V33 H24 V40 H27 V29 H30 V22.5 H34 V29 H37 V36 H40 V31 H43 V39 H47 V46 Z'),
};

/* ---------------------------------------------------------- storage */

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage non disponibile */
  }
}

/* ---------------------------------------------------------- utilità */

function visaNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // 9 caratteri, come il campo numero della zona a lettura ottica
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const code = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return `BP${String(new Date().getFullYear()).slice(2)}${code}`;
}

const pad = (n) => String(n).padStart(2, '0');

function parseDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return y ? new Date(y, m - 1, d) : null;
}

const fmtDate = (d) => (d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : '');
const yymmdd = (d) => (d ? `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}` : '<<<<<<');

function expiry(data) {
  const start = parseDate(data.arrivo);
  const days = Number(data.durata ?? 30);
  if (!start || !days) return null;
  const e = new Date(start);
  e.setDate(e.getDate() + days);
  return e;
}

/** Testo in caratteri MRZ: maiuscolo, senza accenti, spazi → '<'. */
function mrzText(s = '') {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '<');
}

/** Cifra di controllo ICAO 9303 (pesi 7-3-1). */
function checkDigit(s) {
  const weights = [7, 3, 1];
  let sum = 0;
  [...s].forEach((ch, i) => {
    let v = 0;
    if (ch >= '0' && ch <= '9') v = ch.charCodeAt(0) - 48;
    else if (ch >= 'A' && ch <= 'Z') v = ch.charCodeAt(0) - 55;
    sum += v * weights[i % 3];
  });
  return String(sum % 10);
}

function mrzLines(data) {
  const name = `${mrzText(data.cognome)}<<${mrzText(data.nome)}`;
  const line1 = `V<BPL${name}`.padEnd(44, '<').slice(0, 44);
  const num = mrzText(data.numero).padEnd(9, '<').slice(0, 9);
  const nat = (mrzText(data.nazionalita).replace(/</g, '') + 'XXX').slice(0, 3);
  const birth = yymmdd(parseDate(data.nascita));
  const exp = data.durata === '0' ? '<<<<<<' : yymmdd(expiry(data));
  const line2 = `${num}${checkDigit(num)}${nat}${birth}${checkDigit(birth)}<${exp}${checkDigit(exp)}`.padEnd(44, '<').slice(0, 44);
  return [line1, line2];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Riduce la foto a 360×460 (ritaglio centrato) per non riempire lo storage. */
async function processPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const c = document.createElement('canvas');
    c.width = 360;
    c.height = 460;
    const ctx = c.getContext('2d');
    const s = Math.max(c.width / img.width, c.height / img.height);
    const w = img.width * s;
    const h = img.height * s;
    ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ---------------------------------------------------------- disegno */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Scrive il testo riducendo il corpo finché non entra nella larghezza. */
function fitText(ctx, text, x, y, maxW, size, weight = 600, family = '"Chakra Petch", sans-serif') {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    s -= 1;
  } while (s > 12);
  ctx.fillText(text, x, y);
}

function wrapLines(ctx, text, maxW, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

function drawSeal(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(32, 32, 24.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha /= 0.55;
  ctx.fill(SEAL.crown);
  ctx.fill(SEAL.city);
  ctx.fillRect(14, 45.25, 36, 1.5);
  ctx.restore();
}

function drawGuilloche(ctx) {
  ctx.save();
  ctx.lineWidth = 1;
  for (let k = 0; k < 26; k++) {
    ctx.strokeStyle = `rgba(111, 227, 255, ${0.025 + (k % 3) * 0.012})`;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = 170 + k * 26 + Math.sin(x / 90 + k * 0.6) * 22 + Math.sin(x / 37 + k) * 6;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // rosetta di sicurezza
  ctx.translate(1230, 470);
  for (let k = 0; k < 48; k++) {
    ctx.rotate(Math.PI / 24);
    ctx.strokeStyle = 'rgba(45, 125, 255, 0.05)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 170, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlaceholderPhoto(ctx, x, y, w, h) {
  ctx.fillStyle = '#0e1830';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(143, 184, 255, 0.22)';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.38, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.95, w * 0.42, h * 0.32, 0, Math.PI, 0);
  ctx.fill();
}

function drawField(ctx, label, value, x, y, w) {
  ctx.fillStyle = C.muted;
  ctx.font = '500 19px "IBM Plex Mono", monospace';
  ctx.fillText(label.toUpperCase(), x, y);
  if (value) {
    ctx.fillStyle = C.text;
    fitText(ctx, value, x, y + 42, w, 36);
  } else {
    ctx.fillStyle = 'rgba(127, 140, 163, 0.5)';
    ctx.font = '500 34px "Chakra Petch", sans-serif';
    ctx.fillText('—', x, y + 42);
  }
}

function drawStamp(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.21);
  ctx.strokeStyle = C.orange;
  ctx.fillStyle = C.orange;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 118, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 104, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = '700 30px "Chakra Petch", sans-serif';
  ctx.fillText('IN ATTESA', 0, -8);
  ctx.font = '600 21px "Chakra Petch", sans-serif';
  ctx.fillText('DI APPROVAZIONE', 0, 26);
  ctx.font = '500 15px "IBM Plex Mono", monospace';
  ctx.fillText('UFFICIO VISTI', 0, 64);
  ctx.fillText('★ ★ ★', 0, -50);
  ctx.restore();
}

function drawVisa(ctx, data, images) {
  ctx.clearRect(0, 0, W, H);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Fondo
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, C.bg1);
  g.addColorStop(1, C.bg2);
  roundRect(ctx, 0, 0, W, H, 36);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 36);
  ctx.clip();
  drawGuilloche(ctx);
  ctx.globalAlpha = 0.05;
  drawSeal(ctx, 980, 230, 500, C.silver);
  ctx.globalAlpha = 1;

  // Banda superiore
  ctx.fillStyle = C.blue;
  ctx.fillRect(0, 0, W, 10);
  drawSeal(ctx, 70, 44, 96, C.silver);
  ctx.fillStyle = C.text;
  ctx.font = '700 46px "Chakra Petch", sans-serif';
  ctx.fillText('REPUBBLICA DI BIAGIOPOLI', 190, 92);
  ctx.fillStyle = C.cyan;
  ctx.font = '500 22px "IBM Plex Mono", monospace';
  ctx.fillText("VISTO D'INGRESSO · ENTRY VISA", 192, 130);
  ctx.textAlign = 'right';
  ctx.fillStyle = C.muted;
  ctx.font = '500 19px "IBM Plex Mono", monospace';
  ctx.fillText('N° VISTO', W - 70, 80);
  ctx.fillStyle = C.text;
  ctx.font = '500 32px "IBM Plex Mono", monospace';
  ctx.fillText(data.numero, W - 70, 120);
  ctx.textAlign = 'left';
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, 172);
  ctx.lineTo(W - 70, 172);
  ctx.stroke();

  // Foto
  const px = 70;
  const py = 210;
  const pw = 300;
  const ph = 384;
  if (images.foto) ctx.drawImage(images.foto, px, py, pw, ph);
  else drawPlaceholderPhoto(ctx, px, py, pw, ph);
  ctx.strokeStyle = C.line;
  ctx.strokeRect(px, py, pw, ph);

  // Firma
  const sy = 616;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(px, sy, pw, 120);
  if (images.firma) ctx.drawImage(images.firma, px + 6, sy + 4, pw - 12, (pw - 12) * (220 / 600));
  ctx.strokeStyle = C.line;
  ctx.strokeRect(px, sy, pw, 120);
  ctx.fillStyle = C.muted;
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  ctx.fillText('FIRMA DEL TITOLARE', px, sy + 146);

  // Campi
  const x1 = 420;
  const x2 = 900;
  const cw = 440;
  const nascita = fmtDate(parseDate(data.nascita));
  const arrivo = fmtDate(parseDate(data.arrivo));
  const scad = data.durata === '0' ? 'Permanente' : fmtDate(expiry(data));
  const rows = [
    ['Cognome', data.cognome, 'Nome', data.nome],
    ['Data di nascita', nascita, 'Nazionalità', data.nazionalita],
    ['Tipo di visto', data.tipo, 'Professione', data.professione],
    ['Ingresso', arrivo, 'Valido fino al', arrivo ? scad : ''],
    ['Linguaggio preferito', data.linguaggio, 'Contatto', data.contatto],
  ];
  rows.forEach(([l1, v1, l2, v2], i) => {
    const y = 236 + i * 98;
    drawField(ctx, l1, v1, x1, y, cw);
    drawField(ctx, l2, v2, x2, y, cw - 40);
  });

  // Motivo
  ctx.fillStyle = C.muted;
  ctx.font = '500 19px "IBM Plex Mono", monospace';
  ctx.fillText('MOTIVO DELLA VISITA', x1, 726);
  ctx.fillStyle = data.motivo ? C.silver : 'rgba(127, 140, 163, 0.5)';
  ctx.font = '400 26px "IBM Plex Sans", sans-serif';
  const lines = data.motivo ? wrapLines(ctx, `«${data.motivo}»`, 760, 2) : ['—'];
  lines.forEach((l, i) => ctx.fillText(l, x1, 764 + i * 34));

  drawStamp(ctx, 1390, 690);

  // Data di emissione
  ctx.fillStyle = C.muted;
  ctx.font = '500 16px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`RICHIESTA DEL ${fmtDate(parseDate(data.creato))} · NEO-BIAGIOPOLI`, W - 70, 848);
  ctx.textAlign = 'left';

  // Zona a lettura ottica (MRZ)
  ctx.fillStyle = 'rgba(201, 209, 220, 0.08)';
  ctx.fillRect(0, 870, W, H - 870);
  ctx.fillStyle = C.silver;
  ctx.font = '500 38px "IBM Plex Mono", monospace';
  const advance = (W - 140) / 44;
  mrzLines(data).forEach((line, li) => {
    [...line].forEach((ch, i) => ctx.fillText(ch, 70 + i * advance, 922 + li * 52));
  });

  ctx.restore();
  ctx.strokeStyle = 'rgba(143, 184, 255, 0.35)';
  ctx.lineWidth = 3;
  roundRect(ctx, 1.5, 1.5, W - 3, H - 3, 35);
  ctx.stroke();
}

/* ---------------------------------------------------------- firma */

function initSignature(canvas, onChange) {
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let last = null;
  let dirty = false;

  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#eef2f8';
  ctx.lineWidth = 4.5;

  canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    last = point(e);
    canvas.setPointerCapture(e.pointerId);
    ctx.beginPath();
    ctx.arc(last.x, last.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    dirty = true;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });
  const end = () => {
    if (!drawing) return;
    drawing = false;
    if (dirty) onChange(canvas.toDataURL('image/png'));
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  return {
    async set(dataUrl) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dirty = false;
      if (dataUrl) {
        ctx.drawImage(await loadImage(dataUrl), 0, 0);
        dirty = true;
      }
    },
  };
}

/* ---------------------------------------------------------- init */

export function initVisa() {
  const form = document.getElementById('visa-form');
  const canvas = document.getElementById('visa-canvas');
  if (!form || !canvas) return;
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('visa-status');
  const photoInput = form.elements.foto;
  const photoClear = document.getElementById('photo-clear');
  const counter = form.querySelector('.counter[data-for="motivo"]');

  let data = load();
  if (!NUMBER_RE.test(data.numero || '')) data.numero = visaNumber();
  if (!data.creato) {
    const d = new Date();
    data.creato = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  const images = { foto: null, firma: null };

  // Ripristina i campi salvati; le tendine non toccate prendono il valore predefinito
  for (const el of form.elements) {
    if (el.tagName === 'SELECT' && !(el.name in data)) data[el.name] = el.value;
    if (!el.name || el.type === 'file' || !(el.name in data)) continue;
    if (el.type === 'radio') el.checked = el.value === data[el.name];
    else if (el.type === 'checkbox') el.checked = !!data[el.name];
    else el.value = data[el.name];
  }

  let raf = 0;
  const render = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => drawVisa(ctx, data, images));
  };

  let saveTimer = 0;
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!save(data)) setStatus('Impossibile salvare sul dispositivo (spazio pieno o navigazione privata).', 'warn');
    }, 250);
  };

  function setStatus(text, kind = '') {
    status.textContent = text;
    status.dataset.kind = kind;
  }

  function missing() {
    return REQUIRED.filter((k) => !data[k]);
  }

  function refreshStatus() {
    const m = missing();
    if (m.length === 0) setStatus('Domanda completa: il visto è pronto da scaricare.', 'ok');
    else setStatus(`Domanda salvata su questo dispositivo · mancano ${m.length} campi obbligatori.`);
  }

  function updateCounter() {
    counter.textContent = `${(data.motivo || '').length}/120`;
  }

  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.name || el.type === 'file') return;
    data[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    el.removeAttribute('aria-invalid');
    if (el.name === 'tipo') form.querySelector('.visa-types').removeAttribute('aria-invalid');
    if (el.name === 'motivo') updateCounter();
    persist();
    render();
    refreshStatus();
  });
  form.addEventListener('submit', (e) => e.preventDefault());

  // Foto
  async function setPhoto(dataUrl) {
    data.foto = dataUrl || '';
    images.foto = dataUrl ? await loadImage(dataUrl) : null;
    photoClear.hidden = !dataUrl;
    render();
  }
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    try {
      await setPhoto(await processPhoto(file));
      persist();
    } catch {
      setStatus('Non riesco a leggere questa immagine: prova con un JPG o PNG.', 'warn');
    }
    photoInput.value = '';
  });
  photoClear.addEventListener('click', async () => {
    await setPhoto('');
    persist();
  });

  // Firma
  const sign = initSignature(document.getElementById('sign-pad'), async (url) => {
    data.firma = url;
    images.firma = await loadImage(url);
    persist();
    render();
  });
  document.getElementById('sign-clear').addEventListener('click', () => {
    sign.set('');
    data.firma = '';
    images.firma = null;
    persist();
    render();
  });

  // Esportazione
  document.querySelectorAll('[data-export]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const m = missing();
      if (m.length) {
        m.forEach((k) => {
          const el = k === 'tipo' ? form.querySelector('.visa-types') : form.elements[k];
          el?.setAttribute('aria-invalid', 'true');
        });
        const first = m[0] === 'tipo' ? form.querySelector('input[name="tipo"]') : form.elements[m[0]];
        first?.focus();
        setStatus('Completa i campi obbligatori evidenziati prima di scaricare il visto.', 'warn');
        return;
      }
      const type = btn.dataset.export;
      drawVisa(ctx, data, images);
      const fileName = `visto-biagiopoli-${mrzText(`${data.cognome}-${data.nome}`).toLowerCase().replace(/<+/g, '-')}.${type}`;
      const exportCanvas = type === 'jpg' ? flatten(canvas) : canvas;
      exportCanvas.toBlob(
        (blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          setStatus(`Visto scaricato (${fileName}). Ora invialo al Presidente per l'approvazione.`, 'ok');
        },
        type === 'jpg' ? 'image/jpeg' : 'image/png',
        0.92,
      );
    }),
  );

  // Il JPG non ha trasparenza: gli angoli arrotondati vanno su fondo pieno.
  function flatten(src) {
    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    const cx = c.getContext('2d');
    cx.fillStyle = '#05070c';
    cx.fillRect(0, 0, c.width, c.height);
    cx.drawImage(src, 0, 0);
    return c;
  }

  document.getElementById('visa-reset').addEventListener('click', async () => {
    if (!confirm('Cancellare la domanda salvata e ricominciare?')) return;
    clearStorage();
    form.reset();
    data = { numero: visaNumber(), creato: data.creato };
    for (const el of form.querySelectorAll('select')) data[el.name] = el.value;
    images.foto = images.firma = null;
    photoClear.hidden = true;
    await sign.set('');
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    updateCounter();
    render();
    refreshStatus();
  });

  // Primo disegno, poi ridisegno quando i font sono pronti
  (async () => {
    if (data.foto) await setPhoto(data.foto).catch(() => {});
    if (data.firma) {
      await sign.set(data.firma).catch(() => {});
      images.firma = await loadImage(data.firma).catch(() => null);
    }
    updateCounter();
    render();
    refreshStatus();
    if (document.fonts) {
      await Promise.all(
        ['700 46px "Chakra Petch"', '600 36px "Chakra Petch"', '500 22px "IBM Plex Mono"', '400 26px "IBM Plex Sans"'].map((f) =>
          document.fonts.load(f).catch(() => {}),
        ),
      );
      render();
    }
  })();
}
