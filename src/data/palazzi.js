// Metadati dei palazzi (senza dipendenze da three.js, caricati subito).
// Le altezze sono verificate sui modelli con `npm run check:models`.

export const PALAZZI = [
  {
    id: 'torre',
    short: 'Torre Scaglia',
    name: 'Torre Scaglia',
    role: 'Palazzo della Presidenza della Repubblica',
    district: 'Distretto Centrale · Piazza del Commit',
    height: 428,
    floors: 96,
    year: 2026,
    description:
      'Il cuore istituzionale di Neo-Biagiopoli. Qui il Presidente Biagio I Scaglia definisce la strategia nazionale e supervisiona lo sviluppo tecnologico dello Stato. La corona a otto punte riprende il sigillo della bandiera.',
    code:
      'Ogni piano è un commit: 90 solette ruotate di 0,9° l’una sull’altra, come una cronologia git che non smette mai di evolvere. Un anello di luce ogni dieci piani segna una release.',
  },
  {
    id: 'dojo',
    short: 'Dojo della Difesa',
    name: 'Dojo della Difesa Nazionale',
    role: 'Sede del Primo Ministro e Ministero della Difesa',
    district: 'Quartiere Orientale · Colle del Kamehameha',
    height: 89,
    floors: 6,
    year: 2026,
    description:
      'Quartier generale di Son Goku. Cinque livelli di pagoda per l’addestramento delle forze di difesa, una sfera arancione sul pinnacolo e, collegata da un ponte coperto, la Mensa del Parlamento: per Costituzione sempre aperta.',
    code:
      'Architettura a microservizi: il dojo gestisce la sicurezza, la mensa gestisce il carico. Il ponte tra i due è l’unica API che il Primo Ministro usa davvero.',
  },
  {
    id: 'parlamento',
    short: 'Parlamento',
    name: 'Parlamento del Codice Aperto',
    role: 'Assemblea legislativa della Repubblica',
    district: 'Distretto Civico · Viale della Libertà',
    height: 88,
    floors: 5,
    year: 2026,
    description:
      'Tredici colonne d’argento e una cupola completamente trasparente: i lavori dell’Assemblea sono visibili a ogni cittadino. Sotto la cupola ruota il nucleo che ospita il registro pubblico delle leggi.',
    code:
      'Ogni legge è una pull request pubblica: chiunque può leggerla, commentarla, proporre modifiche. Nessuna norma entra in vigore senza aver superato la code review.',
  },
  {
    id: 'istituto-ia',
    short: 'Istituto IA',
    name: 'Istituto Nazionale di Intelligenza Artificiale',
    role: 'Centro di ricerca sull’IA e sul calcolo',
    district: 'Polo della Ricerca · Anello Neurale',
    height: 278,
    floors: 62,
    year: 2026,
    description:
      'Un nucleo di ricerca alto 240 metri avvolto da sei strati di neuroni luminosi. Gli impulsi che corrono lungo le sinapsi sono il traffico reale dei laboratori: si fermano solo quando si ferma la curiosità.',
    code:
      'Sei layer, sessanta nodi, quasi seicento connessioni: una rete neurale fully-connected in scala architettonica. Principio guida: nessun modello diventa più importante delle persone che lo usano.',
  },
  {
    id: 'banca',
    short: 'Banca del BYS',
    name: 'Banca del Byte Sovrano',
    role: 'Banca centrale e zecca del BYS',
    district: 'Distretto Finanziario · Via dei Registri',
    height: 188,
    floors: 40,
    year: 2026,
    description:
      'Otto volumi sfalsati, uno per ogni bit. Sul tetto ruota il Byte sovrano, la moneta nazionale. I volumi accesi sono di vetro e luce, quelli spenti di metallo scuro.',
    code:
      'Letta dall’alto verso il basso la facciata scrive 1011 0010: 0xB2, 178 in decimale. È il byte con cui fu coniata la prima moneta della Repubblica.',
  },
  {
    id: 'biblioteca',
    short: 'Biblioteca',
    name: 'Biblioteca dello Stack',
    role: 'Biblioteca nazionale del software libero',
    district: 'Distretto della Conoscenza · Largo Open Source',
    height: 115,
    floors: 24,
    year: 2026,
    description:
      'Il sapere come infrastruttura. Si entra dagli archivi e si sale fino alle sale di lettura di vetro, con un giardino pensile in cima. L’accesso è libero e gratuito per ogni cittadino.',
    code:
      'L’edificio è uno stack completo: i dischi del database alla base, il backend al centro, lo strato API sospeso su pilastri e il frontend di vetro in alto, ruotato di 15° perché l’interfaccia guarda sempre verso le persone.',
  },
  {
    id: 'faro',
    short: 'Faro Cyber',
    name: 'Faro della Cybersecurity',
    role: 'Agenzia per la sicurezza informatica nazionale',
    district: 'Porto Digitale · Molo del Firewall',
    height: 308,
    floors: 65,
    year: 2026,
    description:
      'Il faro esagonale vigila sul Porto Digitale. Alla base, uno scudo di luce perimetrale; in cima, due fasci che scandagliano l’orizzonte giorno e notte alla ricerca di anomalie.',
    code:
      'Defense in depth: perimetro, torre, lanterna. Gli anelli ogni 40 metri sono livelli di protezione indipendenti: se uno cade, gli altri restano accesi.',
  },
];
