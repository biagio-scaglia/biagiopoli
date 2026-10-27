# Biagiopoli

Stato sovrano tecnologico · Costituzione del 2026.

Sito della Repubblica di Biagiopoli con i palazzi di Neo-Biagiopoli in 3D, ideato da Biagio Scaglia.

- **Hero**: Neo-Biagiopoli, una città procedurale di oltre 1.500 edifici con traffico stradale e aereo, e la Torre Scaglia al centro.
- **Atlante dei palazzi**: sette edifici istituzionali modellati in scala reale (1 unità = 1 metro), con righello delle altezze e confronto in scala.
- **Ufficio Visti**: modulo di richiesta salvato in localStorage, visto generato su canvas (con foto, firma e zona a lettura ottica) ed esportabile in PNG o JPG da inviare al Presidente per l'approvazione. Nessun dato lascia il dispositivo.
- **Area riservata**: il pulsante *Secret* apre una modale con password; sbloccata, mostra l'Arsenale della Repubblica (razzi con lancio di prova e armi varie). Il controllo è lato client (hash SHA-256), quindi è un easter egg, non una protezione reale.

| Palazzo | Altezza |
| --- | --- |
| Torre Scaglia (Presidenza) | 428 m |
| Faro della Cybersecurity | 308 m |
| Istituto Nazionale di IA | 278 m |
| Banca del Byte Sovrano | 188 m |
| Biblioteca dello Stack | 115 m |
| Dojo della Difesa Nazionale | 89 m |
| Parlamento del Codice Aperto | 88 m |

## Sviluppo

```bash
npm install
npm run dev            # server di sviluppo
npm run build          # build di produzione in dist/
npm run check:models   # verifica che le altezze dei modelli corrispondano ai dati
```

## Tecnica

- Vite + Three.js, nessun asset 3D esterno: tutti i modelli sono generati nel codice (`src/three/buildings.js`).
- Le finestre sono uno shader procedurale in metri reali (`src/three/facade.js`): un piano ogni ~3,8 m.
- Three.js viene caricato solo dopo il primo paint; l'atlante 3D solo quando la sezione si avvicina.
- Il rendering si ferma fuori schermo e con la scheda in background; la qualità si adatta (prima si spegne il bloom, poi cala la risoluzione).
- Deploy automatico su GitHub Pages tramite `.github/workflows/deploy.yml`.
