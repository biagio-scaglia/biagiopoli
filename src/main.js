import './style.css';
import { initAtlas } from './atlas.js';
import { initVisa } from './visa.js';

/* Barra superiore e menu mobile */
const topbar = document.getElementById('topbar');
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');

const onScroll = () => topbar.classList.toggle('is-solid', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  nav.classList.toggle('is-open', open);
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

/* Voce di menu attiva */
const links = new Map([...nav.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a, id) => a.classList.toggle('is-active', id === e.target.id));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
links.forEach((_, id) => {
  const el = document.getElementById(id);
  if (el) spy.observe(el);
});

/* Comparsa progressiva dei contenuti */
document.querySelectorAll('.section .article-tag, .lead, .intro-body, .section-head, .gov-card, .principles li, .facts, .flag-figure, .world-text, .declaration p, .visa-grid').forEach((el) =>
  el.classList.add('reveal'),
);
document.querySelectorAll('.incident-log li').forEach((li, i) => li.style.setProperty('transition-delay', `${i * 0.45}s`));

const reveal = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-visible');
      reveal.unobserve(e.target);
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
);
document.querySelectorAll('.reveal, .incident').forEach((el) => reveal.observe(el));

/* Atlante dei palazzi (3D caricato su richiesta) */
initAtlas();

/* Ufficio Visti */
initVisa();

/* Città 3D nell'hero, avviata dopo il primo paint */
const heroStage = document.getElementById('hero-stage');
const heroCanvas = document.getElementById('hero-canvas');
const startCity = async () => {
  try {
    const { createCity } = await import('./three/city.js');
    const { buildingCount } = createCity(heroStage, heroCanvas);
    document.getElementById('hero-count').textContent = `${buildingCount.toLocaleString('it-IT')} edifici in scena`;
  } catch (err) {
    console.error(err);
    document.getElementById('hero-count').textContent = 'Città 3D non disponibile';
  }
};
if ('requestIdleCallback' in window) requestIdleCallback(startCity, { timeout: 600 });
else setTimeout(startCity, 60);
