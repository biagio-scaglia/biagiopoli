// Arsenale della Repubblica: caricato solo dopo lo sblocco dell'area riservata.

const ART = {
  kamehameha: `
    <g class="rocket">
      <path class="flame" d="M52 150 Q60 185 68 150 Q60 165 52 150Z" fill="#ffb36b"/>
      <path class="flame" d="M55 150 Q60 172 65 150Z" fill="#fff0c8"/>
      <path d="M44 120 L30 150 L46 146Z" fill="#ff7a1a"/>
      <path d="M76 120 L90 150 L74 146Z" fill="#ff7a1a"/>
      <path d="M60 14 Q78 40 78 70 V146 H42 V70 Q42 40 60 14Z" fill="#dfe5ee"/>
      <path d="M60 14 Q72 30 76 50 H44 Q48 30 60 14Z" fill="#ff7a1a"/>
      <rect x="42" y="118" width="36" height="6" fill="#2d7dff"/>
      <circle cx="60" cy="80" r="11" fill="#0b1426" stroke="#2d7dff" stroke-width="3"/>
      <circle cx="60" cy="80" r="5" fill="#6fe3ff"/>
    </g>`,
  revert: `
    <g class="rocket">
      <path class="flame" d="M54 156 Q60 190 66 156Z" fill="#6fe3ff"/>
      <path d="M52 128 L40 156 L54 152Z" fill="#2d7dff"/>
      <path d="M68 128 L80 156 L66 152Z" fill="#2d7dff"/>
      <path d="M60 10 Q70 30 70 56 V152 H50 V56 Q50 30 60 10Z" fill="#c9d1dc"/>
      <path d="M50 40 L40 52 L50 56Z M70 40 L80 52 L70 56Z" fill="#2d7dff"/>
      <path d="M53 90 a7 7 0 1 1 7 7 h-4 m0 0 l4 -4 m-4 4 l4 4" fill="none" stroke="#0b1426" stroke-width="2.5" stroke-linecap="round"/>
    </g>`,
  sudo: `
    <g class="rocket">
      <path class="flame" d="M44 150 Q60 196 76 150Z" fill="#ffb36b"/>
      <path class="flame" d="M24 140 Q30 168 36 140Z M84 140 Q90 168 96 140Z" fill="#ffb36b"/>
      <path d="M30 70 Q30 56 30 56 Q24 70 24 80 V140 H36 V80 Q36 70 30 56Z" fill="#8d97a8"/>
      <path d="M90 56 Q84 70 84 80 V140 H96 V80 Q96 70 90 56Z" fill="#8d97a8"/>
      <path d="M60 8 Q82 34 82 66 V150 H38 V66 Q38 34 60 8Z" fill="#eef2f8"/>
      <path d="M60 8 Q76 26 80 46 H40 Q44 26 60 8Z" fill="#2d7dff"/>
      <text x="60" y="104" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="#0b1426">sudo</text>
      <rect x="38" y="122" width="44" height="5" fill="#ff3b3b"/>
    </g>`,
  ion: `
    <rect x="22" y="138" width="76" height="14" rx="3" fill="#2b3342"/>
    <path d="M36 138 L46 104 H74 L84 138Z" fill="#8d97a8"/>
    <g transform="rotate(-32 60 104)">
      <rect x="54" y="20" width="12" height="90" rx="3" fill="#c9d1dc"/>
      <rect x="50" y="34" width="20" height="5" fill="#2d7dff"/>
      <rect x="50" y="52" width="20" height="5" fill="#2d7dff"/>
      <rect x="50" y="70" width="20" height="5" fill="#2d7dff"/>
      <circle class="pulse" cx="60" cy="16" r="7" fill="#6fe3ff"/>
    </g>
    <circle cx="60" cy="104" r="12" fill="#0b1426" stroke="#c9d1dc" stroke-width="3"/>`,
  railgun: `
    <rect x="10" y="64" width="100" height="6" fill="#c9d1dc"/>
    <rect x="10" y="88" width="100" height="6" fill="#c9d1dc"/>
    <rect x="14" y="70" width="80" height="18" fill="#141c2c"/>
    <rect class="pulse" x="18" y="76" width="70" height="6" fill="#6fe3ff"/>
    <rect x="20" y="94" width="34" height="34" rx="4" fill="#2b3342"/>
    <rect x="26" y="100" width="22" height="8" fill="#2d7dff"/>
    <text x="78" y="118" font-family="IBM Plex Mono, monospace" font-size="12" fill="#7f8ca3">null</text>`,
  shield: `
    <path d="M14 140 A46 46 0 0 1 106 140" fill="rgba(45,125,255,.16)" stroke="#6fe3ff" stroke-width="2.5"/>
    <path class="pulse" d="M28 140 A32 32 0 0 1 92 140" fill="none" stroke="#2d7dff" stroke-width="1.5" stroke-dasharray="4 4"/>
    <g fill="#c9d1dc">
      <rect x="46" y="104" width="8" height="36"/><rect x="56" y="92" width="8" height="48"/>
      <rect x="66" y="112" width="7" height="28"/><rect x="38" y="118" width="6" height="22"/>
      <rect x="75" y="120" width="6" height="20"/>
    </g>
    <rect x="8" y="140" width="104" height="3" fill="#2d7dff"/>`,
  fork: `
    <g class="drone"><rect x="48" y="40" width="24" height="10" rx="3" fill="#c9d1dc"/><path d="M40 38 H56 M64 38 H80" stroke="#6fe3ff" stroke-width="3"/></g>
    <g class="drone d2"><rect x="18" y="86" width="20" height="8" rx="3" fill="#8d97a8"/><path d="M12 84 H26 M30 84 H44" stroke="#6fe3ff" stroke-width="2.5"/></g>
    <g class="drone d3"><rect x="82" y="86" width="20" height="8" rx="3" fill="#8d97a8"/><path d="M76 84 H90 M94 84 H108" stroke="#6fe3ff" stroke-width="2.5"/></g>
    <g class="drone d4"><rect x="34" y="126" width="16" height="7" rx="2" fill="#5b6578"/><path d="M29 124 H40 M44 124 H55" stroke="#6fe3ff" stroke-width="2"/></g>
    <g class="drone d5"><rect x="70" y="126" width="16" height="7" rx="2" fill="#5b6578"/><path d="M65 124 H76 M80 124 H91" stroke="#6fe3ff" stroke-width="2"/></g>
    <path d="M60 52 L28 84 M60 52 L92 84 M28 96 L42 122 M92 96 L78 122" stroke="rgba(143,184,255,.35)" stroke-dasharray="3 3"/>`,
  staff: `
    <g transform="rotate(-38 60 80)">
      <rect x="55" y="6" width="10" height="148" rx="4" fill="#c62828"/>
      <rect x="53" y="6" width="14" height="14" rx="3" fill="#ffc94d"/>
      <rect x="53" y="140" width="14" height="14" rx="3" fill="#ffc94d"/>
    </g>
    <circle class="pulse" cx="96" cy="30" r="9" fill="#ff7a1a"/>`,
};

const WEAPONS = [
  {
    id: 'kamehameha',
    name: 'Razzo Kamehameha-1',
    cls: 'Razzo strategico',
    status: 'Operativo',
    auth: 'Primo Ministro',
    rocket: true,
    stats: { Potenza: 98, Gittata: 90, Precisione: 72 },
    specs: ['Gittata 12.000 km', 'Velocità Mach 23', 'Carico: onda di energia concentrata'],
    desc: 'Progettato su specifica diretta di Goku, che ha chiesto "una cosa che faccia whoosh e poi BOOM, ma in modo gentile". L’onda colpisce solo le minacce e lascia intatte le mense.',
  },
  {
    id: 'revert',
    name: 'Intercettore git revert',
    cls: 'Missile antimissile',
    status: 'Operativo',
    auth: 'Ministero della Difesa',
    rocket: true,
    stats: { Potenza: 55, Gittata: 60, Precisione: 99 },
    specs: ['Gittata 400 km', 'Velocità Mach 9', 'Tempo di reazione 0,8 s'],
    desc: 'Non distrugge il missile nemico: lo riporta al commit precedente, quando era ancora in un hangar dall’altra parte del mondo. Zero vittime, cronologia pulita.',
  },
  {
    id: 'sudo',
    name: 'Vettore pesante sudo',
    cls: 'Razzo a privilegi massimi',
    status: 'Classificato',
    auth: 'Presidente della Repubblica',
    rocket: true,
    stats: { Potenza: 100, Gittata: 100, Precisione: 88 },
    specs: ['Due booster laterali', 'Carico utile 140 t', 'Richiede la password del Presidente'],
    desc: 'L’ultima risorsa della Repubblica. Il lancio richiede la firma del Presidente e la conferma esplicita: "Sei sicuro di voler continuare? [s/N]". Finora tutti hanno risposto N.',
  },
  {
    id: 'ion',
    name: 'Cannone a ioni Garbage Collector',
    cls: 'Arma a energia',
    status: 'Operativo',
    auth: 'Agenzia Cybersecurity',
    stats: { Potenza: 80, Gittata: 85, Precisione: 90 },
    specs: ['Portata orbitale', 'Ricarica 12 s', 'Raffreddamento a liquido'],
    desc: 'Individua automaticamente i detriti orbitali non più referenziati e li libera dall’orbita. Gira in background: nessuno sa esattamente quando parte.',
  },
  {
    id: 'railgun',
    name: 'Railgun Null Pointer',
    cls: 'Cannone elettromagnetico',
    status: 'In sviluppo',
    auth: 'Istituto IA',
    stats: { Potenza: 92, Gittata: 70, Precisione: 3 },
    specs: ['Velocità del proiettile 3 km/s', 'Alimentazione 32 MJ', 'Bersaglio: null'],
    desc: 'Potentissima, ma ogni proiettile punta a un indirizzo che non esiste. Il collaudo prosegue: i bersagli inesistenti sono stati colpiti tutti con successo.',
  },
  {
    id: 'shield',
    name: 'Scudo Firewall 2.0',
    cls: 'Difesa della capitale',
    status: 'Sempre attivo',
    auth: 'Faro della Cybersecurity',
    stats: { Potenza: 70, Gittata: 40, Precisione: 100 },
    specs: ['Cupola di 18 km di diametro', 'Regole: deny all, allow amici', 'Uptime 99,999%'],
    desc: 'Una cupola di energia esagonale che copre Neo-Biagiopoli. Lascia passare cittadini, turisti con visto approvato e consegne della mensa.',
  },
  {
    id: 'fork',
    name: 'Sciame di droni fork()',
    cls: 'Ricognizione',
    status: 'Operativo',
    auth: 'Ministero della Difesa',
    stats: { Potenza: 35, Gittata: 75, Precisione: 82 },
    specs: ['1 drone all’avvio', '1.024 dopo dieci secondi', 'Limite di processi: decreto presidenziale'],
    desc: 'Parte un solo drone, poi ognuno si duplica. Uno sciame da ricognizione che copre il territorio in pochi minuti e torna alla base all’ora di pranzo.',
  },
  {
    id: 'staff',
    name: 'Bastone allungabile del Primo Ministro',
    cls: 'Arma personale',
    status: 'In dotazione a Goku',
    auth: 'Solo Goku',
    stats: { Potenza: 75, Gittata: 99, Precisione: 60 },
    specs: ['Lunghezza: variabile', 'Materiale: sconosciuto', 'Usato anche per raggiungere la mensa'],
    desc: 'Si allunga a comando fino a distanze non ancora misurate. Il Ministero non ha mai capito come funzioni e Goku non ha mai pensato di spiegarlo.',
  },
];

const statusClass = (s) =>
  s === 'Classificato' ? 'is-red' : s === 'In sviluppo' ? 'is-amber' : 'is-green';

function card(w) {
  const bars = Object.entries(w.stats)
    .map(
      ([k, v]) => `<div class="w-stat"><span>${k}</span><span class="w-bar"><i style="width:${v}%"></i></span><b>${v}</b></div>`,
    )
    .join('');
  return `
    <article class="weapon" data-id="${w.id}">
      <div class="weapon-art">
        <svg viewBox="0 0 120 200" aria-hidden="true">${ART[w.id]}</svg>
        ${w.rocket ? `<button type="button" class="launch-btn" data-launch="${w.id}">Lancio di prova</button>` : ''}
      </div>
      <div class="weapon-body">
        <p class="weapon-cls">${w.cls}</p>
        <h3>${w.name}</h3>
        <p class="weapon-status ${statusClass(w.status)}">${w.status} · <span>Autorizza: ${w.auth}</span></p>
        <div class="w-stats">${bars}</div>
        <ul class="weapon-specs">${w.specs.map((s) => `<li>${s}</li>`).join('')}</ul>
        <p class="weapon-desc">${w.desc}</p>
      </div>
    </article>`;
}

export function renderArmory(root) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';
  const rockets = WEAPONS.filter((w) => w.rocket);
  const others = WEAPONS.filter((w) => !w.rocket);
  root.innerHTML = `
    <div class="armory-head">
      <div>
        <div class="article-tag">Livello Omega · Accesso autorizzato</div>
        <h2>Arsenale della Repubblica</h2>
      </div>
      <p>
        Ai sensi dell'Articolo IV, ogni sistema d'arma di Biagiopoli è destinato esclusivamente alla protezione della
        popolazione. Nessuna di queste armi è mai stata usata: è bastato che Goku chiedesse «Dove sono?».
      </p>
      <button type="button" class="hud-btn" id="armory-lock">Chiudi arsenale</button>
    </div>

    <h3 class="armory-group"><span>01</span>Razzi</h3>
    <div class="weapons weapons--rockets">${rockets.map(card).join('')}</div>

    <h3 class="armory-group"><span>02</span>Armi varie</h3>
    <div class="weapons">${others.map(card).join('')}</div>

    <p class="armory-foot mono">// documento classificato · la diffusione è punita con una settimana senza mensa</p>
  `;

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-launch]');
    if (btn) {
      const art = btn.closest('.weapon-art');
      if (art.classList.contains('is-launching')) return;
      art.classList.add('is-launching');
      btn.disabled = true;
      btn.textContent = '3… 2… 1…';
      setTimeout(() => {
        art.classList.remove('is-launching');
        btn.disabled = false;
        btn.textContent = 'Lancio di prova';
      }, 2600);
    }
    if (e.target.closest('#armory-lock')) root.dispatchEvent(new CustomEvent('armory:lock', { bubbles: true }));
  });
}
