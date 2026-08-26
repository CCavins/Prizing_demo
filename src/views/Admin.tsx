import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAppState } from '../engine/store';
import { applyConfig, patchConfig, resetRuntime } from '../engine/engine';
import { PRESETS } from '../engine/presets';
import { THEMES, theme } from '../engine/themes';
import type { CampaignConfig, CardDef, GameMode, Rarity, Tag } from '../engine/types';
import { RARITY_LABEL } from '../engine/types';
import { uid } from '../engine/ids';

const RARITIES: Exclude<Rarity, 'miss'>[] = ['common', 'rare', 'epic', 'grail'];

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function playUrl(tagId: string): string {
  return `${location.origin}${location.pathname}#/play?tag=${tagId}`;
}

export default function Admin() {
  const { config, runtime } = useAppState();
  const [draft, setDraft] = useState<CampaignConfig>(() => clone(config));
  const [dirty, setDirty] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const liveRev = useRef(config);

  // follow external changes (preset loaded elsewhere) unless mid-edit
  useEffect(() => {
    liveRev.current = config;
    if (!dirty) setDraft(clone(config));
  }, [config, dirty]);

  const t = theme(draft.themeId);

  function edit(fn: (d: CampaignConfig) => void) {
    setDraft((prev) => {
      const next = clone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  }

  function apply() {
    applyConfig(clone(draft));
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  function applyBoardOnly() {
    patchConfig({ board: clone(draft.board) });
    setDirty(false);
  }

  function loadPreset(p: CampaignConfig) {
    setDraft(clone(p));
    applyConfig(clone(p));
    setDirty(false);
  }

  const totalOpens = runtime.events.filter((e) => e.type === 'open').length;

  return (
    <div className="shell" style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div className="shell-head">
        <div className="shell-title">
          Campaign Configurator
          <small>Everything here is live — apply and the phones, board, and odds change instantly.</small>
        </div>
        <div className="nav-links">
          <Link className="btn" to="/">Home</Link>
          <Link className="btn" to="/sim">Simulator</Link>
          <a className="btn" href={`${location.origin}${location.pathname}#/board`} target="_blank" rel="noreferrer">Board ↗</a>
        </div>
      </div>

      {/* presets + actions */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <span style={{ fontSize: 12, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: 1 }}>Scenes</span>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`btn small ${config.id === p.id && !dirty ? 'primary' : ''}`}
                onClick={() => loadPreset(p)}
                style={config.id === p.id && !dirty ? { background: theme(p.themeId).accent, color: '#0a0a10' } : {}}
              >
                {theme(p.themeId).name}
              </button>
            ))}
          </div>
          <div className="row">
            {dirty && <span className="chip" style={{ color: 'var(--warn)', borderColor: 'var(--warn)' }}>Unsaved changes</span>}
            {savedFlash && <span className="chip" style={{ color: 'var(--good)', borderColor: 'var(--good)' }}>Applied ✓</span>}
            <button className="btn small" disabled={!dirty} onClick={() => { setDraft(clone(liveRev.current)); setDirty(false); }}>Discard</button>
            <button className="btn small primary" onClick={apply}>Apply campaign (resets plays)</button>
            <button className="btn small danger" onClick={() => resetRuntime()}>Reset plays ({totalOpens} opens)</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <h3>Campaign</h3>
            <div className="grid2">
              <div className="field">
                <label>Name</label>
                <input type="text" value={draft.name} onChange={(e) => edit((d) => { d.name = e.target.value; })} />
              </div>
              <div className="field">
                <label>Sponsor</label>
                <input type="text" value={draft.sponsor} onChange={(e) => edit((d) => { d.sponsor = e.target.value; })} />
              </div>
              <div className="field">
                <label>Theme</label>
                <select value={draft.themeId} onChange={(e) => edit((d) => { d.themeId = e.target.value; })}>
                  {THEMES.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Game mode</label>
                <select value={draft.mode} onChange={(e) => edit((d) => { d.mode = e.target.value as GameMode; if (d.mode === 'instant') d.packSize = 1; })}>
                  <option value="instant">Instant Win — one card, win or try again</option>
                  <option value="collectN">Collector — collect N to unlock prize</option>
                  <option value="cardsArePrizes">Cards are prizes — tiered pulls</option>
                </select>
              </div>
              {draft.mode !== 'instant' && (
                <div className="field">
                  <label>Cards per pack · {draft.packSize}</label>
                  <input type="range" min={1} max={5} value={draft.packSize} onChange={(e) => edit((d) => { d.packSize = Number(e.target.value); })} />
                </div>
              )}
            </div>
          </div>

          <PrizeLogicPanel draft={draft} edit={edit} accent={t.accent} />

          <div className="panel">
            <h3>Cards</h3>
            {draft.cards.map((c, i) => (
              <div key={c.id} className="row" style={{ padding: '7px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                <input
                  type="text" value={c.name} style={{ flex: 1, minWidth: 110 }}
                  className="inline-input"
                  onChange={(e) => edit((d) => { d.cards[i].name = e.target.value; })}
                />
                <select value={c.rarity} onChange={(e) => edit((d) => { d.cards[i].rarity = e.target.value as Rarity; })}>
                  {[...RARITIES, 'miss' as const].map((r) => <option key={r} value={r}>{RARITY_LABEL[r]}</option>)}
                </select>
                {draft.mode === 'cardsArePrizes' && c.rarity !== 'miss' && (
                  <>
                    <label className="toggle" style={{ padding: 0 }}>
                      <input type="checkbox" checked={!!c.isPrize} onChange={(e) => edit((d) => { d.cards[i].isPrize = e.target.checked; if (e.target.checked && d.cards[i].inventory === undefined) d.cards[i].inventory = 10; })} />
                      prize
                    </label>
                    {c.isPrize && (
                      <input
                        type="number" min={0} value={c.inventory ?? 0} style={{ width: 70 }}
                        title="Inventory"
                        onChange={(e) => edit((d) => { d.cards[i].inventory = Number(e.target.value); })}
                      />
                    )}
                  </>
                )}
                <button className="btn small danger" onClick={() => edit((d) => { d.cards.splice(i, 1); })}>✕</button>
              </div>
            ))}
            <button
              className="btn small" style={{ marginTop: 10 }}
              onClick={() => edit((d) => { d.cards.push({ id: uid('card-'), name: 'New Card', rarity: 'common' } as CardDef); })}
            >
              + Add card
            </button>
          </div>

          <div className="panel">
            <h3>Rarity odds (relative weights)</h3>
            {RARITIES.map((r) => (
              <div key={r} className="field" style={{ marginBottom: 8 }}>
                <label style={{ color: `var(--rar, var(--dim))` }} className={`rarity-${r}`}>
                  {RARITY_LABEL[r]} · {draft.rarityWeights[r]}
                </label>
                <input
                  type="range" min={0} max={100} value={draft.rarityWeights[r]}
                  onChange={(e) => edit((d) => { d.rarityWeights[r] = Number(e.target.value); })}
                />
              </div>
            ))}
            <p style={{ fontSize: 11, color: 'var(--dim)', margin: '4px 0 0' }}>
              Applies to Collector and Cards-are-prizes draws. Instant Win uses its own odds above.
            </p>
          </div>
        </div>

        {/* right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <h3>Locations · QR entry points</h3>
            <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: -6 }}>
              Each location is its own URL. Print the QR or write it to an NFC tag — scanning opens that location's packs.
            </p>
            {draft.tags.map((tg, i) => (
              <TagEditor key={tg.id} tag={tg} i={i} draft={draft} edit={edit} />
            ))}
            <button
              className="btn small" style={{ marginTop: 8 }}
              onClick={() => edit((d) => {
                d.tags.push({
                  id: uid('tag-'), name: `Location ${d.tags.length + 1}`, location: 'New spot',
                  cardIds: [], packsPerScan: 1, maxOpensPerDevice: 1, color: t.accent,
                });
              })}
            >
              + Add location
            </button>
          </div>

          <div className="panel">
            <h3>Video board</h3>
            <div className="grid2">
              <div className="field">
                <label>Brand name</label>
                <input type="text" value={draft.board.brandName} onChange={(e) => edit((d) => { d.board.brandName = e.target.value; })} />
              </div>
              <div className="field">
                <label>Tagline</label>
                <input type="text" value={draft.board.tagline} onChange={(e) => edit((d) => { d.board.tagline = e.target.value; })} />
              </div>
            </div>
            {([
              ['showLiveTears', 'Live pack tears in center stage'],
              ['showWinnerTicker', 'Winner ticker along the bottom'],
              ['showPrizesRemaining', 'Prizes remaining panel'],
              ['showLeaders', 'Leaders panel'],
              ['maskIdentity', 'Mask player identity (Player 1847)'],
            ] as const).map(([key, label]) => (
              <label key={key} className="toggle">
                <input
                  type="checkbox"
                  checked={draft.board[key]}
                  onChange={(e) => edit((d) => { d.board[key] = e.target.checked; })}
                />
                {label}
              </label>
            ))}
            <div className="field" style={{ marginTop: 8 }}>
              <label>Win reveal delay · {draft.board.winDelaySec}s</label>
              <input
                type="range" min={0} max={10} value={draft.board.winDelaySec}
                onChange={(e) => edit((d) => { d.board.winDelaySec = Number(e.target.value); })}
              />
            </div>
            <button className="btn small" onClick={applyBoardOnly}>Apply board settings only (keeps plays)</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrizeLogicPanel({ draft, edit, accent }: {
  draft: CampaignConfig;
  edit: (fn: (d: CampaignConfig) => void) => void;
  accent: string;
}) {
  const nonMiss = draft.cards.filter((c) => c.rarity !== 'miss');
  if (draft.mode === 'instant') {
    return (
      <div className="panel">
        <h3>Prize logic — Instant Win</h3>
        <div className="grid2">
          <div className="field">
            <label>Prize name</label>
            <input type="text" value={draft.instant.prizeName} onChange={(e) => edit((d) => { d.instant.prizeName = e.target.value; })} />
          </div>
          <div className="field">
            <label>Inventory (total winnable)</label>
            <input type="number" min={0} value={draft.instant.inventory} onChange={(e) => edit((d) => { d.instant.inventory = Number(e.target.value); })} />
          </div>
          <div className="field">
            <label>Winner card</label>
            <select value={draft.instant.winnerCardId} onChange={(e) => edit((d) => { d.instant.winnerCardId = e.target.value; })}>
              {nonMiss.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Try-again card</label>
            <select value={draft.instant.missCardId} onChange={(e) => edit((d) => { d.instant.missCardId = e.target.value; })}>
              {draft.cards.filter((c) => c.rarity === 'miss').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Win odds · <b style={{ color: accent }}>{Math.round(draft.instant.winOdds * 100)}%</b> per pack (while inventory lasts)</label>
          <input
            type="range" min={0} max={100} value={Math.round(draft.instant.winOdds * 100)}
            onChange={(e) => edit((d) => { d.instant.winOdds = Number(e.target.value) / 100; })}
          />
        </div>
      </div>
    );
  }
  if (draft.mode === 'collectN') {
    return (
      <div className="panel">
        <h3>Prize logic — Collector</h3>
        <div className="field">
          <label>Cards in the set (tap to include)</label>
          <div className="row" style={{ gap: 6 }}>
            {nonMiss.map((c) => {
              const on = draft.collectN.setCardIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  className="chip"
                  style={on ? { background: accent, color: '#0a0a10', borderColor: 'transparent' } : {}}
                  onClick={() => edit((d) => {
                    const set = new Set(d.collectN.setCardIds);
                    if (set.has(c.id)) set.delete(c.id); else set.add(c.id);
                    d.collectN.setCardIds = nonMiss.map((x) => x.id).filter((id) => set.has(id));
                    d.collectN.n = Math.min(d.collectN.n || d.collectN.setCardIds.length, d.collectN.setCardIds.length) || d.collectN.setCardIds.length;
                  })}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>Unique cards needed · {draft.collectN.n} of {draft.collectN.setCardIds.length}</label>
            <input
              type="range" min={1} max={Math.max(1, draft.collectN.setCardIds.length)} value={draft.collectN.n}
              onChange={(e) => edit((d) => { d.collectN.n = Number(e.target.value); })}
            />
          </div>
          <div className="field">
            <label>Set prize</label>
            <input type="text" value={draft.collectN.prizeName} onChange={(e) => edit((d) => { d.collectN.prizeName = e.target.value; })} />
          </div>
          <div className="field">
            <label>Prize inventory</label>
            <input type="number" min={0} value={draft.collectN.inventory} onChange={(e) => edit((d) => { d.collectN.inventory = Number(e.target.value); })} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="panel">
      <h3>Prize logic — Cards are prizes</h3>
      <p style={{ fontSize: 12, color: 'var(--dim)', marginTop: -6 }}>
        Mark cards as prizes in the Cards list below and give each an inventory. Rarity odds control how often each tier drops; a prize card stops dropping when its inventory hits zero.
      </p>
      <div className="row" style={{ gap: 6 }}>
        {draft.cards.filter((c) => c.isPrize).map((c) => (
          <span key={c.id} className={`chip rarity-chip rarity-${c.rarity}`}>
            {c.prizeName ?? c.name} · {c.inventory ?? '∞'}
          </span>
        ))}
      </div>
    </div>
  );
}

function TagEditor({ tag, i, draft, edit }: {
  tag: Tag;
  i: number;
  draft: CampaignConfig;
  edit: (fn: (d: CampaignConfig) => void) => void;
}) {
  const [copied, setCopied] = useState(false);
  const nonMiss = draft.cards.filter((c) => c.rarity !== 'miss');
  const url = playUrl(tag.id);
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 12, marginBottom: 10, display: 'grid', gridTemplateColumns: '96px 1fr', gap: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 6, display: 'inline-block' }}>
          <QRCodeSVG value={url} size={80} fgColor="#0b0b12" />
        </div>
        <button
          className="btn small" style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
          onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        >
          {copied ? 'Copied ✓' : 'Copy URL'}
        </button>
      </div>
      <div>
        <div className="grid2">
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Name</label>
            <input type="text" value={tag.name} onChange={(e) => edit((d) => { d.tags[i].name = e.target.value; })} />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Placement</label>
            <input type="text" value={tag.location} onChange={(e) => edit((d) => { d.tags[i].location = e.target.value; })} />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Max opens per device (0 = ∞)</label>
            <input type="number" min={0} value={tag.maxOpensPerDevice} onChange={(e) => edit((d) => { d.tags[i].maxOpensPerDevice = Number(e.target.value); })} />
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Accent color</label>
            <input type="color" value={tag.color} onChange={(e) => edit((d) => { d.tags[i].color = e.target.value; })} style={{ height: 34, background: 'transparent', border: '1px solid var(--line)', borderRadius: 8 }} />
          </div>
        </div>
        {draft.mode !== 'instant' && (
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Card pool at this location {tag.cardIds.length === 0 && '· all cards'}</label>
            <div className="row" style={{ gap: 5 }}>
              {nonMiss.map((c) => {
                const on = tag.cardIds.length === 0 || tag.cardIds.includes(c.id);
                const explicit = tag.cardIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    className="chip"
                    style={explicit ? { background: tag.color, color: '#0a0a10', borderColor: 'transparent' } : on ? { opacity: 0.75 } : { opacity: 0.35 }}
                    onClick={() => edit((d) => {
                      const cur = new Set(d.tags[i].cardIds.length ? d.tags[i].cardIds : []);
                      if (cur.has(c.id)) cur.delete(c.id); else cur.add(c.id);
                      d.tags[i].cardIds = [...cur];
                    })}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <button className="btn small danger" onClick={() => edit((d) => { d.tags.splice(i, 1); })}>Remove location</button>
      </div>
    </div>
  );
}
