import { PALAZZI as BUILDINGS } from './data/palazzi.js';

const fmt = (n) => n.toLocaleString('it-IT');
const COMPARE = 'compare';

function infoHTML(b) {
  return `
    <p class="role">${b.role}</p>
    <h3>${b.name}</h3>
    <dl class="stats">
      <div><dt>Altezza</dt><dd>${fmt(b.height)} <small>m</small></dd></div>
      <div><dt>Piani</dt><dd>${b.floors}</dd></div>
      <div><dt>Anno</dt><dd>${b.year}</dd></div>
    </dl>
    <p class="district">${b.district}</p>
    <p class="desc">${b.description}</p>
    <p class="code">${b.code}</p>
  `;
}

function compareHTML() {
  const sorted = [...BUILDINGS].sort((a, b) => b.height - a.height);
  const max = sorted[0].height;
  return `
    <p class="role">Tutti i palazzi · stessa scala</p>
    <h3>Confronto in scala</h3>
    <p class="desc">Gli edifici sono affiancati alla stessa scala, dal più basso al più alto. Il righello a sinistra segna le altezze in metri.</p>
    <ul class="compare-list">
      ${sorted
        .map(
          (b) => `<li><span>${b.name}</span><span class="h">${fmt(b.height)} m</span>
          <span class="bar" style="transform: scaleX(${(b.height / max).toFixed(3)})"></span></li>`,
        )
        .join('')}
    </ul>
  `;
}

/**
 * Interfaccia dell'atlante: schede e scheda informativa funzionano subito,
 * il visualizzatore 3D viene caricato solo quando la sezione si avvicina.
 */
export function initAtlas() {
  const stage = document.getElementById('atlas-stage');
  const canvas = document.getElementById('atlas-canvas');
  const tabs = document.getElementById('atlas-tabs');
  const info = document.getElementById('atlas-info');
  const loading = document.getElementById('atlas-loading');
  const reset = document.getElementById('atlas-reset');

  let current = BUILDINGS[0].id;
  let viewer = null;

  const entries = [...BUILDINGS.map((b) => ({ id: b.id, label: b.short, meta: `${b.height} m` })), { id: COMPARE, label: 'Confronto in scala' }];
  tabs.innerHTML = entries
    .map(
      (e) => `<button class="atlas-tab${e.id === COMPARE ? ' atlas-tab--compare' : ''}" role="tab" type="button"
        id="tab-${e.id}" data-id="${e.id}" aria-controls="atlas-info" aria-selected="false" tabindex="-1">
        <span>${e.label}</span>${e.meta ? `<small>${e.meta}</small>` : ''}</button>`,
    )
    .join('');

  function select(id, { focus = false } = {}) {
    current = id;
    for (const t of tabs.children) {
      const on = t.dataset.id === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) {
        if (focus) t.focus({ preventScroll: true });
        // scorre solo la fila di schede (mobile), mai la pagina
        if (tabs.scrollWidth > tabs.clientWidth) {
          tabs.scrollTo({ left: t.offsetLeft - tabs.clientWidth / 2 + t.offsetWidth / 2, behavior: 'smooth' });
        }
      }
    }
    info.innerHTML = id === COMPARE ? compareHTML() : infoHTML(BUILDINGS.find((b) => b.id === id));
    if (viewer) id === COMPARE ? viewer.compare() : viewer.show(id);
  }

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.atlas-tab');
    if (btn) select(btn.dataset.id);
  });
  tabs.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const i = entries.findIndex((x) => x.id === current);
    select(entries[(i + keys[e.key] + entries.length) % entries.length].id, { focus: true });
  });
  reset.addEventListener('click', () => viewer?.reset());

  // Link "Sede: ..." nelle schede del governo
  document.querySelectorAll('[data-building]').forEach((a) =>
    a.addEventListener('click', () => select(a.dataset.building)),
  );

  select(current);

  const io = new IntersectionObserver(
    async (list) => {
      if (!list.some((x) => x.isIntersecting)) return;
      io.disconnect();
      try {
        const { createViewer } = await import('./three/viewer.js');
        viewer = createViewer(stage, canvas);
        select(current);
        requestAnimationFrame(() => stage.classList.add('is-ready'));
      } catch (err) {
        console.error(err);
        stage.classList.add('is-error');
        loading.textContent = 'Il tuo dispositivo non supporta WebGL: i modelli 3D non sono disponibili.';
      }
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(stage);
}
