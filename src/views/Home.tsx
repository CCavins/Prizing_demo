import { Link } from 'react-router-dom';
import { useAppState } from '../engine/store';
import { applyConfig } from '../engine/engine';
import { PRESETS } from '../engine/presets';
import { theme } from '../engine/themes';

export default function Home() {
  const { config } = useAppState();

  return (
    <div className="shell" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ padding: '48px 0 32px' }}>
        <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: 10 }}>
          VIXI Prize Packs — Demo Studio
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', lineHeight: 1.08, maxWidth: 700 }}>
          Configure a prize campaign. Simulate ten phones. Watch the board light up.
        </h1>
        <p style={{ color: 'var(--dim)', maxWidth: 560, fontSize: 15 }}>
          Everything is browser-based — no app. Set up locations with QR entry points, pick your prize
          logic, then tear packs on simulated phones and watch stats, inventory, and the venue board react live.
        </p>
        <div className="row" style={{ marginTop: 22 }}>
          <Link className="btn primary" style={{ padding: '13px 22px', fontSize: 15 }} to="/admin">Open Configurator</Link>
          <Link className="btn" style={{ padding: '13px 22px', fontSize: 15 }} to="/sim">Phone Wall Simulator</Link>
          <a className="btn" style={{ padding: '13px 22px', fontSize: 15 }} href={`${location.origin}${location.pathname}#/board`} target="_blank" rel="noreferrer">Video Board ↗</a>
          <a className="btn" style={{ padding: '13px 22px', fontSize: 15 }} href={`${location.origin}${location.pathname}#/play`} target="_blank" rel="noreferrer">Play as a guest ↗</a>
        </div>
      </div>

      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--dim)', marginBottom: 14 }}>
        Four ready-made scenes
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14, marginBottom: 40 }}>
        {PRESETS.map((p) => {
          const t = theme(p.themeId);
          const active = config.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => applyConfig(JSON.parse(JSON.stringify(p)))}
              className="panel"
              style={{
                textAlign: 'left', cursor: 'pointer', minHeight: 170,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6,
                background: t.bg,
                border: active ? `1.5px solid ${t.accent}` : '1px solid var(--line)',
                boxShadow: active ? `0 0 40px ${t.accent}33` : 'none',
                color: 'var(--text)',
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/${p.themeId}/pack-cut.webp`}
                alt=""
                style={{
                  width: 64, marginBottom: 'auto',
                  filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.55))',
                }}
              />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: t.accent }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>{p.name}</div>
              <div className="chip" style={{ alignSelf: 'flex-start', borderColor: `${t.accent}55`, color: t.accent }}>
                {p.mode === 'instant' ? 'Instant Win' : p.mode === 'collectN' ? `Collect ${p.collectN.n}` : 'Cards are prizes'}
              </div>
              {active && <div style={{ fontSize: 11, color: t.accent, fontWeight: 700 }}>● ACTIVE</div>}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingBottom: 24, fontSize: 12, color: 'var(--dim)' }}>
        Tip: open the Simulator and the Board in separate windows — they stay in sync live.
      </div>
    </div>
  );
}
