import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../engine/store';
import { computeStats, resetRuntime } from '../engine/engine';
import { RARITY_LABEL, type Rarity } from '../engine/types';
import { theme } from '../engine/themes';

function playUrl(query: string): string {
  return `${location.origin}${location.pathname}#/play?${query}`;
}

export default function Sim() {
  const state = useAppState();
  const { config, runtime } = state;
  const t = theme(config.themeId);
  const [count, setCount] = useState(6);
  const [assign, setAssign] = useState<'roundRobin' | string>('roundRobin');
  const [nonce, setNonce] = useState(0);
  const [autoOn, setAutoOn] = useState(false);
  const frameRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const stats = useMemo(() => computeStats(state), [state]);

  const phones = Array.from({ length: count }, (_, i) => {
    const tag =
      assign === 'roundRobin'
        ? config.tags[i % Math.max(1, config.tags.length)]?.id ?? ''
        : assign;
    return { i, deviceId: `sim-${i + 1}`, label: `Phone ${i + 1}`, tag };
  });

  function broadcast(msg: object, stagger = 0) {
    frameRefs.current.forEach((f, i) => {
      if (!f?.contentWindow) return;
      setTimeout(() => f.contentWindow?.postMessage(msg, '*'), stagger * i);
    });
  }

  function startAuto() {
    setAutoOn(true);
    broadcast({ vixi: 'auto-start' }, 700);
  }
  function stopAuto() {
    setAutoOn(false);
    broadcast({ vixi: 'auto-stop' });
  }
  function resetAll() {
    stopAuto();
    resetRuntime();
    setNonce((n) => n + 1); // reload frames back to landing
  }

  const remaining: { name: string; left: number; total: number }[] = [];
  if (config.mode === 'instant') {
    remaining.push({ name: config.instant.prizeName, left: runtime.prizeRemaining.instant ?? 0, total: config.instant.inventory });
  }
  if (config.mode === 'collectN') {
    remaining.push({ name: config.collectN.prizeName, left: runtime.prizeRemaining.set ?? 0, total: config.collectN.inventory });
  }
  for (const c of config.cards) {
    if (c.isPrize && c.inventory !== undefined) {
      remaining.push({ name: c.prizeName ?? c.name, left: runtime.prizeRemaining[c.id] ?? 0, total: c.inventory });
    }
  }

  return (
    <div className="shell">
      <div className="shell-head">
        <div className="shell-title">
          Phone Wall Simulator
          <small>{config.name} · {config.tags.length} locations · mode: {config.mode}</small>
        </div>
        <div className="nav-links">
          <Link className="btn" to="/">Home</Link>
          <Link className="btn" to="/admin">Configurator</Link>
          <a className="btn" href={`${location.origin}${location.pathname}#/board`} target="_blank" rel="noreferrer">Open Board ↗</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
        <div>
          <div className="panel" style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="row">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Phones · {count}</label>
                  <input type="range" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Tag assignment</label>
                  <select value={assign} onChange={(e) => setAssign(e.target.value)}>
                    <option value="roundRobin">Round-robin across locations</option>
                    {config.tags.map((tg) => (
                      <option key={tg.id} value={tg.id}>All at: {tg.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row">
                {!autoOn ? (
                  <button className="btn primary" onClick={startAuto}>▶ Auto-open everything</button>
                ) : (
                  <button className="btn" onClick={stopAuto}>⏸ Stop auto</button>
                )}
                <button className="btn danger" onClick={resetAll}>Reset everything</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 16 }}>
            {phones.map((p) => (
              <div key={p.deviceId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="phone-frame" style={{ aspectRatio: '9/18.5' }}>
                  <div className="phone-notch" />
                  <iframe
                    key={`${nonce}-${p.tag}-${config.id}`}
                    ref={(el) => { frameRefs.current[p.i] = el; }}
                    title={p.label}
                    src={playUrl(`device=${p.deviceId}&label=${encodeURIComponent(p.label)}&tag=${p.tag}&sim=1`)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--dim)', padding: '0 4px' }}>
                  <span>{p.label}</span>
                  <span style={{ color: config.tags.find((x) => x.id === p.tag)?.color ?? 'inherit' }}>
                    {config.tags.find((x) => x.id === p.tag)?.name ?? '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* stats rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 18 }}>
          <div className="panel">
            <h3>Live stats</h3>
            <div className="grid2">
              <Stat label="Packs opened" value={stats.packsOpened} />
              <Stat label="Cards pulled" value={stats.cardsPulled} />
              <Stat label="Prizes won" value={stats.prizesWon} accent={t.accent} />
              <Stat label="Redeemed" value={stats.redeemed} accent="var(--good)" />
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.keys(stats.byRarity) as Rarity[]).filter((r) => stats.byRarity[r] > 0).map((r) => (
                <span key={r} className={`chip rarity-chip rarity-${r}`}>{RARITY_LABEL[r]} × {stats.byRarity[r]}</span>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Prize inventory</h3>
            {remaining.map((r) => (
              <div key={r.name} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{r.name}</span>
                  <span style={{ color: r.left === 0 ? 'var(--bad)' : 'var(--dim)' }}>{r.left} / {r.total} left</span>
                </div>
                <div className="progress-bar">
                  <div style={{ width: `${r.total ? (r.left / r.total) * 100 : 0}%`, background: r.left === 0 ? 'var(--bad)' : t.accent }} />
                </div>
              </div>
            ))}
            {remaining.length === 0 && <p style={{ fontSize: 12, color: 'var(--dim)' }}>No capped prizes configured.</p>}
          </div>

          <div className="panel">
            <h3>By location</h3>
            {Object.entries(stats.byTag).map(([id, v]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
                <span>{v.name}</span>
                <span style={{ color: 'var(--dim)' }}>{v.opens} opens · <b style={{ color: t.accent }}>{v.wins} wins</b></span>
              </div>
            ))}
            {Object.keys(stats.byTag).length === 0 && <p style={{ fontSize: 12, color: 'var(--dim)' }}>No opens yet — hit auto or tear a pack.</p>}
          </div>

          <div className="panel" style={{ maxHeight: 260, overflowY: 'auto' }}>
            <h3>Audit log</h3>
            {[...runtime.events].reverse().slice(0, 24).map((e) => (
              <div key={e.id} style={{ fontSize: 11, padding: '3px 0', color: 'var(--dim)' }}>
                <b style={{ color: e.type === 'win' ? t.accent : e.type === 'redeem' ? 'var(--good)' : 'var(--text)' }}>
                  {e.type.toUpperCase()}
                </b>{' '}
                {e.deviceLabel}
                {e.cardName ? ` → ${e.cardName}` : ''}
                {e.prizeName ? ` → ${e.prizeName}` : ''}
                {e.tagName ? ` @ ${e.tagName}` : ''}
              </div>
            ))}
            {runtime.events.length === 0 && <p style={{ fontSize: 12, color: 'var(--dim)' }}>Empty. Everything shows up here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--line)' }}>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: accent }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--dim)' }}>{label}</div>
    </div>
  );
}
