/* Pack look recipes — data + helpers used by card-player.html */
(function () {
  const KEY = 'vixi-pack-look';

  const LOOKS = {
    trace: {
      id: 'trace',
      name: 'Trace',
      tag: 'Pocket-style open',
      how: 'Trace the glowing line left to right. The header peels off the still-whole pack, and the card is drawn out of the mouth.',
      open: 'Pink energy trail. White snap. The crimp strip lifts up and right — the printed pouch stays one piece.',
      out: 'Card comes out the mouth toward you as the wrapper drops and fades.',
      through: 'One large card on a light field. Swipe left for the next. Soft foil sheen on each flip.',
      prize: 'A pale halo and a short haptic — no confetti rain.',
      tip: 'Trace the line<br>left to right',
      tear: 'across',
    },
    crimp: {
      id: 'crimp',
      name: 'Crimp',
      tag: 'The foil snack pack',
      how: 'Swipe the gold seal left to right. The header peels off the still-whole pack, and the card is drawn out of the mouth.',
      open: 'Gold line. White snap. The crimp strip lifts — the printed pouch stays one piece.',
      out: 'Card comes out the mouth toward you as the wrapper drops and fades.',
      through: 'Swipe left. Next cards land face-down, then flip. Peek stack on the right.',
      prize: 'Warm gold burst + a short haptic.',
      tip: 'Swipe right across the seal<br>to open your pack',
      tear: 'across',
    },
    case: {
      id: 'case',
      name: 'Case',
      tag: 'Empty the clamshell',
      how: 'Same left-to-right swipe. The print splits, the lid cracks aside, and the pack tips back to empty.',
      open: 'Seal lights from the left. Face cuts once. Lid skews as the case leans out.',
      out: 'Card deals upward as the case leans away beneath it.',
      through: 'Cards dismiss downward. Soft gold bloom on each flip.',
      prize: 'Quiet gold bloom — light, not confetti.',
      tip: 'Swipe right across the seal<br>to crack it open',
      tear: 'across',
    },
    vault: {
      id: 'vault',
      name: 'Vault',
      tag: 'Unseal and bloom',
      how: 'Swipe left to right. The print splits, the lid launches, and the pack sinks and shrinks.',
      open: 'Cool highlight. Face cuts once. Lid launches straight up; the vault recedes.',
      out: 'Card blooms larger as it leaves the shrinking mouth.',
      through: 'Cards burst from center to the stack. Prism flash on each reveal.',
      prize: 'A single prism wash and a light streak — no particle rain.',
      tip: 'Swipe right across the seal<br>to unseal the vault',
      tear: 'across',
    },
    salon: {
      id: 'salon',
      name: 'Salon',
      tag: 'A slow presentation',
      how: 'A long left-to-right swipe. The header peels quietly off the still-whole pack, and the card is presented from the mouth.',
      open: 'Quiet gold line. The strip lifts and eases away — nothing is thrown.',
      out: 'Card rises from the mouth as the wrapper eases down and fades.',
      through: 'Longer flips. Side-slide exits. Spotlight + glare on each card.',
      prize: 'A vignette, a gold ring, and the foil crawl — almost no particles.',
      tip: 'Slowly swipe right<br>to present the cards',
      tear: 'across',
    },
  };

  const ORDER = ['trace', 'crimp', 'salon'];

  function fromQuery() {
    const m = /(?:\?|&)look=([a-z]+)/i.exec(location.search);
    return m && LOOKS[m[1].toLowerCase()] ? m[1].toLowerCase() : null;
  }

  function current() {
    const id = document.body.dataset.look || 'trace';
    return LOOKS[id] || LOOKS.trace;
  }

  function apply(id, { persist = true } = {}) {
    const look = (ORDER.indexOf(id) >= 0 && LOOKS[id]) ? LOOKS[id] : LOOKS.trace;
    document.body.dataset.look = look.id;
    ['trace', 'crimp', 'case', 'vault', 'salon'].forEach((oid) => document.body.classList.remove('look-' + oid));
    document.body.classList.add('look-' + look.id);
    if (persist) {
      try { localStorage.setItem(KEY, look.id); } catch (e) {}
    }
    const chip = document.getElementById('looksChip');
    if (chip) chip.innerHTML = 'Look · <b>' + look.name + '</b>';
    const tip = document.getElementById('tipText');
    if (tip) tip.innerHTML = look.tip;
    const kicker = document.getElementById('packKicker');
    const title = document.getElementById('packTitle');
    if (kicker && title) {
      if (look.id === 'trace') {
        kicker.hidden = true;
        title.textContent = 'Trace line to open';
      } else {
        kicker.hidden = false;
        kicker.textContent = 'Exclusive Digital Collectable';
        title.innerHTML = "Rip Open<br>Tonight's Pack";
      }
    }
    if (typeof pickTear === 'function') pickTear();
    return look;
  }

  function boot() {
    const raw = fromQuery() || (function () {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }()) || 'trace';
    const start = ORDER.indexOf(raw) >= 0 ? raw : 'trace';
    apply(start, { persist: false });
    pickTear();
    requestAnimationFrame(function () { applyTear(tearVariant); });
  }

  function transforms(id) {
    const look = id || current().id;
    if (look === 'case') {
      return {
        center: 'translate(-50%, -50%)',
        peek1: 'translate(-50%, -50%) translateY(18%) rotate(4deg) scale(.9)',
        peek2: 'translate(-50%, -50%) translateY(28%) rotate(8deg) scale(.82)',
        offR: 'translate(-50%, -50%) translateY(120%)',
        offL: 'translate(-50%, -50%) translateY(130%) rotate(8deg)',
        firstFallback: 'translate(-50%, -50%) translateY(70%) scale(.86)',
      };
    }
    if (look === 'vault') {
      return {
        center: 'translate(-50%, -50%)',
        peek1: 'translate(-50%, -50%) translateX(74%) rotate(8deg) scale(.88)',
        peek2: 'translate(-50%, -50%) translateX(88%) rotate(14deg) scale(.78)',
        offR: 'translate(-50%, -50%) scale(.28)',
        offL: 'translate(-50%, -50%) scale(.35) translateY(18%)',
        firstFallback: 'translate(-50%, -50%) scale(.32)',
      };
    }
    if (look === 'salon') {
      return {
        center: 'translate(-50%, -50%)',
        peek1: 'translate(-50%, -50%) translateX(-78%) rotate(-5deg) scale(.9)',
        peek2: 'translate(-50%, -50%) translateX(-92%) rotate(-9deg) scale(.82)',
        offR: 'translate(-50%, -50%) translateX(-160vw)',
        offL: 'translate(-50%, -50%) translateX(160vw) rotate(16deg)',
        firstFallback: 'translate(-50%, -50%) translateX(-70vw)',
      };
    }
    return {
      center: 'translate(-50%, -50%)',
      peek1: 'translate(-50%, -50%) translateX(78%) rotate(6deg) scale(.9)',
      peek2: 'translate(-50%, -50%) translateX(90%) rotate(12deg) scale(.82)',
      offR: 'translate(-50%, -50%) translateX(160vw) rotate(16deg)',
      offL: 'translate(-50%, -50%) translateX(-160vw) rotate(-22deg)',
      firstFallback: 'translate(-50%, -50%) translateY(60vh) scale(.8)',
    };
  }

  /* Tear sits in the top crimp band. Lid + body share one printed face;
     clip-paths are complementary so type on the rip is cut, not copied. */
  function lidClipFromBody(body) {
    const raw = String(body).replace(/^polygon\(/i, '').replace(/\)$/, '');
    const pts = raw.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    const edge = pts.slice(0, -2);
    return 'polygon(0% 0%, 100% 0%, ' + edge.slice().reverse().join(', ') + ')';
  }
  /* Short lid uses local % — map pack-space tear Y into the 11.4% strip */
  function lidClipLocal(body, lidH) {
    lidH = lidH || 11.4;
    const raw = String(body).replace(/^polygon\(/i, '').replace(/\)$/, '');
    const pts = raw.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    const edge = pts.slice(0, -2);
    const mapped = edge.map(function (p) {
      const parts = p.split(/\s+/);
      const y = parseFloat(parts[1]);
      const ly = Math.max(0, Math.min(100, (y / lidH) * 100));
      return parts[0] + ' ' + ly.toFixed(1) + '%';
    });
    return 'polygon(0% 0%, 100% 0%, ' + mapped.slice().reverse().join(', ') + ')';
  }
  function tearOriginY(body) {
    const raw = String(body).replace(/^polygon\(/i, '').replace(/\)$/, '');
    const pts = raw.split(',').map(function (p) { return p.trim(); }).slice(0, -2);
    const ys = pts.map(function (p) { return parseFloat(p.split(/\s+/)[1]); }).filter(function (n) { return !isNaN(n); });
    if (!ys.length) return '10%';
    return (ys.reduce(function (a, b) { return a + b; }, 0) / ys.length).toFixed(1) + '%';
  }
  function lidTearY(body, lidH) {
    lidH = lidH || 11.4;
    const y = parseFloat(tearOriginY(body));
    if (isNaN(y) || !lidH) return '83%';
    return Math.max(8, Math.min(98, (y / lidH) * 100)).toFixed(1) + '%';
  }
  /* Band on the lid side of the tear (upward), so it never paints over the pouch */
  function lidLipClip(body, lidH, depth) {
    lidH = lidH || 11.4;
    depth = depth == null ? 16 : depth;
    const raw = String(body).replace(/^polygon\(/i, '').replace(/\)$/, '');
    const pts = raw.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    const edge = pts.slice(0, -2);
    const mapped = edge.map(function (p) {
      const parts = p.split(/\s+/);
      const y = parseFloat(parts[1]);
      const ly = lidH === 100 ? y : Math.max(0, Math.min(100, (y / lidH) * 100));
      return { x: parts[0], y: ly, yRaw: parts[1] };
    });
    const inward = mapped.map(function (p) {
      return p.x + ' ' + Math.max(0, p.y - depth).toFixed(2) + '%';
    });
    const along = mapped.slice().reverse().map(function (p) {
      return p.x + ' ' + (lidH === 100 ? p.yRaw : p.y.toFixed(2) + '%');
    });
    return 'polygon(' + inward.concat(along).join(', ') + ')';
  }

  const TEARS = [
    {
      id: 'clean',
      d: 'M0 8 C32 6.8 68 9.4 100 7.6',
      body: 'polygon(0% 9.5%, 38% 9.1%, 72% 10.2%, 100% 9.4%, 100% 100%, 0% 100%)',
    },
  ];

  /* Trace: one gentle dip, then a rise — not a ruler, not teeth */
  const TRACE_TEARS = [
    {
      id: 'trace-soft',
      d: 'M0 4.6 C22 2.6 34 10.8 44 10.4 C62 9.6 74 3.4 100 4.2',
      body: 'polygon(0.0% 8.75%, 5.6% 8.55%, 10.3% 8.39%, 14.5% 8.26%, 18.4% 8.18%, 22.0% 8.15%, 25.6% 8.50%, 29.5% 9.31%, 33.7% 10.25%, 38.4% 10.97%, 44.0% 11.15%, 48.3% 10.82%, 52.8% 10.29%, 58.3% 9.67%, 65.2% 9.07%, 74.0% 8.62%, 85.5% 8.40%, 100.0% 8.55%, 100% 100%, 0% 100%)',
    },
  ];

  let tearLen = 0;
  let tearVariant = TEARS[0];

  function applyTear(variant) {
    tearVariant = variant;
    const idle = document.getElementById('seamIdle');
    const fill = document.getElementById('seamFill');
    const glow = document.getElementById('seamGlow');
    const pack = document.getElementById('packSpin');
    if (!idle || !fill || !pack) return;
    idle.setAttribute('d', variant.d);
    fill.setAttribute('d', variant.d);
    if (glow) glow.setAttribute('d', variant.d);
    pack.style.setProperty('--tear-body', variant.body);
    pack.style.setProperty('--tear-lid', lidClipFromBody(variant.body));
    pack.style.setProperty('--lid-tear-y', tearOriginY(variant.body));
    pack.style.setProperty('--tear-lid-lip', lidLipClip(variant.body, 100, 1.85));
    pack.style.setProperty('--tear-origin-y', tearOriginY(variant.body));
    pack.style.setProperty('--tear-p', '0');
    try {
      tearLen = fill.getTotalLength() || 120;
    } catch (e) {
      tearLen = 120;
    }
    fill.style.strokeDasharray = String(tearLen);
    fill.style.strokeDashoffset = String(tearLen);
    if (glow) {
      glow.style.strokeDasharray = String(tearLen);
      glow.style.strokeDashoffset = String(tearLen);
    }
  }

  function pickTear() {
    applyTear(TRACE_TEARS[0]);
  }

  function tearDelta(look, startX, startY, e, w, h) {
    const dx = e.clientX - startX;
    if (dx < 0) return 0;
    const id = (look && look.id) || current().id;
    const span = id === 'salon' ? 0.74 : id === 'vault' ? 0.48 : id === 'case' ? 0.6 : 0.56;
    return Math.min(1, dx / (w * span));
  }

  function tearVisual(look, p, packTop, packInner, extras) {
    extras = extras || {};
    const fill = extras.seamFill || document.getElementById('seamFill');
    const glow = extras.seamGlow || document.getElementById('seamGlow');
    const pack = document.getElementById('packSpin');
    if (fill && tearLen) {
      fill.style.strokeDashoffset = String(tearLen * (1 - p));
    }
    if (glow && tearLen) {
      glow.style.strokeDashoffset = String(tearLen * (1 - p));
    }
    if (pack) pack.style.setProperty('--tear-p', String(p));
    // Gesture only paints the seal highlight. The lid stays sealed until
    // completeTear plays the split / flyoff.
    if (packTop) {
      packTop.style.transform = '';
      packTop.style.opacity = '';
    }
    if (packInner) packInner.style.transform = '';
  }

  function openTiming(id) {
    const look = id || current().id;
    if (look === 'trace') return { rise: 420, opened: 1360, handoff: 1480 };
    if (look === 'crimp') return { rise: 420, opened: 1360, handoff: 1600 };
    if (look === 'salon') return { rise: 520, opened: 1700, handoff: 2100 };
    if (look === 'vault') return { rise: 360, opened: 560, handoff: 1880 };
    if (look === 'case') return { rise: 400, opened: 600, handoff: 2000 };
    return { rise: 400, opened: 600, handoff: 1980 };
  }

  function playFx(kind) {
    const layer = document.getElementById('fxLayer');
    if (!layer) return;
    layer.innerHTML = '';
    const add = (cls) => {
      const el = document.createElement('div');
      el.className = cls;
      layer.appendChild(el);
    };
    if (kind === 'bloom') add('fx-bloom');
    if (kind === 'halo') add('fx-halo');
    if (kind === 'prism') { add('fx-prism'); add('fx-streak'); }
    if (kind === 'prism-soft') add('fx-streak');
    if (kind === 'spotlight') { add('fx-spot'); add('fx-ring'); }
    if (kind === 'glare') add('fx-glare');
    setTimeout(() => { layer.innerHTML = ''; }, 1200);
  }

  function prizeFx(card, look) {
    const id = (look || current()).id;
    const grand = !!(card && card.grand);
    if (id === 'trace') {
      playFx('halo');
    } else if (id === 'case') {
      playFx('bloom');
    } else if (id === 'vault') {
      playFx('prism');
    } else if (id === 'salon') {
      playFx('spotlight');
    } else if (typeof confetti === 'function') {
      confetti({
        particleCount: grand ? 90 : 48,
        spread: grand ? 110 : 70,
        origin: { x: 0.5, y: 0.46 },
        scalar: 0.78,
        ticks: 140,
        colors: grand ? ['#ffd700', '#ffaa00', '#fff', '#ff6600'] : ['#ffb347', '#ffd7a0', '#fff'],
        zIndex: 95,
      });
    }
    if (navigator.vibrate) {
      try { navigator.vibrate(grand ? [40, 30, 80] : 24); } catch (e) {}
    }
  }

  function passFx(look) {
    const id = (look || current()).id;
    if (id === 'vault') playFx('prism-soft');
    if (id === 'salon') playFx('glare');
    if (id === 'case') playFx('bloom');
    if (id === 'trace') playFx('halo');
  }

  function renderSheet(root, onPick, onPreview) {
    root.innerHTML = '';
    ORDER.forEach((id) => {
      const L = LOOKS[id];
      const btn = document.createElement('div');
      btn.className = 'look-card' + (current().id === id ? ' on' : '');
      btn.setAttribute('role', 'button');
      btn.tabIndex = 0;
      btn.innerHTML =
        '<div class="lk-top"><span class="lk-name">' + L.name + '</span><span class="lk-tag">' + L.tag + '</span></div>' +
        '<p class="lk-how">' + L.how + '</p>' +
        '<dl>' +
          '<dt>Open</dt><dd>' + L.open + '</dd>' +
          '<dt>Out</dt><dd>' + L.out + '</dd>' +
          '<dt>Stack</dt><dd>' + L.through + '</dd>' +
          '<dt>Prize</dt><dd>' + L.prize + '</dd>' +
        '</dl>';
      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'lk-preview';
      prev.textContent = 'Preview prize effect';
      prev.addEventListener('click', (e) => {
        e.stopPropagation();
        onPreview(L);
      });
      btn.appendChild(prev);
      btn.addEventListener('click', () => onPick(L));
      root.appendChild(btn);
    });
  }

  window.PackLooks = {
    LOOKS, ORDER, current, apply, boot, transforms, tearDelta, tearVisual,
    openTiming, pickTear, prizeFx, passFx, playFx, renderSheet,
  };
})();
