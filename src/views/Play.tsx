import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useAppState } from '../engine/store';
import { canOpen, openPack, recordScan, redeemWin } from '../engine/engine';
import type { PullResult, Win } from '../engine/types';
import { packCutUrl, theme } from '../engine/themes';
import PackTear, { type PackTearHandle } from '../components/PackTear';
import TiltCard from '../components/TiltCard';
import { uid } from '../engine/ids';

type Stage = 'land' | 'tearing' | 'reveal' | 'done';

function guestId(): string {
  let id = localStorage.getItem('vixi-guest-id');
  if (!id) {
    id = uid('guest-');
    localStorage.setItem('vixi-guest-id', id);
  }
  return id;
}

export default function Play() {
  const { config, runtime } = useAppState();
  const [params] = useSearchParams();
  const deviceId = params.get('device') ?? guestId();
  const deviceLabel = params.get('label') ?? 'Guest Phone';
  const autoParam = params.get('auto') === '1';

  const [tagId, setTagId] = useState(params.get('tag') ?? config.tags[0]?.id ?? '');
  const [stage, setStage] = useState<Stage>('land');
  const [pull, setPull] = useState<PullResult | null>(null);
  const [revealIdx, setRevealIdx] = useState(0);
  const [auto, setAuto] = useState(autoParam);
  const tearRef = useRef<PackTearHandle>(null);
  const scannedRef = useRef('');

  const t = theme(config.themeId);
  const tag = config.tags.find((x) => x.id === tagId) ?? config.tags[0];
  const dev = runtime.devices[deviceId];

  // reset local UI when the operator resets the campaign
  const startedAt = runtime.startedAt;
  const configId = config.id;
  useEffect(() => {
    setStage('land');
    setPull(null);
    setRevealIdx(0);
    const firstTag = params.get('tag');
    setTagId((prev) => {
      const stillValid = config.tags.some((x) => x.id === prev);
      return stillValid ? prev : firstTag && config.tags.some((x) => x.id === firstTag) ? firstTag : config.tags[0]?.id ?? '';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, configId]);

  // record scan once per tag visit
  useEffect(() => {
    if (!tag) return;
    const key = `${startedAt}:${tag.id}`;
    if (scannedRef.current !== key) {
      scannedRef.current = key;
      recordScan(deviceId, deviceLabel, tag.id);
    }
  }, [tag, deviceId, deviceLabel, startedAt]);

  // listen for auto commands from the simulator
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.vixi === 'auto-start') setAuto(true);
      if (e.data?.vixi === 'auto-stop') setAuto(false);
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const openable = tag ? canOpen(deviceId, tag.id).ok : false;
  const nextTag = useMemo(() => {
    if (!config.tags.length) return null;
    const idx = config.tags.findIndex((x) => x.id === tagId);
    for (let i = 1; i <= config.tags.length; i++) {
      const cand = config.tags[(idx + i) % config.tags.length];
      if (canOpen(deviceId, cand.id).ok) return cand;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.tags, tagId, deviceId, runtime]);

  const doOpen = useCallback(() => {
    if (!tag) return;
    const res = openPack(deviceId, deviceLabel, tag.id);
    if ('error' in res) {
      setStage('done');
      setPull(null);
      return;
    }
    setPull(res);
    setRevealIdx(0);
    setStage('reveal');
  }, [tag, deviceId, deviceLabel]);

  const advance = useCallback(() => {
    if (!pull) return;
    if (revealIdx < pull.cards.length - 1) setRevealIdx((i) => i + 1);
    else setStage('done');
  }, [pull, revealIdx]);

  const goToTag = useCallback((id: string) => {
    setTagId(id);
    setPull(null);
    setRevealIdx(0);
    setStage('land');
  }, []);

  // ---- auto pilot ----
  const autoRef = useRef({ stage, openable, nextTagId: nextTag?.id ?? null, tagId });
  autoRef.current = { stage, openable, nextTagId: nextTag?.id ?? null, tagId };
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      const s = autoRef.current;
      if (s.stage === 'land') {
        if (s.openable) setStage('tearing');
        else if (s.nextTagId) goToTag(s.nextTagId);
        else setAuto(false);
      } else if (s.stage === 'tearing') {
        tearRef.current?.tear();
      } else if (s.stage === 'reveal') {
        advance();
      } else if (s.stage === 'done') {
        if (s.openable) setStage('land');
        else if (s.nextTagId) goToTag(s.nextTagId);
        else setAuto(false);
      }
    }, 1050);
    return () => clearInterval(timer);
  }, [auto, advance, goToTag]);

  if (!tag) {
    return (
      <div className="play-root" style={{ background: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--dim)' }}>No tags configured yet.</p>
      </div>
    );
  }

  const currentCard = pull?.cards[revealIdx];

  return (
    <div className="play-root" style={{ background: t.bg }}>
      <div className="play-top">
        <div>
          <div className="play-brand" style={{ color: t.accent }}>{config.board.brandName}</div>
          <div className="play-loc">{tag.name} · {tag.location}</div>
        </div>
        {auto && <span className="chip on" style={{ background: t.accent, color: '#000' }}>AUTO</span>}
      </div>

      <div className="play-stage">
        <AnimatePresence mode="wait">
          {stage === 'land' && (
            <motion.div
              key="land"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
            >
              <motion.img
                src={packCutUrl(config.themeId)}
                alt=""
                draggable={false}
                style={{
                  width: 'min(52vw, 200px)',
                  filter: `drop-shadow(0 22px 30px rgba(0,0,0,0.55)) drop-shadow(0 0 30px ${t.accent}22)`,
                }}
                animate={{ rotate: [-1.5, 1.5, -1.5], y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
              />
              <h2 style={{ fontSize: 22 }}>{openable ? 'A pack is yours.' : 'All torn here!'}</h2>
              <p style={{ color: 'var(--dim)', fontSize: 13, margin: 0, maxWidth: 260 }}>
                {openable
                  ? config.mode === 'collectN'
                    ? `Tear it open and collect the set of ${config.collectN.n}.`
                    : config.mode === 'cardsArePrizes'
                      ? 'Every card inside is a real prize.'
                      : `Win instantly: ${config.instant.prizeName}.`
                  : nextTag
                    ? `This location is tapped out for you — head to ${nextTag.name}.`
                    : 'You have opened everything available. Nice run.'}
              </p>
            </motion.div>
          )}

          {stage === 'tearing' && (
            <motion.div key="tear" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <PackTear ref={tearRef} themeId={config.themeId} onTorn={doOpen} />
            </motion.div>
          )}

          {stage === 'reveal' && currentCard && (
            <motion.div key={`reveal-${revealIdx}`} style={{ position: 'relative', width: 'min(70vw, 270px)', aspectRatio: '3/4.2' }}>
              {/* stacked next cards behind */}
              {pull!.cards.slice(revealIdx + 1, revealIdx + 3).map((c, i) => (
                <div
                  key={`${c.id}-${i}`}
                  className="card-face"
                  style={{
                    transform: `translateY(${(i + 1) * 10}px) scale(${1 - (i + 1) * 0.045})`,
                    backgroundImage: `url(${import.meta.env.BASE_URL}assets/${config.themeId}/back.webp), ${t.cardBackFallback}`,
                    zIndex: -1 - i,
                    filter: 'brightness(0.7)',
                  }}
                />
              ))}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) advance();
                }}
                initial={{ y: 220, scale: 0.45, opacity: 0, rotateZ: -8 }}
                animate={{ y: 0, scale: 1, opacity: 1, rotateZ: 0 }}
                exit={{ x: -340, rotateZ: -14, opacity: 0, transition: { duration: 0.28 } }}
                transition={{ type: 'spring', stiffness: 210, damping: 20 }}
                style={{ position: 'absolute', inset: 0, perspective: 900, cursor: 'grab' }}
              >
                <TiltCard card={currentCard} themeId={config.themeId} style={{ width: '100%', height: '100%', position: 'relative' }} />
              </motion.div>
            </motion.div>
          )}

          {stage === 'done' && (
            <DoneView
              key="done"
              deviceId={deviceId}
              pull={pull}
              openable={openable}
              nextTagName={nextTag?.name ?? null}
              onAgain={() => setStage('land')}
              onWalk={() => nextTag && goToTag(nextTag.id)}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="play-bottom">
        {stage === 'land' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {openable ? (
              <button className="btn primary" style={{ justifyContent: 'center', padding: '14px', fontSize: 15, background: t.accent, color: '#0a0a10' }} onClick={() => setStage('tearing')}>
                Tear your pack
              </button>
            ) : nextTag ? (
              <button className="btn" style={{ justifyContent: 'center', padding: '13px' }} onClick={() => goToTag(nextTag.id)}>
                Walk to {nextTag.name} →
              </button>
            ) : null}
          </div>
        )}
        {stage === 'reveal' && pull && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div className="dots">
              {pull.cards.map((_, i) => (
                <i key={i} className={i <= revealIdx ? 'on' : ''} />
              ))}
            </div>
            <button className="btn" style={{ justifyContent: 'center', width: '100%', padding: '12px' }} onClick={advance}>
              {revealIdx < pull.cards.length - 1 ? 'Next card →' : 'Continue'}
            </button>
          </div>
        )}
        {stage === 'done' && dev && config.mode === 'collectN' && (
          <SetProgressBar accent={t.accent} />
        )}
      </div>
    </div>
  );
}

function SetProgressBar({ accent }: { accent: string }) {
  const { config, runtime } = useAppState();
  const [params] = useSearchParams();
  const deviceId = params.get('device') ?? localStorage.getItem('vixi-guest-id') ?? '';
  const dev = runtime.devices[deviceId];
  const owned = new Set(dev?.collection ?? []);
  const have = config.collectN.setCardIds.filter((id) => owned.has(id)).length;
  const pct = config.collectN.n ? Math.min(100, (have / config.collectN.n) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dim)' }}>
        <span>Set progress</span>
        <span style={{ color: accent, fontWeight: 700 }}>{have} / {config.collectN.n}</span>
      </div>
      <div className="progress-bar">
        <div style={{ width: `${pct}%`, background: accent }} />
      </div>
    </div>
  );
}

function DoneView({
  deviceId, pull, openable, nextTagName, onAgain, onWalk,
}: {
  deviceId: string;
  pull: PullResult | null;
  openable: boolean;
  nextTagName: string | null;
  onAgain: () => void;
  onWalk: () => void;
}) {
  const { config, runtime } = useAppState();
  const t = theme(config.themeId);
  const dev = runtime.devices[deviceId];
  const newWins = pull?.wins ?? [];
  const missed = config.mode === 'instant' && newWins.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '100%', overflowY: 'auto', paddingBottom: 8 }}
    >
      {newWins.map((w) => (
        <WinCoupon key={w.id} win={w} deviceId={deviceId} accent={t.accent} />
      ))}

      {missed && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>So close.</h2>
          <p style={{ color: 'var(--dim)', fontSize: 13, margin: 0 }}>
            {openable ? 'You have another tear in you. Go again.' : nextTagName ? `Try the pack waiting at ${nextTagName}.` : 'That was the last pack for this phone — thanks for playing.'}
          </p>
        </div>
      )}

      {config.mode === 'collectN' && dev && (
        <CollectionGrid deviceId={deviceId} />
      )}

      {config.mode === 'cardsArePrizes' && dev && dev.wins.filter((w) => !newWins.some((n) => n.id === w.id)).length > 0 && (
        <div className="panel" style={{ padding: 12 }}>
          <h3>Earlier prizes on this phone</h3>
          {dev.wins.filter((w) => !newWins.some((n) => n.id === w.id)).map((w) => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', color: 'var(--dim)' }}>
              <span>{w.prizeName}</span>
              <span style={{ fontFamily: 'var(--font-display)' }}>{w.code}{w.redeemed ? ' · redeemed' : ''}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {openable && (
          <button className="btn primary" style={{ justifyContent: 'center', padding: 13, background: t.accent, color: '#0a0a10' }} onClick={onAgain}>
            Open another pack
          </button>
        )}
        {!openable && nextTagName && (
          <button className="btn" style={{ justifyContent: 'center', padding: 13 }} onClick={onWalk}>
            Walk to {nextTagName} →
          </button>
        )}
      </div>
    </motion.div>
  );
}

function WinCoupon({ win, deviceId, accent }: { win: Win; deviceId: string; accent: string }) {
  const { runtime } = useAppState();
  const live = runtime.devices[deviceId]?.wins.find((w) => w.id === win.id) ?? win;
  return (
    <motion.div
      className="coupon"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      style={{ borderColor: `${accent}88` }}
    >
      <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: accent, fontWeight: 700 }}>You won</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, margin: '4px 0' }}>{live.prizeName}</div>
      <div className="code" style={{ color: accent }}>{live.code}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
        <button className="btn small" onClick={() => navigator.clipboard?.writeText(live.code)}>Copy code</button>
        <button
          className={`btn small ${live.redeemed ? '' : 'good'}`}
          disabled={live.redeemed}
          onClick={() => redeemWin(deviceId, live.id)}
        >
          {live.redeemed ? 'Redeemed ✓' : 'Redeem now'}
        </button>
      </div>
    </motion.div>
  );
}

function CollectionGrid({ deviceId }: { deviceId: string }) {
  const { config, runtime } = useAppState();
  const dev = runtime.devices[deviceId];
  const counts = new Map<string, number>();
  for (const id of dev?.collection ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
  return (
    <div className="panel" style={{ padding: 12 }}>
      <h3>Your collection</h3>
      <div className="coll-grid">
        {config.collectN.setCardIds.map((id) => {
          const card = config.cards.find((c) => c.id === id);
          const n = counts.get(id) ?? 0;
          if (!card) return null;
          const img = card.image ? `url(${import.meta.env.BASE_URL}assets/${config.themeId}/${card.image})` : undefined;
          return (
            <div key={id} className={`coll-cell ${n === 0 ? 'missing' : ''}`} style={{ backgroundImage: img }}>
              {n === 0 && <span className="qm">?</span>}
              {n > 1 && <span className="cnt">×{n}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
