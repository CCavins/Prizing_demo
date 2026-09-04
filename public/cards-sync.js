/* ════════════════════════════════════════════════════════════════
   Realtime sync layer for the Vixi Trading Card Drop.

   - If FIREBASE_CONFIG.databaseURL is filled in, uses Firebase Realtime
     Database (cross-device). RTDB node: `trading-cards`
       config     -> { totals, insertWeight, drainSecs, packCap, demoDrain }
       inventory  -> { prizeId: claimedCount }   (durable, never pruned)
       claims     -> pushed { prize, code, ts }  (ephemeral feed, pruned)
       state      -> { grandRevealed, resetAt }
   - Otherwise falls back to BroadcastChannel + localStorage so the
     player page and output board talk on the SAME device/browser.

   API:
     CardsSync.BASE_PRIZES / GRAND / ALL_PRIZES
     CardsSync.config / inventory / state     -> live snapshots
     CardsSync.ready                          -> Promise (initial data loaded)
     CardsSync.onChange(cb)                   -> cb() on inventory/config/state change
     CardsSync.onClaim(cb)                    -> cb({prize, code, ts}) on new claim event
     CardsSync.claim(prizeId, code)           -> Promise<bool> (false = sold out / lost race)
     CardsSync.rollThirdSlot()                -> { type:'prize', prize } | { type:'insert' }
     CardsSync.baseClaimed() / baseTotal()
     CardsSync.maybeRevealGrand()             -> reveals grand at 75% (first writer wins)
     CardsSync.setConfig(partial)
     CardsSync.resetGame()
     CardsSync.mode                           -> 'firebase' | 'local'
   ════════════════════════════════════════════════════════════════ */
(function () {
  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyA7DEK2VbNGdbaDmsOVoaBgTy-mihkSa78',
    authDomain: 'vixi-offline.firebaseapp.com',
    databaseURL: 'https://vixi-offline-default-rtdb.firebaseio.com',
    projectId: 'vixi-offline',
    storageBucket: 'vixi-offline.firebasestorage.app',
    messagingSenderId: '956827790888',
    appId: '1:956827790888:web:15e9ae359961f240260f1d',
  };
  const NODE = 'trading-cards';
  // ?local=1 forces same-device mode (BroadcastChannel) for testing without Firebase.
  const forceLocal = typeof location !== 'undefined' && /[?&]local=1/.test(location.search);
  const useFirebase = !forceLocal && !!FIREBASE_CONFIG.databaseURL;

  const BASE_PRIZES = [
    { id: 'off25', label: '25% Off Any Merch Item', icon: '🏷️', img: 'images/prizes/off25.png', total: 200, weight: 55 },
    { id: 'off75', label: '75% Off Any Merch Item', icon: '🔥', img: 'images/prizes/off75.png', total: 20,  weight: 10 },
  ];
  const GRAND = { id: 'car', label: 'A Brand New Car', icon: '🚗', img: 'images/prizes/car.png', total: 1, weight: 6 };
  const ALL_PRIZES = [...BASE_PRIZES, GRAND];

  const DEFAULT_CONFIG = {
    totals: { off25: 200, off75: 20, car: 1 },
    insertWeight: 35,   // legacy (unused by the pack flow)
    drainSecs: 60,      // drop length: seconds on the countdown / demo drain
    packCap: 3,         // packs per scan (1 pack + 2 retries)
    demoDrain: true,    // board fakes ambient claims (demo mode)
  };

  const changeHandlers = [];
  const claimHandlers = [];

  const CardsSync = {
    BASE_PRIZES, GRAND, ALL_PRIZES, DEFAULT_CONFIG,
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    inventory: {},
    state: { grandRevealed: false, resetAt: 0, endsAt: 0 },
    mode: useFirebase ? 'firebase' : 'local',
    onChange(cb) { changeHandlers.push(cb); },
    onClaim(cb) { claimHandlers.push(cb); },
    _emitChange() { changeHandlers.forEach(h => { try { h(); } catch (e) { console.error(e); } }); },
    _emitClaim(evt) { claimHandlers.forEach(h => { try { h(evt); } catch (e) { console.error(e); } }); },
    claim() { return Promise.resolve(false); },
    setConfig() {},
    resetGame() {},
    startDrop() {},
    _setGrandRevealed() {},
  };
  window.CardsSync = CardsSync;

  // ── Shared helpers ──────────────────────────────────────────────
  CardsSync.prizeTotal = function (id) {
    const t = CardsSync.config.totals || {};
    const def = ALL_PRIZES.find(p => p.id === id);
    const v = Number(t[id]);
    return Number.isFinite(v) && v >= 0 ? v : (def ? def.total : 0);
  };
  CardsSync.prizeClaimed = function (id) {
    return Number(CardsSync.inventory[id]) || 0;
  };
  CardsSync.prizeRemaining = function (id) {
    return Math.max(0, CardsSync.prizeTotal(id) - CardsSync.prizeClaimed(id));
  };
  CardsSync.baseTotal = function () {
    return BASE_PRIZES.reduce((s, p) => s + CardsSync.prizeTotal(p.id), 0);
  };
  CardsSync.baseClaimed = function () {
    return BASE_PRIZES.reduce((s, p) => s + Math.min(CardsSync.prizeClaimed(p.id), CardsSync.prizeTotal(p.id)), 0);
  };

  // Third slot roll: weighted among in-stock prizes + the foil insert.
  // The grand prize only joins the pool once state.grandRevealed is true.
  CardsSync.rollThirdSlot = function () {
    const pool = [];
    BASE_PRIZES.forEach(p => {
      if (CardsSync.prizeRemaining(p.id) > 0) pool.push(p);
    });
    if (CardsSync.state.grandRevealed && CardsSync.prizeRemaining(GRAND.id) > 0) pool.push(GRAND);

    const insertWeight = Math.max(0, Number(CardsSync.config.insertWeight) || 0);
    const totalWeight = pool.reduce((s, p) => s + p.weight, 0) + insertWeight;
    if (totalWeight <= 0 || pool.length === 0) return { type: 'insert' };

    let r = Math.random() * totalWeight;
    for (const p of pool) {
      r -= p.weight;
      if (r <= 0) return { type: 'prize', prize: p };
    }
    return { type: 'insert' };
  };

  CardsSync.maybeRevealGrand = function () {
    if (CardsSync.state.grandRevealed) return;
    const total = CardsSync.baseTotal();
    if (total <= 0) return;
    if (CardsSync.baseClaimed() >= Math.floor(total * 0.75)) {
      CardsSync._setGrandRevealed();
    }
  };

  CardsSync.makeCode = function () {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return 'CARD-' + s;
  };

  // Anonymous per-device user id (tracked on claims even without sign-in).
  CardsSync.getUid = function () {
    try {
      let uid = localStorage.getItem('vixi-cards-uid');
      if (!uid) {
        uid = 'u-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('vixi-cards-uid', uid);
      }
      return uid;
    } catch (e) { return 'u-anon'; }
  };

  // Drop window helpers (endsAt is a client-clock epoch ms; 0 = no timer set).
  CardsSync.dropActive = function () {
    const e = Number(CardsSync.state.endsAt) || 0;
    return e > 0 && Date.now() < e;
  };
  CardsSync.dropEnded = function () {
    const e = Number(CardsSync.state.endsAt) || 0;
    return e > 0 && Date.now() >= e;
  };

  // ── Local fallback (BroadcastChannel + localStorage) ────────────
  function initLocal() {
    const KEY = 'trading-cards-local';
    let channel = null;
    try { channel = new BroadcastChannel('trading-cards'); } catch (e) {}

    function readStore() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return { config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)), inventory: {}, state: { grandRevealed: false, resetAt: 0, endsAt: 0 } };
    }
    function writeStore(store) {
      try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
    }
    function applyStore(store) {
      CardsSync.config = Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), store.config || {});
      CardsSync.inventory = store.inventory || {};
      CardsSync.state = Object.assign({ grandRevealed: false, resetAt: 0, endsAt: 0 }, store.state || {});
      CardsSync._emitChange();
    }
    function mutate(fn) {
      const store = readStore();
      fn(store);
      writeStore(store);
      applyStore(store);
      if (channel) channel.postMessage({ kind: 'sync' });
    }

    if (channel) {
      channel.addEventListener('message', (e) => {
        if (!e.data) return;
        if (e.data.kind === 'sync') applyStore(readStore());
        if (e.data.kind === 'claim') CardsSync._emitClaim(e.data.evt);
      });
    }
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) applyStore(readStore());
    });

    CardsSync.claim = function (prizeId, code, uid) {
      let ok = false;
      mutate((store) => {
        const totals = (store.config && store.config.totals) || DEFAULT_CONFIG.totals;
        const cur = Number(store.inventory[prizeId]) || 0;
        const total = Number(totals[prizeId]) || 0;
        if (cur < total) {
          store.inventory[prizeId] = cur + 1;
          ok = true;
        }
      });
      if (ok) {
        const evt = { prize: prizeId, code: code || '', uid: uid || '', ts: Date.now() };
        CardsSync._emitClaim(evt);
        if (channel) channel.postMessage({ kind: 'claim', evt });
      }
      return Promise.resolve(ok);
    };

    CardsSync.startDrop = function (secs) {
      mutate((store) => {
        store.state = store.state || {};
        store.state.endsAt = Date.now() + Math.max(5, Number(secs) || 60) * 1000;
      });
    };

    CardsSync.setConfig = function (partial) {
      mutate((store) => {
        store.config = Object.assign({}, store.config, partial);
        if (partial.totals) store.config.totals = Object.assign({}, (store.config.totals || {}), partial.totals);
      });
    };

    CardsSync._setGrandRevealed = function () {
      mutate((store) => { store.state = store.state || {}; store.state.grandRevealed = true; });
    };

    CardsSync.resetGame = function () {
      mutate((store) => {
        store.inventory = {};
        store.state = { grandRevealed: false, resetAt: Date.now(), endsAt: 0 };
      });
    };

    applyStore(readStore());
    CardsSync._readyResolve();
    console.info('[CardsSync] running in LOCAL mode (same-device only).');
  }

  // ── Firebase Realtime Database ──────────────────────────────────
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initFirebase() {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js');

    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.database();
    const root = db.ref(NODE);

    // Live snapshots -> local mirrors
    let gotConfig = false, gotInventory = false, gotState = false;
    function checkReady() {
      if (gotConfig && gotInventory && gotState) CardsSync._readyResolve();
    }
    root.child('config').on('value', (snap) => {
      const val = snap.val() || {};
      CardsSync.config = Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), val);
      if (val.totals) CardsSync.config.totals = Object.assign({}, DEFAULT_CONFIG.totals, val.totals);
      gotConfig = true; checkReady();
      CardsSync._emitChange();
    });
    root.child('inventory').on('value', (snap) => {
      CardsSync.inventory = snap.val() || {};
      gotInventory = true; checkReady();
      CardsSync._emitChange();
    });
    root.child('state').on('value', (snap) => {
      CardsSync.state = Object.assign({ grandRevealed: false, resetAt: 0, endsAt: 0 }, snap.val() || {});
      gotState = true; checkReady();
      CardsSync._emitChange();
    });

    // Claim feed (decoration only — inventory is the source of truth)
    const claimsRef = root.child('claims');
    let primed = false;
    const liveRef = claimsRef.orderByChild('ts').limitToLast(30);
    liveRef.once('value').then(() => { primed = true; });
    liveRef.on('child_added', (snap) => {
      if (!primed) return;
      const val = snap.val();
      if (val && val.prize) CardsSync._emitClaim({ prize: val.prize, code: val.code || '', uid: val.uid || '', ts: val.ts, key: snap.key });
    });

    const PRUNE_MS = 120000;
    function pruneClaims() {
      try {
        claimsRef.orderByChild('ts').endAt(Date.now() - PRUNE_MS).limitToFirst(20).once('value', (snap) => {
          snap.forEach((child) => { child.ref.remove(); });
        });
      } catch (e) {}
    }

    // Claim = transaction on the durable counter; abort at capacity.
    CardsSync.claim = function (prizeId, code, uid) {
      const total = CardsSync.prizeTotal(prizeId);
      return root.child('inventory/' + prizeId)
        .transaction((cur) => {
          const c = Number(cur) || 0;
          if (c >= total) return; // abort — sold out
          return c + 1;
        })
        .then((res) => {
          if (!res.committed) return false;
          claimsRef.push({ prize: prizeId, code: code || '', uid: uid || '', ts: firebase.database.ServerValue.TIMESTAMP });
          pruneClaims();
          return true;
        })
        .catch((err) => { console.error('[CardsSync] claim failed', err); return false; });
    };

    CardsSync.startDrop = function (secs) {
      return root.child('state/endsAt').set(Date.now() + Math.max(5, Number(secs) || 60) * 1000);
    };

    CardsSync.setConfig = function (partial) {
      const updates = {};
      Object.keys(partial).forEach((k) => {
        if (k === 'totals') {
          Object.keys(partial.totals).forEach((id) => { updates['config/totals/' + id] = partial.totals[id]; });
        } else {
          updates['config/' + k] = partial[k];
        }
      });
      return root.update(updates);
    };

    // First writer wins — everyone else's transaction aborts.
    CardsSync._setGrandRevealed = function () {
      root.child('state/grandRevealed').transaction((cur) => {
        if (cur === true) return;
        return true;
      });
    };

    CardsSync.resetGame = function () {
      return root.update({
        inventory: null,
        claims: null,
        state: { grandRevealed: false, resetAt: firebase.database.ServerValue.TIMESTAMP, endsAt: 0 },
      });
    };

    console.info('[CardsSync] running in FIREBASE mode (cross-device).');
  }

  CardsSync.ready = new Promise((resolve) => { CardsSync._readyResolve = resolve; });

  if (useFirebase) {
    initFirebase().catch((err) => {
      console.error('[CardsSync] Firebase init failed, falling back to local mode.', err);
      CardsSync.mode = 'local';
      initLocal();
    });
  } else {
    initLocal();
  }
})();
