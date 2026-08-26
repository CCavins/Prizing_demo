import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '../engine/store';
import type { AuditEvent } from '../engine/types';
import { assetUrl, packCutUrl, theme } from '../engine/themes';
import TiltCard from '../components/TiltCard';

function maskName(deviceLabel: string, deviceId: string, mask: boolean): string {
  if (!mask) return deviceLabel;
  let h = 0;
  for (const ch of deviceId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `Player ${(h % 9000) + 1000}`;
}

interface Moment {
  key: string;
  kind: 'pull' | 'win';
  event: AuditEvent;
}

export default function Board() {
  const { config, runtime } = useAppState();
  const t = theme(config.themeId);
  const seen = useRef<Set<string>>(new Set());
  const queue = useRef<Moment[]>([]);
  const [current, setCurrent] = useState<Moment | null>(null);
  const busy = useRef(false);

  // enqueue fresh pull/win moments
  useEffect(() => {
    for (const e of runtime.events) {
      if (seen.current.has(e.id)) continue;
      seen.current.add(e.id);
      if (e.type === 'pull' && config.board.showLiveTears) queue.current.push({ key: e.id, kind: 'pull', event: e });
      if (e.type === 'win') queue.current.push({ key: e.id, kind: 'win', event: e });
    }
  }, [runtime.events, config.board.showLiveTears]);

  // reset memory when campaign resets
  useEffect(() => {
    seen.current = new Set(runtime.events.map((e) => e.id));
    queue.current = [];
    setCurrent(null);
    busy.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime.startedAt, config.id]);

  // pump the queue
  useEffect(() => {
    const iv = setInterval(() => {
      if (busy.current) return;
      // collapse backlog: prefer wins, keep only the freshest few pulls
      if (queue.current.length > 6) {
        const wins = queue.current.filter((m) => m.kind === 'win');
        queue.current = [...wins, ...queue.current.filter((m) => m.kind === 'pull').slice(-2)];
      }
      const next = queue.current.shift();
      if (!next) return;
      busy.current = true;
      const show = () => {
        setCurrent(next);
        const hold = next.kind === 'win' ? 3400 : 2100;
        setTimeout(() => {
          setCurrent(null);
          setTimeout(() => { busy.current = false; }, 350);
        }, hold);
      };
      if (next.kind === 'win') setTimeout(show, config.board.winDelaySec * 1000);
      else show();
    }, 420);
    return () => clearInterval(iv);
  }, [config.board.winDelaySec]);

  const winEvents = useMemo(
    () => [...runtime.events].filter((e) => e.type === 'win').reverse().slice(0, 12),
    [runtime.events],
  );

  const leaders = useMemo(() => {
    const devs = Object.values(runtime.devices);
    if (config.mode === 'collectN') {
      return devs
        .map((d) => {
          const owned = new Set(d.collection);
          const have = config.collectN.setCardIds.filter((id) => owned.has(id)).length;
          return { label: d.label, id: d.id, score: have, suffix: `/ ${config.collectN.n} cards` };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    }
    return devs
      .map((d) => ({ label: d.label, id: d.id, score: d.wins.length, suffix: d.wins.length === 1 ? 'prize' : 'prizes' }))
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [runtime.devices, config]);

  const remaining: { name: string; left: number; total: number }[] = [];
  if (config.mode === 'instant') remaining.push({ name: config.instant.prizeName, left: runtime.prizeRemaining.instant ?? 0, total: config.instant.inventory });
  if (config.mode === 'collectN') remaining.push({ name: config.collectN.prizeName, left: runtime.prizeRemaining.set ?? 0, total: config.collectN.inventory });
  for (const c of config.cards) {
    if (c.isPrize && c.inventory !== undefined) remaining.push({ name: c.prizeName ?? c.name, left: runtime.prizeRemaining[c.id] ?? 0, total: c.inventory });
  }

  const hasSide = config.board.showPrizesRemaining || config.board.showLeaders;
  const bgUrl = assetUrl(config.themeId, 'board-bg.webp');
  const card = current?.event.cardId ? config.cards.find((c) => c.id === current.event.cardId) : null;

  return (
    <div className="board-root" style={{ backgroundImage: `url(${bgUrl}), ${t.bg}` }}>
      <div className="board-scrim" />
      <div className="board-head">
        <div>
          <div className="board-brand" style={{ color: t.accent }}>{config.board.brandName}</div>
          <div className="board-tag">{config.board.tagline}</div>
        </div>
        <div className="chip" style={{ borderColor: `${t.accent}66`, color: t.accent }}>LIVE</div>
      </div>

      <div className={`board-main ${hasSide ? '' : 'no-side'}`}>
        <div className="board-center" style={{ perspective: 1100 }}>
          <AnimatePresence mode="wait">
            {current?.kind === 'pull' && card && (
              <motion.div
                key={current.key}
                initial={{ y: 260, scale: 0.4, opacity: 0, rotateZ: -10 }}
                animate={{ y: 0, scale: 1, opacity: 1, rotateZ: 0 }}
                exit={{ y: -140, opacity: 0, transition: { duration: 0.3 } }}
                transition={{ type: 'spring', stiffness: 170, damping: 18 }}
                style={{ width: 'min(24vw, 300px)', aspectRatio: '3/4.2', position: 'relative' }}
              >
                <TiltCard card={card} themeId={config.themeId} interactive={false} style={{ width: '100%', height: '100%', position: 'relative' }} />
                <div style={{ textAlign: 'center', marginTop: 18, fontSize: 15, color: '#cfd4e4' }}>
                  {maskName(current.event.deviceLabel, current.event.deviceId, config.board.maskIdentity)} tore a pack at{' '}
                  <b style={{ color: t.accent }}>{current.event.tagName}</b>
                </div>
              </motion.div>
            )}

            {current?.kind === 'win' && (
              <motion.div
                key={current.key}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.06, opacity: 0, transition: { duration: 0.35 } }}
                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                style={{ textAlign: 'center' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  style={{
                    padding: '34px 54px', borderRadius: 26,
                    background: `linear-gradient(160deg, ${t.accent}2e, rgba(8,8,16,0.75))`,
                    border: `1.5px solid ${t.accent}`,
                    boxShadow: `0 0 90px ${t.accent}44`,
                  }}
                >
                  <div style={{ fontSize: 'clamp(13px, 1.4vw, 19px)', letterSpacing: 4, textTransform: 'uppercase', color: t.accent, fontWeight: 700 }}>
                    Someone just won
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(30px, 4.2vw, 62px)', margin: '10px 0 6px' }}>
                    {current.event.prizeName}
                  </div>
                  <div style={{ fontSize: 'clamp(13px, 1.3vw, 18px)', color: '#cfd4e4' }}>
                    {maskName(current.event.deviceLabel, current.event.deviceId, config.board.maskIdentity)}
                    {current.event.tagName ? ` · ${current.event.tagName}` : ''}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {!current && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center' }}
              >
                <motion.img
                  src={packCutUrl(config.themeId)}
                  alt=""
                  animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  style={{
                    width: 'min(20vw, 230px)', margin: '0 auto', display: 'block',
                    filter: `drop-shadow(0 40px 60px rgba(0,0,0,0.6)) drop-shadow(0 0 60px ${t.accent}33)`,
                  }}
                />
                <div style={{ marginTop: 22, fontSize: 'clamp(14px, 1.5vw, 21px)', color: '#cfd4e4', letterSpacing: 1 }}>
                  Scan a code anywhere in the venue to tear a pack
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasSide && (
          <div className="board-side">
            {config.board.showPrizesRemaining && (
              <div className="board-panel">
                <h4>Prizes remaining</h4>
                {remaining.map((r) => (
                  <div key={r.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{r.name}</span>
                      <b style={{ color: r.left === 0 ? 'var(--bad)' : t.accent }}>{r.left}</b>
                    </div>
                    <div className="progress-bar">
                      <div style={{ width: `${r.total ? (r.left / r.total) * 100 : 0}%`, background: t.accent }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {config.board.showLeaders && (
              <div className="board-panel" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <h4>{config.mode === 'collectN' ? 'Closest to the set' : 'Top winners'}</h4>
                {leaders.map((l, i) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #ffffff12', fontSize: 14 }}>
                    <span><b style={{ color: t.accent, marginRight: 8 }}>{i + 1}</b>{maskName(l.label, l.id, config.board.maskIdentity)}</span>
                    <span style={{ color: '#cfd4e4' }}>{l.score} {l.suffix}</span>
                  </div>
                ))}
                {leaders.length === 0 && <p style={{ fontSize: 13, color: '#8a90a5' }}>Waiting for the first tear…</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {config.board.showWinnerTicker && (
        <div className="ticker">
          {winEvents.length === 0 ? (
            <span style={{ fontSize: 13, color: '#8a90a5' }}>Winners appear here the moment a pack hits.</span>
          ) : (
            winEvents.map((e) => (
              <motion.span
                key={e.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="chip"
                style={{ borderColor: `${t.accent}55`, color: '#e8ebf5', padding: '7px 14px', fontSize: 12, textTransform: 'none' }}
              >
                🏆 {maskName(e.deviceLabel, e.deviceId, config.board.maskIdentity)} — {e.prizeName}
              </motion.span>
            ))
          )}
        </div>
      )}
    </div>
  );
}
