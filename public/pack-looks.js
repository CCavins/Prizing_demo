/* Pack look recipes — data + helpers used by card-player.html */
(function () {
  const KEY = 'vixi-pack-look';

  const LOOKS = {
    trace: {
      id: 'trace',
      name: 'Trace',
      tag: 'Pocket-style open',
      how: 'Trace the glowing line left to right. The pack snaps, the top strip flies off, and the card is drawn out of the pouch.',
      open: 'Pink energy trail. White snap. Jagged top strip lifts up and right.',
      out: 'Body stays a hollow pouch. Card comes out the mouth toward you as the wrapper drops and fades.',
      through: 'One large card on a light field. Swipe left for the next. Soft foil sheen on each flip.',
      prize: 'A pale halo and a short haptic — no confetti rain.',
      tip: 'Trace the line<br>left to right',
      tear: 'across',
    },
    crimp: {
      id: 'crimp',
      name: 'Crimp',
      tag: 'The foil snack pack',
      how: 'Swipe the seal from left to right. The flap lifts; the pack lowers; the card is drawn out of the mouth.',
      open: 'Left-to-right gold line. Top flap peels. The pack itself drops away.',
      out: 'Card starts inside the pack and slides out as the wrapper sinks.',
      through: 'Swipe left. Next cards land face-down, then flip. Peek stack on the right.',
      prize: 'Warm gold burst + a short haptic.',
      tip: 'Swipe right across the seal<br>to open your pack',
      tear: 'across',
    },
    case: {
      id: 'case',
      name: 'Case',
      tag: 'Empty the clamshell',
      how: 'Same left-to-right swipe. The pack tips back and empties; the card deals up out of it.',
      open: 'Seal lights from the left. Lid cracks. Pack tilts down like a case tipping out.',
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
      how: 'Swipe left to right. The pack sinks and shrinks; the card blooms out of the opening.',
      open: 'Cool highlight. Lid launches. Pack recedes and scales down.',
      out: 'Card grows as it leaves the shrinking vault.',
      through: 'Cards burst from center to the stack. Prism flash on each reveal.',
      prize: 'A single prism wash and a light streak — no particle rain.',
      tip: 'Swipe right across the seal<br>to unseal the vault',
      tear: 'across',
    },
    salon: {
      id: 'salon',
      name: 'Salon',
      tag: 'A slow presentation',
      how: 'A long left-to-right swipe. The pack eases down; the card is presented out of it.',
      open: 'Quiet peel. Pack lowers slowly — nothing is thrown.',
      out: 'Card rises a beat after the pack begins to drop.',
      through: 'Longer flips. Side-slide exits. Spotlight + glare on each card.',
      prize: 'A vignette, a gold ring, and the foil crawl — almost no particles.',
      tip: 'Slowly swipe right<br>to present the cards',
      tear: 'across',
    },
  };

  const ORDER = ['trace', 'crimp', 'case', 'vault', 'salon'];

  function fromQuery() {
    const m = /(?:\?|&)look=([a-z]+)/i.exec(location.search);
    return m && LOOKS[m[1].toLowerCase()] ? m[1].toLowerCase() : null;
  }

  function current() {
    const id = document.body.dataset.look || 'trace';
    return LOOKS[id] || LOOKS.trace;
  }

  function apply(id, { persist = true } = {}) {
    const look = LOOKS[id] || LOOKS.trace;
    document.body.dataset.look = look.id;
    ORDER.forEach((oid) => document.body.classList.remove('look-' + oid));
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
    return look;
  }

  function boot() {
    const start = fromQuery() || (function () {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }()) || 'trace';
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

  /* Tear sits in the top crimp band so the lid is a thin strip that comes off */
  const TEARS = [
    {
      id: 'wave',
      d: 'M0 8 C12 4 22 12 34 7.5 C46 3 56 13 70 8 C82 4 92 11 100 7',
      lid: 'polygon(0% 0%,100% 0%,100% 76%,90% 90%,78% 70%,66% 92%,52% 66%,40% 88%,26% 72%,12% 86%,0% 78%)',
      body: 'polygon(0% 9.6%,12% 10.6%,26% 8.8%,40% 11%,52% 8.4%,66% 11.2%,78% 8.8%,90% 10.8%,100% 9.4%,100% 100%,0% 100%)',
    },
    {
      id: 'dip',
      d: 'M0 5 C20 5.5 36 13 50 13.5 C64 13 80 6 100 5.5',
      lid: 'polygon(0% 0%,100% 0%,100% 74%,84% 80%,68% 98%,50% 100%,32% 98%,16% 80%,0% 74%)',
      body: 'polygon(0% 9.2%,16% 10%,32% 12%,50% 12.4%,68% 12%,84% 10%,100% 9.2%,100% 100%,0% 100%)',
    },
    {
      id: 'arch',
      d: 'M0 11 C22 10 36 2.5 50 2 C64 2.5 78 10 100 10.5',
      lid: 'polygon(0% 0%,100% 0%,100% 92%,82% 90%,64% 64%,50% 58%,36% 64%,18% 90%,0% 92%)',
      body: 'polygon(0% 11.2%,18% 11%,36% 8.2%,50% 7.6%,64% 8.2%,82% 11%,100% 11.2%,100% 100%,0% 100%)',
    },
    {
      id: 'drift',
      d: 'M0 4 C16 5 32 9 50 12 C70 14.5 86 9 100 10',
      lid: 'polygon(0% 0%,100% 0%,100% 88%,86% 82%,70% 98%,50% 92%,32% 80%,16% 70%,0% 64%)',
      body: 'polygon(0% 8.2%,16% 9%,32% 10.4%,50% 11.6%,70% 12.4%,86% 10.6%,100% 11.2%,100% 100%,0% 100%)',
    },
  ];

  const TRACE_TEARS = [
    {
      id: 'trace-wave',
      d: 'M0 8 C13 4.5 24 12 37 7.2 C50 2.5 62 13 75 8 C87 4 95 11 100 7.5',
      lid: 'polygon(0% 0%,100% 0%,100% 90%,88% 98%,74% 82%,60% 100%,46% 80%,32% 98%,18% 84%,8% 96%,0% 88%)',
      body: 'polygon(0% 10.2%,8% 11%,18% 9.6%,32% 11.2%,46% 9.2%,60% 11.4%,74% 9.4%,88% 11.2%,100% 10.4%,100% 100%,0% 100%)',
    },
    {
      id: 'trace-dip',
      d: 'M0 5.5 C18 6 34 13.5 50 14 C66 13.5 82 6.5 100 6',
      lid: 'polygon(0% 0%,100% 0%,100% 78%,84% 84%,68% 100%,50% 100%,32% 100%,16% 84%,0% 78%)',
      body: 'polygon(0% 9.4%,16% 10.2%,32% 12%,50% 12.2%,68% 12%,84% 10.2%,100% 9.4%,100% 100%,0% 100%)',
    },
    {
      id: 'trace-arch',
      d: 'M0 11 C20 10 36 3 50 2.5 C64 3 80 10.5 100 11',
      lid: 'polygon(0% 0%,100% 0%,100% 94%,82% 92%,64% 68%,50% 62%,36% 68%,18% 92%,0% 94%)',
      body: 'polygon(0% 11.4%,18% 11.2%,36% 8.4%,50% 7.8%,64% 8.4%,82% 11.2%,100% 11.4%,100% 100%,0% 100%)',
    },
    {
      id: 'trace-drift',
      d: 'M0 4.5 C16 5.5 30 9.5 48 12.5 C68 15 86 9.5 100 10.5',
      lid: 'polygon(0% 0%,100% 0%,100% 90%,86% 84%,70% 100%,50% 94%,32% 82%,16% 72%,0% 66%)',
      body: 'polygon(0% 8.4%,16% 9.2%,32% 10.6%,50% 11.8%,70% 12.4%,86% 10.8%,100% 11.2%,100% 100%,0% 100%)',
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
    pack.style.setProperty('--tear-lid', variant.lid);
    pack.style.setProperty('--tear-body', variant.body);
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
    const pool = current().id === 'trace' ? TRACE_TEARS : TEARS;
    applyTear(pool[Math.floor(Math.random() * pool.length)]);
  }

  function tearDelta(look, startX, startY, e, w, h) {
    const dx = e.clientX - startX;
    if (dx < 0) return 0;
    return Math.min(1, dx / (w * 0.56));
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
    const id = (look && look.id) || current().id;
    if (p > 0.04) {
      packTop.style.opacity = '1';
      packTop.style.transformOrigin = id === 'trace' ? '8% 100%' : '50% 100%';
      packTop.style.transform = 'rotateX(' + (p * 28) + 'deg) translateY(' + (-p * 10) + '%) rotateZ(' + (-p * 2.2) + 'deg)';
    } else {
      packTop.style.transform = '';
    }
    if (id === 'trace') {
      packInner.style.transform = '';
      return;
    }
    packInner.style.transform = 'rotateX(' + (p * 5) + 'deg)';
  }

  function openTiming(id) {
    const look = id || current().id;
    if (look === 'trace') return { rise: 480, opened: 1180, handoff: 2280 };
    if (look === 'salon') return { rise: 420, opened: 1200, handoff: 2400 };
    if (look === 'vault') return { rise: 340, opened: 980, handoff: 2050 };
    if (look === 'case') return { rise: 360, opened: 1020, handoff: 2100 };
    return { rise: 360, opened: 1050, handoff: 2150 };
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
