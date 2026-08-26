import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { CardDef } from '../engine/types';
import { RARITY_LABEL } from '../engine/types';
import { assetUrl, theme } from '../engine/themes';

const RARITY_COLOR: Record<string, string> = {
  common: '#9aa1b5',
  rare: '#4da3ff',
  epic: '#b45cff',
  grail: '#ffc83d',
  miss: '#6b7183',
};

interface Props {
  card: CardDef;
  themeId: string;
  interactive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * A trading card with pointer-driven 3D tilt and a holo sheen that
 * tracks the tilt — drag or hover to inspect it from different angles.
 */
export default function TiltCard({ card, themeId, interactive = true, style, className }: Props) {
  const t = theme(themeId);
  const px = useMotionValue(0.5); // pointer 0..1
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [16, -16]), { stiffness: 260, damping: 22 });
  const ry = useSpring(useTransform(px, [0, 1], [-18, 18]), { stiffness: 260, damping: 22 });
  const holoX = useTransform(px, [0, 1], ['-40%', '40%']);
  const holoY = useTransform(py, [0, 1], ['-40%', '40%']);
  const holoOpacity = useTransform(px, [0, 0.5, 1], [0.85, 0.35, 0.85]);

  const color = RARITY_COLOR[card.rarity] ?? '#fff';
  const isShiny = card.rarity === 'epic' || card.rarity === 'grail';
  const img = card.image ? assetUrl(themeId, card.image) : null;

  function onPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
    py.set(Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)));
  }

  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      className={`reveal-card ${className ?? ''}`}
      style={{ rotateX: rx, rotateY: ry, ...style }}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={onLeave}
      onPointerUp={onLeave}
    >
      <div
        className="card-glow"
        style={{
          background: `radial-gradient(60% 60% at 50% 45%, ${color}55, transparent 70%)`,
          filter: 'blur(14px)',
        }}
      />
      <div
        className={`card-face rarity-${card.rarity}`}
        style={{
          backgroundImage: img
            ? `url(${img}), linear-gradient(160deg, ${color}44, #0b0b12 75%)`
            : `linear-gradient(160deg, ${color}55, #0b0b12 70%), ${t.packFallback}`,
          borderColor: `${color}66`,
        }}
      >
        {!img && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 800, opacity: 0.22 }}>
              {card.name.slice(0, 1)}
            </span>
          </div>
        )}
        <motion.div
          className="card-holo"
          style={{
            opacity: isShiny ? holoOpacity : 0.28,
            backgroundImage: `linear-gradient(115deg, transparent 32%, ${color}66 44%, #ffffffaa 50%, ${color}66 56%, transparent 68%)`,
            backgroundSize: '220% 220%',
            backgroundPositionX: holoX,
            backgroundPositionY: holoY,
          }}
        />
        <div className="card-label">
          <span className={`chip rarity-chip rarity-${card.rarity}`} style={{ marginBottom: 6 }}>
            {RARITY_LABEL[card.rarity]}
          </span>
          <div className="nm">{card.name}</div>
          {card.subtitle && <div className="sb">{card.subtitle}</div>}
        </div>
      </div>
    </motion.div>
  );
}
