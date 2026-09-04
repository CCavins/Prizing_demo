/* ════════════════════════════════════════════════════════════════
   Vixi Trading Card Drop — shared card deck + renderer.

   Generic (unlicensed) basketball cards: abstract prism-shard art,
   giant jersey number, nameplate. Rarity tiers add foil treatments.

   API (window.CardsDeck):
     randomPlayerCard()          -> card data object
     insertCard()                -> foil insert card data ("no prize" slot)
     prizeCard(prize, code)      -> prize card data
     renderCard(card)            -> DOM element (.tcard)
     RARITY_LABEL                -> { base, silver, gold, prism }
   ════════════════════════════════════════════════════════════════ */
(function () {
  // 15 fictional players, each tied 1:1 to a generated artwork in images/cards/.
  const PLAYERS = [
    { name: 'Marcus Vale',  num: 8,  pos: 'SF', team: 'Meteors',    abbr: 'MET', c1: '#ff5f2e', c2: '#2b1055', img: 'images/cards/card01.jpg' },
    { name: 'Ty Brooks',    num: 4,  pos: 'SG', team: 'Voltage',    abbr: 'VLT', c1: '#ffd166', c2: '#073b4c', img: 'images/cards/card02.jpg' },
    { name: 'Deon Carter',  num: 23, pos: 'PG', team: 'Reapers',    abbr: 'RPR', c1: '#9b5de5', c2: '#10002b', img: 'images/cards/card03.jpg' },
    { name: 'Jalen Cross',  num: 11, pos: 'SG', team: 'Cyclones',   abbr: 'CYC', c1: '#00bbf9', c2: '#03045e', img: 'images/cards/card04.jpg' },
    { name: 'Kobe Draper',  num: 2,  pos: 'PF', team: 'Wildcats',   abbr: 'WLD', c1: '#f15bb5', c2: '#3a0ca3', img: 'images/cards/card05.jpg' },
    { name: 'Zeke Harmon',  num: 21, pos: 'PF', team: 'Emberhawks', abbr: 'EMB', c1: '#fb5607', c2: '#1a1a2e', img: 'images/cards/card06.jpg' },
    { name: 'Micah Frost',  num: 13, pos: 'SG', team: 'Frostbite',  abbr: 'FRB', c1: '#90e0ef', c2: '#023e8a', img: 'images/cards/card07.jpg' },
    { name: 'Andre Boone',  num: 34, pos: 'C',  team: 'Titans',     abbr: 'TTN', c1: '#06d6a0', c2: '#1b3a4b', img: 'images/cards/card08.jpg' },
    { name: 'Donte Rivers', num: 9,  pos: 'PG', team: 'Vipers',     abbr: 'VIP', c1: '#d90429', c2: '#2b2d42', img: 'images/cards/card09.jpg' },
    { name: 'Elias Stone',  num: 7,  pos: 'SF', team: 'Sentries',   abbr: 'SEN', c1: '#ffaa00', c2: '#1b4332', img: 'images/cards/card10.jpg' },
    { name: 'Reggie Slate', num: 55, pos: 'PF', team: 'Magma',      abbr: 'MGM', c1: '#e85d04', c2: '#141414', img: 'images/cards/card11.jpg' },
    { name: 'Luka Ashford', num: 77, pos: 'C',  team: 'Phantoms',   abbr: 'PHM', c1: '#b8a1ff', c2: '#0d1b2a', img: 'images/cards/card12.jpg' },
    { name: 'Trey Maddox',  num: 30, pos: 'SG', team: 'Venom',      abbr: 'VNM', c1: '#9ef01a', c2: '#0a2472', img: 'images/cards/card13.jpg' },
    { name: 'Isaiah Kane',  num: 24, pos: 'SF', team: 'Blaze',      abbr: 'BLZ', c1: '#d00000', c2: '#ffba08', img: 'images/cards/card14.jpg' },
    { name: 'Cam Ridley',   num: 1,  pos: 'SG', team: 'Tide',       abbr: 'TDE', c1: '#00b4d8', c2: '#6c757d', img: 'images/cards/card15.jpg' },
  ];

  const RARITY_LABEL = { base: 'Base', silver: 'Silver', gold: 'Gold', prism: 'Prism' };

  function rollRarity() {
    const r = Math.random();
    if (r < 0.02) return 'prism';
    if (r < 0.10) return 'gold';
    if (r < 0.30) return 'silver';
    return 'base';
  }

  function randomPlayerCard() {
    const p = PLAYERS[Math.floor(Math.random() * PLAYERS.length)];
    return {
      kind: 'player',
      id: 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      name: p.name,
      num: p.num,
      pos: p.pos,
      team: p.team,
      abbr: p.abbr,
      c1: p.c1,
      c2: p.c2,
      img: p.img,
      rating: 72 + Math.floor(Math.random() * 27),
      rarity: rollRarity(),
      ts: Date.now(),
    };
  }

  function insertCard() {
    return {
      kind: 'insert',
      id: 'i-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      name: 'VIXI',
      sub: 'Foil Insert',
      c1: '#8ec5ff',
      c2: '#141a2e',
      rarity: 'silver',
      ts: Date.now(),
    };
  }

  function prizeCard(prize, code) {
    return {
      kind: 'prize',
      id: 'z-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      prizeId: prize.id,
      label: prize.label,
      icon: prize.icon,
      img: prize.img || '',
      code: code,
      grand: prize.id === 'car',
      ts: Date.now(),
    };
  }

  // Card back (used for face-down cards during pack reveals)
  function renderCardBack() {
    const el = document.createElement('div');
    el.className = 'tcard tcard-backface';
    el.innerHTML =
      '<div class="tcb-bg"></div>' +
      '<div class="tcb-facets"></div>' +
      '<div class="tc-frame"></div>' +
      '<div class="tcb-mark">V</div>' +
      '<div class="tcb-brand">VIXI PRIZE PACKS</div>' +
      '<div class="tc-foil"></div>';
    return el;
  }

  // ── Renderer ────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCard(card) {
    const el = document.createElement('div');
    el.className = 'tcard tcard-' + card.kind + ' rarity-' + (card.rarity || 'base') + (card.grand ? ' tcard-grand' : '');

    if (card.kind === 'player') {
      el.style.setProperty('--c1', card.c1);
      el.style.setProperty('--c2', card.c2);
      // Generated artwork when available; legacy shard art for older saved cards.
      const art = card.img
        ? '<div class="tc-img" style="background-image:url(\'' + card.img + '\')"></div>'
        : '<div class="tc-shards"><i></i><i></i><i></i><i></i><i></i></div>' +
          '<div class="tc-bignum">' + esc(card.num) + '</div>';
      el.innerHTML =
        '<div class="tc-bg"></div>' +
        art +
        '<div class="tc-frame"></div>' +
        '<div class="tc-top">' +
          '<span class="tc-abbr">' + esc(card.abbr) + '</span>' +
          '<span class="tc-rating">' + esc(card.rating) + '</span>' +
        '</div>' +
        '<div class="tc-plate">' +
          '<div class="tc-name">' + esc(card.name) + '</div>' +
          '<div class="tc-meta">#' + esc(card.num) + ' · ' + esc(card.pos) + ' · ' + esc(card.team) + '</div>' +
        '</div>' +
        '<div class="tc-rarity-tag">' + RARITY_LABEL[card.rarity || 'base'] + '</div>' +
        '<div class="tc-foil"></div>' +
        '<div class="tc-glare"></div>';
    } else if (card.kind === 'insert') {
      el.style.setProperty('--c1', card.c1);
      el.style.setProperty('--c2', card.c2);
      el.innerHTML =
        '<div class="tc-bg"></div>' +
        '<div class="tc-shards"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="tc-frame"></div>' +
        '<div class="tc-insert-mark">V</div>' +
        '<div class="tc-plate">' +
          '<div class="tc-name">' + esc(card.name) + '</div>' +
          '<div class="tc-meta">' + esc(card.sub) + '</div>' +
        '</div>' +
        '<div class="tc-foil"></div>' +
        '<div class="tc-glare"></div>';
    } else {
      el.innerHTML =
        '<div class="tc-bg"></div>' +
        '<div class="tc-shards"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="tc-frame"></div>' +
        '<div class="tc-prize-badge">' + (card.grand ? 'BIG PRIZE' : 'PRIZE CARD') + '</div>' +
        '<div class="tc-prize-icon">' + (card.img ? '<img class="tc-prize-img" src="' + card.img + '" alt="">' : card.icon) + '</div>' +
        '<div class="tc-prize-label">' + esc(card.label) + '</div>' +
        '<div class="tc-prize-code">' + esc(card.code || '') + '</div>' +
        '<div class="tc-prize-redeem">Show at the merch stand</div>' +
        '<div class="tc-foil"></div>' +
        '<div class="tc-glare"></div>';
    }
    return el;
  }

  // ── Injected card styles (shared by output + player) ───────────
  const css = `
  .tcard {
    --c1: #ff5f2e; --c2: #2b1055;
    position: relative;
    width: var(--cardw, 180px);
    aspect-ratio: 5 / 7;
    border-radius: calc(var(--cardw, 180px) * .07);
    overflow: hidden;
    background: #0c0f18;
    box-shadow: 0 10px 30px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08);
    font-family: 'Lato', system-ui, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    flex-shrink: 0;
    transform-style: flat;
    -webkit-transform-style: flat;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .tcard > * {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .tc-bg {
    position: absolute; inset: 0;
    background: linear-gradient(155deg, var(--c1) 0%, var(--c2) 62%, #090b12 100%);
  }
  .tc-img {
    position: absolute; inset: 0;
    background-size: cover;
    background-position: center top;
  }
  /* darken behind the nameplate so it reads over artwork */
  .tc-img::after {
    content: '';
    position: absolute; left: 0; right: 0; bottom: 0;
    height: 34%;
    background: linear-gradient(to top, rgba(5,7,12,.82), transparent);
  }
  .tc-shards { position: absolute; inset: 0; }
  .tc-shards i { position: absolute; display: block; opacity: .8; }
  .tc-shards i:nth-child(1) { inset: 0; background: linear-gradient(200deg, rgba(255,255,255,.28), transparent 45%); clip-path: polygon(0 0, 72% 0, 30% 100%, 0 100%); }
  .tc-shards i:nth-child(2) { inset: 0; background: linear-gradient(120deg, var(--c1), transparent 70%); clip-path: polygon(100% 8%, 100% 55%, 52% 100%, 78% 30%); opacity: .55; }
  .tc-shards i:nth-child(3) { inset: 0; background: linear-gradient(340deg, rgba(255,255,255,.16), transparent 55%); clip-path: polygon(0 62%, 48% 20%, 34% 100%, 0 100%); }
  .tc-shards i:nth-child(4) { inset: 0; background: linear-gradient(30deg, var(--c2), transparent 65%); clip-path: polygon(60% 0, 100% 0, 100% 42%); opacity: .7; }
  .tc-shards i:nth-child(5) { inset: 0; background: linear-gradient(75deg, rgba(0,0,0,.4), transparent 60%); clip-path: polygon(0 100%, 100% 64%, 100% 100%); }
  .tc-bignum {
    position: absolute;
    top: 46%; left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .78);
    line-height: 1;
    color: rgba(255,255,255,.92);
    text-shadow:
      calc(var(--cardw,180px) * .015) calc(var(--cardw,180px) * .02) 0 rgba(0,0,0,.45),
      0 0 calc(var(--cardw,180px) * .18) rgba(255,255,255,.25);
    letter-spacing: -0.04em;
  }
  .tc-frame {
    position: absolute;
    inset: calc(var(--cardw, 180px) * .035);
    border: 1px solid rgba(255,255,255,.35);
    border-radius: calc(var(--cardw, 180px) * .045);
    pointer-events: none;
  }
  .tc-top {
    position: absolute;
    top: calc(var(--cardw, 180px) * .07);
    left: calc(var(--cardw, 180px) * .08);
    right: calc(var(--cardw, 180px) * .08);
    display: flex; justify-content: space-between; align-items: center;
  }
  .tc-abbr {
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .075);
    letter-spacing: .18em;
    color: rgba(255,255,255,.85);
  }
  .tc-rating {
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .1);
    color: #fff;
    background: rgba(0,0,0,.35);
    border: 1px solid rgba(255,255,255,.25);
    border-radius: 99px;
    padding: calc(var(--cardw,180px)*.01) calc(var(--cardw,180px)*.05);
  }
  .tc-plate {
    position: absolute;
    left: calc(var(--cardw, 180px) * .06);
    right: calc(var(--cardw, 180px) * .06);
    bottom: calc(var(--cardw, 180px) * .07);
    background: rgba(6,8,14,.88);
    border: 1px solid rgba(255,255,255,.18);
    border-radius: calc(var(--cardw, 180px) * .04);
    padding: calc(var(--cardw,180px)*.045) calc(var(--cardw,180px)*.05);
    text-align: center;
    transform: translateZ(1px);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .tc-name {
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .088);
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tc-meta {
    font-weight: 700;
    font-size: calc(var(--cardw, 180px) * .056);
    text-transform: uppercase;
    letter-spacing: .14em;
    color: rgba(255,255,255,.55);
    margin-top: calc(var(--cardw,180px)*.012);
  }
  .tc-rarity-tag {
    position: absolute;
    top: calc(var(--cardw, 180px) * .2);
    left: calc(var(--cardw, 180px) * .08);
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .05);
    text-transform: uppercase;
    letter-spacing: .2em;
    color: rgba(255,255,255,.5);
    writing-mode: vertical-rl;
  }
  .rarity-base .tc-rarity-tag { display: none; }

  /* Foil overlays per rarity */
  .tc-foil { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
  .rarity-silver .tc-foil {
    opacity: 1;
    background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.22) 46%, rgba(220,235,255,.4) 50%, rgba(255,255,255,.22) 54%, transparent 70%);
    background-size: 250% 250%;
    animation: tcFoilSweep 4.5s ease-in-out infinite;
  }
  .rarity-gold .tc-foil {
    opacity: 1;
    background:
      linear-gradient(115deg, transparent 32%, rgba(255,215,0,.3) 47%, rgba(255,245,200,.5) 50%, rgba(255,180,0,.3) 53%, transparent 68%);
    background-size: 250% 250%;
    animation: tcFoilSweep 3.5s ease-in-out infinite;
  }
  .rarity-gold .tc-frame { border-color: rgba(255,215,0,.75); box-shadow: inset 0 0 calc(var(--cardw,180px)*.06) rgba(255,215,0,.25); }
  .rarity-prism .tc-foil {
    opacity: .85;
    background:
      linear-gradient(115deg,
        rgba(255,0,128,.28), rgba(255,140,0,.28), rgba(255,255,0,.24),
        rgba(0,255,128,.24), rgba(0,180,255,.28), rgba(160,0,255,.28));
    background-size: 400% 400%;
    mix-blend-mode: screen;
    animation: tcPrism 5s linear infinite;
  }
  .rarity-prism .tc-frame { border-color: rgba(255,255,255,.9); }
  @keyframes tcFoilSweep {
    0%, 100% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
  }
  @keyframes tcPrism {
    0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
    100% { background-position: 300% 50%; filter: hue-rotate(360deg); }
  }

  /* Glare layer — driven by JS in the 3D viewer */
  .tc-glare {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(var(--glare-angle, 115deg), transparent 35%, rgba(255,255,255,var(--glare-alpha, 0)) 50%, transparent 65%);
  }

  /* Insert card */
  .tcard-insert .tc-insert-mark {
    position: absolute;
    top: 42%; left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .72);
    color: rgba(255,255,255,.9);
    text-shadow: 0 0 calc(var(--cardw,180px)*.2) rgba(142,197,255,.6);
  }

  /* Prize card */
  .tcard-prize .tc-bg {
    background: linear-gradient(160deg, #23180a 0%, #4a3208 45%, #120c04 100%);
  }
  .tcard-prize .tc-shards i:nth-child(1) { background: linear-gradient(200deg, rgba(255,215,0,.4), transparent 50%); }
  .tcard-prize .tc-shards i:nth-child(2) { background: linear-gradient(120deg, rgba(255,170,0,.5), transparent 70%); }
  .tcard-prize .tc-shards i:nth-child(3) { background: linear-gradient(340deg, rgba(255,240,200,.2), transparent 55%); }
  .tcard-prize .tc-shards i:nth-child(4) { background: linear-gradient(30deg, rgba(120,70,0,.8), transparent 65%); }
  .tcard-prize .tc-frame { border-color: rgba(255,215,0,.65); }
  .tc-prize-badge {
    position: absolute;
    top: calc(var(--cardw, 180px) * .1);
    left: 50%; transform: translateX(-50%);
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .058);
    letter-spacing: .3em;
    text-indent: .3em;
    color: #1a1206;
    background: linear-gradient(90deg, #ffd700, #ffaa00);
    border-radius: 99px;
    padding: calc(var(--cardw,180px)*.02) calc(var(--cardw,180px)*.06);
    white-space: nowrap;
  }
  .tc-prize-icon {
    position: absolute;
    top: 34%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: calc(var(--cardw, 180px) * .38);
    filter: drop-shadow(0 calc(var(--cardw,180px)*.03) calc(var(--cardw,180px)*.06) rgba(0,0,0,.5));
  }
  .tc-prize-img {
    display: block;
    width: calc(var(--cardw, 180px) * .5);
    height: calc(var(--cardw, 180px) * .5);
    object-fit: cover;
    border-radius: calc(var(--cardw, 180px) * .06);
    box-shadow: 0 calc(var(--cardw,180px)*.02) calc(var(--cardw,180px)*.08) rgba(0,0,0,.55), 0 0 0 1px rgba(255,215,0,.35);
  }
  .tc-prize-label {
    position: absolute;
    top: 52%; left: 10%; right: 10%;
    text-align: center;
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .1);
    line-height: 1.25;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0,0,0,.5);
  }
  .tc-prize-code {
    position: absolute;
    bottom: calc(var(--cardw, 180px) * .19);
    left: 50%; transform: translateX(-50%);
    font-family: monospace;
    font-weight: 700;
    font-size: calc(var(--cardw, 180px) * .085);
    letter-spacing: .12em;
    color: #ffd700;
    background: rgba(0,0,0,.45);
    border: 1px dashed rgba(255,215,0,.5);
    border-radius: calc(var(--cardw,180px)*.03);
    padding: calc(var(--cardw,180px)*.02) calc(var(--cardw,180px)*.05);
    white-space: nowrap;
  }
  .tc-prize-redeem {
    position: absolute;
    bottom: calc(var(--cardw, 180px) * .09);
    left: 0; right: 0;
    text-align: center;
    font-weight: 700;
    font-size: calc(var(--cardw, 180px) * .05);
    text-transform: uppercase;
    letter-spacing: .16em;
    color: rgba(255,255,255,.55);
  }
  .tcard-prize .tc-foil {
    opacity: 1;
    background: linear-gradient(115deg, transparent 32%, rgba(255,215,0,.25) 48%, rgba(255,250,220,.4) 50%, rgba(255,215,0,.25) 52%, transparent 68%);
    background-size: 250% 250%;
    animation: tcFoilSweep 3s ease-in-out infinite;
  }
  .tcard-grand { box-shadow: 0 0 30px rgba(255,215,0,.5), 0 10px 40px rgba(0,0,0,.6); }
  .tcard-grand .tc-bg { background: linear-gradient(160deg, #3d2800 0%, #7a5200 45%, #1c1200 100%); }

  /* Card back — silver foil */
  .tcb-bg {
    position: absolute; inset: 0;
    background: linear-gradient(115deg, #b9c2cf 0%, #eef2f7 18%, #8f9aa9 34%, #dde4ec 50%, #98a3b3 66%, #f2f5f9 82%, #aab4c2 100%);
  }
  .tcb-facets {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(60deg, rgba(255,255,255,.28) 25%, transparent 25.5%),
      linear-gradient(-60deg, rgba(255,255,255,.28) 25%, transparent 25.5%),
      linear-gradient(60deg, transparent 74.5%, rgba(20,30,45,.12) 75%),
      linear-gradient(-60deg, transparent 74.5%, rgba(20,30,45,.12) 75%);
    background-size: 34% 42%;
  }
  .tcard-backface .tc-frame {
    border-color: rgba(20,30,45,.35);
  }
  .tcb-mark {
    position: absolute;
    top: 44%; left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .62);
    background: linear-gradient(160deg, #33415a, #0e1626 45%, #3c4c68 55%, #101a2a);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 1px 1px rgba(255,255,255,.55));
  }
  .tcb-brand {
    position: absolute;
    bottom: calc(var(--cardw, 180px) * .12);
    left: 0; right: 0;
    text-align: center;
    font-weight: 900;
    font-size: calc(var(--cardw, 180px) * .055);
    letter-spacing: .34em;
    text-indent: .34em;
    color: rgba(20,30,45,.6);
  }
  .tcard-backface .tc-foil {
    opacity: 1;
    background: linear-gradient(115deg, transparent 34%, rgba(255,255,255,.3) 48%, rgba(255,255,255,.55) 50%, rgba(255,255,255,.3) 52%, transparent 66%);
    background-size: 250% 250%;
    animation: tcFoilSweep 4s ease-in-out infinite;
  }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  window.CardsDeck = { PLAYERS, RARITY_LABEL, randomPlayerCard, insertCard, prizeCard, renderCard, renderCardBack };
})();
